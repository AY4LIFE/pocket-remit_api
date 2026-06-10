import {pool} from "../config/database.js"
import bcrypt from "bcryptjs"


// The shape of the User. Every user will have these fields
export interface User {
    id: string,
    email: string,
    password_hash: string,
    full_name: string,
    role: "customer" | "admin",
    created_at: Date
}

// What we expect when someone is registering
export interface createUserInput{
    email: string,
    password: string,
    full_name: string
}

// --------------------
// Creates the users table if it doesn't already exist.
// We'll call this once when the server starts.
// --------------------
export const createUsersTable = async (): Promise<void> => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      full_name VARCHAR(255) NOT NULL,
      role VARCHAR(50) DEFAULT 'customer',
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
};


// Saves a new user to the database
export const createUser = async (input: createUserInput): Promise<User> => {
    const password_hash = await bcrypt.hash(input.password, 10)
    const result = await pool.query<User>(

        `INSERT INTO users (email, password_hash, full_name)
     VALUES ($1, $2, $3)
     RETURNING id, email, full_name, role, created_at`,
    // $1, $2, $3 are placeholders — this prevents SQL injection attacks
    [input.email, password_hash, input.full_name]
  );

// Return the user if it exists
  const user = result.rows[0];
  if (!user) {
    throw new Error("Failed to create user");
  }

  return user;
};

// Find the user by email. This would be helpful in LOGIN to check if the user exists
export const findUserEmail = async(email: string): Promise<User | null> => {
    const result = await pool.query<User>(
        'SELECT * FROM users WHERE email = $1', [email]
    )
    return result.rows[0] || null // Return the user if exists, else null
}
    
// Finds a user by their id
// This would be helpful in the auth/me route to get the current user's profile
export const findUserById = async (id: string): Promise<User | null> => {
    const result = await pool.query<User>(
        'SELECT id, email, full_name, role, created_at FROM users WHERE id = $1', [id]
    )
    return result.rows[0] || null
}
