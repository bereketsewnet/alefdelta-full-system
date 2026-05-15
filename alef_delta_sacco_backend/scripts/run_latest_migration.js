import fs from 'node:fs/promises';
import path from 'node:path';
import mysql from 'mysql2/promise';
import config from '../src/core/config.js';

const migrationsDir = path.resolve(process.cwd(), 'backend/migrations');

async function runSql(connection, sql) {
  const statements = sql
    .split(/;\s*(?:\r?\n|$)/)
    .map((stmt) => stmt.trim())
    .filter((stmt) => stmt.length);
  for (const statement of statements) {
    // Skip empty statements
    if (!statement) continue;
    try {
        await connection.query(statement);
    } catch (err) {
        // Ignore "Duplicate column name" errors which are common when re-running alterations
        if (err.code === 'ER_DUP_FIELDNAME') {
            console.log(`   ⚠️  Skipping duplicate column: ${err.message}`);
        } else if (err.code === 'ER_TABLE_EXISTS_ERROR') {
            console.log(`   ⚠️  Skipping existing table: ${err.message}`);
        } else {
            throw err;
        }
    }
  }
}

async function runLatestMigration() {
  const files = (await fs.readdir(migrationsDir))
    .filter((file) => file.endsWith('.sql'))
    .sort();

  const latestFile = files[files.length - 1];
  
  if (!latestFile) {
      console.log('No migrations found.');
      return;
  }

  console.log(`▶️  Running latest migration: ${latestFile}`);
  
  const connection = await mysql.createConnection(config.db);
  try {
    const sql = await fs.readFile(path.join(migrationsDir, latestFile), 'utf8');
    await runSql(connection, sql);
    console.log(`✅ Completed: ${latestFile}`);
  } finally {
    await connection.end();
  }
}

runLatestMigration()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });

