import app, { connectDB } from '../server/app.js';

let isConnected = false;

export default async function handler(req, res) {
  if (!isConnected) {
    try {
      await connectDB();
      isConnected = true;
    } catch (err) {
      console.error('DB connection error:', err);
      return res.status(500).json({ success: false, message: 'Database connection failed' });
    }
  }
  return app(req, res);
}
