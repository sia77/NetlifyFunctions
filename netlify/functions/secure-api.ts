import { APIGatewayEvent, Handler } from 'aws-lambda';
import { getHeaders } from '../types/constants';
import { handleFirstLogin } from '../lib/handleFirstLogin'



import { authenticateAndAuthorize } from '../utils/authenticateAndAuthorize';

export const handler: Handler = async (event: APIGatewayEvent) => {
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: getHeaders,
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

    // Business logic here
    const { auth0_sub, email, decoded, userInfo } = authResult;
    const user = await handleFirstLogin({ auth0_sub, email });

    return {
      statusCode: 200,
      headers: getHeaders,
      body: JSON.stringify({
        message: 'User authenticated',
        user,
      }),
    };

  } catch (err: any) {
    return {
      statusCode: err.statusCode || 500,
      headers: getHeaders,
      body: JSON.stringify({ message: err.message, error: err.error }),
    };
  }
};


