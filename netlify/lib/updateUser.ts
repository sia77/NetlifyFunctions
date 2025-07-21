import { corsHeaders } from '../constants/headers';
import { User } from '../types/interfaces';
import { sql } from './db';

export const updateUser = async (user: User, auth0_sub: string) => {
    // Check if user exists
    const existing = await sql`SELECT * FROM users WHERE auth0_sub = ${auth0_sub} LIMIT 1`;

    const userInDb = existing[0];

    if (!userInDb) {
        return {
        statusCode: 404,
        headers: corsHeaders,
        body: JSON.stringify({ message: 'User not found' }),
        };
    }

    const { email, first_name, last_name, address, phone, state_province, postal_code, unit, city, country } = user;


    try{
        const updated = await sql`
        UPDATE users
        SET 
          email = ${email},
          first_name = ${first_name},
          last_name = ${last_name},
          address = ${address},
          phone = ${phone},
          state_province = ${state_province},
          postal_code = ${postal_code},
          unit = ${unit},
          city = ${city},
          country= ${country}
        WHERE auth0_sub = ${auth0_sub}
        RETURNING *;
      `;
      
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ message: 'User updated successfully', user: updated[0] }),
      };


    }catch(error:any){        
        console.error("Update error:", error.message);

        // Specific handling for invalid column name
        if (error.message.includes('does not exist')) {
          return {
            statusCode: 400,
            headers: corsHeaders,
            body: JSON.stringify({ message: 'Invalid field provided in update request.' }),
          };
        }else{
          return {
            statusCode:500,
            Headers:corsHeaders,
            body: JSON.stringify({message:error.message})
          }
        }
    }
};