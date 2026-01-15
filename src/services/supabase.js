import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.warn('⚠️ Supabase credentials missing. Make sure SUPABASE_URL and SUPABASE_KEY are in .env');
}

// Evitar crash si faltan credenciales (Devuelve objeto dummy o null)
export const supabase = (SUPABASE_URL && SUPABASE_KEY)
    ? createClient(SUPABASE_URL, SUPABASE_KEY)
    : {
        from: () => ({ select: () => ({ data: [], error: { message: "Supabase no configurado" } }) })
    };
