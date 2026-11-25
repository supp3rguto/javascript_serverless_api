const { updateClientPoints } = require("../services/customerService");
const { ok, badRequest, notFound, serverError } = require("../utils/httpResponse");

module.exports.handler = async (event) => {
  try {
    const { id } = event.pathParameters || {};

    let body;
    try {
      body = JSON.parse(event.body || "{}");
    } catch {
      return badRequest("Invalid JSON payload.");
    }

    const updatedClient = await updateClientPoints(id, body.points);

    return ok({
      message: "Client points updated successfully.",
      client: updatedClient,
    });
  } catch (err) {
    if (err.statusCode === 400) return badRequest(err.message);
    if (err.statusCode === 404) return notFound(err.message);

    console.error("Error updating client points:", err);
    return serverError();
  }
};