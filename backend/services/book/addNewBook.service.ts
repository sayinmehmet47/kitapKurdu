// addNewBook.service.ts
import type { Request } from 'express';
import * as webpush from 'web-push';
import { logger } from '../../logger';
import { Books } from '../../models/Books';
import { getUserSubscriptionsExcludingUser, removeSubscription } from '../../web-push';
import type { BookMetadata } from './googleBooksMetadata.service';
import { fetchGoogleBooksMetadata } from './googleBooksMetadata.service';

const getTrimmedString = (value: unknown): string | undefined => {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed || undefined;
};

const addNewBook = async (req: Request) => {
  const incomingName = typeof req.body.name === 'string' ? req.body.name : undefined;
  const nameForLookup = getTrimmedString(incomingName);
  const manualAuthor = getTrimmedString(req.body.author);
  const manualIsbn = getTrimmedString(req.body.isbn);
  const manualPublisher = getTrimmedString(req.body.publisher);
  let metadata: BookMetadata | null = null;

  try {
    metadata =
      (await fetchGoogleBooksMetadata({
        name: nameForLookup,
        isbn: manualIsbn,
      })) ?? null;
  } catch (error) {
    logger.error('Failed to enrich book metadata from Google Books API', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }

  const bookName = nameForLookup ? (incomingName ?? '') : (metadata?.title ?? '');
  const books = new Books({
    name: bookName,
    url: req.body.url,
    size: req.body.size,
    date: new Date(),
    uploader: req.body.uploader,
    author: manualAuthor ?? metadata?.author ?? null,
    isbn: manualIsbn ?? metadata?.isbn ?? null,
    publisher: manualPublisher ?? metadata?.publisher ?? null,
  });

  if (metadata?.categories?.length) {
    books.category = Array.from(
      new Set(metadata.categories.map((category) => category.toLowerCase()))
    );
  }

  if (metadata?.description) {
    books.description = metadata.description;
  }

  if (metadata?.imageLinks) {
    books.set('imageLinks', metadata.imageLinks);
  }

  await books.save();

  const user = req.user as any;

  const payload = JSON.stringify({
    title: 'New Book Added',
    body: `A new book "${books.name}" has been added!`,
  });

  const subscriptions = await getUserSubscriptionsExcludingUser(user.id);

  subscriptions.forEach((subscription) => {
    if (subscription?.subscription?.endpoint) {
      webpush
        .sendNotification(subscription.subscription as webpush.PushSubscription, payload)
        .catch((error) => {
          if (error.statusCode === 410) {
            removeSubscription(subscription.subscription);
          } else {
            logger.error('Error sending push notification', {
              error: error.message,
              statusCode: error.statusCode,
              endpoint: subscription.subscription?.endpoint,
            });
          }
        });
    } else {
      logger.error('Invalid subscription endpoint', { subscription });
    }
  });

  return books;
};

export { addNewBook };
