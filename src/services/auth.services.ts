import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { AppDataSource } from "../config/database.js";
import { User } from "../models/User.js";
import devLogger from '../utils/logger.js'

const userRepository = AppDataSource.getRepository(User);
const logger = devLogger()

type UserWithoutPassword = Omit<User, "password_hash">;

interface AuthResponse {
  user: UserWithoutPassword;
  token: string;
}
// generating JWT Token for the user to check if he/she is already logged in
const generateToken = (user: User): string => {
  return jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET as string,
    { expiresIn: "24h" }
  );
};
// Registering the user
export const registerUser = async (
  email: string,
  password: string,
  full_name: string
): Promise<AuthResponse> => {
  const existingUser = await userRepository.findOne({ where: { email } });
  if (existingUser) { // If the user exists, throw an error
    logger.warn('Registration attempted with existing email',{
      email
    })
    const error = new Error("Email already in use") as any;
    error.status = 409;
    throw error;
  }
  // Hash the password with bcrypt to prevent hackers from seeing the real password
  const password_hash = await bcrypt.hash(password, 10); // Hashing the password with salt 10
  const user = userRepository.create({ email, password_hash, full_name });
  await userRepository.save(user);

  logger.info('New user registered', {
    userId: user.id,
    email: user.email,
    role: user.role
  })
  const token = generateToken(user); // Generate a token for every new user
  const { password_hash: _, ...userWithoutPassword } = user; // Remove the password from the user details for security
  return { user: userWithoutPassword, token };
};

// Login the user
export const loginUser = async (
  email: string,
  password: string
): Promise<AuthResponse> => {
  const user = await userRepository.findOne({ where: { email } });
  if (!user) { // If the user does not exist throw an error
    logger.warn('Login attempted with unrecognised email', {
      email
    })
    const error = new Error("Invalid email or password") as any;
    error.status = 401;
    throw error;
  }

  // Match the password with the unhashed password
  const passwordMatch = await bcrypt.compare(password, user.password_hash);
  if (!passwordMatch) { // If the passwords do not match

    logger.warn('Login failed - incorrect password', {
      userId: user.id,
      email: user.email
    })
    const error = new Error("Invalid email or password") as any;
    error.status = 401;
    throw error;
  }

  logger.info('User logged in successfully', {
    userId: user.id,
    email: user.email,
    role: user.role
  })
  const token = generateToken(user); // Generate a token for the logged in user
  const { password_hash: _, ...userWithoutPassword } = user;
  return { user: userWithoutPassword, token };
};

// getMe get the user details
export const getMe = async (userId: string): Promise<UserWithoutPassword> => {
  const user = await userRepository.findOne({ where: { id: userId } });
  if (!user) { // If there is no user, throw an error
    logger.warn('getMe called with invalid userId', {
      userId
    })
    const error = new Error("User not found") as any;
    error.status = 404;
    throw error;
  }

  const { password_hash: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
};