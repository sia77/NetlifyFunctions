import { corsHeaders } from '../types/constants';
import { sql } from './db';

export const addToWatchlist = async (auth0_sub: string, symbol:string) => {

    try{
            
        const existing = await sql`SELECT id FROM users WHERE auth0_sub = ${auth0_sub} LIMIT 1`;

        const userInDb = existing[0];

        if(!userInDb){
            return {
                statusCode: 404,
                headers: corsHeaders,
                body: JSON.stringify({ message: 'User not found' }),
            };        
        }

        const {id} = existing[0];
        const now = new Date();

        const result = await sql`
            INSERT INTO watchlist (user_id, symbol, added_at)
            VALUES (${id}, ${symbol}, ${now})
            ON CONFLICT DO NOTHING
            RETURNING *;
            `;

        // Insert was successful
        if (result.length > 0) {
        
            return {
                statusCode: 200,
                body: JSON.stringify({ message: 'Symbol added to watchlist' }),
                headers: corsHeaders,
            };
        } else {
        // Conflict occurred, insert was skipped
            return {
                statusCode: 200,
                body: JSON.stringify({ message: 'Symbol already in watchlist' }),
                headers: corsHeaders,
            };
        }

    }catch(err:any){
        console.error('Error inserting to watchlist:', err);
        return {
            statusCode: 500,
            headers: corsHeaders,
            body: JSON.stringify({ message: 'Internal server error' }),
        };

    }


    
}