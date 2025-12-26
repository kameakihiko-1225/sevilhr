import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

const createLeadSchema = z.object({
  location: z.enum(['Toshkent shahri', 'Boshqa viloyatda'], {
    errorMap: () => ({ message: 'Location must be either "Toshkent shahri" or "Boshqa viloyatda"' }),
  }),
  companyType: z.string().optional(),
  roleInCompany: z.string().optional(),
  interests: z.array(z.string()).optional(),
  companyDescription: z.string().optional(),
  annualTurnover: z.string().optional(),
  numberOfEmployees: z.string().optional(),
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  phoneNumber: z.string().min(9, 'Phone number must be at least 9 characters'),
  companyName: z.string().optional(),
  locale: z.enum(['uz', 'en', 'ru']).optional().default('uz'),
  status: z.enum(['PARTIAL', 'FULL']),
});

export function validateCreateLead(req: Request, res: Response, next: NextFunction) {
  try {
    createLeadSchema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors,
      });
    }
    next(error);
  }
}

