import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { AppDataSource } from "../config/database.js";
import { User } from "../models/User.js";

const userRepository = AppDataSource.getRepository(User);

type UserWithoutPassword = Omit<User, "password_hash">;

interface AuthResponse {
  user: UserWithoutPassword;
  token: string;
}

const generateToken = (user: User): string => {
  return jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET as string,
    { expiresIn: "24h" }
  );
};

export const registerUser = async (
  email: string,
  password: string,
  full_name: string
): Promise<AuthResponse> => {
  const existingUser = await userRepository.findOne({ where: { email } });
  if (existingUser) {
    const error = new Error("Email already in use") as any;
    error.status = 409;
    throw error;
  }

  const password_hash = await bcrypt.hash(password, 10);
  const user = userRepository.create({ email, password_hash, full_name });
  await userRepository.save(user);

  const token = generateToken(user);
  const { password_hash: _, ...userWithoutPassword } = user;
  return { user: userWithoutPassword, token };
};

export const loginUser = async (
  email: string,
  password: string
): Promise<AuthResponse> => {
  const user = await userRepository.findOne({ where: { email } });
  if (!user) {
    const error = new Error("Invalid email or password") as any;
    error.status = 401;
    throw error;
  }

  const passwordMatch = await bcrypt.compare(password, user.password_hash);
  if (!passwordMatch) {
    const error = new Error("Invalid email or password") as any;
    error.status = 401;
    throw error;
  }

  const token = generateToken(user);
  const { password_hash: _, ...userWithoutPassword } = user;
  return { user: userWithoutPassword, token };
};

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