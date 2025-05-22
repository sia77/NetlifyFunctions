import { APIGatewayEvent, Handler } from 'aws-lambda';
import { getHeaders } from '../types/constants';
import jwt, { JwtPayload } from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import axios from 'axios';

const client = jwksClient({
  jwksUri: `https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`,
});

function getKey(header: any, callback: any) {
  client.getSigningKey(header.kid, function (err, key) {
    const signingKey = key?.getPublicKey();
    callback(null, signingKey);
  });
}

const handler: Handler = async (event:APIGatewayEvent) => {

  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: getHeaders,
      body: '',
    };
  }

  const authHeader = event.headers.authorization;

  if (!authHeader) return { 
    statusCode: 401, 
    headers:getHeaders,
    body: JSON.stringify({ message:"Unauthorized" }) 
  };

  const token = authHeader.split(" ")[1];

  return new Promise((resolve) => {
    jwt.verify(token, getKey, {
      audience: `${process.env.AUTH0_AUDIENCE}`,
      issuer: `https://${process.env.AUTH0_DOMAIN}/`,    
      algorithms: ['RS256'],
    }, async (err, decoded) => {
      if (err) {
        return resolve({
          statusCode: 403,
          headers: getHeaders,
          body: JSON.stringify({ message: 'Invalid token', error: err.message }),
        });
      }

      if (typeof decoded === 'object' && decoded !== null && 'scope' in decoded) {
        const scopes = (decoded as JwtPayload).scope as string;
    
        if (!scopes.includes('read:data')) {
          return resolve({
            statusCode: 403,
            headers: getHeaders,
            body: JSON.stringify({ message: 'Insufficient scope' }),
          });
        }
      }

      try{

        // Fetch user info from Auth0
        const userInfo = await axios.get(`https://${process.env.AUTH0_DOMAIN}/userinfo`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const email = userInfo.data.email;

        return resolve({
          statusCode: 200,
          headers: getHeaders,
          body: JSON.stringify({
            message: 'User authenticated',
            email,
            userInfo: userInfo.data,
            decodedToken: decoded,
          }),
        });

      }catch(userInfoError:any){
        console.error('Error fetching user info:', userInfoError.message);
        return resolve({
          statusCode: 500,
          headers: getHeaders,
          body: JSON.stringify({ message: 'Failed to fetch user info' }),
        });
      }
    });
  });

};

export {handler};