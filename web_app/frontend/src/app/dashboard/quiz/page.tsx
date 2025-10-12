'use client';

import React from 'react';
import { AcademicCapIcon } from '@heroicons/react/24/outline';

export default function QuizPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-sm">
        <div className="text-center">
          <AcademicCapIcon className="w-16 h-16 text-blue-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Quiz Mode</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Select your exam, subject, and topic to start a timed quiz
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            Quiz functionality with 8-level hierarchy navigation coming soon...
          </p>
        </div>
      </div>
    </div>
  );
}
