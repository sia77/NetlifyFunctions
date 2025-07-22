import { Handler } from "aws-lambda";
import { addToWatchlist, isSymbolInWatchlist } from '../lib';
import { withAuth } from '../middleware';
import { corsHeaders, getHeaders } from "../constants/headers";


export const handler: Handler = async (event) => {

  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: corsHeaders, 
      body: '',
    };
  }

  return withAuth(event, async ({ auth0_sub }, event) => {
    try {
        switch (event.httpMethod) {
            case "POST": {
                const body = JSON.parse(event.body || '{}');
                return await addToWatchlist(auth0_sub, body);
            }

            case "GET": {
                const symbol = event.queryStringParameters?.symbol;

                if (!symbol) {
                    return {
                        statusCode: 400,
                        headers: getHeaders,
                        body: JSON.stringify({ message: "Missing symbol query parameter" }),
                    };
                }

                const exists = await isSymbolInWatchlist(auth0_sub, symbol);

                return {
                    statusCode: 200,
                    headers: getHeaders,
                    body: JSON.stringify({ exists }),
                };
            }

            case "DELETE": {
                const body = JSON.parse(event.body || '{}');
                //return await removeFromWatchlist(auth0_sub, body);
            }

            default:
                return {
                    statusCode: 405,
                    headers: getHeaders,
                    body: JSON.stringify({ message: `Method ${event.httpMethod} Not Allowed` }),
                };
        }
    } catch {
        return {
            statusCode: 400,
            headers: getHeaders,
            body: JSON.stringify({ message: "Invalid JSON body" }),
        };
    }
  });
};

