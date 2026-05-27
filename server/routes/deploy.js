const express = require('express');
const router = express.Router();
const Deployment = require('../models/Deployment');
const { getDeployQueue } = require('../queue/deployQueue');

/**
 * POST /api/deploy
 *
 * Accepts: { clientName, domain, image }
 * - Validates input
 * - Saves a new Deployment document with status "Pending"
 * - Pushes a job to the BullMQ queue
 * - Responds immediately with 200 OK + { deploymentId }
 */
router.post('/deploy', async (req, res) => {
  try {
    const { clientName, domain, image } = req.body;

    // Basic validation
    if (!clientName || typeof clientName !== 'string' || !clientName.trim()) {
      return res.status(400).json({ error: 'clientName is required.' });
    }
    if (!domain || typeof domain !== 'string' || !domain.trim()) {
      return res.status(400).json({ error: 'domain is required.' });
    }
    if (!image || typeof image !== 'string' || !image.trim()) {
      return res.status(400).json({ error: 'image is required.' });
    }

    // Domain format check
    const domainRegex = /^([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/;
    if (!domainRegex.test(domain.trim())) {
      return res.status(400).json({ error: 'Invalid domain format (e.g. test.ourplatform.com).' });
    }

    // Save to MongoDB as Pending
    const deployment = await Deployment.create({
      clientName: clientName.trim(),
      domain: domain.trim().toLowerCase(),
      image: image.trim(),
      status: 'Pending',
      steps: [
        {
          name: 'Queued',
          status: 'done',
          message: 'Deployment request received and queued.',
          timestamp: new Date(),
        },
      ],
    });

    // Push job to BullMQ queue
    const queue = getDeployQueue();
    const job = await queue.add(
      'deploy',
      {
        deploymentId: deployment._id.toString(),
        clientName: deployment.clientName,
        domain: deployment.domain,
        image: deployment.image,
      },
      { jobId: deployment._id.toString() }
    );

    // Store the BullMQ job ID on the deployment record
    await Deployment.findByIdAndUpdate(deployment._id, { jobId: job.id });

    return res.status(200).json({
      message: 'Deployment queued successfully.',
      deploymentId: deployment._id.toString(),
    });
  } catch (err) {
    console.error('[POST /api/deploy]', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

/**
 * GET /api/status/:id
 *
 * Returns the current deployment status + step log for the given ID.
 */
router.get('/status/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Basic ObjectId format check
    if (!/^[a-f\d]{24}$/i.test(id)) {
      return res.status(400).json({ error: 'Invalid deployment ID.' });
    }

    const deployment = await Deployment.findById(id).lean();
    if (!deployment) {
      return res.status(404).json({ error: 'Deployment not found.' });
    }

    return res.json({
      id: deployment._id.toString(),
      clientName: deployment.clientName,
      domain: deployment.domain,
      image: deployment.image,
      status: deployment.status,
      steps: deployment.steps,
      errorMessage: deployment.errorMessage,
      createdAt: deployment.createdAt,
      updatedAt: deployment.updatedAt,
    });
  } catch (err) {
    console.error('[GET /api/status/:id]', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

/**
 * GET /api/deployments
 *
 * Returns all deployments (most recent first) for the dashboard list.
 */
router.get('/deployments', async (req, res) => {
  try {
    const deployments = await Deployment.find()
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return res.json(
      deployments.map((d) => ({
        id: d._id.toString(),
        clientName: d.clientName,
        domain: d.domain,
        image: d.image,
        status: d.status,
        errorMessage: d.errorMessage,
        createdAt: d.createdAt,
        updatedAt: d.updatedAt,
      }))
    );
  } catch (err) {
    console.error('[GET /api/deployments]', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
