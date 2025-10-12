'use client';

import React, { useEffect, useState } from 'react';
import { Card, Loading, Button } from '@/components/common';
import { quizService } from '@/lib/quiz-service';
import toast from 'react-hot-toast';
import {
  BookmarkIcon,
  TrashIcon,
  FolderOpenIcon,
} from '@heroicons/react/24/outline';

export default function BookmarksPage() {
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    fetchBookmarks();
  }, []);

  const handleDeleteBookmark = async (bookmarkId: string) => {
    const confirmed = window.confirm('Are you sure you want to remove this bookmark?');
    if (!confirmed) return;

    try {
      await quizService.deleteBookmark(bookmarkId);
      setBookmarks(bookmarks.filter(b => b.id !== bookmarkId));
      toast.success('Bookmark removed');
    } catch (error) {
      toast.error('Failed to remove bookmark');
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    await fetchBookmarks();
    toast.success('Bookmarks refreshed!');
  };

  if (loading) {
    return <Loading text="Loading bookmarks..." />;
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Bookmarks</h1>
          <p className="text-gray-600 mt-2">Your saved questions for quick review</p>
        </div>
        <button
          onClick={handleRefresh}
          className="px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary-dark transition"
        >
          Refresh
        </button>
      </div>

      {bookmarks.length > 0 ? (
        <div className="space-y-4">
          {bookmarks.map((bookmark) => (
            <Card key={bookmark.id}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <BookmarkIcon className="w-5 h-5 text-warning" />
                    <span className="text-sm font-medium text-gray-600">
                      Bookmarked {new Date(bookmark.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  {bookmark.question && (
                    <>
                      <p className="text-gray-900 font-medium mb-2">
                        {bookmark.question.question_text}
                      </p>
                      {bookmark.question.difficulty && (
                        <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                          bookmark.question.difficulty === 'easy'
                            ? 'bg-easy/10 text-easy border border-easy'
                            : bookmark.question.difficulty === 'medium'
                            ? 'bg-medium/10 text-medium border border-medium'
                            : 'bg-hard/10 text-hard border border-hard'
                        }`}>
                          {bookmark.question.difficulty.toUpperCase()}
                        </span>
                      )}
                    </>
                  )}
                </div>
                <button
                  onClick={() => handleDeleteBookmark(bookmark.id)}
                  className="p-2 rounded-lg hover:bg-red-50 text-red-600 transition"
                  title="Remove bookmark"
                >
                  <TrashIcon className="w-5 h-5" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="text-center py-12">
          <FolderOpenIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Bookmarks Yet</h3>
          <p className="text-gray-600 mb-6">
            Start bookmarking questions during quizzes to save them for later review.
          </p>
          <Button onClick={() => window.location.href = '/dashboard/quiz'} variant="primary">
            Take a Quiz
          </Button>
        </Card>
      )}
    </div>
  );
}
