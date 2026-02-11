
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
    // URL par défaut - Hardcodée proprement
    const defaultUrl = "postgresql://neondb_owner:npg_lu2eOvKXfM1y@ep-billowing-frog-ab0q17jx-pooler.eu-west-2.aws.neon.tech/neondb";

    let url = defaultUrl;

    // 1. Env Vars
    const envUrl = getEnv('NETLIFY_DATABASE_URL') || getEnv('DATABASE_URL') || getEnv('VITE_DATABASE_URL');
    if (envUrl) {
        url = envUrl;
    } 
    
    // 2. LocalStorage (Avec nettoyage agressif)
    if (typeof window !== 'undefined') {
        try {
            const localUrl = localStorage.getItem('daryl_db_url');
            if (localUrl && localUrl.trim().length > 10) {
                // On vérifie que ça ressemble vaguement à une URL postgres
                if (localUrl.includes('postgres')) {
                    url = localUrl;
                }
            }
        } catch (e) {
            console.warn("Erreur lecture LocalStorage", e);
        }
    }
    
    // Nettoyage final agressif pour éviter l'erreur "Invalid Name" dans les headers Fetch
    try {
        // Supprime les paramètres de requête comme ?sslmode=...
        if (url.includes('?')) {
            url = url.split('?')[0];
        }
        
        // Supprime tout espace invisible, saut de ligne, etc.
        url = url.trim().replace(/\s/g, '');
        
        return url;
    } catch (e) {
        return defaultUrl;
    }
};

const connectionString = getConnectionString();

let sqlClient: any = undefined;

if (connectionString) {
  try {
    // Initialisation du client Neon (HTTP mode)
    // Note: neon() ne lance pas de connexion immédiatement, c'est au premier appel de query.
    sqlClient = neon(connectionString);
    console.log("Neon Client Initialized with URL ending in ...", connectionString.slice(-10));
  } catch (err) {
    console.error("Failed to initialize database client constructor:", err);
  }
} else {
  console.warn("No database connection string found.");
}

export const sql = sqlClient;
