import { Router } from 'express';
import { createLead } from '../services/leadService';
import { validateCreateLead } from '../middleware/validation';
import { storePendingSubmission, retrievePendingSubmission } from '../utils/pendingSubmissions';

const router = Router();

// Store pending form submission
router.post('/leads/pending', async (req, res) => {
  try {
    const { sessionId, formData } = req.body;
    
    if (!sessionId || !formData) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'sessionId and formData are required',
      });
    }

    storePendingSubmission(sessionId, formData);
    
    res.status(200).json({ success: true, sessionId });
  } catch (error) {
    console.error('Error storing pending submission:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Retrieve pending form submission
router.get('/leads/pending/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const formData = retrievePendingSubmission(sessionId);
    
    if (!formData) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Pending submission not found or expired',
      });
    }
    
    res.status(200).json({ success: true, formData });
  } catch (error) {
    console.error('Error retrieving pending submission:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

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

