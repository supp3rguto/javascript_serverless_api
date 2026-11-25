# Serverless Loyalty API (AWS Lambda + DynamoDB)

A RESTful Serverless API built with Node.js, Serverless Framework, AWS Lambda, API Gateway, and Amazon DynamoDB. Originally designed around a coffee shop loyalty program scenario from AWS Cloud Practitioner Essentials, the project runs **100% locally** using Docker Compose and `serverless-offline` without requiring an active AWS account.

## Architecture & Engineering Decisions

- **Serverless Compute (AWS Lambda + API Gateway):** Event-driven HTTP handlers emulated locally with Serverless Framework and `serverless-offline`.
- **Layered Separation:** Handlers (`src/handlers/`) are strictly responsible for HTTP parsing and response mapping; business validation, UUID verification, and DynamoDB SDK v3 commands live in `src/services/customerService.js`.
- **Atomic Point Updates (`UpdateCommand`):** `PATCH /clients/{id}/points` uses `UpdateExpression` (`if_not_exists(fidelityPoints, :zero) + :delta`) paired with `ConditionExpression: "attribute_exists(id)"` to prevent race conditions and eliminate read-modify-write round trips.
- **Conditional Deletes (`DeleteCommand`):** `DELETE /clients/{id}` enforces `ConditionExpression: "attribute_exists(id)"` so deleting a non-existent record deterministically returns `404 Not Found`.
- **Point Reads vs. Full Scans (`GetCommand` vs. `ScanCommand`):** Partition key (`id`, UUID v4) validation runs before hitting DynamoDB to avoid wasted read capacity on malformed requests.
- **Infrastructure as Code (IaC):** Functions, HTTP routes, DynamoDB table definition (`ClientsFidelity`), and least-privilege IAM permissions are declared in `serverless.yml`.
- **Containerized Local DB:** Instead of relying on the unmaintained `serverless-dynamodb-local` plugin (which depends on AWS SDK v2 and causes credential conflicts), DynamoDB Local runs via Docker Compose alongside an automated `aws-cli` init container that provisions the `ClientsFidelity` table on startup.

## Tech Stack

- **Runtime:** Node.js `v20.x`
- **Framework:** Serverless Framework + `serverless-offline`
- **AWS SDK:** `@aws-sdk/client-dynamodb`, `@aws-sdk/lib-dynamodb` (v3)
- **Local Infrastructure:** Docker Compose (`amazon/dynamodb-local` + `amazon/aws-cli`)
- **Testing:** Jest + `aws-sdk-client-mock`

## Project Structure

```text
javascript_serverless_api/
├── docker-compose.yml              # DynamoDB Local + automated table provisioning
├── serverless.yml                  # IaC (Lambda functions, HTTP routes, IAM, DynamoDB table)
├── package.json
├── src/
│   ├── database/
│   │   └── dynamoClient.js         # DynamoDB DocumentClient (switches local/AWS via IS_OFFLINE)
│   ├── handlers/
│   │   ├── hello.js                # GET /dev/hello (health check)
│   │   ├── createCustomer.js       # POST /dev/clients
│   │   ├── listCustomers.js        # GET /dev/clients
│   │   ├── getCustomer.js          # GET /dev/clients/{id}
│   │   ├── updateCustomerPoints.js # PATCH /dev/clients/{id}/points
│   │   └── deleteCustomer.js       # DELETE /dev/clients/{id}
│   ├── services/
│   │   └── customerService.js      # Business logic, UUID validation & DynamoDB SDK v3 commands
│   └── utils/
│       └── httpResponse.js         # Standardized API Gateway Proxy responses & CORS headers
└── tests/
    └── customerService.test.js     # Unit tests with mocked DynamoDB DocumentClient

```

## Running Locally

### Prerequisites

* Node.js 20+
* Docker & Docker Compose

### Setup & Start

1. Install dependencies:

```bash
npm install

```

2. Start DynamoDB Local and automatically provision the `ClientsFidelity` table:

```bash
docker compose up -d

```

3. Start the API Gateway & Lambda emulator:

```bash
npx serverless offline

```

The API will be available at `http://localhost:3000/dev`.

## API Endpoints

| Method | Endpoint | DynamoDB Operation | Responses |
| --- | --- | --- | --- |
| `GET` | `/dev/hello` | - | `200 OK` |
| `POST` | `/dev/clients` | `PutItem` | `201 Created`, `400 Bad Request` |
| `GET` | `/dev/clients` | `Scan` | `200 OK`, `500 Internal Server Error` |
| `GET` | `/dev/clients/{id}` | `GetItem` | `200 OK`, `400 Bad Request`, `404 Not Found` |
| `PATCH` | `/dev/clients/{id}/points` | `UpdateItem` (atomic) | `200 OK`, `400 Bad Request`, `404 Not Found` |
| `DELETE` | `/dev/clients/{id}` | `DeleteItem` (conditional) | `200 OK`, `400 Bad Request`, `404 Not Found` |

### Example Requests

Create a client (defaults to `10` fidelity points):

```bash
curl -i -X POST http://localhost:3000/dev/clients \
  -H "Content-Type: application/json" \
  -d '{"name": "Augusto", "email": "augusto@cafeteria.com"}'

```

List all clients:

```bash
curl -i http://localhost:3000/dev/clients

```

Get a client by UUID:

```bash
curl -i http://localhost:3000/dev/clients/<UUID>

```

Atomically add/subtract loyalty points:

```bash
curl -i -X PATCH http://localhost:3000/dev/clients/<UUID>/points \
  -H "Content-Type: application/json" \
  -d '{"points": 50}'

```

Delete a client:

```bash
curl -i -X DELETE http://localhost:3000/dev/clients/<UUID>

```

## Running Tests

Unit tests mock the AWS SDK v3 `DynamoDBDocumentClient` via `aws-sdk-client-mock` and run without requiring Docker or DynamoDB Local:

```bash
npm test

```

## Author

**Augusto Ortigoso Barbosa**

* GitHub: https://github.com/supp3rguto
* LinkedIn: https://www.linkedin.com/in/augusto-barbosa-769602194
