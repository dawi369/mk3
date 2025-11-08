import dotenv from 'dotenv';

dotenv.config();

export const PORT = process.env.PORT || 5001;
export const POLYGON_API_KEY = process.env.POLYGON_API_KEY || 'no_api_key_:(';
export const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
export const REDIS_PORT = process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : 6379;