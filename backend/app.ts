import { Request, Response } from 'express';
import 'express-async-errors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';

import routes from './routes';
import { json } from 'body-parser';

import express from 'express';
import cors from 'cors';
import path from 'path';
import { NotFoundError } from './errors/not-found-error';
import { errorHandler } from './middleware/error-handler';
import { updateMetrics } from './metrics';
import { logger } from './logger';
import winston from 'winston';
import passport from './src/config/passport';
import { Books } from './models/Books';

const app = express();
app.set('trust proxy', true);
app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize());
app.use(morgan('dev'));

app.use(
  cors({
    origin: [
      'http://localhost:3000',
      'https://kitapkurdu.xyz',
      'https://www.kitapkurdu.xyz',
      'https://dev.kitapkurdu.xyz',
      'https://www.dev.kitapkurdu.xyz',
      'https://staging.kitapkurdu.xyz',
      'https://www.staging.kitapkurdu.xyz',
      'https://kitapkurdu.onrender.com',
      'https://kitap-kurdu-bx87.vercel.app',
    ],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  })
);

app.use('/api', routes);

// Server-rendered Open Graph/Twitter meta for rich link previews
app.get('/og/book/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const book = await Books.findById(id).lean();
    if (!book) {
      return res.status(404).send('Not found');
    }

    const origin = `${req.protocol}://${req.get('host')}`;
    const pageUrl = `${origin}/book/${id}`;
    const coverImage = book.url?.includes('pdf')
      ? book.url.replace('pdf', 'jpg')
      : book.imageLinks?.thumbnail || `${origin}/logo-white.svg`;

    const title = `${book.name} | Book-Worm`;
    const description =
      book.description || 'Read and download books on Book-Worm';

    const html = `<!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>${title}</title>
        <meta name="description" content="${escapeHtml(description)}" />
        <meta property="og:title" content="${escapeHtml(title)}" />
        <meta property="og:description" content="${escapeHtml(description)}" />
        <meta property="og:image" content="${coverImage}" />
        <meta property="og:type" content="article" />
        <meta property="og:url" content="${pageUrl}" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="${escapeHtml(title)}" />
        <meta name="twitter:description" content="${escapeHtml(description)}" />
        <meta name="twitter:image" content="${coverImage}" />
      </head>
      <body>
        <noscript>This preview is intended for link unfurlers.</noscript>
        <script>window.location.replace(${JSON.stringify(pageUrl)});</script>
      </body>
    </html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(200).send(html);
  } catch (error) {
    logger.error('Error generating Open Graph preview', {
      bookId: req.params.id,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    res.status(500).send('Server error');
  }
});

// Sitemap for key routes and per-book pages
app.get('/sitemap.xml', async (req: Request, res: Response) => {
  try {
    const origin =
      process.env.CLIENT_URL || `${req.protocol}://${req.get('host')}`;
    const staticUrls = ['/', '/all-books', '/recently-added'];

    const books = await Books.find({}, { _id: 1, date: 1 }).lean();
    const urls: Array<{ loc: string; lastmod?: string }> = [
      ...staticUrls.map((path) => ({ loc: `${origin}${path}` })),
      ...books.map((b: any) => ({
        loc: `${origin}/book/${b._id}`,
        lastmod: b.date ? new Date(b.date).toISOString() : undefined,
      })),
    ];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${u.loc}</loc>
    ${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}
    <changefreq>weekly</changefreq>
    <priority>${u.loc.includes('/book/') ? '0.8' : '0.6'}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;

    res.setHeader('Content-Type', 'application/xml');
    res.status(200).send(xml);
  } catch (error) {
    logger.error('Error generating sitemap', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    res.status(500).send('Server error');
  }
});

app.get('/healthz', (req: Request, res: Response) => {
  res
    .status(200)
    .json({ status: 'ok', uptime: process.uptime(), timestamp: Date.now() });
});

app.use(updateMetrics);

app.all('*', (req: Request, res: Response) => {
  throw new NotFoundError();
});

app.use(errorHandler);

if (process.env.NODE_ENV === 'production') {
  // Set static folder
  app.use(express.static('client/build'));

  app.get('*', (req: Request, res: Response) => {
    res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html'));
  });
}

if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.simple(),
    })
  );
}
export { app };

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
