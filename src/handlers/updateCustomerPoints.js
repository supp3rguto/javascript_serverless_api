const { UpdateCommand } = require("@aws-sdk/lib-dynamodb");
const dynamoDB = require("../database/dynamoClient");
const { ok, badRequest, notFound, serverError } = require("../utils/httpResponse");

const TABLE_NAME = "ClientsFidelity";
const UUID_V4_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

module.exports.handler = async (event) => {
  try {
    const { id } = event.pathParameters || {};

    if (!id || !UUID_V4_REGEX.test(id)) {
      return badRequest("Invalid client ID format. Expected a valid UUID.");
    }

    let body;
    try {
      body = JSON.parse(event.body || "{}");
    } catch {
      return badRequest("Invalid JSON payload.");
    }

    const { points } = body;

    if (typeof points !== "number" || !Number.isInteger(points) || points === 0) {
      return badRequest("Field 'points' must be a non-zero integer.");
    }

    const command = new UpdateCommand({
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
    });

    const result = await dynamoDB.send(command);

    return ok({
      message: "Client points updated successfully.",
      client: result.Attributes,
    });
  } catch (err) {
    if (err.name === "ConditionalCheckFailedException") {
      return notFound("Client not found.");
    }

    console.error("Error updating client points:", err);
    return serverError();
  }
};