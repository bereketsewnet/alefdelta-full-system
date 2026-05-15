import mysql from 'mysql2/promise';
import config from '../src/core/config.js';
import { runMigrations } from './run_migrations.js';

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

async function dropAllTables() {
  await ensureDatabase();
  const connection = await mysql.createConnection(config.db);
  try {
    // Disable foreign key checks to allow dropping tables with FK constraints
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');
    
    const [rows] = await connection.query(
      'SELECT table_name FROM information_schema.tables WHERE table_schema = ?',
      [config.db.database]
    );
    if (rows.length === 0) {
      console.log('ℹ️  No tables to drop');
      await connection.query('SET FOREIGN_KEY_CHECKS = 1');
      return;
    }
    console.log(`🗑️  Dropping ${rows.length} table(s)...`);
    
    for (const row of rows) {
      const tableName = row.table_name || row.TABLE_NAME;
      // eslint-disable-next-line no-await-in-loop
      await connection.query(`DROP TABLE IF EXISTS \`${tableName}\``);
      console.log(`   ✓ Dropped table: ${tableName}`);
    }
    
    // Re-enable foreign key checks
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log('✅ All tables dropped successfully');
  } finally {
    await connection.end();
  }
}

async function reset() {
  console.log('🔄 Starting database reset...');
  try {
    await dropAllTables();
  } catch (error) {
    console.error('❌ Failed to drop tables:', error.message);
    throw error;
  }
  await runMigrations();
}

// Always execute when script is run
reset()
  .then(() => {
    console.log('✅ Database reset complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Reset failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  });

