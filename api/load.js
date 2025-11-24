// api/load.js
import automationCode from '../lib/automation.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'text/javascript');
  
  // Just send the code. The code itself handles the login UI.
  res.status(200).send(automationCode);
}
