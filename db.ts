
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
const getConnectionString = () => {
    // URL par défaut nettoyée pour compatibilité navigateur (suppression des params query potentiellement bloquants)
    const defaultUrl = "postgresql://neondb_owner:npg_lu2eOvKXfM1y@ep-billowing-frog-ab0q17jx-pooler.eu-west-2.aws.neon.tech/neondb";

    // 1. Env Vars (Prioritaire si défini en prod via Vercel/Netlify)
    const envUrl = getEnv('NETLIFY_DATABASE_URL') || getEnv('DATABASE_URL') || getEnv('VITE_DATABASE_URL');
    if (envUrl) {
        return envUrl;
    } 
    
    // 2. LocalStorage (Permet de surcharger UNIQUEMENT si une URL valide est fournie)
    if (typeof window !== 'undefined') {
        const localUrl = localStorage.getItem('daryl_db_url');
        // On n'utilise l'override local que s'il semble valide (commence par postgres)
        if (localUrl && localUrl.trim().startsWith('postgres')) {
            return localUrl.trim();
        }
    }

    // 3. Fallback : Utiliser l'URL par défaut hardcodée
    return defaultUrl;
};

const connectionString = getConnectionString();

let sqlClient: any = null;

if (connectionString) {
  try {
    // Initialisation du client Neon en mode Serverless (HTTP)
    sqlClient = neon(connectionString);
    console.log("Database connection initialized");
  } catch (err) {
    console.error("Failed to initialize database client:", err);
  }
} else {
  console.warn("No database connection string found. App will start in Offline Mode.");
}

export const sql = sqlClient;
