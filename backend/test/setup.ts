import bcrypt from 'bcrypt';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { Books } from '../models/Books';
import { Messages } from '../models/Messages';
import { User } from '../models/User';
import * as webPushHelpers from '../web-push';

process.env.ACCESS_TOKEN_SECRET_KEY = 'access';
process.env.REFRESH_TOKEN_SECRET_KEY = 'refresh';

// Fix mongoose deprecation warning
mongoose.set('strictQuery', false);

type PlainDoc = Record<string, any>;
const users: PlainDoc[] = [];
const books: PlainDoc[] = [];
const messages: PlainDoc[] = [];

const clone = <T>(input: T): T => JSON.parse(JSON.stringify(input));

const matchesQuery = (doc: PlainDoc, query: any = {}): boolean => {
  if (!query || Object.keys(query).length === 0) return true;

  return Object.entries(query).every(([key, value]) => {
    if (key === '$or' && Array.isArray(value)) {
      return value.some((cond) => matchesQuery(doc, cond));
    }
    if (key === '$and' && Array.isArray(value)) {
      return value.every((cond) => matchesQuery(doc, cond));
    }

    const docValue = doc[key];
    if (value instanceof RegExp) {
      return value.test(String(docValue ?? ''));
    }

    if (value && typeof value === 'object' && '$regex' in (value as any)) {
      const pattern = (value as any).$regex;
      const regex =
        pattern instanceof RegExp
          ? pattern
          : new RegExp(String(pattern), (value as any).$options);
      return regex.test(String(docValue ?? ''));
    }

    if (value && typeof value === 'object' && '$in' in value) {
      return (value.$in as unknown[]).some((candidate) => {
        if (candidate instanceof RegExp) {
          return candidate.test(String(docValue ?? ''));
        }
        return String(candidate) === String(docValue);
      });
    }

    return String(docValue) === String(value);
  });
};

const resetStores = () => {
  users.length = 0;
  books.length = 0;
  messages.length = 0;
};

const setupUserModelMocks = () => {
  jest
    .spyOn(User.prototype as any, 'save')
    .mockImplementation(async function saveUser(this: any): Promise<any> {
      const existing = users.find(
        (u) => String(u._id) === String(this._id ?? '')
      );
      const _id = this._id || new mongoose.Types.ObjectId();
      const userDoc = {
        ...clone(this),
        _id,
        id: _id.toString(),
        isEmailVerified: this.isEmailVerified ?? false,
        booksUploaded: this.booksUploaded ?? [],
        messages: this.messages ?? [],
      };

      if (existing) {
        Object.assign(existing, userDoc);
        return existing;
      }

      users.push(userDoc);
      return userDoc;
    });

  jest.spyOn(User as any, 'findOne').mockImplementation(
    async (filter: any): Promise<any> =>
      users.find((u) => matchesQuery(u, filter)) || null
  );

  jest.spyOn(User as any, 'updateOne').mockImplementation(
    async (filter: any, update: any): Promise<any> => {
      const target = users.find((u) => matchesQuery(u, filter));
      if (target) {
        const updates = update?.$set ?? update ?? {};
        Object.assign(target, updates);
        if (update?.$push) {
          Object.entries(update.$push).forEach(([key, val]) => {
            const arr = (target as any)[key] || [];
            arr.push(val);
            (target as any)[key] = arr;
          });
        }
        return { acknowledged: true, modifiedCount: 1 };
      }
      return { acknowledged: true, modifiedCount: 0 };
    }
  );

  jest.spyOn(User as any, 'findById').mockImplementation(
    async (id: any): Promise<any> =>
      users.find((u) => String(u._id) === String(id)) || null
  );

  jest
    .spyOn(User as any, 'findByIdAndUpdate')
    .mockImplementation(async (id: any, update: any): Promise<any> => {
      const target = users.find((u) => String(u._id) === String(id));
      if (target) {
        Object.assign(target, update?.$set ?? update ?? {});
        return target;
      }
      return null;
    });
};

const applySort = (data: PlainDoc[], sortObj: Record<string, 1 | -1>) => {
  const [[field, direction]] = Object.entries(sortObj);
  return [...data].sort((a, b) => {
    const aVal = a[field];
    const bVal = b[field];
    if (aVal === bVal) return 0;
    if (aVal === undefined) return 1;
    if (bVal === undefined) return -1;
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return direction === 1
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal);
    }
    return direction === 1 ? (aVal > bVal ? 1 : -1) : aVal < bVal ? 1 : -1;
  });
};

const createBooksQuery = (initial: PlainDoc[]) => {
  let data = [...initial];

  return {
    populate() {
      data = data.map((doc) => {
        const uploader = users.find(
          (u) => String(u._id) === String(doc.uploader)
        );
        return uploader
          ? { ...doc, uploader: { username: uploader.username, email: uploader.email, _id: uploader._id } }
          : doc;
      });
      return this;
    },
    sort(sortObj: Record<string, 1 | -1>) {
      data = applySort(data, sortObj);
      return this;
    },
    skip(count: number) {
      data = data.slice(count);
      return this;
    },
    limit(count: number) {
      data = data.slice(0, count);
      return this;
    },
    lean() {
      return Promise.resolve(clone(data));
    },
  };
};

