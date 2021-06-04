'use strict';

//const uuid = require('uuid');
const AWS = require('aws-sdk'); // eslint-disable-line import/no-extraneous-dependencies
const s3 = new AWS.S3();
const dynamoDb = new AWS.DynamoDB.DocumentClient();

//const myBucket = 'my-service-v1-4-bucket';
const myBucket = process.env.S3_BUCKET;
  
module.exports.objectCreated = (event) => {
  event.Records.forEach((record) => {
    const timestamp = new Date().getTime();
    const filename = record.s3.object.key;
    const filesize = record.s3.object.size;
    //console.log(`New object has been created: ${filename} (${filesize} bytes)`);
    const params = {
      TableName: process.env.DYNAMODB_TABLE,
      //TableName: 'test2',
      Item: {
        FileName: filename,
        FileSize: filesize,
        FileMimeType: '', // todo: lookup S3 object to get this because it doesnt seem to be passed through 
        DateUploaded: timestamp,
      },
    };

    // write the todo to the database
    dynamoDb.put(params, (error) => {
      // handle potential errors
      if (error) {
        console.error(error);
        //return;
      }
    });
  });
};

module.exports.createSignedS3PutUrl = (event, context, callback) => {
  const timestamp = new Date().getTime();
  let data = {};
  try {
    data = JSON.parse(event.body);
  } catch (e) {
    console.error(e);
  }
  if (typeof data.FileName !== 'string' || data.FileName=='') {
    console.error('Invalid FileName');
    callback(null, {
      statusCode: 400,
      headers: { 'Content-Type': 'text/plain' },
      body: 'Invalid FileName',
    });
    return;
  }
  
  // todo: lookup dynamodb table to make sure this filename has not already been used 
	
  //const myKey = data.FileName;
  const signedUrlExpireSeconds = 60 * 60 * 24; // valid for 24 hours

  const url = s3.getSignedUrl('putObject', {
    Bucket: myBucket,
    Key: data.FileName,
    Expires: signedUrlExpireSeconds,
    //ContentType: 'text/plain',
  });

  //console.log(url);
  
  /*
  const params = {
    TableName: process.env.DYNAMODB_TABLE,
    //TableName: 'test2',
    Item: {
      //id: uuid.v1(),
      FileName: data.FileName,
      SignedUrl: url,
      SignedUrlExpireSeconds: signedUrlExpireSeconds,
      //FileNameOriginal: '',
      FileSize: '',
      FileMimeType: '',
      DateCreated: timestamp,
      DateUploaded: '',
    },
  };

  // write the todo to the database
  dynamoDb.put(params, (error) => {
    // handle potential errors
    if (error) {
      console.error(error);
      callback(null, {
        statusCode: error.statusCode || 501,
        headers: { 'Content-Type': 'text/plain' },
        body: 'Couldn\'t create',
      });
      return;
    }

    // create a response
    const response = {
      statusCode: 200,
      body: JSON.stringify(params.Item),
    };
    callback(null, response);
  });
  */
  
  const params = {
    Item: {
      FileName: data.FileName,
      SignedUrl: url,
      SignedUrlExpireSeconds: signedUrlExpireSeconds,
    },
  };
  
  const response = {
    statusCode: 200,
    body: JSON.stringify(params.Item),
  };
  callback(null, response);
  
};
