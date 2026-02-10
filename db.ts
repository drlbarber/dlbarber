
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
    // URL par défaut fournie pour le projet Daryl Barber
    let url = "postgresql://neondb_owner:npg_lu2eOvKXfM1y@ep-billowing-frog-ab0q17jx-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

    // 1. Env Vars (Prioritaire si défini en prod)
    const envUrl = getEnv('NETLIFY_DATABASE_URL') || getEnv('DATABASE_URL') || getEnv('VITE_DATABASE_URL');
    if (envUrl) {
        url = envUrl;
    } 
    // 2. LocalStorage (Permet de surcharger via l'interface Admin si nécessaire)
    else if (typeof window !== 'undefined') {
        const localUrl = localStorage.getItem('daryl_db_url');
        if (localUrl) url = localUrl;
    }

    // Nettoyage des espaces blancs accidentels
    return url ? url.trim() : "";
};

const connectionString = getConnectionString();

let sqlClient: any = null;

if (connectionString) {
  try {
    // Initialisation du client Neon en mode Serverless
    sqlClient = neon(connectionString);
    console.log("Database connection initialized.");
  } catch (err) {
    console.error("Failed to initialize database client:", err);
  }
} else {
  console.warn("No database connection string found. App will start in Offline Mode.");
}

export const sql = sqlClient;
