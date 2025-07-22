import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import axios from 'axios';
import { AuthResult } from '../types/interfaces';
import { getHeaders } from '../constants/headers';

const client = jwksClient({
  jwksUri: `https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`,
});

function getKey(header: any, callback: any) {
  client.getSigningKey(header.kid, (err, key) => {
    const signingKey = key?.getPublicKey();
    callback(null, signingKey);
  });
}


export async function authenticateAndAuthorize(authHeader: string): Promise<AuthResult> {
  if (!authHeader) {
    throw { statusCode: 401, headers: getHeaders, message: 'Missing Authorization header' };
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = await jwtVerify(token); 

    if (typeof decoded !== 'object' || decoded === null || !('scope' in decoded)) {
      throw { statusCode: 403, message: 'Invalid token payload' };
    }

    const scopes = (decoded as any).scope as string;
    if (!scopes.includes('read:data') && !scopes.includes('update:data')) {
      throw { statusCode: 403, message: 'Insufficient scope' };
    }

    const userInfo = await axios.get(`https://${process.env.AUTH0_DOMAIN}/userinfo`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    return {
      auth0_sub: (decoded as any).sub,
      email: userInfo.data.email,
      decoded,
      userInfo: userInfo.data,
    };
  } catch (err: any) {
    throw {
      statusCode: err.statusCode || 403,
      message: err.message || 'Authentication failed',
      error: err.error || err.toString(),
      headers: getHeaders,
    };
  }
}

function jwtVerify(token: string): Promise<any> {
  return new Promise((resolve, reject) => {
    jwt.verify(
      token,
      getKey,
      {
        audience: process.env.AUTH0_AUDIENCE,
        issuer: `https://${process.env.AUTH0_DOMAIN}/`,
        algorithms: ['RS256'],
      },
      (err, decoded) => {
        if (err) return reject(err);
        resolve(decoded);
      }
    );
  });
}