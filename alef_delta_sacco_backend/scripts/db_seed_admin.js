import fs from 'node:fs/promises';
import path from 'node:path';
import mysql from 'mysql2/promise';
import { v4 as uuid } from 'uuid';
import config from '../src/core/config.js';
import { hashPassword, generateRandomPassword } from '../src/core/utils/password.js';

const templatePath = path.resolve(process.cwd(), 'seeds/seed_admin.sql');
const credentialsPath = path.resolve(process.cwd(), 'scripts/admin_credentials.txt');

function splitStatements(sql) {
  return sql
    .split(/;\s*(?:\r?\n|$)/)
    .map((stmt) => stmt.trim())
    .filter((stmt) => stmt.length);
}

async function ensureDatabase() {
  // Connect without database to create it if needed
  const { database, ...dbConfigWithoutDb } = config.db;
  const connection = await mysql.createConnection(dbConfigWithoutDb);
  try {
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${database}\``);
    console.log(`✅ Database '${database}' exists or was created`);
  } finally {
    await connection.end();
  }
}

async function seedAdmin() {
  console.log('👤 Starting admin user seed...');
  console.log(`📁 Template file: ${templatePath}`);
  console.log(`🔌 Target database: ${config.db.host}:${config.db.port}/${config.db.database}`);
  
  // Ensure database exists
  await ensureDatabase();
  
  const template = await fs.readFile(templatePath, 'utf8');
  const plainPassword = generateRandomPassword(20);
  const passwordHash = await hashPassword(plainPassword);
  const userId = uuid();
  const username = `admin_${Date.now()}`;
  const email = `${username}@sacco.local`;
  const phone = '+251900000000';
  
  console.log(`📝 Generated username: ${username}`);
  
  const sql = template
    .replace('{{USER_ID}}', userId)
    .replace('{{USERNAME}}', username)
    .replace('{{PASSWORD_HASH}}', passwordHash)
    .replace('{{EMAIL}}', email)
    .replace('{{PHONE}}', phone);
  
  const statements = splitStatements(sql);
  if (statements.length === 0) {
    throw new Error(`No SQL statements found in template`);
  }
  
  console.log(`📋 Executing ${statements.length} SQL statement(s)...`);
  
  const connection = await mysql.createConnection(config.db);
  try {
    for (const statement of statements) {
      // eslint-disable-next-line no-await-in-loop
      await connection.query(statement);
    }
    console.log('✅ Admin user created successfully');
  } catch (error) {
    console.error(`❌ Error creating admin user: ${error.message}`);
    throw error;
  } finally {
    await connection.end();
  }
  
  await fs.writeFile(
    credentialsPath,
    `Username: ${username}\nPassword: ${plainPassword}\nGenerated: ${new Date().toISOString()}\n`,
    { mode: 0o600 }
  );
  console.log(`✅ Admin credentials saved to ${credentialsPath}`);
  console.log(`\n🔑 Admin Login Credentials:`);
  console.log(`   Username: ${username}`);
  console.log(`   Password: ${plainPassword}`);
}

// Always execute when script is run
seedAdmin()
  .then(() => {
    console.log('✅ Admin seed completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Admin seed failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  });

