import express from 'express';
import { body } from 'express-validator';
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
import { auth, isAdmin } from '../../middleware/auth';
import { validateRequest } from '../../middleware/validate-request';

const router = express.Router();

router.get('/allBooks', getAllBooksController);

router.get('/searchBooks', searchBooksController);

router.get('/search', searchBooksController);

router.post(
  '/addNewBook',
  [
    body('name')
      .trim()
      .notEmpty()
      .withMessage('Name is required')
      .bail()
      .isLength({ max: 200 })
      .withMessage('Name must be at most 200 characters'),
    body('url').not().isEmpty().withMessage('Url is required'),
    body('size').not().isEmpty().withMessage('Size is required'),
    body('author')
      .optional({ nullable: true })
      .isString()
      .withMessage('Author must be a string')
      .bail()
      .trim()
      .isLength({ max: 200 })
      .withMessage('Author must be at most 200 characters'),
    body('isbn')
      .optional({ nullable: true })
      .isString()
      .withMessage('ISBN must be a string')
      .bail()
      .trim()
      .isLength({ max: 32 })
      .withMessage('ISBN must be at most 32 characters'),
    body('publisher')
      .optional({ nullable: true })
      .isString()
      .withMessage('Publisher must be a string')
      .bail()
      .trim()
      .isLength({ max: 200 })
      .withMessage('Publisher must be at most 200 characters'),
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
