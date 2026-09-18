const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

// Create connection pool with sensible production/development limits
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'trueinspect_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

/**
 * Executes a parameterized SQL query using the connection pool.
 * @param {string} sql
 * @param {Array} params
 * @returns {Promise<Array>}
 */
const query = async (sql, params = []) => {
  const [results] = await pool.execute(sql, params);
  return results;
};

/**
 * Tests connection to MySQL database.
 * Returns connection status object.
 */
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    return { success: true, message: 'Connected to MySQL database: ' + (process.env.DB_NAME || 'trueinspect_db') };
  } catch (error) {
    return {
      success: false,
      message: 'Unable to connect to MySQL database. Please verify credentials in backend/.env.',
      error: error.message
    };
  }
};

module.exports = {
  pool,
  query,
  testConnection
};
