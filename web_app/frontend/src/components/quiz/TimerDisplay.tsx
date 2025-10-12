'use client';

import React from 'react';
import { ClockIcon } from '@heroicons/react/24/outline';

interface TimerDisplayProps {
  timeLeft: number;
  isRunning: boolean;
}

export function TimerDisplay({ timeLeft, isRunning }: TimerDisplayProps) {
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  const isLowTime = timeLeft < 300; // Less than 5 minutes
  const isCritical = timeLeft < 60; // Less than 1 minute

  return (
    <div
      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-lg font-bold ${
        isCritical
          ? 'bg-red-100 text-red-600 animate-pulse'
          : isLowTime
          ? 'bg-warning/20 text-warning'
          : 'bg-blue-100 text-primary'
      }`}
    >
      <ClockIcon className="w-5 h-5" />
      <span>{formattedTime}</span>
      {!isRunning && <span className="text-sm">(Paused)</span>}
    </div>
  );
}
