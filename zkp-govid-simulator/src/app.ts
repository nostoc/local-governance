import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import authRoutes from './routes/auth';
import { initializeDatabase } from './database/db';
import { seedDatabase } from './database/seed';

const app: Express = express();

// Initialize database and seed data
initializeDatabase();
seedDatabase();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', authRoutes);

// Health check endpoint
app.get('/health', (req: Request, res: Response): void => {
  res.json({ status: 'ok', message: 'ZKP GovID Simulator is running' });
});

export default app;
