import mongoose from 'mongoose';
import request from 'supertest';
import { app } from '../../../app';
import { Books } from '../../../models/Books';
import { Rating } from '../../../models/Rating';

const getCookie = async (isAdmin = true) => {
  const { accessToken } = await global.signin(isAdmin);
  return `accessToken=${accessToken}`;
};

const makeBook = (overrides: Record<string, unknown> = {}) =>
  Books.create({
    name: 'Book',
    url: `https://example.com/${Math.random().toString(36).slice(2)}.pdf`,
    size: 100,
    ...overrides,
  });

const markBody = (canonicalId: string, duplicateIds: string[]) => ({
  canonicalId,
  duplicateIds,
});

const missingId = () => String(new mongoose.Types.ObjectId());

const searchNames = async (q: string) => {
  const res = await request(app).get('/api/books/search').query({ q }).expect(200);
  return res.body.results.map((book: { name: string }) => book.name);
};

describe('POST /api/duplicate-audit/mark', () => {
  it('returns 401 when unauthenticated and 403 for non-admin users', async () => {
    const canonical = await makeBook();
    const dup = await makeBook();
    const body = markBody(String(canonical._id), [String(dup._id)]);

    await request(app).post('/api/duplicate-audit/mark').send(body).expect(401);

    const cookie = await getCookie(false);
    await request(app)
      .post('/api/duplicate-audit/mark')
      .set('Cookie', cookie)
      .send(body)
      .expect(403);
  });

  it('rejects malformed bodies and invalid ids', async () => {
    const cookie = await getCookie();
    const book = await makeBook();
    const id = String(book._id);

    const badBodies = [
      {},
      { canonicalId: '' },
      { canonicalId: 123, duplicateIds: [id] },
      { canonicalId: id, duplicateIds: 'not-an-array' },
      { canonicalId: id, duplicateIds: [] },
      { canonicalId: id, duplicateIds: [123] },
    ];
    for (const body of badBodies) {
      const res = await request(app)
        .post('/api/duplicate-audit/mark')
        .set('Cookie', cookie)
        .send(body)
        .expect(400);
      expect(res.body.errors).toBeDefined();
    }

    for (const badId of ['not-an-object-id', '123']) {
      await request(app)
        .post('/api/duplicate-audit/mark')
        .set('Cookie', cookie)
        .send(markBody(id, [badId]))
        .expect(400);
    }
  });

  it('rejects batches larger than 50 duplicates', async () => {
    const cookie = await getCookie();
    const canonical = await makeBook();
    const dup = await makeBook();
    const tooMany = Array.from({ length: 51 }, () => String(dup._id));

    const res = await request(app)
      .post('/api/duplicate-audit/mark')
      .set('Cookie', cookie)
      .send(markBody(String(canonical._id), tooMany))
      .expect(400);

    expect(res.body.errors[0].message).toContain('50');
  });

  it('returns 404 when the canonical or a duplicate does not exist', async () => {
    const cookie = await getCookie();
    const canonical = await makeBook();
    const dup = await makeBook();

    await request(app)
      .post('/api/duplicate-audit/mark')
      .set('Cookie', cookie)
      .send(markBody(missingId(), [String(dup._id)]))
      .expect(404);

    await request(app)
      .post('/api/duplicate-audit/mark')
      .set('Cookie', cookie)
      .send(markBody(String(canonical._id), [missingId()]))
      .expect(404);
  });

  it('rejects marking a book as its own duplicate', async () => {
    const cookie = await getCookie();
    const book = await makeBook();

    await request(app)
      .post('/api/duplicate-audit/mark')
      .set('Cookie', cookie)
      .send(markBody(String(book._id), [String(book._id)]))
      .expect(400);
  });

  it('rejects a canonical that is already hidden as a duplicate', async () => {
    const cookie = await getCookie();
    const bookA = await makeBook();
    const bookB = await makeBook();
    const bookC = await makeBook();

    await request(app)
      .post('/api/duplicate-audit/mark')
      .set('Cookie', cookie)
      .send(markBody(String(bookB._id), [String(bookA._id)]))
      .expect(200);

    await request(app)
      .post('/api/duplicate-audit/mark')
      .set('Cookie', cookie)
      .send(markBody(String(bookC._id), [String(bookB._id)]))
      .expect(400);
  });

  it('rejects hiding a book that is the canonical of another marked book (prevents chains)', async () => {
    const cookie = await getCookie();
    const canonical = await makeBook();
    const dup = await makeBook();
    const grandchild = await makeBook();

    await request(app)
      .post('/api/duplicate-audit/mark')
      .set('Cookie', cookie)
      .send(markBody(String(dup._id), [String(grandchild._id)]))
      .expect(200);

    await request(app)
      .post('/api/duplicate-audit/mark')
      .set('Cookie', cookie)
      .send(markBody(String(canonical._id), [String(dup._id)]))
      .expect(400);
  });

  it('rejects repointing a duplicate already hidden under another canonical', async () => {
    const cookie = await getCookie();
    const canonicalA = await makeBook();
    const canonicalB = await makeBook();
    const dup = await makeBook();

    await request(app)
      .post('/api/duplicate-audit/mark')
      .set('Cookie', cookie)
      .send(markBody(String(canonicalA._id), [String(dup._id)]))
      .expect(200);

    // dup is already hidden under A; silently moving it under B must fail.
    const res = await request(app)
      .post('/api/duplicate-audit/mark')
      .set('Cookie', cookie)
      .send(markBody(String(canonicalB._id), [String(dup._id)]))
      .expect(400);

    expect(res.body.errors[0].message).toContain('unmark');

    // The original mapping is untouched.
    const stored = await Books.findById(dup._id).lean();
    expect(String(stored?.duplicateOf)).toBe(String(canonicalA._id));
  });

  it('marks duplicates under the canonical and hides them from every public endpoint', async () => {
    const cookie = await getCookie();
    const canonical = await makeBook({ name: 'Canonical Book' });
    const dupA = await makeBook({ name: 'Duplicate A' });
    const dupB = await makeBook({ name: 'Duplicate B' });

    const res = await request(app)
      .post('/api/duplicate-audit/mark')
      .set('Cookie', cookie)
      .send(markBody(String(canonical._id), [String(dupA._id), String(dupB._id)]))
      .expect(200);

    expect(res.body).toEqual({
      canonicalId: String(canonical._id),
      duplicateIds: [String(dupA._id), String(dupB._id)],
      updatedCount: 2,
    });

    const stored = await Books.find({ _id: { $in: [dupA._id, dupB._id] } }).lean();
    for (const book of stored) {
      expect(String(book.duplicateOf)).toBe(String(canonical._id));
    }

    expect(await searchNames('Duplicate')).toEqual([]);

    const allBooks = await request(app)
      .get('/api/books/allBooks')
      .query({ language: 'all', page: 1, limit: 20 })
      .expect(200);
    expect(allBooks.body.data.results.map((b: { name: string }) => b.name)).toEqual([
      'Canonical Book',
    ]);

    const recent = await request(app)
      .get('/api/books/recently-added')
      .query({ page: 1, limit: 20 })
      .expect(200);
    expect(recent.body.data.books.map((b: { name: string }) => b.name)).toEqual(['Canonical Book']);

    // Detail returns an empty body for hidden books (the client renders not-found).
    const hiddenDetail = await request(app).get(`/api/books/getBookById/${dupA._id}`).expect(200);
    expect(hiddenDetail.body).toBeNull();
    await request(app).get(`/og/book/${dupA._id}`).expect(404);

    const sitemap = await request(app).get('/sitemap.xml').expect(200);
    expect(sitemap.text).toContain(`/book/${canonical._id}`);
    expect(sitemap.text).not.toContain(`/book/${dupA._id}`);
    expect(sitemap.text).not.toContain(`/book/${dupB._id}`);

    const detail = await request(app).get(`/api/books/getBookById/${canonical._id}`).expect(200);
    expect(detail.body.name).toBe('Canonical Book');
  });

  it('is idempotent when the same duplicates are marked again', async () => {
    const cookie = await getCookie();
    const canonical = await makeBook();
    const dup = await makeBook();

    await request(app)
      .post('/api/duplicate-audit/mark')
      .set('Cookie', cookie)
      .send(markBody(String(canonical._id), [String(dup._id)]))
      .expect(200);

    const res = await request(app)
      .post('/api/duplicate-audit/mark')
      .set('Cookie', cookie)
      .send(markBody(String(canonical._id), [String(dup._id)]))
      .expect(200);

    expect(res.body.updatedCount).toBe(0);
  });
});

