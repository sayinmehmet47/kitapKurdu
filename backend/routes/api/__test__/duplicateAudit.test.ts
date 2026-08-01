import request from 'supertest';
import { app } from '../../../app';
import { Books } from '../../../models/Books';

const getCookie = async (isAdmin = true) => {
  const { accessToken } = await global.signin(isAdmin);
  return `accessToken=${accessToken}`;
};

describe('GET /api/duplicate-audit', () => {
  it('returns 401 when unauthenticated', async () => {
    await request(app).get('/api/duplicate-audit').expect(401);
  });

  it('returns 403 for non-admin users', async () => {
    const cookie = await getCookie(false);
    await request(app).get('/api/duplicate-audit').set('Cookie', cookie).expect(403);
  });

  it('groups books by normalized URL', async () => {
    const cookie = await getCookie();
    await Books.insertMany([
      { name: 'Alpha', url: 'HTTPS://Example.COM/Foo/Book.pdf?token=secret', size: 100 },
      { name: 'Alpha', url: 'https://example.com/foo/book.pdf#section', size: 100 },
      { name: 'Single', url: 'https://unique.example.com/only.pdf', size: 100 },
    ]);

    const res = await request(app)
      .get('/api/duplicate-audit?type=url')
      .set('Cookie', cookie)
      .expect(200);

    expect(res.body.type).toBe('url');
    expect(res.body.summary.url).toBe(1);
    expect(res.body.summary.isbn).toBe(0);
    expect(res.body.totalGroups).toBe(1);
    expect(res.body.scannedBooks).toBe(3);
    expect(res.body.totalBooks).toBe(3);
    expect(res.body.isTruncated).toBe(false);
    expect(res.body.page).toBe(1);
    expect(res.body.groups).toHaveLength(1);
    expect(res.body.groups[0].count).toBe(2);
    expect(res.body.groups[0].confidence).toBe('exact');
    expect(res.body.groups[0].key).toMatch(/^[0-9a-f]{64}$/);
  });

  it('never returns raw URLs in the response', async () => {
    const cookie = await getCookie();
    const rawUrls = [
      'HTTPS://Example.COM/Foo/Book.pdf?token=secret',
      'https://example.com/foo/book.pdf#section',
      'https://unique.example.com/only.pdf',
    ];
    await Books.insertMany([
      { name: 'Alpha', url: rawUrls[0], size: 100 },
      { name: 'Alpha', url: rawUrls[1], size: 100 },
      { name: 'Single', url: rawUrls[2], size: 100 },
    ]);

    const res = await request(app)
      .get('/api/duplicate-audit?type=url')
      .set('Cookie', cookie)
      .expect(200);

    const body = JSON.stringify(res.body);
    for (const raw of rawUrls) {
      expect(body).not.toContain(raw);
    }
    expect(body).not.toContain('token=secret');

    expect(Object.keys(res.body.groups[0].books[0]).sort()).toEqual([
      'author',
      'bookId',
      'duplicateOf',
      'isbn',
      'language',
      'name',
      'size',
    ]);
    for (const book of res.body.groups[0].books) {
      expect(book).not.toHaveProperty('url');
      expect(book).not.toHaveProperty('uploader');
    }
  });

  it('groups books by normalized ISBN', async () => {
    const cookie = await getCookie();
    await Books.insertMany([
      { name: 'Isbn One', url: 'https://a.example.com/1.pdf', size: 10, isbn: '978-0000000000' },
      { name: 'Isbn Two', url: 'https://b.example.com/2.pdf', size: 20, isbn: '9780000000000' },
      { name: 'Isbn Bad', url: 'https://c.example.com/3.pdf', size: 30, isbn: '12345' },
    ]);

    const res = await request(app)
      .get('/api/duplicate-audit?type=isbn')
      .set('Cookie', cookie)
      .expect(200);

    expect(res.body.summary.isbn).toBe(1);
    expect(res.body.groups).toHaveLength(1);
    expect(res.body.groups[0].count).toBe(2);
    expect(res.body.groups[0].confidence).toBe('exact');
    expect(res.body.groups[0].key).toBe('9780000000000');
  });

  it('groups books by normalized name and exact size', async () => {
    const cookie = await getCookie();
    await Books.insertMany([
      { name: '  KÜÇÜK   PRENS ', url: 'https://a.example.com/1.pdf', size: 100 },
      { name: 'kucuk prens', url: 'https://b.example.com/2.pdf', size: 100 },
      { name: 'kucuk prens', url: 'https://c.example.com/3.pdf', size: 200 },
    ]);

    const res = await request(app)
      .get('/api/duplicate-audit?type=name-size')
      .set('Cookie', cookie)
      .expect(200);

    expect(res.body.summary['name-size']).toBe(1);
    expect(res.body.groups).toHaveLength(1);
    expect(res.body.groups[0].count).toBe(2);
    expect(res.body.groups[0].confidence).toBe('exact');
    expect(res.body.groups[0].key).toBe('kucuk prens :: 100');
    // Display keys must never leak NUL control characters into clients/CSV.
    expect(JSON.stringify(res.body)).not.toContain('\\u0000');
  });

  it('groups TITANIC and Titanic (dotted I vs plain case) under the same key', async () => {
    const cookie = await getCookie();
    await Books.insertMany([
      { name: 'TITANIC', url: 'https://a.example.com/titanic.pdf', size: 100 },
      { name: 'Titanic', url: 'https://b.example.com/titanic.pdf', size: 100 },
    ]);

    const res = await request(app)
      .get('/api/duplicate-audit?type=name-size')
      .set('Cookie', cookie)
      .expect(200);

    expect(res.body.summary['name-size']).toBe(1);
    expect(res.body.groups).toHaveLength(1);
    expect(res.body.groups[0].count).toBe(2);
    expect(res.body.groups[0].key).toBe('titanic :: 100');
  });

  it('groups İstanbul and Istanbul (dotted vs dotless i) under the same key', async () => {
    const cookie = await getCookie();
    await Books.insertMany([
      { name: 'İstanbul', url: 'https://a.example.com/istanbul.pdf', size: 100 },
      { name: 'Istanbul', url: 'https://b.example.com/istanbul.pdf', size: 100 },
    ]);

    const res = await request(app)
      .get('/api/duplicate-audit?type=name-size')
      .set('Cookie', cookie)
      .expect(200);

    expect(res.body.summary['name-size']).toBe(1);
    expect(res.body.groups).toHaveLength(1);
    expect(res.body.groups[0].count).toBe(2);
    expect(res.body.groups[0].key).toBe('istanbul :: 100');
  });

  it('reports isTruncated=false and totalBooks for a small collection', async () => {
    const cookie = await getCookie();
    await Books.insertMany([
      { name: 'Alpha', url: 'https://a.example.com/1.pdf', size: 100 },
      { name: 'Alpha', url: 'https://b.example.com/1.pdf', size: 100 },
    ]);

    const res = await request(app)
      .get('/api/duplicate-audit?type=url')
      .set('Cookie', cookie)
      .expect(200);

    expect(res.body.totalBooks).toBe(2);
    expect(res.body.scannedBooks).toBe(2);
    expect(res.body.isTruncated).toBe(false);
  });

  it('flags isTruncated when the collection exceeds the 10k scan bound', async () => {
    const cookie = await getCookie();
    const fixtures = Array.from({ length: 10_001 }, (_, i) => ({
      name: `Book ${i}`,
      url: `https://t${i}.example.com/only.pdf`,
      size: 1,
    }));
    await Books.insertMany(fixtures);

    const res = await request(app)
      .get('/api/duplicate-audit?type=url')
      .set('Cookie', cookie)
      .expect(200);

    expect(res.body.totalBooks).toBe(10_001);
    expect(res.body.scannedBooks).toBe(10_000);
    expect(res.body.isTruncated).toBe(true);
  });

  it('groups soft candidates by title, author and language including Turkish, legacy and same-title different-size', async () => {
    const cookie = await getCookie();
    await Books.insertMany([
      {
        name: 'Küçük Prens',
        author: 'Antoine de Saint-Exupéry',
        url: 'https://a.example.com/1.pdf',
        size: 100,
        language: 'turkish',
      },
      {
        name: 'KUCUK PRENS',
        author: 'Antoine de Saint-Exupery',
        url: 'https://b.example.com/2.pdf',
        size: 500,
        language: 'turkish',
      },
      {
        name: 'Antoine de Saint-Exupéry - Küçük Prens',
        author: null,
        url: 'https://c.example.com/3.pdf',
        size: 300,
        language: 'turkish',
      },
      {
        name: 'Küçük Prens',
        author: 'Başka Yazar',
        url: 'https://d.example.com/4.pdf',
        size: 100,
        language: 'turkish',
      },
    ]);

    const res = await request(app)
      .get('/api/duplicate-audit?type=title-author-language')
      .set('Cookie', cookie)
      .expect(200);

    expect(res.body.summary['title-author-language']).toBe(1);
    expect(res.body.groups).toHaveLength(1);
    expect(res.body.groups[0].count).toBe(3);
    expect(res.body.groups[0].confidence).toBe('soft');
    expect(res.body.groups[0].books.map((b: { name: string }) => b.name).sort()).toEqual([
      'Antoine de Saint-Exupéry - Küçük Prens',
      'KUCUK PRENS',
      'Küçük Prens',
    ]);
  });

  it('paginates selected groups and reports totals', async () => {
    const cookie = await getCookie();
    const fixtures = Array.from({ length: 6 }, (_, i) => [
      { name: `Book ${i}`, url: `https://a${i}.example.com/1.pdf`, size: i + 1 },
      { name: `Book ${i}`, url: `https://b${i}.example.com/2.pdf`, size: i + 1 },
    ]).flat();
    await Books.insertMany(fixtures);

    const page1 = await request(app)
      .get('/api/duplicate-audit?type=name-size&page=1&limit=2')
      .set('Cookie', cookie)
      .expect(200);

    expect(page1.body.totalGroups).toBe(6);
    expect(page1.body.page).toBe(1);
    expect(page1.body.limit).toBe(2);
    expect(page1.body.groups).toHaveLength(2);

    const page3 = await request(app)
      .get('/api/duplicate-audit?type=name-size&page=3&limit=2')
      .set('Cookie', cookie)
      .expect(200);

    expect(page3.body.groups).toHaveLength(2);
    const names = page3.body.groups.flatMap((g: { books: { name: string }[] }) =>
      g.books.map((b) => b.name)
    );
    expect(names.sort()).toEqual(['Book 4', 'Book 4', 'Book 5', 'Book 5']);
  });

  it('returns 400 for invalid query parameters', async () => {
    const cookie = await getCookie();
    const invalidQueries = [
      '?type=bogus',
      '?type=',
      '?page=0',
      '?page=abc',
      '?page=-1',
      '?limit=0',
      '?limit=51',
      '?limit=abc',
    ];

    for (const query of invalidQueries) {
      const res = await request(app)
        .get(`/api/duplicate-audit${query}`)
        .set('Cookie', cookie)
        .expect(400);
      expect(res.body.errors).toBeDefined();
    }
  });

  it('leaves the Books collection byte-for-byte unchanged', async () => {
    const cookie = await getCookie();
    await Books.insertMany([
      {
        name: 'Küçük Prens',
        author: 'Antoine de Saint-Exupéry',
        url: 'https://a.example.com/1.pdf',
        size: 100,
        isbn: '978-0000000000',
        language: 'turkish',
      },
      {
        name: 'KUCUK PRENS',
        author: 'Antoine de Saint-Exupery',
        url: 'https://b.example.com/2.pdf',
        size: 500,
        language: 'turkish',
      },
      { name: 'Single', url: 'https://unique.example.com/only.pdf', size: 100, isbn: '12345' },
    ]);

    const snapshot = async () => {
      const docs = await Books.find({}, '_id name size url isbn author language').lean();
      return {
        count: await Books.countDocuments(),
        json: JSON.stringify(docs),
      };
    };

    const before = await snapshot();

    await request(app).get('/api/duplicate-audit?type=url').set('Cookie', cookie).expect(200);
    await request(app)
      .get('/api/duplicate-audit?type=isbn&limit=1')
      .set('Cookie', cookie)
      .expect(200);
    await request(app)
      .get('/api/duplicate-audit?type=title-author-language')
      .set('Cookie', cookie)
      .expect(200);

    const after = await snapshot();

    expect(after.count).toBe(before.count);
    expect(after.json).toBe(before.json);
  });
});
