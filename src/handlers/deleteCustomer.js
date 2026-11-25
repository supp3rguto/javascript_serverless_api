const { deleteClient } = require("../services/customerService");
const { ok, badRequest, notFound, serverError } = require("../utils/httpResponse");

module.exports.handler = async (event) => {
  try {
    const { id } = event.pathParameters || {};
    const deletedClient = await deleteClient(id);

    return ok({
      message: "Client deleted successfully.",
      deletedClient,
    });
  } catch (err) {
    if (err.statusCode === 400) return badRequest(err.message);
    if (err.statusCode === 404) return notFound(err.message);

    console.error("Error deleting client:", err);
    return serverError();
  }
};