// src/config/index.ts
import dotenv from 'dotenv';

dotenv.config();

export default {
  port: process.env.PORT || 5000,
  database_url: process.env.DATABASE_URL,
  node_env: process.env.NODE_ENV || 'development',
};
