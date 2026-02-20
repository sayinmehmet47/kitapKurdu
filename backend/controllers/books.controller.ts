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
import { logger } from '../logger';

export const getAllBooksController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const books = await getAllBooksService(req);
    res.json(books);
  } catch (err) {
    next(err);
  }
};

export const searchBooksController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const books = await searchBooksService(req);
    res.json(books);
  } catch (err) {
    next(err);
  }
};

export const addBookController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const books = await addNewBook(req);

    res.status(201).json(books);
  } catch (err) {
    next(err);
  }
};

export const recentlyAddedBooksController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 16;

    const result = await getRecentlyAddedBooks({ page, limit });
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const deleteBookController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const book = await deleteBook(req);
    res.status(200).json(book);
  } catch (err) {
    next(err);
  }
};

export const getBookByIdController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const book = await getBookById(req);
    res.status(200).json(book);
  } catch (err) {
    next(err);
  }
};

export const updateCategoriesController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    await updateCategories();
    res.status(200).send('Categories updated');
  } catch (err) {
    next(err);
  }
};

export const updateBookController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const book = await updateBook(req);
    res.status(200).json(book);
  } catch (err) {
    next(err);
  }
};
