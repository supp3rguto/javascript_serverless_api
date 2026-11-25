const { DeleteCommand } = require("@aws-sdk/lib-dynamodb");
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

    const command = new DeleteCommand({
      TableName: TABLE_NAME,
      Key: { id },
      ConditionExpression: "attribute_exists(id)",
      ReturnValues: "ALL_OLD",
    });

    const result = await dynamoDB.send(command);

    return ok({
      message: "Client deleted successfully.",
      deletedClient: result.Attributes,
    });
  } catch (err) {
    if (err.name === "ConditionalCheckFailedException") {
      return notFound("Client not found.");
    }

    console.error("Error deleting client:", err);
    return serverError();
  }
};