import automationCode from '../lib/automation.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  // Simply send the code. The code itself handles the Login/Lock screen logic.
  res.status(200).send(automationCode);
}
