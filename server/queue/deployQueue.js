const { Queue } = require('bullmq');
const { getRedisConnection } = require('./redisConnection');

let deployQueue = null;

/**
 * Returns the singleton BullMQ Queue instance.
 * Lazily created on first call.
 */
function getDeployQueue() {
  if (!deployQueue) {
    deployQueue = new Queue('deployments', {
      connection: getRedisConnection(),
      defaultJobOptions: {
        attempts: 2,
        backoff: { type: 'exponential', delay: 3000 },
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 50 },
      },
    });
  }
  return deployQueue;
}

module.exports = { getDeployQueue };
