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

const dbUrl = process.env.DATABASE_URL;
let sequelize;

if (!dbUrl || dbUrl === 'PONER_AQUI_VALOR_DE_DATABASE_URL') {
    console.warn('⚠️ DATABASE_URL no está definida. El backend funcionará en MODO DEMO (solo lectura de datos estáticos).');
    sequelize = {
        authenticate: async () => { throw new Error('DB not configured'); },
        sync: async () => { console.log('ℹ️ Saltando sincronización de DB (Modo Demo)'); },
        getDialect: () => 'none',
        define: () => ({}),
        fn: (name) => name,
        col: (name) => name
    };
} else {
    sequelize = new Sequelize(dbUrl, {
        dialect: 'postgres',
        logging: false, // Set to console.log to see SQL queries
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false
            }
        }
    });
}

export default sequelize;
