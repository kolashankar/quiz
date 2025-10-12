'use client';

import React from 'react';
import Link from 'next/link';
import { Card } from '@/components/common';
import {
  InformationCircleIcon,
  EnvelopeIcon,
  ShieldCheckIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';

export default function SettingsPage() {
  const settingsLinks = [
    {
      title: 'About',
      description: 'Learn more about Genuis and our mission',
      icon: InformationCircleIcon,
      href: '/dashboard/about',
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: 'Contact Us',
      description: 'Get in touch with our support team',
      icon: EnvelopeIcon,
      href: '/dashboard/contact',
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
    {
      title: 'Privacy Policy',
      description: 'Learn how we protect your data',
      icon: ShieldCheckIcon,
      href: '/dashboard/privacy',
      color: 'text-info',
      bgColor: 'bg-info/10',
    },
  ];

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">Settings</h1>

      <div className="space-y-4">
        {settingsLinks.map((link) => {
          const Icon = link.icon;
          return (
            <Link key={link.href} href={link.href}>
              <Card className="hover:shadow-md transition cursor-pointer">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-lg ${link.bgColor} flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`w-6 h-6 ${link.color}`} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{link.title}</h3>
                      <p className="text-sm text-gray-600">{link.description}</p>
                    </div>
                  </div>
                  <ChevronRightIcon className="w-5 h-5 text-gray-400" />
                </div>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Account Settings Section */}
      <Card className="mt-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Account Settings</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-2">
            <div>
              <div className="font-medium text-gray-900">Email Notifications</div>
              <div className="text-sm text-gray-600">Receive updates via email</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>

          <div className="flex items-center justify-between py-2">
            <div>
              <div className="font-medium text-gray-900">Show on Leaderboard</div>
              <div className="text-sm text-gray-600">Display your rank publicly</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>

          <div className="flex items-center justify-between py-2">
            <div>
              <div className="font-medium text-gray-900">AI Recommendations</div>
              <div className="text-sm text-gray-600">Get personalized study suggestions</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
        </div>
      </Card>

      {/* App Information */}
      <Card className="mt-6 bg-gray-50">
        <div className="text-center py-4">
          <div className="text-sm text-gray-600 mb-1">Genuis Quiz Platform</div>
          <div className="text-xs text-gray-500">Version 1.0.0</div>
        </div>
      </Card>
    </div>
  );
}
