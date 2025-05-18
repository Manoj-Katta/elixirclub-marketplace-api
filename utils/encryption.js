const crypto = require('crypto');

const KEY = Buffer.from('6d66fb7debfd15bf716bb14752b9603b', 'utf8'); // 32 bytes
const IV = Buffer.from('716bb14752b9603b', 'utf8');                  // 16 bytes

const encryptPayload = (data) => {
  try {
    const json = typeof data === 'object' ? JSON.stringify(data) : data;
    const cipher = crypto.createCipheriv('aes-256-cbc', KEY, IV);
    let encrypted = cipher.update(json, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    return encrypted;
  } catch (e) {
    console.error('Encryption error:', e);
    return data;
  }
};

/**
 * Decrypts the payload.
 * @param {string} encrypted - The encrypted base64 string.
 * @param {boolean} parseJson - If true, tries to parse JSON. If false, returns plain string.
 */
const decryptPayload = (encrypted, parseJson = true) => {
  try {
    const decipher = crypto.createDecipheriv('aes-256-cbc', KEY, IV);
    let decrypted = decipher.update(encrypted, 'base64', 'utf8');
    decrypted += decipher.final('utf8');

    return parseJson ? JSON.parse(decrypted) : decrypted;
  } catch (e) {
    console.error('Decryption error:', e);
    return encrypted;
  }
};

module.exports = { encryptPayload, decryptPayload };
