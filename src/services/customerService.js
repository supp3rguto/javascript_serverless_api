const dynamoDB = require('../database/dynamoClient');
const { PutCommand, ScanCommand } = require("@aws-sdk/lib-dynamodb");
const crypto = require('crypto');

const TABLE_NAME = 'ClientsFidelity';

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

module.exports = {
    createClient,
    listClients
};