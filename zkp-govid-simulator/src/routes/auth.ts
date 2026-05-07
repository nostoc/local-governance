import express, { Router } from 'express';
import { addCitizen, authenticate } from '../controllers/authController';

const router: Router = express.Router();

// POST /api/govid/verify-citizen
// Verify citizen identity and generate ZKP proof
router.post('/govid/verify-citizen', authenticate);

// POST /api/govid/add-citizen
// Add a new citizen to the government registry
router.post('/govid/add-citizen', addCitizen);

export default router;
