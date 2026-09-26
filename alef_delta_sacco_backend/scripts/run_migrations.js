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
    // eslint-disable-next-line no-await-in-loop
    await connection.query(statement);
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

async function ensureMigrationsTable(connection) {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      migration_name VARCHAR(255) PRIMARY KEY,
      applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB
  `);
}

async function getAppliedMigrations(connection) {
  const [rows] = await connection.query('SELECT migration_name FROM schema_migrations');
  return new Set(rows.map(row => row.migration_name));
}

async function markMigrationApplied(connection, migrationName) {
  await connection.query(
    'INSERT INTO schema_migrations (migration_name) VALUES (?)',
    [migrationName]
  );
}

export async function runMigrations() {
  console.log('📦 Starting database migrations...');
  console.log(`📁 Migrations directory: ${migrationsDir}`);
  console.log(`🔌 Target database: ${config.db.host}:${config.db.port}/${config.db.database}`);
  
  // Ensure database exists
  await ensureDatabase();
  
  const files = (await fs.readdir(migrationsDir))
    .filter((file) => file.endsWith('.sql'))
    .sort();
  const onlyArgument = process.argv.find((argument) => argument.startsWith('--only='));
  const onlyMigration = onlyArgument?.slice('--only='.length) || null;
  
  if (files.length === 0) {
    throw new Error(`No SQL migration files found in ${migrationsDir}`);
  }
  
  console.log(`📋 Found ${files.length} migration file(s): ${files.join(', ')}`);
  
  const connection = await mysql.createConnection(config.db);
  try {
    // Ensure migrations tracking table exists
    await ensureMigrationsTable(connection);
    
    // Get already applied migrations
    const appliedMigrations = await getAppliedMigrations(connection);
    console.log(`📊 Already applied: ${appliedMigrations.size} migration(s)`);

    if (onlyMigration) {
      const targetIndex = files.indexOf(onlyMigration);
      if (targetIndex < 0) throw new Error(`Requested migration does not exist: ${onlyMigration}`);
      const missingPredecessors = files.slice(0, targetIndex).filter((file) => !appliedMigrations.has(file));
      if (missingPredecessors.length) {
        throw new Error(`Cannot run only ${onlyMigration}; earlier migrations are not recorded as applied: ${missingPredecessors.join(', ')}`);
      }
      console.log(`🎯 Restricted to one migration: ${onlyMigration}`);
    }
    
    let appliedCount = 0;
    let skippedCount = 0;
    
    const selectedFiles = onlyMigration ? [onlyMigration] : files;
    for (const file of selectedFiles) {
      if (appliedMigrations.has(file)) {
        console.log(`⏭️  Skipping (already applied): ${file}`);
        skippedCount++;
        continue;
      }
      
      const sql = await fs.readFile(path.join(migrationsDir, file), 'utf8');
      console.log(`▶️  Running migration: ${file}`);
      await runSql(connection, sql);
      await markMigrationApplied(connection, file);
      console.log(`✅ Completed: ${file}`);
      appliedCount++;
    }
    
    console.log(`\n📈 Migration summary:`);
    console.log(`   - Applied: ${appliedCount}`);
    console.log(`   - Skipped: ${skippedCount}`);
    console.log(`   - Total considered: ${selectedFiles.length}`);
  } catch (error) {
    console.error(`❌ Error in migration: ${error.message}`);
    throw error;
  } finally {
    await connection.end();
  }
}

// Only execute when script is run directly (not when imported)
if (process.argv[1] && process.argv[1].includes('run_migrations.js')) {
  runMigrations()
    .then(() => {
      console.log('✅ Migrations completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration failed:', error.message);
      console.error(error.stack);
      process.exit(1);
    });
}
