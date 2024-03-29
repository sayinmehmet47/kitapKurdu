// updateCategories.service.ts
import { Books } from '../../models/Books';
import axios from 'axios';
import Bottleneck from 'bottleneck';

const limiter = new Bottleneck({
  minTime: 200, // Minimum time between subsequent tasks in ms. Adjust this value to fit the rate limit of the API.
});

const updateCategories = async () => {
  const books = await Books.find({}).lean();

  const updatePromises = books.map((book) => {
    return limiter.schedule(async () => {
      if (book.name) {
        const response = await axios.get(
          `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(
            book.name
          )}`
        );

        const categories = new Set(
          response.data.items
            .slice(0, 10)
            .filter((item: any) => item.volumeInfo.categories)
            .flatMap((item: any) => item.volumeInfo.categories)
            .map((category: string) => category.toLowerCase())
        );

        const convertedCategories = Array.from(categories);
        const { description, imageLinks } = response.data.items[0].volumeInfo;

        return Books.findByIdAndUpdate(book._id, {
          category: convertedCategories,
          description,
          imageLinks,
        });
      }
    });
  });

  await Promise.all(updatePromises);
};

export { updateCategories };
