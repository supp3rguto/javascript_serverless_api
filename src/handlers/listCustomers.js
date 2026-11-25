const { listClients } = require("../services/customerService");
const { ok, serverError } = require("../utils/httpResponse");

module.exports.handler = async () => {
  try {
    const clients = await listClients();
    return ok(clients);
  } catch (err) {
    console.error("Error listing clients:", err);
    return serverError();
  }
};