describe('POST /api/duplicate-audit/unmark', () => {
  it('returns 401 when unauthenticated and 403 for non-admin users', async () => {
    const dup = await makeBook();
    const body = { duplicateIds: [String(dup._id)] };

    await request(app).post('/api/duplicate-audit/unmark').send(body).expect(401);

    const cookie = await getCookie(false);
    await request(app)
      .post('/api/duplicate-audit/unmark')
      .set('Cookie', cookie)
      .send(body)
      .expect(403);
  });

  it('rejects malformed bodies', async () => {
    const cookie = await getCookie();

    const badBodies = [
      {},
      { duplicateIds: 'not-an-array' },
      { duplicateIds: [] },
      { duplicateIds: [123] },
    ];
    for (const body of badBodies) {
      const res = await request(app)
        .post('/api/duplicate-audit/unmark')
        .set('Cookie', cookie)
        .send(body)
        .expect(400);
      expect(res.body.errors).toBeDefined();
    }
  });

  it('returns 404 when a book id does not exist', async () => {
    const cookie = await getCookie();
    await request(app)
      .post('/api/duplicate-audit/unmark')
      .set('Cookie', cookie)
      .send({ duplicateIds: [missingId()] })
      .expect(404);
  });

  it('restores unmarked books to every public endpoint and keeps others hidden', async () => {
    const cookie = await getCookie();
    const canonical = await makeBook({ name: 'Canonical Book' });
    const dupA = await makeBook({ name: 'Duplicate A' });
    const dupB = await makeBook({ name: 'Duplicate B' });

    await request(app)
      .post('/api/duplicate-audit/mark')
      .set('Cookie', cookie)
      .send(markBody(String(canonical._id), [String(dupA._id), String(dupB._id)]))
      .expect(200);

    const res = await request(app)
      .post('/api/duplicate-audit/unmark')
      .set('Cookie', cookie)
      .send({ duplicateIds: [String(dupA._id)] })
      .expect(200);

    expect(res.body).toEqual({
      duplicateIds: [String(dupA._id)],
      updatedCount: 1,
    });

    expect(await searchNames('Duplicate')).toEqual(['Duplicate A']);

    const detail = await request(app).get(`/api/books/getBookById/${dupA._id}`).expect(200);
    expect(detail.body.name).toBe('Duplicate A');
    await request(app).get(`/og/book/${dupA._id}`).expect(200);

    const sitemap = await request(app).get('/sitemap.xml').expect(200);
    expect(sitemap.text).toContain(`/book/${dupA._id}`);
    expect(sitemap.text).not.toContain(`/book/${dupB._id}`);

    const stillHidden = await request(app).get(`/api/books/getBookById/${dupB._id}`).expect(200);
    expect(stillHidden.body).toBeNull();
  });

  it('is idempotent when unmarking books that are not marked', async () => {
    const cookie = await getCookie();
    const dup = await makeBook();

    const res = await request(app)
      .post('/api/duplicate-audit/unmark')
      .set('Cookie', cookie)
      .send({ duplicateIds: [String(dup._id)] })
      .expect(200);

    expect(res.body.updatedCount).toBe(0);
  });
});

