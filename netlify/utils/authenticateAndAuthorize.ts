import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import axios from 'axios';
import { AuthResult } from '../types/interfaces';
import { getHeaders } from '../constants/headers';
import { HttpError } from '../utils/errors';

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
    console.log(`Error: ${'Missing Authorization header - authHeader'}`);
    throw new HttpError('Missing Authorization header', 401, 'authHeader' );
  }

  const token = authHeader.split(' ')[1];

  const decoded = await jwtVerify(token);

  if (typeof decoded !== 'object' || decoded === null || !('scope' in decoded)) {
    console.log(`Error: ${'Invalid token payload - decoded'}`);
    throw new HttpError('Invalid token payload', 403, 'decoded' );
  }

  const scopes = (decoded as any).scope as string;
  if (!scopes.includes('read:data') && !scopes.includes('update:data')) {
    console.log(`Error: ${'Insufficient - scope'}`);
    throw new HttpError('Insufficient scope', 403, 'scopes' ); 
  }

  let userInfo;
  try {
    userInfo = await axios.get(`https://${process.env.AUTH0_DOMAIN}/userinfo`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch (err: any) {
    console.log(`Error: Failed to fetch user info - ${err.message}`);
    throw new HttpError('Failed to fetch user info', 401, 'axios.userinfo');
  }

  return {
    auth0_sub: (decoded as any).sub,
    email: userInfo.data.email,
    decoded,
    userInfo: userInfo.data,
  };
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