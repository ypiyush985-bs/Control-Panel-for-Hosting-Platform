const mongoose = require('mongoose');

/**
 * Deployment model — tracks each client onboarding request.
 *
 * status lifecycle:
 *   Pending → Running → Completed | Failed
 */
const deploymentSchema = new mongoose.Schema(
  {
    clientName: {
      type: String,
      required: true,
      trim: true,
    },
    domain: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    image: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['Pending', 'Running', 'Completed', 'Failed'],
      default: 'Pending',
    },
    // Step-level detail for the UI
    steps: [
      {
        name: String,
        status: { type: String, enum: ['pending', 'running', 'done', 'error'] },
        message: String,
        timestamp: Date,
      },
    ],
    // Error message if the deployment failed
    errorMessage: {
      type: String,
      default: null,
    },
    // BullMQ job ID for reference
    jobId: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true, // adds createdAt + updatedAt
  }
);

module.exports = mongoose.model('Deployment', deploymentSchema);
