import { APIGatewayEvent, Handler } from 'aws-lambda';
import { getHeaders, corsHeaders } from '../constants/headers';
import { handleFirstLogin } from '../lib/handleFirstLogin';
import { updateUser } from '../lib/updateUser';
import { authenticateAndAuthorize } from '../utils/authenticateAndAuthorize';

export const handler: Handler = async (event: APIGatewayEvent) => {
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: '',
    };
  }

  try {

    const authHeader: string = event.headers?.authorization ?? '';

    const authResult = await authenticateAndAuthorize(authHeader);
    const { auth0_sub, email } = authResult;

    if (event.httpMethod === "GET") {
      
      return await handleFirstLogin({ auth0_sub, email });

    }else if(event.httpMethod === "PUT"){

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


