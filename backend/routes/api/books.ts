import express from 'express';
import { auth, isAdmin } from '../../middleware/auth';

import { body } from 'express-validator';
import { validateRequest } from '../../middleware/validate-request';

import {
  addBookController,
  deleteBookController,
  getAllBooksController,
  getBookByIdController,
  recentlyAddedBooksController,
  searchBooksController,
  updateBookController,
  updateCategoriesController,
} from '../../controllers/books.controller';

const router = express.Router();

router.get('/allBooks', getAllBooksController);

router.get('/searchBooks', searchBooksController);

router.post(
  '/addNewBook',
  [
    body('name').not().isEmpty().withMessage('Name is required'),
    body('url').not().isEmpty().withMessage('Url is required'),
    body('size').not().isEmpty().withMessage('Size is required'),
    body('uploader').not().isEmpty().withMessage('Uploader is required'),
  ],
  validateRequest,
  auth,
  addBookController
);

router.get('/recently-added', recentlyAddedBooksController);

router.post('/deleteBook/:id', validateRequest, isAdmin, deleteBookController);

router.post('/updateBook/:id', isAdmin, updateBookController);

router.get('/getBookById/:id', getBookByIdController);

router.post('/updateCategories', isAdmin, updateCategoriesController);

export { router as booksRouter };
