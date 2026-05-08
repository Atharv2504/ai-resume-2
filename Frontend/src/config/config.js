const AUTH_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const API_KEY = import.meta.env.VITE_STRAPI_API_KEY;
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_MODEL = import.meta.env.VITE_GROQ_MODEL || "llama-3.1-8b-instant";
const VITE_APP_URL = import.meta.env.VITE_APP_URL;

export { AUTH_KEY, API_KEY, GROQ_API_KEY, GROQ_MODEL, VITE_APP_URL };
