# Requirements Document

## Introduction

This document defines the requirements for the **Hosting Control Panel** — a full-stack feature that allows platform admins to onboard new clients by deploying Docker containers to an existing EC2 server and triggering post-deployment AWS Lambda functions. The system consists of a React frontend (built on the existing Vite project), a Node.js/Express backend, a BullMQ/Redis job queue, and a MongoDB database for deployment state persistence.

The feature covers two main areas:
1. **Client Onboarding Form** — a React UI where admins submit deployment requests.
2. **Live Status Dashboard** — a React UI that polls the backend and displays real-time deployment status updates.

On the backend, a REST API accepts deployment requests, persists them to MongoDB, enqueues background jobs, and a worker process executes Docker commands on EC2 (via AWS SSM) and invokes an AWS Lambda function.

---

## Glossary

- **Control_Panel**: The React frontend application that admins use to manage client deployments.
- **Onboarding_Form**: The React component that collects `clientName`, `domain`, and `image` inputs and submits a deployment request.
- **Status_Dashboard**: The React component that displays the current deployment status for all submitted deployments and auto-refreshes without a full page reload.
- **Deploy_API**: The Node.js/Express HTTP endpoint (`POST /api/deploy`) that accepts deployment requests.
- **Status_API**: The Node.js/Express HTTP endpoint (`GET /api/status/:id`) that returns the current deployment record.
- **Deployment_Record**: A MongoDB document representing a single deployment, containing `clientName`, `domain`, `image`, `status`, `createdAt`, and `updatedAt` fields.
- **Deployment_Queue**: The BullMQ queue backed by Redis that holds pending deployment jobs.
- **Deployment_Worker**: The BullMQ worker process that consumes jobs from the Deployment_Queue and executes the deployment steps.
- **EC2_Server**: The existing Amazon EC2 instance on which Docker containers are run.
- **SSM_Command**: An AWS Systems Manager `SendCommand` API call used to execute shell commands on the EC2_Server without requiring direct SSH access.
- **Docker_Container**: A running container on the EC2_Server, started from the client-supplied image and mapped to the client's custom domain.
- **Lambda_Function**: The AWS Lambda function invoked after a successful Docker deployment for post-deployment setup tasks.
- **Deployment_Status**: An enumerated value representing the lifecycle state of a deployment: `Pending`, `Running`, `Completed`, or `Failed`.
- **Validator**: The input validation module used by both the Onboarding_Form and the Deploy_API.

---

## Requirements

### Requirement 1: Client Onboarding Form

**User Story:** As a platform admin, I want a form to submit a new client deployment, so that I can onboard clients without manually running server commands.

#### Acceptance Criteria

1. THE Control_Panel SHALL render the Onboarding_Form with input fields for `clientName`, `domain`, and `image`.
2. THE Onboarding_Form SHALL include a "Deploy" button that submits the form data to the Deploy_API.
3. WHEN the admin clicks "Deploy" with all fields populated and valid, THE Onboarding_Form SHALL disable the "Deploy" button and display a loading indicator until a response is received from the Deploy_API.
4. WHEN the Deploy_API responds with a deployment ID, THE Onboarding_Form SHALL clear its input fields and display a success notification containing the deployment ID.
5. IF the Deploy_API returns an error response, THEN THE Onboarding_Form SHALL display a descriptive error message without clearing the input fields.
6. THE Validator SHALL reject a `clientName` that is empty or exceeds 100 characters, and THE Onboarding_Form SHALL display the validation error inline before submission.
7. THE Validator SHALL reject a `domain` that does not match the pattern `^([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$`, and THE Onboarding_Form SHALL display the validation error inline before submission.
8. THE Validator SHALL reject an `image` that is empty or does not match the pattern `^[a-zA-Z0-9._\-/:]+$`, and THE Onboarding_Form SHALL display the validation error inline before submission.

---

### Requirement 2: Live Status Dashboard

