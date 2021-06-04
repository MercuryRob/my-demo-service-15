'use strict';

const AWS = require('aws-sdk'); // eslint-disable-line import/no-extraneous-dependencies

const dynamoDb = new AWS.DynamoDB.DocumentClient();

module.exports.get = (event, context, callback) => {
  let fileName = '';
  try {
    fileName = event.pathParameters.filename;
  } catch (e) {
    //console.error(e);
  }
  if (fileName=='') {
    console.error('Invalid FileName');
    callback(null, {
      statusCode: 400,
      headers: { 'Content-Type': 'text/plain' },
      body: 'Invalid FileName',
    });
    return;
  }
  
  const params = {
    TableName: process.env.DYNAMODB_TABLE,
    //TableName: 'test2',
    Key: {
      FileName: fileName,
    },
  };

  // fetch todo from the database
  dynamoDb.get(params, (error, result) => {
    // handle potential errors
    if (error) {
      console.error(error);
      callback(null, {
        statusCode: error.statusCode || 501,
        headers: { 'Content-Type': 'text/plain' },
        body: 'Couldn\'t fetch .',
      });
      return;
    }

    // create a response
    const response = {
      statusCode: 200,
      body: JSON.stringify(result.Item),
    };
    callback(null, response);
  });
};
