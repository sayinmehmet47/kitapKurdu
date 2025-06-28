// recentlyAddedBooks.service.ts
import { Books } from '../../models/Books';
import { apiResponse } from '../../utils/apiResponse.utils';

interface PaginationParams {
  page?: number;
  limit?: number;
}

interface PaginatedBooksResponse {
  books: any[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalBooks: number;
    hasMore: boolean;
    limit: number;
  };
}

const getRecentlyAddedBooks = async (params: PaginationParams = {}) => {
  const { page = 1, limit = 16 } = params; // Default to 16 books per load
  const skip = (page - 1) * limit;

  try {
    // Get total count for pagination metadata
    const totalBooks = await Books.countDocuments({});

    // Get paginated books
    const books = await Books.find({})
      .sort({ date: -1, createdAt: -1 }) // Sort by date first, then createdAt
      .skip(skip)
      .limit(limit)
      .exec();

    const totalPages = Math.ceil(totalBooks / limit);
    const hasMore = page < totalPages;

    const response: PaginatedBooksResponse = {
      books,
      pagination: {
        currentPage: page,
        totalPages,
        totalBooks,
        hasMore,
        limit,
      },
    };

    return apiResponse(
      200,
      'success',
      'Recently added books fetched successfully',
      response
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';
    throw new Error(`Failed to fetch recently added books: ${errorMessage}`);
  }
};

export { getRecentlyAddedBooks };
