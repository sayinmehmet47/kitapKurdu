// addNewBook.service.ts
import { Request } from 'express';
import { Books } from '../../models/Books';
import axios from 'axios';
import * as webpush from 'web-push';
import { Item } from '../../routes/api/books.types';
import {
  getUserSubscriptionsExcludingUser,
  removeSubscription,
} from '../../web-push';

const addNewBook = async (req: Request) => {
  let responseData;

  try {
    const response = await axios.get(
      `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(
        req.body.name
      )}`
    );
    responseData = await response?.data?.items;
  } catch (error) {
    responseData = null;
  }

  const books = new Books({
    name: req.body.name,
    url: req.body.url,
    size: req.body.size,
    date: new Date(),
    uploader: req.body.uploader,
  });

  if (responseData && responseData.length > 0) {
    const categories: Set<string> = new Set(
      responseData
        .slice(0, 10)
        .filter((item: Item) => item.volumeInfo.categories)
        .flatMap((item: Item) => item.volumeInfo.categories)
        .map((category: string) => category.toLowerCase())
    );

    const convertedCategories = Array.from(categories);

    const { description, imageLinks } = responseData[0].volumeInfo || {};
    books.category = convertedCategories;
    books.description = description;
    books.imageLinks = imageLinks;
  }

  await books.save();

  const user = req.user as any;

  const payload = JSON.stringify({
    title: 'New Book Added',
    body: `A new book "${req.body.name}" has been added!`,
  });

  const subscriptions = await getUserSubscriptionsExcludingUser(user.id);

  subscriptions.forEach((subscription) => {
    if (subscription?.subscription?.endpoint) {
      webpush
        .sendNotification(
          subscription.subscription as webpush.PushSubscription,
          payload
        )
        .catch((error) => {
          if (error.statusCode === 410) {
            removeSubscription(subscription.subscription);
          } else {
            console.error('Error sending push notification:', error);
          }
        });
    } else {
      console.error('Invalid subscription endpoint:', subscription);
    }
  });

  return books;
};

export { addNewBook };
