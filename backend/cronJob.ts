import { schedule } from 'node-cron';
import { updateCategories } from './services/book';
import { logger } from './logger';

export const myCronJob = () => {
  schedule('0 0 * * *', async () => {
    try {
      logger.info('Running cron job to update categories');
      await updateCategories();
      logger.info('Categories updated successfully');
    } catch (error) {
      logger.error('Error updating categories:', error);
    }
  });
};
