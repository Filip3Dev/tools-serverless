'use strict';

const dynamodb = require('./dynamodb');
const ValidationContract = require('../validations/helper');

module.exports.update = (event, context, callback) => {
    const timestamp = new Date().getTime();
    const data = JSON.parse(event.body);
    let contract = new ValidationContract();

    contract.isRequired(data.title, 'Você precisa definir um titulo.');
    contract.isRequired(data.link, 'Você precisa preencher o link.');
    contract.isRequired(data.description, 'Onde está a descrição?');
    contract.isRequired(data.tags, 'Onde estão as tags?');

    // validation
    if (!contract.isValid()) {
        console.error('Validation Failed');
        callback(null, {
            statusCode: 400,
            headers: {
                'Content-Type': 'text/plain'
            },
            body: 'Couldn\'t create the tool.',
        });
        return 0;
    }

    const params = {
        TableName: process.env.DYNAMODB_TABLE,
        Key: {
            id: event.pathParameters.id,
        },
        ExpressionAttributeValues: {
            ':title': data.title,
            ':link': data.link,
            ':description': data.description,
            ':tags': data.tags,
            ':updatedAt': timestamp,
        },
        UpdateExpression: 'SET title = :title, link = :link, description = :description, tags = :tags, updatedAt = :updatedAt',
        ReturnValues: 'ALL_NEW',
    };

    // update the todo in the database
    dynamodb.update(params, (error, result) => {
        // handle potential errors
        if (error) {
            console.error(error);
            callback(null, {
                statusCode: error.statusCode || 501,
                headers: {
                    'Content-Type': 'text/plain'
                },
                body: 'Couldn\'t update the todo item.',
            });
            return;
        }

        // create a response
        const response = {
            statusCode: 200,
            body: JSON.stringify(result.Attributes),
        };
        callback(null, response);
    });
};