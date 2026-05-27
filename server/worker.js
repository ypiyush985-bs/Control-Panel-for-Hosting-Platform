/**
 * Deployment Worker
 *
 * Runs as a separate process: `node worker.js`
 *
 * Picks up jobs from the 'deployments' BullMQ queue and executes:
 *   1. Docker on EC2 via AWS SSM SendCommand
 *   2. AWS Lambda InvokeCommand for post-deployment setup
 *   3. Updates MongoDB deployment status at each step
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { Worker } = require('bullmq');
const { SSMClient, SendCommandCommand, GetCommandInvocationCommand } = require('@aws-sdk/client-ssm');
const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda');

const Deployment = require('./models/Deployment');
const { getRedisConnection } = require('./queue/redisConnection');

// ── AWS clients ───────────────────────────────────────────────────────────────

const ssmClient = new SSMClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const lambdaClient = new LambdaClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Updates a deployment's status and appends a step log entry.
 */
async function updateStep(deploymentId, stepName, stepStatus, message, deploymentStatus = null) {
  const update = {
    $push: {
      steps: {
        name: stepName,
        status: stepStatus,
        message,
        timestamp: new Date(),
      },
    },
  };
  if (deploymentStatus) {
    update.$set = { status: deploymentStatus };
  }
  await Deployment.findByIdAndUpdate(deploymentId, update);
}

/**
 * Polls SSM GetCommandInvocation until the command reaches a terminal state.
 * Returns the final status string.
 */
async function waitForSSMCommand(commandId, instanceId, maxWaitMs = 120_000) {
  const start = Date.now();
  const POLL_INTERVAL = 5_000;

  while (Date.now() - start < maxWaitMs) {
    await new Promise((r) => setTimeout(r, POLL_INTERVAL));

    const result = await ssmClient.send(
      new GetCommandInvocationCommand({
        CommandId: commandId,
        InstanceId: instanceId,
      })
    );

    const status = result.StatusDetails;
    // Terminal states
    if (['Success', 'Failed', 'Cancelled', 'TimedOut', 'DeliveryTimedOut'].includes(status)) {
      return { status, output: result.StandardOutputContent, error: result.StandardErrorContent };
    }
  }

  throw new Error('SSM command timed out waiting for completion');
}

// ── Worker processor ──────────────────────────────────────────────────────────

