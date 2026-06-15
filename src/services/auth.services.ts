import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { AppDataSource } from "../config/database.js";
import { User } from "../models/User.js";

// --------------------
// This is the TypeORM repository for User.
// Think of it as our toolbox for all User database operations.
// It replaces the old createUser(), findUserByEmail() functions.
// --------------------
const userRepository = AppDataSource.getRepository(User);

// --------------------
// The shape of the data we return after login/register.
// --------------------
type UserWithoutPassword = Omit<User, "password_hash">;

interface AuthResponse {
  user: UserWithoutPassword;
  token: string;
}

// --------------------
// Helper that creates a JWT token for a user.
// --------------------
const generateToken = (user: User): string => {
  return jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET as string,
    { expiresIn: "24h" }
  );
};

// --------------------
// Handles registering a new user.
// --------------------
export const registerUser = async (
  email: string,
  password: string,
  full_name: string
): Promise<AuthResponse> => {

  // Step 1: Check if email is already taken
  // TypeORM's findOne() replaces our old findUserByEmail()
  const existingUser = await userRepository.findOne({ where: { email } });
  if (existingUser) {
    const error = new Error("Email already in use") as any;
    error.status = 409;
    throw error;
  }

  // Step 2: Hash the password
  const password_hash = await bcrypt.hash(password, 10);

  // Step 3: Create and save the new user
  // TypeORM's create() builds the object, save() inserts it into the DB
  const user = userRepository.create({ email, password_hash, full_name });
  await userRepository.save(user);

  // Step 4: Generate token
  const token = generateToken(user);

  // Step 5: Remove password before returning
  const { password_hash: _, ...userWithoutPassword } = user;
  return { user: userWithoutPassword, token };
};

// --------------------
// Handles logging in an existing user.
// --------------------
export const loginUser = async (
  email: string,
  password: string
): Promise<AuthResponse> => {

  // Step 1: Find user by email
  const user = await userRepository.findOne({ where: { email } });
  if (!user) {
    const error = new Error("Invalid email or password") as any;
    error.status = 401;
    throw error;
  }

  // Step 2: Compare passwords
  const passwordMatch = await bcrypt.compare(password, user.password_hash);
  if (!passwordMatch) {
    const error = new Error("Invalid email or password") as any;
    error.status = 401;
    throw error;
  }

  // Step 3: Generate token
  const token = generateToken(user);

  // Step 4: Remove password before returning
  const { password_hash: _, ...userWithoutPassword } = user;
  return { user: userWithoutPassword, token };
};

// --------------------
// Gets the current logged in user's profile.
// --------------------
export const getMe = async (userId: string): Promise<UserWithoutPassword> => {
  const user = await userRepository.findOne({ where: { id: userId } });
  if (!user) {
    const error = new Error("User not found") as any;
    error.status = 404;
    throw error;
  }

  const { password_hash: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
};