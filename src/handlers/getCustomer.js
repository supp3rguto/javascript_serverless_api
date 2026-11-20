const customerService = require("../services/customerService");
const httpResponse = require("../utils/httpResponse");

module.exports.handler = async (event) => {
    try {
        const clientId = event.pathParameters?.id;

        if (!clientId) {
        return httpResponse.badRequest("Client ID path parameter is required.");
        }

        const client = await customerService.getClientById(clientId);

        if (!client) {
        return httpResponse.notFound(`Client with ID '${clientId}' not found.`);
        }

        return httpResponse.ok({ client });
    } catch (error) {
        if (error.statusCode === 400) {
            return httpResponse.badRequest(error.message);
        }
        
        console.error("[getCustomer] Unexpected error:", error);
        return httpResponse.serverError("Failed to retrieve client");
    }
}; 