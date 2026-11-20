const customerService = require("../services/customerService");

module.exports.handler = async (event) => {
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

/** fetches a single client by its partition key (UUID) 
 * @param {string} id
 * @return {Promise<object|null>}
 */

const getClientById = async (id) => {
    if (!id || !UUID_V4_REGEX.test(id)) {
        const error = new Error("Invalid client ID. Expected a valid UUID.");
        error.statusCode = 400;
        throw error;
    }

    const command = new GetCommand({
        TableName: TABLE_NAME,
        Key: { id }
    });

    const result = await dynamoDB.send(command);

    return result.Item || null;
}

module.exports = {
  createClient,
  listClients,
  getClientById,
};