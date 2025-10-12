'use client';

import React from 'react';
import { Card, Button } from '@/components/common';
import Link from 'next/link';
import { BookOpenIcon } from '@heroicons/react/24/outline';

export default function SyllabusPage() {
  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">Syllabus</h1>

      <Card className="text-center py-12">
        <BookOpenIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Explore Syllabus</h3>
        <p className="text-gray-600 mb-6">
          Browse through the complete syllabus structure and topics.
        </p>
        <Link href="/dashboard/quiz">
          <Button variant="primary">View Quiz Hierarchy</Button>
        </Link>
      </Card>
    </div>
  );
}