async function processDeployment(job) {
  const { deploymentId, clientName, domain, image } = job.data;

  console.log(`[Worker] Processing deployment ${deploymentId} — ${clientName} / ${domain} / ${image}`);

  // ── Step 1: Mark as Running ────────────────────────────────────────────────
  await Deployment.findByIdAndUpdate(deploymentId, { status: 'Running' });
  await updateStep(deploymentId, 'Initializing', 'done', 'Deployment job picked up by worker.');

  // ── Step 2: Docker on EC2 via SSM SendCommand ──────────────────────────────
  await updateStep(deploymentId, 'Docker Deploy', 'running', `Sending SSM command to EC2 instance ${process.env.EC2_INSTANCE_ID}…`);

  const dockerCommand = [
    `docker pull ${image}`,
    `docker stop ${domain.replace(/\./g, '-')} 2>/dev/null || true`,
    `docker rm   ${domain.replace(/\./g, '-')} 2>/dev/null || true`,
    `docker run -d --name ${domain.replace(/\./g, '-')} ` +
      `-e VIRTUAL_HOST=${domain} ` +
      `-e LETSENCRYPT_HOST=${domain} ` +
      `--network nginx-proxy ` +
      `${image}`,
  ].join(' && ');

  let ssmCommandId;
  try {
    const ssmResponse = await ssmClient.send(
      new SendCommandCommand({
        InstanceIds: [process.env.EC2_INSTANCE_ID],
        DocumentName: 'AWS-RunShellScript',
        Parameters: { commands: [dockerCommand] },
        Comment: `Deploy ${image} for ${clientName} on ${domain}`,
        TimeoutSeconds: 120,
      })
    );
    ssmCommandId = ssmResponse.Command.CommandId;
    console.log(`[Worker] SSM command sent: ${ssmCommandId}`);
  } catch (err) {
    await updateStep(deploymentId, 'Docker Deploy', 'error', `SSM SendCommand failed: ${err.message}`, 'Failed');
    await Deployment.findByIdAndUpdate(deploymentId, { errorMessage: err.message });
    throw err;
  }

  // Poll for SSM command completion
  let ssmResult;
  try {
    ssmResult = await waitForSSMCommand(ssmCommandId, process.env.EC2_INSTANCE_ID);
  } catch (err) {
    await updateStep(deploymentId, 'Docker Deploy', 'error', err.message, 'Failed');
    await Deployment.findByIdAndUpdate(deploymentId, { errorMessage: err.message });
    throw err;
  }

  if (ssmResult.status !== 'Success') {
    const msg = `Docker deploy failed (${ssmResult.status}): ${ssmResult.error || ssmResult.output}`;
    await updateStep(deploymentId, 'Docker Deploy', 'error', msg, 'Failed');
    await Deployment.findByIdAndUpdate(deploymentId, { errorMessage: msg });
    throw new Error(msg);
  }

  await updateStep(deploymentId, 'Docker Deploy', 'done', `Container started successfully on ${domain}.`);

  // ── Step 3: Invoke Lambda for post-deployment setup ────────────────────────
  await updateStep(deploymentId, 'Lambda Setup', 'running', `Invoking Lambda function "${process.env.LAMBDA_FUNCTION_NAME}"…`);

  const lambdaPayload = JSON.stringify({
    deploymentId,
    clientName,
    domain,
    image,
    action: 'post-deployment-setup',
  });

  let lambdaResponse;
  try {
    lambdaResponse = await lambdaClient.send(
      new InvokeCommand({
        FunctionName: process.env.LAMBDA_FUNCTION_NAME,
        InvocationType: 'RequestResponse',
        Payload: Buffer.from(lambdaPayload),
      })
    );
  } catch (err) {
    await updateStep(deploymentId, 'Lambda Setup', 'error', `Lambda invocation failed: ${err.message}`, 'Failed');
    await Deployment.findByIdAndUpdate(deploymentId, { errorMessage: err.message });
    throw err;
  }

  // Check for Lambda function error
  if (lambdaResponse.FunctionError) {
    const responseBody = Buffer.from(lambdaResponse.Payload).toString('utf-8');
    const msg = `Lambda returned error: ${lambdaResponse.FunctionError} — ${responseBody}`;
    await updateStep(deploymentId, 'Lambda Setup', 'error', msg, 'Failed');
    await Deployment.findByIdAndUpdate(deploymentId, { errorMessage: msg });
    throw new Error(msg);
  }

  const lambdaResult = Buffer.from(lambdaResponse.Payload).toString('utf-8');
  await updateStep(deploymentId, 'Lambda Setup', 'done', `Lambda completed: ${lambdaResult}`);

  // ── Step 4: Mark Completed ─────────────────────────────────────────────────
  await Deployment.findByIdAndUpdate(deploymentId, { status: 'Completed' });
  await updateStep(deploymentId, 'Completed', 'done', `Deployment for ${clientName} on ${domain} is live.`);

  console.log(`[Worker] Deployment ${deploymentId} completed successfully.`);
}

// ── Bootstrap ─────────────────────────────────────────────────────────────────

async function start() {
  // Connect to MongoDB
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/deployment-panel');
  console.log('[Worker] MongoDB connected.');

  // Start BullMQ worker
  const worker = new Worker('deployments', processDeployment, {
    connection: getRedisConnection(),
    concurrency: 3,
  });

  worker.on('completed', (job) => {
    console.log(`[Worker] Job ${job.id} completed.`);
  });

  worker.on('failed', (job, err) => {
    console.error(`[Worker] Job ${job?.id} failed: ${err.message}`);
  });

  worker.on('error', (err) => {
    console.error('[Worker] Worker error:', err);
  });

  console.log('[Worker] Listening for deployment jobs…');
}

start().catch((err) => {
  console.error('[Worker] Fatal startup error:', err);
  process.exit(1);
});
