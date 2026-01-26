
import { neon } from '@netlify/neon';

// Helper to safely access environment variables in various environments
// (Vite, Next.js, Standard Node, etc.) to prevent "process is not defined" crashes
const getEnv = (key: string) => {
  try {
    // 1. Check for Vite / Modern Browser environments
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      // @ts-ignore
      return import.meta.env[key] || import.meta.env[`VITE_${key}`];
    }
    
    // 2. Check for Node.js / Webpack / standard process.env
    // @ts-ignore
    if (typeof process !== 'undefined' && process.env) {
      // @ts-ignore
      return process.env[key];
    }
  } catch (e) {
    console.warn('Environment variable access failed', e);
  }
  
  return undefined;
};

const connectionString = getEnv('NETLIFY_DATABASE_URL') || getEnv('DATABASE_URL');

// Export the sql client, or null if no connection string is found (fallback mode)
// This ensures the app doesn't crash if DB is not configured; it will use LocalStorage instead.
export const sql = connectionString ? neon(connectionString) : null;
