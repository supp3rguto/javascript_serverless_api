const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient } = require("@aws-sdk/lib-dynamodb");

const isOffline = process.env.IS_OFFLINE;

const client = new DynamoDBClient({
    region: "us-east-1",
    endpoint: isOffline ? "http://localhost:8000" : undefined,
    credentials: isOffline
        ? { accessKeyId: "fakeMyKeyId", secretAccessKey: "fakeSecretAccessKey"}
        : undefined,
});

const dynamoClient = DynamoDBDocumentClient.from(client);

module.exports = dynamoClient;