**User Story:** As a platform admin, I want to see the real-time deployment status of all submitted deployments, so that I can monitor progress without manually refreshing the page.

#### Acceptance Criteria

1. THE Status_Dashboard SHALL display a list of all Deployment_Records retrieved from the Status_API, showing `clientName`, `domain`, `image`, `status`, and `createdAt` for each record.
2. WHILE a Deployment_Record has a status of `Pending` or `Running`, THE Status_Dashboard SHALL poll the Status_API at an interval of 5 seconds for that record.
3. WHEN a Deployment_Record transitions to `Completed` or `Failed`, THE Status_Dashboard SHALL stop polling for that record and update the displayed status without a full page reload.
4. THE Status_Dashboard SHALL render each Deployment_Status value with a distinct visual indicator: `Pending` as grey, `Running` as blue, `Completed` as green, and `Failed` as red.
5. IF the Status_API returns an error for a polling request, THEN THE Status_Dashboard SHALL display an inline error indicator for that record and retry after the next polling interval.
6. THE Status_Dashboard SHALL display deployments in reverse chronological order by `createdAt`.

---

### Requirement 3: Deploy API Endpoint

**User Story:** As the system, I want a POST endpoint that accepts deployment requests, so that the frontend can trigger deployments and receive an immediate acknowledgement.

#### Acceptance Criteria

1. WHEN a `POST /api/deploy` request is received with a valid JSON body containing `clientName`, `domain`, and `image`, THE Deploy_API SHALL create a Deployment_Record in MongoDB with `status` set to `Pending` and respond with HTTP 200 and a JSON body containing the new record's `id`.
2. THE Deploy_API SHALL push a job containing the Deployment_Record's `id` onto the Deployment_Queue immediately after the record is persisted.
3. IF the request body is missing any of `clientName`, `domain`, or `image`, THEN THE Deploy_API SHALL respond with HTTP 400 and a JSON error body describing the missing fields.
4. IF the `domain` field fails the Validator's domain pattern check, THEN THE Deploy_API SHALL respond with HTTP 422 and a JSON error body describing the validation failure.
5. IF the `image` field fails the Validator's image pattern check, THEN THE Deploy_API SHALL respond with HTTP 422 and a JSON error body describing the validation failure.
6. IF MongoDB is unavailable when the request is received, THEN THE Deploy_API SHALL respond with HTTP 503 and a JSON error body without pushing a job to the Deployment_Queue.
7. THE Deploy_API SHALL respond within 2000ms under normal operating conditions (MongoDB and Redis available).

---

### Requirement 4: Status API Endpoint

**User Story:** As the system, I want a GET endpoint that returns the current deployment status, so that the frontend can poll for updates.

#### Acceptance Criteria

1. WHEN a `GET /api/status/:id` request is received with a valid MongoDB ObjectId, THE Status_API SHALL respond with HTTP 200 and a JSON body containing the full Deployment_Record.
2. IF the `:id` parameter does not correspond to any Deployment_Record in MongoDB, THEN THE Status_API SHALL respond with HTTP 404 and a JSON error body.
3. IF the `:id` parameter is not a valid MongoDB ObjectId format, THEN THE Status_API SHALL respond with HTTP 400 and a JSON error body.
4. THE Status_API SHALL respond within 500ms under normal operating conditions.

---

### Requirement 5: Deployment Worker — Docker on EC2

**User Story:** As the system, I want a background worker that runs Docker containers on the EC2 server, so that client deployments are executed without blocking the API.

#### Acceptance Criteria

