const customerService = require('../services/customerService');

module.exports.handler = async (event) => {
    try {
        const body = JSON.parse(event.body);
        const createdClient = await customerService.createClient(body);

        return {
            statusCode: 201,
            body: JSON.stringify({
                message: "Client created successfully",
                client: createdClient
            })
        };
    } catch (error) {
        return {
            statusCode: 400,
            body: JSON.stringify({ erro: error.message }),
        };
    }
};