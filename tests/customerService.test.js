const { mockClient } = require("aws-sdk-client-mock");
const {
  DynamoDBDocumentClient,
  PutCommand,
  UpdateCommand,
  DeleteCommand,
} = require("@aws-sdk/lib-dynamodb");

const {
  createClient,
  updateClientPoints,
  deleteClient,
} = require("../src/services/customerService");

const ddbMock = mockClient(DynamoDBDocumentClient);
const VALID_UUID = "61f572df-04b5-4234-8971-1a3aa2024f44";

describe("customerService", () => {
  beforeEach(() => {
    ddbMock.reset();
  });

  describe("createClient", () => {
    it("should create a client with default fidelityPoints = 10", async () => {
      ddbMock.on(PutCommand).resolves({});

      const client = await createClient({
        name: "Augusto",
        email: "augusto@example.com",
      });

      expect(client).toMatchObject({
        name: "Augusto",
        email: "augusto@example.com",
        fidelityPoints: 10,
      });
      expect(client.id).toBeDefined();
      expect(client.createdAt).toBeDefined();
    });

    it("should throw 400 when name or email is missing", async () => {
      await expect(createClient({ name: "Augusto" })).rejects.toMatchObject({
        statusCode: 400,
      });
    });
  });

  describe("updateClientPoints", () => {
    it("should atomically increment fidelityPoints and return updated item", async () => {
      ddbMock.on(UpdateCommand).resolves({
        Attributes: {
          id: VALID_UUID,
          name: "Augusto",
          fidelityPoints: 60,
        },
      });

      const updated = await updateClientPoints(VALID_UUID, 50);

      expect(updated.fidelityPoints).toBe(60);
    });

    it("should throw 400 for invalid UUID", async () => {
      await expect(updateClientPoints("invalid-id", 50)).rejects.toMatchObject({
        statusCode: 400,
      });
    });

    it("should throw 400 for non-integer or zero points", async () => {
      await expect(updateClientPoints(VALID_UUID, 0)).rejects.toMatchObject({
        statusCode: 400,
      });
      await expect(updateClientPoints(VALID_UUID, 10.5)).rejects.toMatchObject({
        statusCode: 400,
      });
    });

    it("should throw 404 when DynamoDB raises ConditionalCheckFailedException", async () => {
      const conditionalError = new Error("Conditional check failed");
      conditionalError.name = "ConditionalCheckFailedException";

      ddbMock.on(UpdateCommand).rejects(conditionalError);

      await expect(updateClientPoints(VALID_UUID, 50)).rejects.toMatchObject({
        statusCode: 404,
      });
    });
  });

  describe("deleteClient", () => {
    it("should delete an existing client and return the deleted attributes", async () => {
      ddbMock.on(DeleteCommand).resolves({
        Attributes: { id: VALID_UUID, name: "Augusto" },
      });

      const deleted = await deleteClient(VALID_UUID);

      expect(deleted).toEqual({ id: VALID_UUID, name: "Augusto" });
    });

    it("should throw 404 when trying to delete a non-existent client", async () => {
      const conditionalError = new Error("Conditional check failed");
      conditionalError.name = "ConditionalCheckFailedException";

      ddbMock.on(DeleteCommand).rejects(conditionalError);

      await expect(deleteClient(VALID_UUID)).rejects.toMatchObject({
        statusCode: 404,
      });
    });
  });
});