describe('mark/unmark data integrity', () => {
  it('changes only duplicateOf and never deletes books or ratings', async () => {
    const { accessToken, sender } = await global.signin(true);
    const cookie = `accessToken=${accessToken}`;
    const canonical = await makeBook({ name: 'Canonical' });
    const dup = await makeBook({ name: 'Duplicate' });
    await Rating.create({ bookId: canonical._id, userId: sender, rating: 5 });

    const snapshot = async () => {
      const docs = (await Books.find({}, null, { sort: { _id: 1 } }).lean()) as Array<
        Record<string, unknown>
      >;
      return {
        bookCount: await Books.countDocuments(),
        ratingCount: await Rating.countDocuments(),
        bookIds: docs.map((doc) => String(doc._id)).sort(),
      };
    };

    const before = await snapshot();

    await request(app)
      .post('/api/duplicate-audit/mark')
      .set('Cookie', cookie)
      .send(markBody(String(canonical._id), [String(dup._id)]))
      .expect(200);

    await request(app)
      .post('/api/duplicate-audit/unmark')
      .set('Cookie', cookie)
      .send({ duplicateIds: [String(dup._id)] })
      .expect(200);

    const after = await snapshot();

    expect(after.bookCount).toBe(before.bookCount);
    expect(after.ratingCount).toBe(before.ratingCount);
    expect(after.bookIds).toEqual(before.bookIds);

    const dupDoc = await Books.findById(dup._id).lean();
    expect(dupDoc?.duplicateOf).toBeNull();
  });

  it('audit still includes marked books and reports their duplicateOf', async () => {
    const cookie = await getCookie();
    const canonical = await makeBook({ name: 'Same Name', size: 100 });
    const dup = await makeBook({ name: 'Same Name', size: 100 });

    await request(app)
      .post('/api/duplicate-audit/mark')
      .set('Cookie', cookie)
      .send(markBody(String(canonical._id), [String(dup._id)]))
      .expect(200);

    const res = await request(app)
      .get('/api/duplicate-audit?type=name-size')
      .set('Cookie', cookie)
      .expect(200);

    expect(res.body.scannedBooks).toBe(2);
    expect(res.body.totalBooks).toBe(2);
    expect(res.body.summary['name-size']).toBe(1);
    expect(res.body.groups[0].count).toBe(2);

    const group = res.body.groups[0];
    const dupItem = group.books.find((b: { bookId: string }) => b.bookId === String(dup._id));
    const canonicalItem = group.books.find(
      (b: { bookId: string }) => b.bookId === String(canonical._id)
    );
    expect(dupItem.duplicateOf).toBe(String(canonical._id));
    expect(canonicalItem.duplicateOf).toBeNull();
  });
});
