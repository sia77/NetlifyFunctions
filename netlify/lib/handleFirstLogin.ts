import { corsHeaders } from '../types/constants';
import { InitialUserInfo, User } from '../types/interfaces';
import { sql } from './db';


export const handleFirstLogin = async ({ auth0_sub, email }: InitialUserInfo) => {
  const existingUser = await sql`
    SELECT * FROM users WHERE auth0_sub = ${auth0_sub}
  `;

  if (existingUser.length === 0) {

    try{

      await sql`
        INSERT INTO users (auth0_sub, email)
        VALUES (${auth0_sub}, ${email})
      `;

      const result = await sql`
        SELECT * FROM users WHERE auth0_sub = ${auth0_sub}
      `;

      const { id, auth0_sub:dbAuth0Sub, ...user} = result[0];

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          message: 'User authenticated',
          user,
        }),
      };

    }catch(error:any){
      return {
        statusCode: 404,
        headers: corsHeaders,
        body: JSON.stringify({
          message: error.message || 'User not found',
        }),
      };

    }

  } else {

    const { id, auth0_sub, ...user} = existingUser[0];
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        message: 'User authenticated',
        user,
      }),
    };
   
  }
};