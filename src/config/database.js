import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import dns from 'node:dns';

dotenv.config();

// Prefer IPv4 if available, though direct Supabase DBs are often IPv6-only.
if (dns.setDefaultResultOrder) {
    try {
        dns.setDefaultResultOrder('ipv4first');
    } catch (e) {
        // Ignore if not supported in this Node version
    }
}

const sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    logging: false, // Set to console.log to see SQL queries
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: false
        }
    }
});

export default sequelize;
