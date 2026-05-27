require('dotenv').config();

let connection = null;

/**
 * Returns a shared Redis connection config object for BullMQ.
 * BullMQ manages its own ioredis connection internally when given host/port.
 */
function getRedisConnection() {
  if (!connection) {
    connection = {
      host: process.env.REDIS_HOST || '127.0.0.1',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      maxRetriesPerRequest: null, // required by BullMQ
    };
  }
  return connection;
}

module.exports = { getRedisConnection };
