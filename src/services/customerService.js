const dynamoDb = require('../database/dyanmoClient');
const { PutCommand } = require("@aws-sdk/lib-dynamodb");
const crypto = require('crypto');

const TABLE_NAME = 'ClientsFidelidade';

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

    await dynamoDb.send(comand);

    return newCLient;
};

module.exports = {
    createClient
};