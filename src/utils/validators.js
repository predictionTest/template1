/**
 * Validate Ethereum address
 * @param {string} address - Address to validate
 * @returns {boolean} Is valid
 */
export const isValidAddress = (address) => {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
};

/**
 * Validate number input
 * @param {string} value - Value to validate
 * @returns {boolean} Is valid number
 */
export const isValidNumber = (value) => {
    return !isNaN(value) && parseFloat(value) > 0;
};

/**
 * Validate integer input
 * @param {string} value - Value to validate
 * @returns {boolean} Is valid integer
 */
export const isValidInteger = (value) => {
    return Number.isInteger(parseFloat(value)) && parseFloat(value) > 0;
};

/**
 * Validate amount within range
 * @param {number} amount - Amount to validate
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {boolean} Is within range
 */
export const isWithinRange = (amount, min, max) => {
    return amount >= min && amount <= max;
};

/**
 * Validate sufficient balance
 * @param {number} amount - Required amount
 * @param {number} balance - Available balance
 * @returns {boolean} Has sufficient balance
 */
export const hasSufficientBalance = (amount, balance) => {
    return balance >= amount;
};

/**
 * Validate transaction hash
 * @param {string} hash - Transaction hash
 * @returns {boolean} Is valid hash
 */
export const isValidTxHash = (hash) => {
    return /^0x[a-fA-F0-9]{64}$/.test(hash);
};

/**
 * Sanitize number input
 * @param {string} value - Input value
 * @returns {string} Sanitized value
 */
export const sanitizeNumberInput = (value) => {
    return value.replace(/[^0-9.]/g, '');
};

/**
 * Validate email
 * @param {string} email - Email to validate
 * @returns {boolean} Is valid email
 */
export const isValidEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

