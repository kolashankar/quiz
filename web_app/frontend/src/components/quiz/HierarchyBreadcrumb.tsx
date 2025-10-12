'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRightIcon } from '@heroicons/react/24/outline';
import { HierarchyNavigation } from '@/types';

interface HierarchyBreadcrumbProps {
  navigation: HierarchyNavigation;
}

export function HierarchyBreadcrumb({ navigation }: HierarchyBreadcrumbProps) {
  const breadcrumbs = [];

  if (navigation.exam) {
    breadcrumbs.push({
      label: navigation.exam.name,
      href: '/dashboard/quiz',
    });
  }

  if (navigation.subject) {
    breadcrumbs.push({
      label: navigation.subject.name,
      href: '#',
    });
  }

  if (navigation.chapter) {
    breadcrumbs.push({
      label: navigation.chapter.name,
      href: '#',
    });
  }

  if (navigation.topic) {
    breadcrumbs.push({
      label: navigation.topic.name,
      href: '#',
    });
  }

  if (navigation.subTopic) {
    breadcrumbs.push({
      label: navigation.subTopic.name,
      href: '#',
    });
  }

  if (navigation.section) {
    breadcrumbs.push({
      label: navigation.section.name,
      href: '#',
    });
  }

  if (navigation.subSection) {
    breadcrumbs.push({
      label: navigation.subSection.name,
      href: '#',
    });
  }

  if (breadcrumbs.length === 0) {
    return null;
  }

  return (
    <div className="bg-white border-b border-gray-200 px-4 md:px-6 lg:px-8 py-3">
      <nav className="flex items-center space-x-2 overflow-x-auto">
        {breadcrumbs.map((crumb, index) => (
          <React.Fragment key={index}>
            {index > 0 && (
              <ChevronRightIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
            )}
            {index === breadcrumbs.length - 1 ? (
              <span className="text-sm font-medium text-primary whitespace-nowrap">
                {crumb.label}
              </span>
            ) : (
              <Link
                href={crumb.href}
                className="text-sm text-gray-600 hover:text-primary whitespace-nowrap transition"
              >
                {crumb.label}
              </Link>
            )}
          </React.Fragment>
        ))}
      </nav>
    </div>
  );
}
