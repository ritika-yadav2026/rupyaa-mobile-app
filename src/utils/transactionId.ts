/**
 * Generates a random transaction ID for testing purposes.
 * In production, this should be replaced with the actual loanId.
 * 
 * @returns A random string that can be used as a transaction ID
 */
export const generateRandomTransactionId = (): string => {
  // Generate a random string using timestamp and random number
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000000);
  return `txn_${timestamp}_${random}`;
};
