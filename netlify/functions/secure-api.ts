
const jwt = require('jsonwebtoken');
import { APIGatewayEvent, Handler } from 'aws-lambda';
import { getHeaders } from '../types/constants';

const handler: Handler = async (event:APIGatewayEvent) => {
  const authHeader = event.headers.authorization;
  if (!authHeader) return { 
    statusCode: 401, 
    headers:getHeaders,
    body: JSON.stringify({ message:"Unauthorized" }) 
  };

  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.AUTH0_CLIENT_SECRET);
    return { 
      statusCode: 200,
      headers:getHeaders, 
      body: JSON.stringify({ user: decoded }) };
  } catch (error) {
    return { 
      statusCode: 403, 
      headers:getHeaders,
      body: JSON.stringify({ message:"Invalid token" }) };
  }
};

export {handler};