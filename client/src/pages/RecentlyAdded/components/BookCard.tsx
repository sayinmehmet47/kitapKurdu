import React from 'react';
import { Link } from 'react-router-dom';
import { DownloadIcon, Edit, Eye, MoreHorizontal, Clock } from 'lucide-react';
import { AiOutlineDelete } from 'react-icons/ai';
import {
  Button,
  Card,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Badge,
} from '@/components/ui';
import { downloadBook } from '@/helpers/downloadBook';
import { Book } from '@/models/book.model';

interface BookCardProps {
  book: Book;
  isAdmin: boolean;
  onDelete: (id: string) => void;
}

export const BookCard: React.FC<BookCardProps> = ({
  book,
  isAdmin,
  onDelete,
}) => {
  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDelete(book._id);
  };

  const handleDownloadClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (book.url) {
      downloadBook(book.url, book.name);
    }
  };

  const getBookCoverUrl = () => {
    if (book.url?.includes('pdf')) {
      return book.url.replace('pdf', 'jpg');
    }
    return (
      book.imageLinks?.thumbnail ||
      'https://images.pexels.com/photos/8594539/pexels-photo-8594539.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'
    );
  };

  return (
    <div className="group">
      <Link to={`/book/${book._id}`} className="block">
        <Card className="overflow-hidden bg-white hover:shadow-xl transition-all duration-500 border-0 shadow-sm hover:shadow-2xl hover:-translate-y-1">
          <div className="aspect-[2/3] relative overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
            <img
              src={getBookCoverUrl()}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              alt={book.name}
              loading="lazy"
            />

            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            {/* Actions Menu */}
            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="h-10 w-10 p-0 bg-white/95 backdrop-blur-sm hover:bg-white shadow-lg border-0 rounded-full"
                    onClick={(e) => e.preventDefault()}
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-48 shadow-xl border-0"
                >
                  <DropdownMenuLabel className="font-medium">
                    Actions
                  </DropdownMenuLabel>
                  <DropdownMenuItem asChild>
                    <Link
                      to={`/book/${book._id}`}
                      className="flex items-center cursor-pointer"
                    >
                      <Eye className="h-4 w-4 mr-3" />
                      View Details
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={handleDownloadClick}
                  >
                    <DownloadIcon className="h-4 w-4 mr-3" />
                    Download
                  </DropdownMenuItem>
                  {isAdmin && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link
                          to={`/book/edit/${book._id}`}
                          className="flex items-center cursor-pointer"
                        >
                          <Edit className="h-4 w-4 mr-3" />
                          Edit Book
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="cursor-pointer text-destructive focus:text-destructive"
                        onClick={handleDeleteClick}
                      >
                        <AiOutlineDelete className="h-4 w-4 mr-3" />
                        Delete Book
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* New Badge */}
            <div className="absolute bottom-3 left-3 opacity-0 group-hover:opacity-100 transition-all duration-300">
              <Badge
                variant="secondary"
                className="text-xs bg-black/70 text-white border-0 backdrop-blur-sm"
              >
                <Clock className="h-3 w-3 mr-1" />
                New
              </Badge>
            </div>
          </div>
        </Card>
      </Link>

      {/* Book Title - Clean and minimal */}
      <div className="mt-4 px-1">
        <h3 className="font-medium text-gray-900 text-sm leading-tight line-clamp-2 group-hover:text-primary transition-colors duration-200">
          {book.name}
        </h3>
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-gray-500">Recently added</span>
          {book.language && (
            <Badge
              variant="outline"
              className="text-xs px-2 py-0.5 border-gray-200 text-gray-600"
            >
              {book.language}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
};
