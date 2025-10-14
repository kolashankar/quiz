'use client';

import React, { useState, useEffect } from 'react';
import { Card, Loading } from '@/components/common';
import { quizService } from '@/lib/quiz-service';
import toast from 'react-hot-toast';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  BookOpenIcon,
  AcademicCapIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';

type SearchLevel = 'all' | 'exam' | 'subject' | 'chapter' | 'topic' | 'question';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [level, setLevel] = useState<SearchLevel>('all');
  const [results, setResults] = useState<any>({
    exams: [],
    subjects: [],
    chapters: [],
    topics: [],
    questions: [],
  });
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  const saveRecentSearch = (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    
    const updated = [searchQuery, ...recentSearches.filter((s) => s !== searchQuery)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  };

  const handleSearch = async () => {
    if (!query.trim()) {
      toast.error('Please enter a search query');
      return;
    }

    setLoading(true);
    try {
      const data = await quizService.search(query, {
        level: level === 'all' ? undefined : level,
      });
      setResults(data);
      saveRecentSearch(query);
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('recentSearches');
    toast.success('Recent searches cleared');
  };

  const totalResults =
    results.exams.length +
    results.subjects.length +
    results.chapters.length +
    results.topics.length +
    results.questions.length;

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-6">Search</h1>

      {/* Search Bar */}
      <Card className="mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 dark:text-gray-500 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search exams, subjects, topics, or questions..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-lg"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-3 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 dark:text-gray-600 hover:bg-gray-200 dark:bg-gray-700 transition flex items-center gap-2"
            >
              <FunnelIcon className="w-5 h-5" />
              <span className="hidden md:inline">Filters</span>
            </button>
            <button
              onClick={handleSearch}
              disabled={loading}
              className="px-6 py-3 rounded-lg bg-primary text-white hover:bg-primary-dark transition disabled:opacity-50"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setLevel('all')}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  level === 'all'
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setLevel('exam')}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  level === 'exam'
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Exams
              </button>
              <button
                onClick={() => setLevel('subject')}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  level === 'subject'
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Subjects
              </button>
              <button
                onClick={() => setLevel('chapter')}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  level === 'chapter'
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Chapters
              </button>
              <button
                onClick={() => setLevel('topic')}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  level === 'topic'
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Topics
              </button>
              <button
                onClick={() => setLevel('question')}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  level === 'question'
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Questions
              </button>
            </div>
          </div>
        )}
      </Card>

      {/* Recent Searches */}
      {recentSearches.length > 0 && !query && (
        <Card className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Recent Searches</h3>
            <button
              onClick={clearRecentSearches}
              className="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:text-gray-100"
            >
              Clear
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {recentSearches.map((search, index) => (
              <button
                key={index}
                onClick={() => {
                  setQuery(search);
                  setTimeout(handleSearch, 100);
                }}
                className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 dark:text-gray-600 rounded-lg hover:bg-gray-200 dark:bg-gray-700 transition text-sm"
              >
                {search}
              </button>
            ))}
          </div>
        </Card>
      )}

      {/* Loading State */}
      {loading && <Loading text="Searching..." />}

      {/* Results */}
      {!loading && query && totalResults > 0 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              Found {totalResults} result{totalResults !== 1 ? 's' : ''}
            </h2>
          </div>

          {/* Exams */}
          {results.exams.length > 0 && (
            <Card>
              <div className="flex items-center gap-2 mb-4">
                <AcademicCapIcon className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  Exams ({results.exams.length})
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {results.exams.map((exam: any) => (
                  <Link
                    key={exam.id}
                    href={`/dashboard/quiz/hierarchy?exam_id=${exam.id}`}
                    className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:bg-gray-800 transition"
                  >
                    <div className="font-semibold text-gray-900 dark:text-gray-100">{exam.name}</div>
                    {exam.description && (
                      <div className="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-500 mt-1">{exam.description}</div>
                    )}
                  </Link>
                ))}
              </div>
            </Card>
          )}

          {/* Subjects */}
          {results.subjects.length > 0 && (
            <Card>
              <div className="flex items-center gap-2 mb-4">
                <BookOpenIcon className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  Subjects ({results.subjects.length})
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {results.subjects.map((subject: any) => (
                  <Link
                    key={subject.id}
                    href={`/dashboard/quiz/hierarchy?subject_id=${subject.id}`}
                    className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:bg-gray-800 transition"
                  >
                    <div className="font-semibold text-gray-900 dark:text-gray-100">{subject.name}</div>
                    {subject.description && (
                      <div className="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-500 mt-1">{subject.description}</div>
                    )}
                  </Link>
                ))}
              </div>
            </Card>
          )}

          {/* Chapters */}
          {results.chapters.length > 0 && (
            <Card>
              <div className="flex items-center gap-2 mb-4">
                <DocumentTextIcon className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  Chapters ({results.chapters.length})
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {results.chapters.map((chapter: any) => (
                  <Link
                    key={chapter.id}
                    href={`/dashboard/quiz/hierarchy?chapter_id=${chapter.id}`}
                    className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:bg-gray-800 transition"
                  >
                    <div className="font-semibold text-gray-900 dark:text-gray-100">{chapter.name}</div>
                  </Link>
                ))}
              </div>
            </Card>
          )}

          {/* Topics */}
          {results.topics.length > 0 && (
            <Card>
              <div className="flex items-center gap-2 mb-4">
                <DocumentTextIcon className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  Topics ({results.topics.length})
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {results.topics.map((topic: any) => (
                  <Link
                    key={topic.id}
                    href={`/dashboard/quiz/hierarchy?topic_id=${topic.id}`}
                    className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:bg-gray-800 transition"
                  >
                    <div className="font-semibold text-gray-900 dark:text-gray-100">{topic.name}</div>
                  </Link>
                ))}
              </div>
            </Card>
          )}

          {/* Questions */}
          {results.questions.length > 0 && (
            <Card>
              <div className="flex items-center gap-2 mb-4">
                <DocumentTextIcon className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  Questions ({results.questions.length})
                </h3>
              </div>
              <div className="space-y-3">
                {results.questions.map((question: any, index: number) => (
                  <div key={question.id || index} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="text-gray-900 dark:text-gray-100 mb-2 line-clamp-2">
                      {question.question_text}
                    </div>
                    {question.difficulty && (
                      <span
                        className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                          question.difficulty === 'easy'
                            ? 'bg-easy/10 text-easy'
                            : question.difficulty === 'medium'
                            ? 'bg-medium/10 text-medium'
                            : 'bg-hard/10 text-hard'
                        }`}
                      >
                        {question.difficulty.toUpperCase()}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* No Results */}
      {!loading && query && totalResults === 0 && (
        <Card className="text-center py-12">
          <MagnifyingGlassIcon className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">No results found</h3>
          <p className="text-gray-600 dark:text-gray-400 dark:text-gray-500">Try adjusting your search query or filters</p>
        </Card>
      )}

      {/* Empty State */}
      {!loading && !query && recentSearches.length === 0 && (
        <Card className="text-center py-12">
          <MagnifyingGlassIcon className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Start Searching</h3>
          <p className="text-gray-600 dark:text-gray-400 dark:text-gray-500">
            Search for exams, subjects, chapters, topics, or questions
          </p>
        </Card>
      )}
    </div>
  );
}
