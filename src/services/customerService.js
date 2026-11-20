const dynamoDB = require('../database/dynamoClient');
const { PutCommand, ScanCommand, GetCommand } = require("@aws-sdk/lib-dynamodb");
const crypto = require('crypto');

const TABLE_NAME = 'ClientsFidelity';
const UUID_V4_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const createClient = async (clientData) => {
    if (!clientData.name || !clientData.email) {
        throw new Error("Name and email are required");
    }

    const newCLient = { 
        id: crypto.randomUUID(),
        name: clientData.name,
        email: clientData.email,
        fidelityPoints: 10,
        createdAt: new Date().toISOString()
    }

    const comand = new PutCommand({
        TableName: TABLE_NAME,
        Item: newCLient
    })

    await dynamoDB.send(comand);
    return newCLient;
};

const listClients = async () => {
    const command = new ScanCommand({
        TableName: TABLE_NAME
    });

    const result = await dynamoDB.send(command);
    return result.Items || [];
}

const getClientById = async (id) => {
    if (!id || !UUID_V4_REGEX.test(id)) {
        const error = new Error("Invalid client ID format. Expected a valid UUID.");
        error.statusCode = 400;
        throw error;
    }

    const command = new GetCommand({
        TableName: TABLE_NAME,
        Key: { id }
    });

    const result = await dynamoDB.send(command);

    return result.Item || null;
};

module.exports = {
    createClient,
    listClients,
    getClientById
};