const setupBooksModelMocks = () => {
  jest
    .spyOn(Books.prototype as any, 'save')
    .mockImplementation(async function saveBook(this: any): Promise<any> {
      const existing = books.find(
        (b) => String(b._id) === String(this._id ?? '')
      );
      const _id = this._id || new mongoose.Types.ObjectId();
      const doc = {
        ...clone(this),
        _id,
        id: _id.toString(),
        date: this.date ?? new Date(),
      };

      if (existing) {
        Object.assign(existing, doc);
        return existing;
      }

      books.push(doc);
      return doc;
    });

  jest.spyOn(Books as any, 'countDocuments').mockImplementation(
    async (filter: any): Promise<any> =>
      books.filter((b) => matchesQuery(b, filter)).length
  );

  jest.spyOn(Books as any, 'find').mockImplementation((filter: any = {}) => {
    const filtered = books.filter((b) => matchesQuery(b, filter));
    return createBooksQuery(filtered) as any;
  });

  jest
    .spyOn(Books as any, 'aggregate')
    .mockImplementation(async () => clone(books));

  jest.spyOn(Books as any, 'populate').mockImplementation(async (docs: any) => {
    const docsArray = Array.isArray(docs) ? docs : [docs];
    return docsArray.map((doc) => {
      const uploader = users.find((u) => String(u._id) === String(doc.uploader));
      return uploader
        ? {
            ...doc,
            uploader: {
              username: uploader.username,
              email: uploader.email,
              _id: uploader._id,
            },
          }
        : doc;
    });
  });

  jest.spyOn(Books as any, 'findById').mockImplementation(
    async (id: any): Promise<any> =>
      books.find((b) => String(b._id) === String(id)) || null
  );

  jest
    .spyOn(Books as any, 'findByIdAndRemove')
    .mockImplementation(async (id: any): Promise<any> => {
      const index = books.findIndex((b) => String(b._id) === String(id));
      if (index === -1) return null;
      const [removed] = books.splice(index, 1);
      return removed;
    });

  jest
    .spyOn(Books as any, 'findByIdAndUpdate')
    .mockImplementation(async (id: any, update: any): Promise<any> => {
      const target = books.find((b) => String(b._id) === String(id));
      if (target) {
        Object.assign(target, update?.$set ?? update ?? {});
        return target;
      }
      return null;
    });
};

const setupMessagesModelMocks = () => {
  jest
    .spyOn(Messages.prototype as any, 'save')
    .mockImplementation(async function saveMessage(this: any): Promise<any> {
      const _id = this._id || new mongoose.Types.ObjectId();
      const doc = { ...clone(this), _id, id: _id.toString(), date: this.date ?? new Date() };
      messages.push(doc);
      return doc;
    });

  jest.spyOn(Messages as any, 'find').mockImplementation((filter: any = {}) => {
    const filtered = messages.filter((m) => matchesQuery(m, filter));
    return {
      populate(path: string) {
        if (path === 'sender') {
          return Promise.resolve(
            filtered.map((msg) => {
              const sender = users.find(
                (u) => String(u._id) === String(msg.sender)
              );
              return sender ? { ...msg, sender } : msg;
            })
          );
        }
        return Promise.resolve(clone(filtered));
      },
    } as any;
  });

  jest
    .spyOn(Messages as any, 'findByIdAndRemove')
    .mockImplementation(async (id: any): Promise<any> => {
      const index = messages.findIndex((m) => String(m._id) === String(id));
      if (index === -1) return null;
      const [removed] = messages.splice(index, 1);
      return removed;
    });
};

beforeAll(async () => {
  resetStores();
  jest.spyOn(mongoose, 'connect').mockResolvedValue(mongoose as any);
  jest.spyOn(mongoose, 'disconnect').mockResolvedValue();

  jest.spyOn(axios as any, 'get').mockResolvedValue({ data: { items: [] } } as any);
  jest
    .spyOn(webPushHelpers, 'getUserSubscriptionsExcludingUser')
    .mockResolvedValue([]);
  jest
    .spyOn(webPushHelpers, 'removeSubscription')
    .mockResolvedValue(undefined);

  setupUserModelMocks();
  setupBooksModelMocks();
  setupMessagesModelMocks();
});

beforeEach(async () => {
  jest.clearAllMocks();
  (axios.get as any).mockResolvedValue({ data: { items: [] } } as any);
  (webPushHelpers.getUserSubscriptionsExcludingUser as any).mockResolvedValue(
    []
  );
  (webPushHelpers.removeSubscription as any).mockResolvedValue(undefined);
  resetStores();
});

afterAll(async () => {
  jest.restoreAllMocks();
});

declare global {
  var signin: (isAdmin?: boolean) => Promise<any>;
}

global.signin = async (isAdmin: boolean = false) => {
  const salt = await bcrypt.genSalt(10);
  if (!salt) throw new Error('Something went wrong with bcrypt');
  const hash = await bcrypt.hash('test', salt);
  if (!hash) throw new Error('Something went wrong hashing the password');

  const newUser = new User({
    username: 'test',
    email: 'example@gmail.com',
    password: hash,
    isAdmin,
  });

  const savedUser = await newUser.save();
  if (!savedUser) throw new Error('Something went wrong saving the user');

  const payload = {
    _id: savedUser._id,
    isAdmin: savedUser.isAdmin,
  };

  const accessToken = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET_KEY!, {
    expiresIn: '85m',
  });
  const refreshToken = jwt.sign(
    payload,
    process.env.REFRESH_TOKEN_SECRET_KEY!,
    { expiresIn: '12d' }
  );

  return { accessToken, refreshToken, sender: savedUser._id };
};
