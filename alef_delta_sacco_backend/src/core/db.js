import { Sequelize } from 'sequelize';
import config from './config.js';
import logger from './logger.js';

// Initialize Sequelize with options matching the working project
// and using the existing config structure
const sequelize = new Sequelize(
  config.db.database,
  config.db.user,
  config.db.password,
  {
    host: config.db.host,
    port: config.db.port,
    dialect: 'mysql',
    logging: false,
    define: { timestamps: false },
    pool: {
      max: config.db.connectionLimit || 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    dialectOptions: {
      // Ensure date strings are returned to match previous mysql2 behavior
      dateStrings: true,
      typeCast: true,
      // If the server enforces specific flags, Sequelize/mysql2 usually handles them better here
      multipleStatements: true
    }
  }
);

/**
 * Executes a SELECT query and returns the rows.
 * mimic: const [rows] = await pool.query(sql, params); return rows;
 */
export async function query(sql, params = []) {
  try {
    const [results] = await sequelize.query(sql, { replacements: params });
    return results;
  } catch (error) {
    logger.error('Database query error', { sql, error });
    throw error;
  }
}

/**
 * Executes an INSERT/UPDATE/DELETE query and returns the result header.
 * mimic: const [result] = await pool.execute(sql, params); return result;
 */
export async function execute(sql, params = []) {
  try {
    const [results] = await sequelize.query(sql, { replacements: params });
    return results;
  } catch (error) {
    logger.error('Database execute error', { sql, error });
    throw error;
  }
}

/**
 * Creates a shim object that mimics a mysql2 connection
 * allowing it to be used by existing repositories within a Sequelize transaction.
 */
const createConnectionShim = (t) => ({
  query: async (sql, params) => {
    // mysql2 connection.query returns [rows, fields]
    const [results] = await sequelize.query(sql, { transaction: t, replacements: params });
    return [results, null];
  },
  execute: async (sql, params) => {
    // mysql2 connection.execute returns [result, fields]
    const [results] = await sequelize.query(sql, { transaction: t, replacements: params });
    return [results, null];
  },
  // No-ops for transaction management as it's handled by Sequelize's scope
  beginTransaction: async () => {},
  commit: async () => {},
  rollback: async () => {},
  release: () => {}
});

/**
 * Executes a handler within a transaction.
 * Passes a connection-like object to the handler.
 */
export async function withTransaction(handler) {
  return sequelize.transaction(async (t) => {
    const connectionShim = createConnectionShim(t);
    return handler(connectionShim);
  });
}

/**
 * Gets a raw connection (shimmed) for manual management.
 * NOTE: Prefer using withTransaction whenever possible.
 */
export async function getConnection() {
  // This is a best-effort shim for legacy code that calls getConnection directly.
  // It returns a connection from the manager, which is a raw mysql2 connection.
  const connection = await sequelize.connectionManager.getConnection();
  
  // We attach the release method that Sequelize expects if it's not standard
  // or ensure the caller calls .release() which we map to releasing back to manager.
  const originalRelease = connection.release;
  connection.release = () => {
    if (originalRelease) originalRelease.call(connection);
    sequelize.connectionManager.releaseConnection(connection);
  };
  
  return connection;
}

export async function healthCheck() {
  try {
    await sequelize.authenticate();
    return true;
  } catch (error) {
    logger.error('Database health check failed', { error });
    return false;
  }
}

export default sequelize;
