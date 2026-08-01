import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { app } from '../../../app';
import { Books } from '../../../models/Books';
import { Rating } from '../../../models/Rating';
import { User } from '../../../models/User';

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

// global.signin() always creates the same username/email, so a test that needs
// both an admin and a regular user in the same database must mint its own
// unique users instead.
let userSeq = 0;
const makeCookie = async (isAdmin = false) => {
  userSeq += 1;
  const hash = await bcrypt.hash('test', 10);
  const user = await User.create({
    username: `test-${userSeq}`,
    email: `example${userSeq}@gmail.com`,
    password: hash,
    isAdmin,
  });
  const accessToken = jwt.sign(
    { _id: user._id, isAdmin: user.isAdmin },
    process.env.ACCESS_TOKEN_SECRET_KEY!,
    { expiresIn: '85m' }
  );
  return `accessToken=${accessToken}`;
};

describe('ratings and hidden duplicates', () => {
  it('refuses summary, reviews and rate writes for a hidden duplicate until it is unmarked', async () => {
    const canonical = await makeBook({ name: 'Canonical Book' });
    const dup = await makeBook({ name: 'Hidden Duplicate' });
    const cookie = await makeCookie(true);
    const authCookie = await makeCookie();

    await request(app)
      .post('/api/duplicate-audit/mark')
      .set('Cookie', cookie)
      .send(markBody(String(canonical._id), [String(dup._id)]))
      .expect(200);

    // Public read routes return the existing not-found pattern for the hidden book.
    await request(app).get(`/api/ratings/summary/${dup._id}`).expect(404);
    await request(app).get(`/api/ratings/reviews/${dup._id}`).expect(404);

    // The authenticated rate write is refused too, and nothing is persisted.
    await request(app)
      .post('/api/ratings')
      .set('Cookie', authCookie)
      .send({ bookId: String(dup._id), rating: 5 })
      .expect(404);
    expect(await Rating.countDocuments({ bookId: dup._id })).toBe(0);

    // Restoring the book brings summary, reviews and rate writes back.
    await request(app)
      .post('/api/duplicate-audit/unmark')
      .set('Cookie', cookie)
      .send({ duplicateIds: [String(dup._id)] })
      .expect(200);

    await request(app).get(`/api/ratings/summary/${dup._id}`).expect(200);
    await request(app).get(`/api/ratings/reviews/${dup._id}`).expect(200);

    const rate = await request(app)
      .post('/api/ratings')
      .set('Cookie', authCookie)
      .send({ bookId: String(dup._id), rating: 5 })
      .expect(200);
    expect(String(rate.body.data.bookId)).toBe(String(dup._id));

    const summary = await request(app).get(`/api/ratings/summary/${dup._id}`).expect(200);
    expect(summary.body.data.count).toBe(1);
    expect(summary.body.data.avgRating).toBe(5);
  });

  it('keeps the canonical book fully ratable while a duplicate is hidden', async () => {
    const canonical = await makeBook({ name: 'Canonical Book' });
    const dup = await makeBook({ name: 'Hidden Duplicate' });
    const cookie = await makeCookie(true);
    const authCookie = await makeCookie();

    await request(app)
      .post('/api/duplicate-audit/mark')
      .set('Cookie', cookie)
      .send(markBody(String(canonical._id), [String(dup._id)]))
      .expect(200);

    await request(app).get(`/api/ratings/summary/${canonical._id}`).expect(200);
    await request(app).get(`/api/ratings/reviews/${canonical._id}`).expect(200);

    const rate = await request(app)
      .post('/api/ratings')
      .set('Cookie', authCookie)
      .send({ bookId: String(canonical._id), rating: 4 })
      .expect(200);
    expect(String(rate.body.data.bookId)).toBe(String(canonical._id));
  });

  it('returns 404 for ratings of a book id that does not exist', async () => {
    const missing = String((await makeBook())._id);
    await Books.findByIdAndRemove(missing);

    await request(app).get(`/api/ratings/summary/${missing}`).expect(404);
    await request(app).get(`/api/ratings/reviews/${missing}`).expect(404);

    const authCookie = await makeCookie();
    await request(app)
      .post('/api/ratings')
      .set('Cookie', authCookie)
      .send({ bookId: missing, rating: 5 })
      .expect(404);
  });
});
