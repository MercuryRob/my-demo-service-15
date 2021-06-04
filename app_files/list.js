'use strict';

const AWS = require('aws-sdk'); // eslint-disable-line import/no-extraneous-dependencies

const dynamoDb = new AWS.DynamoDB.DocumentClient();
const params = {
  TableName: process.env.DYNAMODB_TABLE,
  //TableName: 'ServerlessDemoAppFiles',
};

module.exports.list = (event, context, callback) => {
  let page = 1;
  const maxRowsPerPage = 6;
  let data = {};
  try {
    data = JSON.parse(event.body);
  } catch (e) {
    console.error(e);
  }
  if (typeof data.page === 'number' && data.page>1) {
    page = Math.round(data.page);
  }
  
  // fetch all app_files from the database
  dynamoDb.scan(params, (error, result) => {
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
    
    // pagination 
    let pageItems = [];
    const startItem = (page - 1) * maxRowsPerPage;
    const endItem = (page * maxRowsPerPage) - 1;
    let i = 0;
    result.Items.forEach(item => {
      //console.log(item);
      if( i>=startItem && i<=endItem ) pageItems.push(item);
      i++;
    }); 
    
    
    // create a response
    const response = {
      statusCode: 200,
      body: JSON.stringify(pageItems),
    };
    callback(null, response);
  });
};
