import { neon } from '@netlify/neon';

// Initialize the SQL client using the Netlify environment variable
// This typically requires the project to be linked to Netlify with the Neon integration
const connectionString = process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL;

// Export the sql client, or null if no connection string is found (fallback mode)
export const sql = connectionString ? neon(connectionString) : null;