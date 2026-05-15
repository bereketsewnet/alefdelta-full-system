import fs from 'node:fs/promises';
import path from 'node:path';
import mysql from 'mysql2/promise';
import config from '../src/core/config.js';

const seedFile = path.resolve(process.cwd(), 'seeds/seed_all.sql');

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

async function seedAll() {
  console.log('🌱 Starting seed data insertion...');
  console.log(`📁 Seed file: ${seedFile}`);
  console.log(`🔌 Target database: ${config.db.host}:${config.db.port}/${config.db.database}`);
  
  // Ensure database exists
  await ensureDatabase();
  
  const sql = await fs.readFile(seedFile, 'utf8');
  const statements = splitStatements(sql);
  
  if (statements.length === 0) {
    throw new Error(`No SQL statements found in ${seedFile}`);
  }
  
  console.log(`📋 Found ${statements.length} SQL statement(s) to execute`);
  
  const connection = await mysql.createConnection(config.db);
  try {
    let count = 0;
    for (const statement of statements) {
      count += 1;
      // eslint-disable-next-line no-console
      console.log(`▶️  Executing statement ${count}/${statements.length}...`);
      // eslint-disable-next-line no-await-in-loop
      await connection.query(statement);
    }
    console.log(`✅ All ${count} statements executed successfully`);
  } catch (error) {
    console.error(`❌ Error executing seed statement: ${error.message}`);
    throw error;
  } finally {
    await connection.end();
  }
}

// Always execute when script is run
seedAll()
  .then(() => {
    console.log('✅ Seed data inserted successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Seed failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  });

