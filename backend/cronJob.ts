import axios from 'axios';
const cron = require('node-cron');

const allBooksURL = 'https://kitapkurdu.onrender.com/api/books/allBooks?page=1';

export const myCronJob = () => {
  // This function will run every 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    try {
      const response = await axios.get(allBooksURL);
      console.log('cron job started');
    } catch (error) {
      console.error(error);
    }
  });
};
