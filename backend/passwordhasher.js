const bcrypt = require('bcrypt');

async function hashPassword(plainTextPassword) {
    try {
        const saltRounds = 10; // You can adjust the salt rounds as needed
        const hashedPassword = await bcrypt.hash(plainTextPassword, saltRounds);
        console.log(`Plain Text Password: ${plainTextPassword}`);
        console.log(`Hashed Password: ${hashedPassword}`);
    } catch (error) {
        console.error('Error hashing password:', error);
    }
}

// Replace 'your-password' with the password you want to hash
const passwordToHash = 'ANIK@akil1';
hashPassword(passwordToHash);
