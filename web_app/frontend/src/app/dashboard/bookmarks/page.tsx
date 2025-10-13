'use client';

import React, { useEffect, useState } from 'react';
import { Card, Loading, Button, Input } from '@/components/common';
import { quizService } from '@/lib/quiz-service';
import toast from 'react-hot-toast';
import {
  BookmarkIcon,
  TrashIcon,
  FolderOpenIcon,
  MagnifyingGlassIcon,
  Squares2X2Icon,
  ListBulletIcon,
  FunnelIcon,
  PlayIcon,
} from '@heroicons/react/24/outline';
import { renderLatex } from '@/lib/latex-renderer';
import { renderCodeBlocks } from '@/components/quiz/CodeBlock';
import Link from 'next/link';

type ViewMode = 'grid' | 'list';
type DifficultyFilter = 'all' | 'easy' | 'medium' | 'hard';

export default function BookmarksPage() {
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [filteredBookmarks, setFilteredBookmarks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyFilter>('all');
  const [selectedBookmarks, setSelectedBookmarks] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchBookmarks();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [bookmarks, searchQuery, difficultyFilter]);

  const fetchBookmarks = async () => {
    try {
      const bookmarkList = await quizService.getBookmarks();
      setBookmarks(bookmarkList);
    } catch (error) {
      console.error('Error fetching bookmarks:', error);
      toast.error('Failed to load bookmarks');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...bookmarks];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter((bookmark) =>
        bookmark.question?.question_text?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply difficulty filter
    if (difficultyFilter !== 'all') {
      filtered = filtered.filter(
        (bookmark) => bookmark.question?.difficulty === difficultyFilter
      );
    }

    setFilteredBookmarks(filtered);
  };

  const handleDeleteBookmark = async (bookmarkId: string) => {
    const confirmed = window.confirm('Are you sure you want to remove this bookmark?');
    if (!confirmed) return;

    try {
      await quizService.deleteBookmark(bookmarkId);
      setBookmarks(bookmarks.filter((b) => b.id !== bookmarkId));
      toast.success('Bookmark removed');
    } catch (error) {
      toast.error('Failed to remove bookmark');
    }
  };

  const handleBatchDelete = async () => {
    if (selectedBookmarks.size === 0) {
      toast.error('No bookmarks selected');
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to remove ${selectedBookmarks.size} bookmark(s)?`
    );
    if (!confirmed) return;

    try {
      // Delete bookmarks using batch operation
      await quizService.batchBookmarkOperation(
        Array.from(selectedBookmarks),
        'remove'
      );
      
      setBookmarks(bookmarks.filter((b) => !selectedBookmarks.has(b.id)));
      setSelectedBookmarks(new Set());
      toast.success(`Removed ${selectedBookmarks.size} bookmark(s)`);
    } catch (error) {
      toast.error('Failed to remove bookmarks');
    }
  };

  const toggleBookmarkSelection = (bookmarkId: string) => {
    const newSelected = new Set(selectedBookmarks);
    if (newSelected.has(bookmarkId)) {
      newSelected.delete(bookmarkId);
    } else {
      newSelected.add(bookmarkId);
    }
    setSelectedBookmarks(newSelected);
  };

  const selectAllBookmarks = () => {
    if (selectedBookmarks.size === filteredBookmarks.length) {
      setSelectedBookmarks(new Set());
    } else {
      setSelectedBookmarks(new Set(filteredBookmarks.map((b) => b.id)));
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    await fetchBookmarks();
    toast.success('Bookmarks refreshed!');
  };

  const renderFormattedText = (text: string) => {
    if (text.includes('```')) {
      return renderCodeBlocks(text);
    }
    if (text.includes('$')) {
      return renderLatex(text);
    }
    return text;
  };

  if (loading) {
    return <Loading text="Loading bookmarks..." />;
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Bookmarks</h1>
          <p className="text-gray-600 mt-2">
            {filteredBookmarks.length} question{filteredBookmarks.length !== 1 ? 's' : ''} saved
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            className="px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary-dark transition"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <Card className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search bookmarks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition ${
                viewMode === 'grid'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              title="Grid View"
            >
              <Squares2X2Icon className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition ${
                viewMode === 'list'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              title="List View"
            >
              <ListBulletIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Filters Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
          >
            <FunnelIcon className="w-5 h-5" />
            Filters
          </button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setDifficultyFilter('all')}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  difficultyFilter === 'all'
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setDifficultyFilter('easy')}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  difficultyFilter === 'easy'
                    ? 'bg-easy text-white'
                    : 'bg-easy/10 text-easy hover:bg-easy/20'
                }`}
              >
                Easy
              </button>
              <button
                onClick={() => setDifficultyFilter('medium')}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  difficultyFilter === 'medium'
                    ? 'bg-medium text-white'
                    : 'bg-medium/10 text-medium hover:bg-medium/20'
                }`}
              >
                Medium
              </button>
              <button
                onClick={() => setDifficultyFilter('hard')}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  difficultyFilter === 'hard'
                    ? 'bg-hard text-white'
                    : 'bg-hard/10 text-hard hover:bg-hard/20'
                }`}
              >
                Hard
              </button>
            </div>
          </div>
        )}
      </Card>

      {/* Batch Actions */}
      {selectedBookmarks.size > 0 && (
        <Card className="mb-6 bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="font-semibold text-gray-900">
                {selectedBookmarks.size} bookmark(s) selected
              </span>
              <button
                onClick={selectAllBookmarks}
                className="text-sm text-primary hover:underline"
              >
                {selectedBookmarks.size === filteredBookmarks.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={handleBatchDelete}
                variant="outline"
                size="small"
              >
                <TrashIcon className="w-4 h-4 mr-2" />
                Delete Selected
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Bookmarks Display */}
      {filteredBookmarks.length > 0 ? (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-4' : 'space-y-4'}>
          {filteredBookmarks.map((bookmark) => (
            <Card key={bookmark.id} className="relative">
              {/* Selection Checkbox */}
              <div className="absolute top-4 left-4 z-10">
                <input
                  type="checkbox"
                  checked={selectedBookmarks.has(bookmark.id)}
                  onChange={() => toggleBookmarkSelection(bookmark.id)}
                  className="w-5 h-5 text-primary rounded border-gray-300 focus:ring-primary cursor-pointer"
                />
              </div>

              <div className="pl-10">
                {/* Bookmark Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <BookmarkIcon className="w-5 h-5 text-warning" />
                    <span className="text-sm text-gray-600">
                      {new Date(bookmark.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDeleteBookmark(bookmark.id)}
                    className="p-2 rounded-lg hover:bg-red-50 text-red-600 transition"
                    title="Remove bookmark"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>

                {/* Question Content */}
                {bookmark.question ? (
                  <div>
                    <div className="text-gray-900 font-medium mb-3 line-clamp-3">
                      {renderFormattedText(bookmark.question.question_text)}
                    </div>

                    {/* Difficulty Badge */}
                    {bookmark.question.difficulty && (
                      <span
                        className={`inline-block px-2 py-1 rounded text-xs font-medium mb-3 ${
                          bookmark.question.difficulty === 'easy'
                            ? 'bg-easy/10 text-easy border border-easy'
                            : bookmark.question.difficulty === 'medium'
                            ? 'bg-medium/10 text-medium border border-medium'
                            : 'bg-hard/10 text-hard border border-hard'
                        }`}
                      >
                        {bookmark.question.difficulty.toUpperCase()}
                      </span>
                    )}

                    {/* Options Preview */}
                    {viewMode === 'list' && bookmark.question.options && (
                      <div className="space-y-2 mb-3">
                        {bookmark.question.options.map((option: string, index: number) => (
                          <div
                            key={index}
                            className={`p-2 rounded-lg text-sm ${
                              index === bookmark.question.correct_answer
                                ? 'bg-success/10 border border-success text-success'
                                : 'bg-gray-50'
                            }`}
                          >
                            <span className="font-semibold mr-2">
                              {String.fromCharCode(65 + index)}.
                            </span>
                            {option}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Explanation Preview */}
                    {bookmark.question.explanation && viewMode === 'list' && (
                      <div className="p-3 bg-blue-50 border-l-4 border-primary rounded-r-lg text-sm">
                        <div className="font-semibold text-primary mb-1">Explanation:</div>
                        <div className="text-gray-700 line-clamp-2">
                          {bookmark.question.explanation}
                        </div>
                      </div>
                    )}

                    {/* Tags */}
                    {bookmark.question.tags && bookmark.question.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {bookmark.question.tags.slice(0, 3).map((tag: string, index: number) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-blue-50 text-blue-600 text-xs rounded"
                          >
                            {tag}
                          </span>
                        ))}
                        {bookmark.question.tags.length > 3 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                            +{bookmark.question.tags.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-gray-500">
                    <FolderOpenIcon className="w-5 h-5" />
                    <span className="text-sm">Question details unavailable</span>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="text-center py-12">
          <FolderOpenIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {searchQuery || difficultyFilter !== 'all'
              ? 'No bookmarks found'
              : 'No Bookmarks Yet'}
          </h3>
          <p className="text-gray-600 mb-6">
            {searchQuery || difficultyFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'Start bookmarking questions during quizzes to save them for later review.'}
          </p>
          <Link href="/dashboard/quiz">
            <Button variant="primary">
              <PlayIcon className="w-5 h-5 mr-2" />
              Take a Quiz
            </Button>
          </Link>
        </Card>
      )}
    </div>
  );
}
