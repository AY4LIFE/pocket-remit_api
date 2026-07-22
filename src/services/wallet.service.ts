import {Decimal} from "decimal.js";
import {
  findWalletsByUserID,
  findWalletById,
  findWalletByUserAndCurrency,
  createWallet,
} from "../repositories/wallet.repository.js";
import { Wallet } from "../models/Wallet.js";

// --------------------
// Supported currencies in PocketRemit.
// If someone tries to create a wallet with an unsupported
// currency, we reject it immediately.
// --------------------
const SUPPORTED_CURRENCIES = ["NGN", "USD", "GHS", "EUR"];

// --------------------
// Gets all wallets for a user.
// Used in GET /wallets
// --------------------
export const getUserWallets = async (userId: string): Promise<Wallet[]> => {
  return findWalletsByUserID(userId);
};

// --------------------
// Creates a new wallet for a user.
// Rules:
// 1. Currency must be supported
// 2. User can't have two wallets for the same currency
// --------------------
export const createUserWallet = async (
  userId: string,
  currency: string
): Promise<Wallet> => {
  const upperCurrency = currency.toUpperCase();

  // Rule 1: Check if currency is supported
  if (!SUPPORTED_CURRENCIES.includes(upperCurrency)) {
    const error = new Error(
      `Currency ${upperCurrency} is not supported. Supported currencies are: ${SUPPORTED_CURRENCIES.join(", ")}`
    ) as any;
    error.status = 400;
    throw error;
  }

  // Rule 2: Check if user already has a wallet for this currency
  const existingWallet = await findWalletByUserAndCurrency(userId, upperCurrency);
  if (existingWallet) {
    const error = new Error(
      `You already have a ${upperCurrency} wallet`
    ) as any;
    error.status = 409;
    throw error;
  }

  // All good — create the wallet
  return createWallet(userId, upperCurrency);
};

// --------------------
// Gets the balance of a specific wallet.
// Rules:
// 1. Wallet must exist
// 2. Wallet must belong to the requesting user
// --------------------
export const getWalletBalance = async (
  walletId: string,
  userId: string
): Promise<{ currency: string; balance: string }> => {

  // Find the wallet
  const wallet = await findWalletById(walletId);

  // Rule 1: Wallet must exist
  if (!wallet) {
    const error = new Error("Wallet not found") as any;
    error.status = 404;
    throw error;
  }

  // Rule 2: Wallet must belong to the requesting user
  // This prevents users from seeing each other's balances!
  if (wallet.user.id !== userId) {
    const error = new Error("You do not have access to this wallet") as any;
    error.status = 403; // 403 means "Forbidden" — you're logged in but not allowed
    throw error;
  }

  // --------------------
  // We use Decimal.js to format the balance safely.
  // Remember: TypeORM returns decimal columns as strings.
  // Decimal.js handles the conversion safely.
  // --------------------
  return {
    currency: wallet.currency,
    balance: new Decimal(wallet.balance).toFixed(2), // e.g "50000.00"
  };
};