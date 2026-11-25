const dynamoDB = require("../database/dynamoClient");
const {
  PutCommand,
  ScanCommand,
  GetCommand,
  UpdateCommand,
  DeleteCommand,
} = require("@aws-sdk/lib-dynamodb");
const crypto = require("crypto");

const TABLE_NAME = "ClientsFidelity";
const UUID_V4_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const createHttpError = (statusCode, message) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
};

const createClient = async (clientData) => {
  if (!clientData?.name || !clientData?.email) {
    throw createHttpError(400, "Name and email are required.");
  }

  const newClient = {
    id: crypto.randomUUID(),
    name: clientData.name,
    email: clientData.email,
    fidelityPoints: 10,
    createdAt: new Date().toISOString(),
  };

  await dynamoDB.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: newClient,
    })
  );

  return newClient;
};

const listClients = async () => {
  const result = await dynamoDB.send(
    new ScanCommand({
      TableName: TABLE_NAME,
    })
  );
  return result.Items || [];
};

const getClientById = async (id) => {
  if (!id || !UUID_V4_REGEX.test(id)) {
    throw createHttpError(400, "Invalid client ID. Expected a valid UUID.");
  }

  const result = await dynamoDB.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: { id },
    })
  );

  return result.Item || null;
};

const updateClientPoints = async (id, points) => {
  if (!id || !UUID_V4_REGEX.test(id)) {
    throw createHttpError(400, "Invalid client ID format. Expected a valid UUID.");
  }

  if (typeof points !== "number" || !Number.isInteger(points) || points === 0) {
    throw createHttpError(400, "Field 'points' must be a non-zero integer.");
  }

  try {
    const result = await dynamoDB.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { id },
        UpdateExpression:
          "SET fidelityPoints = if_not_exists(fidelityPoints, :zero) + :delta, updatedAt = :updatedAt",
        ConditionExpression: "attribute_exists(id)",
        ExpressionAttributeValues: {
          ":zero": 0,
          ":delta": points,
          ":updatedAt": new Date().toISOString(),
        },
        ReturnValues: "ALL_NEW",
      })
    );

    return result.Attributes;
  } catch (err) {
    if (err.name === "ConditionalCheckFailedException") {
      throw createHttpError(404, "Client not found.");
    }
    throw err;
  }
};

const deleteClient = async (id) => {
  if (!id || !UUID_V4_REGEX.test(id)) {
    throw createHttpError(400, "Invalid client ID format. Expected a valid UUID.");
  }

  try {
    const result = await dynamoDB.send(
      new DeleteCommand({
        TableName: TABLE_NAME,
        Key: { id },
        ConditionExpression: "attribute_exists(id)",
        ReturnValues: "ALL_OLD",
      })
    );

    return result.Attributes;
  } catch (err) {
    if (err.name === "ConditionalCheckFailedException") {
      throw createHttpError(404, "Client not found.");
    }
    throw err;
  }
};

module.exports = {
  createClient,
  listClients,
  getClientById,
  updateClientPoints,
  deleteClient,
};