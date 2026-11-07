const crypto = require('crypto');

/**
 * Generate a unique, readable PNR code
 * Example: ALG-8K9N2P
 */
const generatePNR = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excludes confusing 0, O, 1, I
  let randomCode = '';
  const bytes = crypto.randomBytes(6);
  for (let i = 0; i < 6; i++) {
    randomCode += chars[bytes[i] % chars.length];
  }
  return `ALG-${randomCode}`;
};

module.exports = {
  generatePNR
};

