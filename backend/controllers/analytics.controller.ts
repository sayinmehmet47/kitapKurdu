import { Request, Response } from 'express';
import { getTopSearchesService } from '../services/analytics/getTopSearches.service';

export const getTopSearchesController = async (req: Request, res: Response) => {
  try {
    const result = await getTopSearchesService(req);
    res.status(200).json(result);
  } catch (err) {
    if (err instanceof Error) {
      res.status(500).json({ error: err.message });
    } else {
      res.status(500).json({ error: 'An unknown error occurred' });
    }
  }
};
