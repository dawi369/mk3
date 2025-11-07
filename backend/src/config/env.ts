import dotenv from 'dotenv';

dotenv.config();

export const PORT = process.env.PORT || 5001;
export const POLYGON_API_KEY = process.env.POLYGON_API_KEY || 'no_api_key_:(';
