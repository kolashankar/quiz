'use client';

import React from 'react';
import { Card } from '@/components/common';
import { ShieldCheckIcon } from '@heroicons/react/24/outline';

export default function PrivacyPage() {
  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">Privacy Policy</h1>

      <Card className="mb-6">
        <div className="flex items-center space-x-3 mb-4">
          <ShieldCheckIcon className="w-8 h-8 text-primary" />
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Your Privacy Matters</h2>
            <p className="text-sm text-gray-600">Last updated: January 2025</p>
          </div>
        </div>
        <p className="text-gray-700">
          At Genuis, we are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, and safeguard your data.
        </p>
      </Card>

      <Card className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Information We Collect</h2>
        <div className="space-y-4 text-gray-700">
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Personal Information</h3>
            <p className="text-sm">
              When you create an account, we collect your email address and any optional profile information you provide. This information is used to authenticate your account and personalize your experience.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Usage Data</h3>
            <p className="text-sm">
              We collect information about your quiz performance, including test scores, time taken, topics attempted, and question responses. This data helps us provide personalized recommendations and improve our services.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Device Information</h3>
            <p className="text-sm">
              We may collect device information such as device type, operating system, and app version to ensure compatibility and optimize performance.
            </p>
          </div>
        </div>
      </Card>

      <Card className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">How We Use Your Information</h2>
        <div className="space-y-3 text-gray-700">
          <div className="flex items-start space-x-2">
            <span className="text-primary font-bold">•</span>
            <p className="text-sm">
              <strong>Personalization:</strong> To provide customized quiz recommendations and study tips based on your performance using AI technology.
            </p>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-primary font-bold">•</span>
            <p className="text-sm">
              <strong>Analytics:</strong> To generate performance analytics, track your progress, and help you identify areas for improvement.
            </p>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-primary font-bold">•</span>
            <p className="text-sm">
              <strong>Service Improvement:</strong> To analyze usage patterns and improve our application features and user experience.
            </p>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-primary font-bold">•</span>
            <p className="text-sm">
              <strong>Communication:</strong> To send you important updates about your account, new features, or changes to our services.
            </p>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-primary font-bold">•</span>
            <p className="text-sm">
              <strong>Leaderboard:</strong> To display your ranking and username on leaderboards (you can opt out in settings).
            </p>
          </div>
        </div>
      </Card>

      <Card className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Data Security</h2>
        <div className="space-y-3 text-gray-700 text-sm">
          <p>
            We implement industry-standard security measures to protect your personal information:
          </p>
          <ul className="space-y-2 ml-4">
            <li className="flex items-start space-x-2">
              <span className="text-success font-bold">✓</span>
              <span>Encrypted data transmission using HTTPS/TLS protocols</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-success font-bold">✓</span>
              <span>Secure password hashing and authentication using JWT tokens</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-success font-bold">✓</span>
              <span>Regular security audits and vulnerability assessments</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-success font-bold">✓</span>
              <span>Restricted access to personal data within our organization</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-success font-bold">✓</span>
              <span>Secure cloud infrastructure with backup and disaster recovery</span>
            </li>
          </ul>
        </div>
      </Card>

      <Card className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Data Sharing and Third Parties</h2>
        <div className="space-y-3 text-gray-700 text-sm">
          <p>
            We do not sell your personal information to third parties. We may share your data only in the following circumstances:
          </p>
          <div className="space-y-2 ml-4">
            <div>
              <strong>AI Services:</strong> We use Google Gemini AI to provide personalized recommendations. Your performance data is processed by Gemini but is not stored or used for any other purpose.
            </div>
            <div>
              <strong>Service Providers:</strong> We work with trusted service providers for hosting, analytics, and infrastructure who are bound by confidentiality agreements.
            </div>
            <div>
              <strong>Legal Requirements:</strong> We may disclose information if required by law or to protect our rights and safety.
            </div>
          </div>
        </div>
      </Card>

      <Card className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Rights</h2>
        <div className="space-y-3 text-gray-700 text-sm">
          <p>You have the following rights regarding your personal data:</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3 bg-gray-50 rounded-lg">
              <strong className="text-gray-900">Access:</strong>
              <p className="text-xs mt-1">Request a copy of your personal data</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <strong className="text-gray-900">Correction:</strong>
              <p className="text-xs mt-1">Update or correct your information</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <strong className="text-gray-900">Deletion:</strong>
              <p className="text-xs mt-1">Request deletion of your account and data</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <strong className="text-gray-900">Portability:</strong>
              <p className="text-xs mt-1">Export your data in a readable format</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <strong className="text-gray-900">Opt-out:</strong>
              <p className="text-xs mt-1">Opt out of certain data collection</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <strong className="text-gray-900">Withdraw Consent:</strong>
              <p className="text-xs mt-1">Withdraw consent for data processing</p>
            </div>
          </div>
        </div>
      </Card>

      <Card className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Cookies and Tracking</h2>
        <p className="text-gray-700 text-sm">
          We use cookies and similar technologies to enhance your experience, remember your preferences, and analyze usage patterns. You can control cookie settings through your browser, but disabling cookies may limit some features.
        </p>
      </Card>

      <Card className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Children's Privacy</h2>
        <p className="text-gray-700 text-sm">
          Our services are intended for users aged 13 and above. We do not knowingly collect personal information from children under 13. If you believe we have collected such information, please contact us immediately.
        </p>
      </Card>

      <Card className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Changes to Privacy Policy</h2>
        <p className="text-gray-700 text-sm">
          We may update this Privacy Policy from time to time. We will notify you of any significant changes through email or in-app notifications. Your continued use of the service after changes indicates acceptance of the updated policy.
        </p>
      </Card>

      <Card className="bg-primary/5">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Contact Us</h2>
        <p className="text-gray-700 text-sm mb-3">
          If you have any questions about this Privacy Policy or how we handle your data, please contact us:
        </p>
        <div className="text-sm space-y-1">
          <p><strong>Email:</strong> privacy@genuis.com</p>
          <p><strong>Phone:</strong> +91 1234567890</p>
          <p><strong>Address:</strong> Hyderabad, Telangana, India - 500001</p>
        </div>
      </Card>
    </div>
  );
}
