import { APIGatewayEvent } from "aws-lambda";
import { AuthResult } from "../types/interfaces";
import { getHeaders } from "../constants/headers";
import { authenticateAndAuthorize } from '../utils/authenticateAndAuthorize';

export const withAuth = async (
  event: APIGatewayEvent,
  handler: (authData: AuthResult, event: APIGatewayEvent) => Promise<any>
) => {
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
    return await handler(authResult, event);
  } catch (err) {
    return {
      statusCode: err.statusCode || 500,
      headers: getHeaders,
      body: JSON.stringify({ message: err.message }),
    };
  }
};