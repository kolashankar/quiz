'use client';

import React from 'react';
import { Card } from '@/components/common';
import { BellIcon } from '@heroicons/react/24/outline';

export default function NotificationsPage() {
  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">Notifications</h1>

      <Card className="text-center py-12">
        <BellIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Notifications</h3>
        <p className="text-gray-600">You're all caught up! Check back later for updates.</p>
      </Card>
    </div>
  );
}
