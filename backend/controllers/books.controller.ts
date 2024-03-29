import { NextFunction, Request, Response } from 'express';
import {
  addNewBook,
  deleteBook,
  getAllBooksService,
  getBookById,
  getRecentlyAddedBooks,
  searchBooksService,
  updateBook,
  updateCategories,
} from '../services/book';

export const getAllBooksController = async (req: Request, res: Response) => {
  try {
    const books = await getAllBooksService(req);
    res.json(books);
  } catch (err) {
    if (err instanceof Error) {
      res.status(500).json({ error: err.message });
    } else {
      res.status(500).json({ error: 'An unknown error occurred' });
    }
  }
};

export const searchBooksController = async (req: Request, res: Response) => {
  try {
    const books = await searchBooksService(req);
    res.json(books);
  } catch (err) {
    if (err instanceof Error) {
      res.status(500).json({ error: err.message });
    } else {
      res.status(500).json({ error: 'An unknown error occurred' });
    }
  }
};
export const addBookController = async (req: Request, res: Response) => {
  try {
    const books = await addNewBook(req);

    res.status(201).json(books);
  } catch (err) {
    if (err instanceof Error) {
      res.status(500).json({ error: err.message });
    } else {
      res.status(500).json({ error: 'An unknown error occurred' });
    }
  }
};

export const recentlyAddedBooksController = async (
  req: Request,
  res: Response
) => {
  try {
    const books = await getRecentlyAddedBooks();
    res.json(books);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: 'An unknown error occurred' });
  }
};

export const deleteBookController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const book = await deleteBook(req);
    res.status(201).json(book);
  } catch (err) {
    next(err);
  }
};

export const getBookByIdController = async (req: Request, res: Response) => {
  try {
    const book = await getBookById(req);
    res.status(201).json(book);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: 'An unknown error occurred' });
  }
};

export const updateCategoriesController = async (
  req: Request,
  res: Response
) => {
  try {
    await updateCategories();
    res.status(200).send('Categories updated');
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: 'An unknown error occurred' });
  }
};

export const updateBookController = async (req: Request, res: Response) => {
  try {
    const book = await updateBook(req);
    res.status(201).json(book);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: 'An unknown error occurred' });
  }
};
