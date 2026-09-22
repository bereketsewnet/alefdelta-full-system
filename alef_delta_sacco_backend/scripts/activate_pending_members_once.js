import { query } from '../src/core/db.js';
import { activateMember } from '../src/modules/members/member.service.js';

function readArgument(name) {
  const prefix = `--${name}=`;
  const argument = process.argv.find((value) => value.startsWith(prefix));
  return argument ? argument.slice(prefix.length) : null;
}

const execute = process.argv.includes('--execute');
const expectedCountValue = readArgument('expected-count');
const expectedCount = expectedCountValue === null ? null : Number(expectedCountValue);
const actorEmail = readArgument('actor-email') || 'sacco@alefdelta.com';

async function main() {
  const [admin] = await query(
    `SELECT user_id, email, role, status
     FROM users
     WHERE LOWER(email) = LOWER(?) AND role = 'ADMIN' AND status = 'ACTIVE'
     LIMIT 1`,
    [actorEmail]
  );
  if (!admin) throw new Error(`Active ADMIN account not found for ${actorEmail}`);

  const pendingMembers = await query(
    `SELECT member_id, membership_no
     FROM members
     WHERE status = 'PENDING'
     ORDER BY registered_date, member_id`
  );

  console.log(`Pending members found: ${pendingMembers.length}`);
  if (!execute) {
    console.log('Preview only. No member was changed.');
    console.log(`To execute this exact count, rerun with --execute --expected-count=${pendingMembers.length}`);
    return;
  }

  if (!Number.isInteger(expectedCount) || expectedCount < 0) {
    throw new Error('--expected-count=<preview count> is required with --execute');
  }
  if (pendingMembers.length !== expectedCount) {
    throw new Error(`Safety check failed: expected ${expectedCount} pending members but found ${pendingMembers.length}. Run preview again.`);
  }

  let activated = 0;
  const failures = [];
  for (const member of pendingMembers) {
    try {
      await activateMember(member.member_id, {
        userId: admin.user_id,
        role: 'ADMIN',
        isAdmin: true
      });
      activated += 1;
    } catch (error) {
      failures.push({ membership_no: member.membership_no, message: error.message });
    }
  }

  const [remaining] = await query("SELECT COUNT(*) total FROM members WHERE status = 'PENDING'");
  console.log(`Activated: ${activated}`);
  console.log(`Failed: ${failures.length}`);
  console.log(`Pending members remaining: ${Number(remaining.total)}`);
  if (failures.length) {
    failures.forEach((failure) => console.error(`${failure.membership_no}: ${failure.message}`));
    process.exitCode = 1;
  }
}

main()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(() => {
    // Sequelize keeps its connection pool open; exit after all output flushes.
    setTimeout(() => process.exit(process.exitCode || 0), 10);
  });
