'use client';

import React, { useState } from 'react';
import { Question } from '@/types';
import { Card } from '../common';
import { BookmarkIcon, LightBulbIcon } from '@heroicons/react/24/outline';
import { BookmarkIcon as BookmarkSolidIcon } from '@heroicons/react/24/solid';
import { renderLatex } from '@/lib/latex-renderer';
import { renderCodeBlocks, renderInlineCode } from './CodeBlock';

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
  const [showHint, setShowHint] = useState(false);

  const difficultyColors = {
    easy: 'bg-easy/10 text-easy border-easy',
    medium: 'bg-medium/10 text-medium border-medium',
    hard: 'bg-hard/10 text-hard border-hard',
  };

  const difficultyColor = difficultyColors[question.difficulty as keyof typeof difficultyColors] || difficultyColors.medium;

  // Helper function to render text with LaTeX and code
  const renderFormattedText = (text: string) => {
    // First check for code blocks
    if (text.includes('```')) {
      return renderCodeBlocks(text);
    }
    // Then check for inline code
    if (text.includes('`')) {
      const parts = renderInlineCode(text);
      // Now check each part for LaTeX
      return parts.map((part, idx) => {
        if (typeof part === 'string') {
          if (part.includes('$')) {
            return <span key={idx}>{renderLatex(part)}</span>;
          }
          return <span key={idx}>{part}</span>;
        }
        return part;
      });
    }
    // Check for LaTeX
    if (text.includes('$')) {
      return renderLatex(text);
    }
    return text;
  };

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
        <div className="text-lg text-gray-900 leading-relaxed">
          {renderFormattedText(question.question_text)}
        </div>
      </div>

      {/* Question Image (if exists) */}
      {question.image_url && (
        <div className="mb-6">
          <img
            src={question.image_url}
            alt="Question illustration"
            className="max-w-full h-auto rounded-lg border border-gray-200"
          />
        </div>
      )}

      {/* Hint Button */}
      {question.hint && (
        <div className="mb-4">
          <button
            onClick={() => setShowHint(!showHint)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition ${
              showHint
                ? 'bg-yellow-50 border-yellow-400 text-yellow-700'
                : 'border-yellow-300 text-yellow-600 hover:bg-yellow-50'
            }`}
          >
            <LightBulbIcon className="w-5 h-5" />
            <span className="font-medium">
              {showHint ? 'Hide Hint' : 'Show Hint'}
            </span>
          </button>
          {showHint && (
            <div className="mt-3 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-r-lg">
              <p className="text-sm text-gray-800">
                <strong className="text-yellow-700">Hint:</strong>{' '}
                {renderFormattedText(question.hint)}
              </p>
            </div>
          )}
        </div>
      )}

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
                    {typeof option === 'string' ? renderFormattedText(option) : option}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Code Snippet (if exists) */}
      {question.code_snippet && (
        <div className="mt-6">
          <div className="text-sm font-semibold text-gray-700 mb-2">Code Reference:</div>
          {renderCodeBlocks(`\`\`\`${question.code_language || 'javascript'}\n${question.code_snippet}\n\`\`\``)}
        </div>
      )}
    </Card>
  );
}
