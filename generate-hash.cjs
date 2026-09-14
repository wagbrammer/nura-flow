const crypto = require('crypto');
const fs = require('fs');

const pwd = 'CCccjz45-6';
const salt = crypto.randomBytes(16);
const hash = crypto.pbkdf2Sync(pwd, salt, 100000, 32, 'sha256');
const hashValue = 'pbkdf2_sha256$100000$' + salt.toString('hex') + '$' + hash.toString('hex');
const secret = crypto.randomBytes(32).toString('base64');

const envContent = `ROBUSTEC_AUTH_USER="wagbrammer"
ROBUSTEC_AUTH_PASSWORD_HASH="${hashValue}"
ROBUSTEC_AUTH_SESSION_SECRET="${secret}"
GEMINI_API_KEY="YOUR_GEMINI_API_KEY_HERE"
APP_URL="http://localhost:3000"
`;

fs.writeFileSync('C:/users/wagbr/documents/codex/Flow/.env', envContent, 'utf8');
console.log('Updated .env with hash:', hashValue);