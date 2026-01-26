
import { neon } from '@neondatabase/serverless';

// Helper pour récupérer les variables d'environnement de manière sécurisée (compatible Vite & Netlify)
const getEnv = (key: string) => {
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      // @ts-ignore
      return import.meta.env[key] || import.meta.env[`VITE_${key}`];
    }
    // @ts-ignore
    if (typeof process !== 'undefined' && process.env) {
      // @ts-ignore
      return process.env[key];
    }
  } catch (e) {
    return undefined;
  }
  return undefined;
};

// Récupération de l'URL de la base de données
// NOTE: Pour que cela fonctionne en production, assurez-vous que la variable d'environnement 
// VITE_DATABASE_URL ou DATABASE_URL est définie dans Netlify "Site settings > Environment variables"
const connectionString = getEnv('NETLIFY_DATABASE_URL') || getEnv('DATABASE_URL') || getEnv('VITE_DATABASE_URL');

let sqlClient: any = null;

if (connectionString) {
  try {
    // Initialisation du client Neon en mode Serverless (compatible navigateur)
    sqlClient = neon(connectionString);
    console.log("Database connection initialized.");
  } catch (err) {
    console.error("Failed to initialize database client:", err);
  }
} else {
  console.warn("No database connection string found. Running in LocalStorage (Offline) mode.");
}

export const sql = sqlClient;
