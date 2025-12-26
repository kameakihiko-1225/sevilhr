import { Router } from 'express';
import { createLead } from '../services/leadService';
import { validateCreateLead } from '../middleware/validation';

const router = Router();

router.post('/leads', validateCreateLead, async (req, res) => {
  try {
    const result = await createLead(req.body);
    res.status(201).json(result);
  } catch (error) {
    console.error('Error creating lead:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;

