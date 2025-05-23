import { UserInfo } from '../types/interfaces';
import { sql } from './db';


export const handleFirstLogin = async ({ auth0_sub, email }: UserInfo) => {
  const existingUser = await sql`
    SELECT * FROM users WHERE auth0_sub = ${auth0_sub}
  `;

  if (existingUser.length === 0) {
    await sql`
      INSERT INTO users (auth0_sub, email)
      VALUES (${auth0_sub}, ${email})
    `;

    console.log('New user created:', email);

    const result = await sql`
      SELECT * FROM users WHERE auth0_sub = ${auth0_sub}
    `;

    return result;
  } else {
    console.log('User already exists:', email);
    return existingUser;
  }
};