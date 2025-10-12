'use client';

import React from 'react';
import { Card, Button } from '@/components/common';
import Link from 'next/link';
import { RectangleStackIcon } from '@heroicons/react/24/outline';

export default function PracticePage() {
  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">Practice Mode</h1>

      <Card className="text-center py-12">
        <RectangleStackIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Practice Mode Coming Soon</h3>
        <p className="text-gray-600 mb-6">
          Practice mode will allow you to review questions without time limits.
        </p>
        <Link href="/dashboard/quiz">
          <Button variant="primary">Take a Timed Quiz Instead</Button>
        </Link>
      </Card>
    </div>
  );
}
