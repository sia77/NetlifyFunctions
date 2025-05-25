import { APIGatewayEvent, Handler } from 'aws-lambda';
import { getHeaders, getHeadersOption, putHeaders } from '../types/constants';
import { handleFirstLogin } from '../lib/handleFirstLogin';
import { updateUser } from '../lib/updateUser';
import { authenticateAndAuthorize } from '../utils/authenticateAndAuthorize';

export const handler: Handler = async (event: APIGatewayEvent) => {
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: getHeadersOption,
      body: '',
    };
  }

  try {

    const authHeader = event.headers.authorization;

    if (!authHeader) {
      return {
        statusCode: 401,
        headers: getHeaders,
        body: JSON.stringify({ message: "Missing Authorization header" }),
      };
    }

    const authResult = await authenticateAndAuthorize(authHeader);
    const { auth0_sub, email, decoded, userInfo } = authResult;

    if (event.httpMethod === "GET") {
      console.log("hello");
      
      return await handleFirstLogin({ auth0_sub, email });

    }

    if(event.httpMethod === "PUT"){

      if (!event.body) {
        return {
          statusCode: 400,
          headers: getHeaders,
          body: JSON.stringify({ message: "Missing request body" }),
        };
      }

      return await updateUser(JSON.parse(event.body), auth0_sub );

    }

  } catch (err: any) {
    return {
      statusCode: err.statusCode || 500,
      headers: getHeaders,
      body: JSON.stringify({ message: err.message, error: err.error }),
    };
  }
};


