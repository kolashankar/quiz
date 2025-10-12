'use client';

import React from 'react';
import { Question } from '@/types';
import { Card } from '../common';
import { BookmarkIcon } from '@heroicons/react/24/outline';
import { BookmarkIcon as BookmarkSolidIcon } from '@heroicons/react/24/solid';

interface QuestionCardProps {
  question: Question;
  questionNumber: number;
  totalQuestions: number;
  selectedAnswer: number;
  onSelectAnswer: (index: number) => void;
  isBookmarked: boolean;
  onToggleBookmark: () => void;
}

export function QuestionCard({
  question,
  questionNumber,
  totalQuestions,
  selectedAnswer,
  onSelectAnswer,
  isBookmarked,
  onToggleBookmark,
}: QuestionCardProps) {
  const difficultyColors = {
    easy: 'bg-easy/10 text-easy border-easy',
    medium: 'bg-medium/10 text-medium border-medium',
    hard: 'bg-hard/10 text-hard border-hard',
  };

  const difficultyColor = difficultyColors[question.difficulty as keyof typeof difficultyColors] || difficultyColors.medium;

  return (
    <Card>
      {/* Question Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-gray-600">
            Question {questionNumber} of {totalQuestions}
          </span>
          <span className={`px-2 py-1 rounded text-xs font-medium border ${difficultyColor}`}>
            {question.difficulty.toUpperCase()}
          </span>
        </div>
        <button
          onClick={onToggleBookmark}
          className="p-2 rounded-lg hover:bg-gray-100 transition"
          title={isBookmarked ? 'Remove bookmark' : 'Bookmark question'}
        >
          {isBookmarked ? (
            <BookmarkSolidIcon className="w-6 h-6 text-warning" />
          ) : (
            <BookmarkIcon className="w-6 h-6 text-gray-400" />
          )}
        </button>
      </div>

      {/* Question Text */}
      <div className="mb-6">
        <p className="text-lg text-gray-900 leading-relaxed">{question.question_text}</p>
      </div>

      {/* Options */}
      <div className="space-y-3">
        {question.options.map((option, index) => {
          const isSelected = selectedAnswer === index;
          return (
            <button
              key={index}
              onClick={() => onSelectAnswer(index)}
              className={`w-full p-4 rounded-lg border-2 text-left transition ${
                isSelected
                  ? 'border-primary bg-primary/10'
                  : 'border-gray-200 hover:border-primary/50 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    isSelected ? 'border-primary bg-primary' : 'border-gray-300'
                  }`}
                >
                  {isSelected && (
                    <div className="w-3 h-3 rounded-full bg-white"></div>
                  )}
                </div>
                <div className="flex-1">
                  <span className={`font-medium ${
                    isSelected ? 'text-primary' : 'text-gray-900'
                  }`}>
                    {String.fromCharCode(65 + index)}.
                  </span>
                  <span className={`ml-2 ${
                    isSelected ? 'text-gray-900' : 'text-gray-700'
                  }`}>
                    {option}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </Card>
  );
}
