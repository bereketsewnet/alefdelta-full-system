import fs from 'node:fs/promises';
import path from 'node:path';
import mysql from 'mysql2/promise';
import config from '../src/core/config.js';

const migrationsDir = path.resolve(process.cwd(), 'migrations');

async function runSql(connection, sql) {
  const statements = sql
    .split(/;\s*(?:\r?\n|$)/)
    .map((stmt) => stmt.trim())
    .filter((stmt) => stmt.length);
  for (const statement of statements) {
    if (statement.length > 0) {
      // eslint-disable-next-line no-await-in-loop
      await connection.query(statement);
    }
  }
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

async function runSingleMigration(filename) {
  const filePath = path.join(migrationsDir, filename);
  
  // Check if file exists
  try {
    await fs.access(filePath);
  } catch (error) {
    throw new Error(`Migration file not found: ${filename}`);
  }
  
  console.log('📦 Running single migration...');
  console.log(`📁 Migrations directory: ${migrationsDir}`);
  console.log(`🔌 Target database: ${config.db.host}:${config.db.port}/${config.db.database}`);
  console.log(`📄 Migration file: ${filename}`);
  
  // Ensure database exists
  await ensureDatabase();
  
  const connection = await mysql.createConnection(config.db);
  try {
    const sql = await fs.readFile(filePath, 'utf8');
    console.log(`▶️  Running migration: ${filename}`);
    await runSql(connection, sql);
    console.log(`✅ Completed: ${filename}`);
  } catch (error) {
    console.error(`❌ Error in migration: ${error.message}`);
    throw error;
  } finally {
    await connection.end();
  }
}

// Get filename from command line argument
const filename = process.argv[2];

if (!filename) {
  console.error('❌ Please provide a migration filename');
  console.error('Usage: node scripts/run_single_migration.js <filename>');
  console.error('Example: node scripts/run_single_migration.js 08_add_pending_status_to_members.sql');
  process.exit(1);
}

// Only execute when script is run directly
runSingleMigration(filename)
  .then(() => {
    console.log('✅ Migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Migration failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  });

