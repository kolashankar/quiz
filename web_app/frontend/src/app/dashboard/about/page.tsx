'use client';

import React from 'react';
import { Card } from '@/components/common';
import {
  AcademicCapIcon,
  SparklesIcon,
  ChartBarIcon,
  TrophyIcon,
  BookOpenIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';

export default function AboutPage() {
  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">About Genuis</h1>

      {/* App Info Section */}
      <Card className="mb-6">
        <div className="text-center py-8">
          <div className="w-20 h-20 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center mx-auto mb-4">
            <AcademicCapIcon className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Genuis Quiz Platform</h2>
          <p className="text-gray-600 mb-1">Version 1.0.0</p>
          <p className="text-sm text-gray-500">Your AI-Powered Learning Companion</p>
        </div>
      </Card>

      {/* About Section */}
      <Card className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">About Genuis</h2>
        <div className="space-y-4 text-gray-700">
          <p>
            Genuis is a comprehensive quiz application designed to help students prepare for competitive exams including UPSC, JEE, NEET, EAPCET, and more.
          </p>
          <p>
            Our platform offers an extensive question bank, personalized recommendations powered by AI, detailed analytics, and practice modes to help you excel in your exams.
          </p>
          <p>
            With an intuitive interface and advanced features, we make learning engaging and effective. Track your progress, identify weak areas, and compete with peers on the leaderboard.
          </p>
        </div>
      </Card>

      {/* Features Section */}
      <Card className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Key Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <SparklesIcon className="w-6 h-6 text-primary" />
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">AI-Powered Recommendations</h3>
              <p className="text-sm text-gray-600">
                Get personalized test recommendations and study tips powered by Gemini AI based on your performance.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 rounded-lg bg-success/10 flex items-center justify-center">
                <ChartBarIcon className="w-6 h-6 text-success" />
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Detailed Analytics</h3>
              <p className="text-sm text-gray-600">
                Track your performance with comprehensive analytics including difficulty-wise breakdowns and topic strengths.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 rounded-lg bg-warning/10 flex items-center justify-center">
                <BookOpenIcon className="w-6 h-6 text-warning" />
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Extensive Question Bank</h3>
              <p className="text-sm text-gray-600">
                Access thousands of questions organized across 8 levels: Exam → Subject → Chapter → Topic → Sub-Topic → Section → Sub-Section → Questions.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 rounded-lg bg-info/10 flex items-center justify-center">
                <TrophyIcon className="w-6 h-6 text-info" />
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Leaderboard & Competition</h3>
              <p className="text-sm text-gray-600">
                Compete with peers and climb the leaderboard with weekly, monthly, and all-time rankings.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 rounded-lg bg-secondary/10 flex items-center justify-center">
                <UserGroupIcon className="w-6 h-6 text-secondary" />
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Practice Modes</h3>
              <p className="text-sm text-gray-600">
                Multiple practice modes including timed tests, topic-wise practice, and bookmarked question review.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 rounded-lg bg-error/10 flex items-center justify-center">
                <AcademicCapIcon className="w-6 h-6 text-error" />
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Multi-Platform Support</h3>
              <p className="text-sm text-gray-600">
                Access your learning journey on mobile (Android/iOS) and web platforms with synchronized progress.
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Mission Section */}
      <Card className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Our Mission</h2>
        <p className="text-gray-700">
          Our mission is to democratize quality education and make exam preparation accessible to everyone. We believe that with the right tools, guidance, and dedication, every student can achieve their academic goals.
        </p>
      </Card>

      {/* Technology Section */}
      <Card>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Technology Stack</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="font-semibold text-gray-900 mb-1">Frontend</div>
            <div className="text-gray-600">React Native (Mobile)</div>
            <div className="text-gray-600">Next.js (Web)</div>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="font-semibold text-gray-900 mb-1">Backend</div>
            <div className="text-gray-600">FastAPI</div>
            <div className="text-gray-600">Python</div>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="font-semibold text-gray-900 mb-1">Database</div>
            <div className="text-gray-600">MongoDB</div>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="font-semibold text-gray-900 mb-1">AI</div>
            <div className="text-gray-600">Google Gemini Pro</div>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="font-semibold text-gray-900 mb-1">Authentication</div>
            <div className="text-gray-600">JWT</div>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="font-semibold text-gray-900 mb-1">Deployment</div>
            <div className="text-gray-600">Cloud-based</div>
          </div>
        </div>
      </Card>
    </div>
  );
}