1. WHEN the Deployment_Worker picks up a job from the Deployment_Queue, THE Deployment_Worker SHALL update the Deployment_Record's `status` to `Running` in MongoDB before executing any deployment steps.
2. THE Deployment_Worker SHALL issue an SSM_Command to the EC2_Server to pull the Docker image specified in the Deployment_Record using `docker pull <image>`.
3. WHEN the `docker pull` SSM_Command completes successfully, THE Deployment_Worker SHALL issue a second SSM_Command to run the container with the client's `domain` mapped as an environment variable and a host port assigned.
4. THE Deployment_Worker SHALL poll the SSM_Command invocation status at 5-second intervals until the command reaches a terminal state (`Success` or `Failed`), with a maximum wait time of 300 seconds per command.
5. IF an SSM_Command returns a `Failed` terminal state or the 300-second timeout is exceeded, THEN THE Deployment_Worker SHALL update the Deployment_Record's `status` to `Failed` and record the error output in a `errorMessage` field, then stop processing the job.
6. WHEN both SSM_Commands complete with `Success` status, THE Deployment_Worker SHALL proceed to invoke the Lambda_Function.

---

### Requirement 6: Deployment Worker — AWS Lambda Invocation

**User Story:** As the system, I want the worker to trigger a Lambda function after a successful Docker deployment, so that post-deployment setup tasks are executed automatically.

#### Acceptance Criteria

1. WHEN the Docker deployment steps complete successfully, THE Deployment_Worker SHALL invoke the Lambda_Function using the AWS SDK v3 `InvokeCommand` with a payload containing `clientName`, `domain`, and `image` from the Deployment_Record.
2. WHEN the Lambda_Function invocation returns a `StatusCode` of 200, THE Deployment_Worker SHALL update the Deployment_Record's `status` to `Completed` and set `updatedAt` to the current timestamp.
3. IF the Lambda_Function invocation returns a `FunctionError` field or a `StatusCode` other than 200, THEN THE Deployment_Worker SHALL update the Deployment_Record's `status` to `Failed` and record the Lambda error details in the `errorMessage` field.
4. IF the AWS SDK throws an exception during the Lambda invocation (e.g., network error, IAM permission denied), THEN THE Deployment_Worker SHALL update the Deployment_Record's `status` to `Failed` and record the exception message in the `errorMessage` field.

---

### Requirement 7: Deployment Record Persistence

**User Story:** As the system, I want all deployment state to be persisted in MongoDB, so that status is durable across server restarts and accessible to both the API and the worker.

#### Acceptance Criteria

1. THE Deployment_Record SHALL contain the fields: `id` (MongoDB ObjectId), `clientName` (string), `domain` (string), `image` (string), `status` (Deployment_Status enum), `createdAt` (Date), `updatedAt` (Date), and `errorMessage` (string, nullable).
2. WHEN a Deployment_Record is created, THE Deploy_API SHALL set `createdAt` and `updatedAt` to the current UTC timestamp.
3. WHEN the Deployment_Worker updates a Deployment_Record's `status`, THE Deployment_Worker SHALL also update `updatedAt` to the current UTC timestamp.
4. THE Deployment_Record SHALL enforce that `status` is one of the four valid Deployment_Status values: `Pending`, `Running`, `Completed`, `Failed`.
5. FOR ALL Deployment_Records, the `createdAt` timestamp SHALL be less than or equal to the `updatedAt` timestamp (temporal ordering invariant).

---

### Requirement 8: Input Validation — Round-Trip and Structural Integrity

**User Story:** As the system, I want all deployment inputs to be validated consistently on both the frontend and backend, so that invalid data never reaches the queue or the EC2 server.

#### Acceptance Criteria

1. THE Validator SHALL accept a `clientName` that is a non-empty string of 1 to 100 characters.
2. THE Validator SHALL accept a `domain` that matches the pattern `^([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$`.
3. THE Validator SHALL accept an `image` that matches the Docker image reference pattern `^[a-zA-Z0-9._\-/:]+$`.
4. FOR ALL valid deployment input objects `{ clientName, domain, image }`, serializing the object to JSON and deserializing it SHALL produce an object with identical field values (JSON round-trip property).
5. THE Validator SHALL return a result object with the shape `{ valid: boolean, error: string | null }` for every validation call, consistent with the existing validation utility contract in `src/utils/validation.js`.

