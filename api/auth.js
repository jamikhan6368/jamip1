import { Pool } from 'pg';
import automationCode from '../lib/automation.js';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
      // Simple check: If code exists, send it.
      // The Auth logic logic is handled before this point in your flow,
      // or inside the client if using the Dummy Loader model.
      
      // Send the code
      res.status(200).send(automationCode);
  } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Server Error' });
  }
}
