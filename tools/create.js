'use strict';

const uuid = require('uuid');
const dynamodb = require('./dynamodb');
const ValidationContract = require('../validations/helper');

module.exports.create = (event, context, callback) => {
    const timestamp = new Date().getTime();
    const data = JSON.parse(event.body);
    let contract = new ValidationContract();

    contract.isRequired(data.title, 'Você precisa definir um titulo.');
    contract.isRequired(data.link, 'Você precisa preencher o link.');
    contract.isRequired(data.description, 'Onde está a descrição?');
    contract.isRequired(data.tags, 'Onde estão as tags?');

    if (!contract.isValid()) {
        console.error('Validation Failed');
        callback(null, {
            statusCode: 400,
            headers: {
                'Content-Type': 'text/plain'
            },
            body: JSON.stringify({
                message: 'Couldn\'t create the tool.',
                data: contract.errors()
            })
        });
        return 0;
    }

    const params = {
        TableName: process.env.DYNAMODB_TABLE,
        Item: {
            id: uuid.v4(),
            title: data.title,
            link: data.link,
            description: data.description,
            tags: data.tags,
            createdAt: timestamp,
            updatedAt: timestamp,
        },
    };

    // write the todo to the database
    dynamodb.put(params, (error) => {
        // handle potential errors
        if (error) {
            console.error(error);
            callback(null, {
                statusCode: error.statusCode || 501,
                headers: {
                    'Content-Type': 'text/plain'
                },
                body: 'Couldn\'t create the todo item.',
            });
            return;
        }

        // create a response
        const response = {
            statusCode: 201,
            body: JSON.stringify(params.Item),
        };
        callback(null, response);
    });
};