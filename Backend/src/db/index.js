import { Pool } from "pg";
import { ApiError } from "../utils/ApiError.js";

let pool;

const getPool = () => {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    });
  }
  return pool;
};

const initializeSchema = async () => {
  const activePool = getPool();
  await activePool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      full_name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await activePool.query(`
    CREATE TABLE IF NOT EXISTS resumes (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      first_name TEXT NOT NULL DEFAULT '',
      last_name TEXT NOT NULL DEFAULT '',
      email TEXT NOT NULL DEFAULT '',
      title TEXT NOT NULL,
      summary TEXT NOT NULL DEFAULT '',
      job_title TEXT NOT NULL DEFAULT '',
      phone TEXT NOT NULL DEFAULT '',
      address TEXT NOT NULL DEFAULT '',
      experience JSONB NOT NULL DEFAULT '[]'::jsonb,
      education JSONB NOT NULL DEFAULT '[]'::jsonb,
      skills JSONB NOT NULL DEFAULT '[]'::jsonb,
      projects JSONB NOT NULL DEFAULT '[]'::jsonb,
      theme_color TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
};

const connectDB = async () => {
  if (!process.env.DATABASE_URL) {
    throw new ApiError(500, "DATABASE_URL is missing in environment variables.");
  }

  try {
    const activePool = getPool();
    await activePool.query("SELECT 1");
    await initializeSchema();
    console.log("PostgreSQL Connected");
    return activePool;
  } catch (err) {
    throw new ApiError(500, "Database connection failed", [], err.stack);
  }
};

const query = (text, params = []) => getPool().query(text, params);

export { connectDB, query };
