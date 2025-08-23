import { useSearchParams } from 'react-router-dom';
import { Search, Filter, X, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import {
  Button,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Input,
  Badge,
} from '@/components';

interface BookFiltersProps {
  onSearch?: (query: string) => void;
}

const BookFilters = ({ onSearch }: BookFiltersProps) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState(
    searchParams.get('search') || ''
  );

  const AVAILABLE_CATEGORIES = ['Science', 'Technology', 'History', 'Fiction'];
  const activeCategories = (searchParams.get('category') || '')
    .split(',')
    .filter(Boolean);
  const activeFiltersCount = [
    searchParams.get('language') && searchParams.get('language') !== 'all',
    searchParams.get('fileType') && searchParams.get('fileType') !== 'all',
    searchParams.get('category'),
    searchParams.get('sort') && searchParams.get('sort') !== 'dateDesc',
    searchParams.get('search'),
  ].filter(Boolean).length;

  const handleLanguageChange = (value: string) => {
    if (value === 'all') {
      searchParams.delete('language');
    } else {
      searchParams.set('language', value);
    }
    setSearchParams(new URLSearchParams(searchParams));
  };

  const handleFileTypeChange = (value: string) => {
    if (!value || value === 'all') {
      searchParams.delete('fileType');
    } else {
      searchParams.set('fileType', value);
    }
    setSearchParams(new URLSearchParams(searchParams));
  };

  const handleSortChange = (value: string) => {
    searchParams.set('sort', value);
    setSearchParams(new URLSearchParams(searchParams));
  };

  const handleCategoryToggle = (category: string) => {
    const current = searchParams.get('category') || '';
    const set = new Set(current.split(',').filter(Boolean));
    if (set.has(category)) {
      set.delete(category);
    } else {
      set.add(category);
    }
    const next = Array.from(set).join(',');
    if (next) {
      searchParams.set('category', next);
    } else {
      searchParams.delete('category');
    }
    setSearchParams(new URLSearchParams(searchParams));
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    searchParams.set('page', '1');
    if (searchQuery.trim()) {
      searchParams.set('search', searchQuery.trim());
    } else {
      searchParams.delete('search');
    }
    setSearchParams(new URLSearchParams(searchParams));
    onSearch?.(searchQuery.trim());
  };

  const clearAllFilters = () => {
    const newParams = new URLSearchParams();
    const page = searchParams.get('page');
    if (page) newParams.set('page', page);
    setSearchParams(newParams);
    setSearchQuery('');
  };

  const removeCategory = (category: string) => {
    const current = searchParams.get('category') || '';
    const filtered = current
      .split(',')
      .filter((cat) => cat !== category)
      .join(',');
    if (filtered) {
      searchParams.set('category', filtered);
    } else {
      searchParams.delete('category');
    }
    setSearchParams(new URLSearchParams(searchParams));
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl p-6 mb-6 mx-4 shadow-sm">
      {/* Search Bar */}
      <form onSubmit={handleSearchSubmit} className="mb-6">
        <div className="relative flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              type="text"
              placeholder="Search books by title, author, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10 py-3 w-full border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {searchQuery && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  searchParams.delete('search');
                  searchParams.set('page', '1');
                  setSearchParams(new URLSearchParams(searchParams));
                }}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          <Button
            type="submit"
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700"
          >
            Search
          </Button>
        </div>
      </form>

      {/* Filter Toggle & Active Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2"
        >
          <Filter className="h-4 w-4" />
          Filters
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="ml-1 px-2 py-0 text-xs">
              {activeFiltersCount}
            </Badge>
          )}
          <ChevronDown
            className={`h-4 w-4 transition-transform ${
              showFilters ? 'rotate-180' : ''
            }`}
          />
        </Button>

        {activeFiltersCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            Clear all
          </Button>
        )}
      </div>

      {/* Active Category Tags */}
      {activeCategories.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {activeCategories.map((category) => (
            <Badge
              key={category}
              variant="secondary"
              className="flex items-center gap-1 px-3 py-1"
            >
              {category}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeCategory(category)}
                className="h-4 w-4 p-0 ml-1 hover:bg-transparent"
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}

      {/* Filters Panel */}
      {showFilters && (
        <div className="border-t pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Language Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Language
              </label>
              <Select
                value={searchParams.get('language') || 'all'}
                onValueChange={handleLanguageChange}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="all">All Languages</SelectItem>
                    <SelectItem value="english">🏴󠁧󠁢󠁥󠁮󠁧󠁿 English</SelectItem>
                    <SelectItem value="turkish">🇹🇷 Turkish</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            {/* File Type Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                File Type
              </label>
              <Select
                value={searchParams.get('fileType') || 'all'}
                onValueChange={handleFileTypeChange}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="pdf">📄 PDF</SelectItem>
                    <SelectItem value="epub">📖 EPUB</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            {/* Sort Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Sort By
              </label>
              <Select
                value={searchParams.get('sort') || 'dateDesc'}
                onValueChange={handleSortChange}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="dateDesc">🆕 Newest First</SelectItem>
                    <SelectItem value="dateAsc">🕒 Oldest First</SelectItem>
                    <SelectItem value="nameAsc">🔤 A → Z</SelectItem>
                    <SelectItem value="nameDesc">🔤 Z → A</SelectItem>
                    <SelectItem value="ratingDesc">⭐ Highest Rated</SelectItem>
                    <SelectItem value="ratingAsc">⭐ Lowest Rated</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Category Filter */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-700">
              Categories
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {AVAILABLE_CATEGORIES.map((category) => {
                const isActive = activeCategories.includes(category);
                return (
                  <Button
                    key={category}
                    variant={isActive ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleCategoryToggle(category)}
                    className={`justify-center transition-all duration-200 ${
                      isActive
                        ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md'
                        : 'hover:bg-gray-50 hover:border-gray-300'
                    }`}
                  >
                    {category}
                  </Button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookFilters;
