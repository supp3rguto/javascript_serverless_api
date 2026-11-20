const customerService = require("../services/customerService");

module.export.handler = async (event) => {
    try {
        const clients = await customerService.listClients();

        return {
            statusCode: 200,
            body: JSON.stringify({
                total: clients.length,
                clients: clients
            })
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message }),
        };
    }
};