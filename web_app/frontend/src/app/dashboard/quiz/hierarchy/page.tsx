'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, Loading, Button } from '@/components/common';
import { HierarchyBreadcrumb } from '@/components/quiz/HierarchyBreadcrumb';
import { quizService } from '@/lib/quiz-service';
import { HierarchyNavigation } from '@/types';
import toast from 'react-hot-toast';
import {
  BookOpenIcon,
  DocumentTextIcon,
  RectangleStackIcon,
  ListBulletIcon,
  FolderIcon,
  FolderOpenIcon,
  ChevronRightIcon,
  BoltIcon,
} from '@heroicons/react/24/outline';

export default function HierarchyPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [navigation, setNavigation] = useState<HierarchyNavigation>({});
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const currentLevel = searchParams.get('level') as string;

  const levelConfig: any = {
    subject: {
      title: 'Select Subject',
      subtitle: 'Choose a subject to practice',
      icon: BookOpenIcon,
      nextLevel: 'chapter',
      fetchFunction: () => quizService.getSubjects(searchParams.get('examId') || ''),
    },
    chapter: {
      title: 'Select Chapter',
      subtitle: 'Choose a chapter to practice',
      icon: DocumentTextIcon,
      nextLevel: 'topic',
      fetchFunction: () => quizService.getChapters(searchParams.get('subjectId') || ''),
    },
    topic: {
      title: 'Select Topic',
      subtitle: 'Choose a topic to practice',
      icon: RectangleStackIcon,
      nextLevel: 'subTopic',
      fetchFunction: () => quizService.getTopics(searchParams.get('chapterId') || ''),
    },
    subTopic: {
      title: 'Select Sub-Topic',
      subtitle: 'Choose a sub-topic to practice',
      icon: ListBulletIcon,
      nextLevel: 'section',
      fetchFunction: () => quizService.getSubTopics(searchParams.get('topicId') || ''),
    },
    section: {
      title: 'Select Section',
      subtitle: 'Choose a section to practice',
      icon: FolderIcon,
      nextLevel: 'subSection',
      fetchFunction: () => quizService.getSections(searchParams.get('subTopicId') || ''),
    },
    subSection: {
      title: 'Select Sub-Section',
      subtitle: 'Choose a sub-section to practice',
      icon: FolderOpenIcon,
      nextLevel: 'questions',
      fetchFunction: () => quizService.getSubSections(searchParams.get('sectionId') || ''),
    },
  };

  useEffect(() => {
    buildNavigation();
    fetchItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const buildNavigation = () => {
    const nav: HierarchyNavigation = {};
    
    const examId = searchParams.get('examId');
    const examName = searchParams.get('examName');
    if (examId && examName) {
      nav.exam = { id: examId, name: examName, description: '', created_at: '' };
    }

    const subjectId = searchParams.get('subjectId');
    const subjectName = searchParams.get('subjectName');
    if (subjectId && subjectName) {
      nav.subject = { id: subjectId, name: subjectName, exam_id: '', description: '', created_at: '' };
    }

    const chapterId = searchParams.get('chapterId');
    const chapterName = searchParams.get('chapterName');
    if (chapterId && chapterName) {
      nav.chapter = { id: chapterId, name: chapterName, subject_id: '', description: '', created_at: '' };
    }

    const topicId = searchParams.get('topicId');
    const topicName = searchParams.get('topicName');
    if (topicId && topicName) {
      nav.topic = { id: topicId, name: topicName, chapter_id: '', description: '', created_at: '' };
    }

    const subTopicId = searchParams.get('subTopicId');
    const subTopicName = searchParams.get('subTopicName');
    if (subTopicId && subTopicName) {
      nav.subTopic = { id: subTopicId, name: subTopicName, topic_id: '', description: '', created_at: '' };
    }

    const sectionId = searchParams.get('sectionId');
    const sectionName = searchParams.get('sectionName');
    if (sectionId && sectionName) {
      nav.section = { id: sectionId, name: sectionName, sub_topic_id: '', description: '', created_at: '' };
    }

    const subSectionId = searchParams.get('subSectionId');
    const subSectionName = searchParams.get('subSectionName');
    if (subSectionId && subSectionName) {
      nav.subSection = { id: subSectionId, name: subSectionName, section_id: '', description: '', created_at: '' };
    }

    setNavigation(nav);
  };

  const fetchItems = async () => {
    try {
      const config = levelConfig[currentLevel];
      if (config) {
        const data = await config.fetchFunction();
        setItems(data);
      }
    } catch (error) {
      console.error(`Error fetching ${currentLevel}:`, error);
      toast.error(`Failed to load ${currentLevel}s`);
    } finally {
      setLoading(false);
    }
  };

  const handleItemSelect = (item: any) => {
    const config = levelConfig[currentLevel];
    const params = new URLSearchParams(searchParams.toString());
    
    if (config.nextLevel === 'questions') {
      // Navigate to test screen
      params.set('subSectionId', item.id);
      params.set('subSectionName', item.name);
      router.push(`/dashboard/quiz/test?${params.toString()}`);
    } else {
      // Navigate to next level
      params.set('level', config.nextLevel);
      params.set(`${currentLevel}Id`, item.id);
      params.set(`${currentLevel}Name`, item.name);
      router.push(`/dashboard/quiz/hierarchy?${params.toString()}`);
    }
  };

  const handleStartQuiz = () => {
    const topicId = searchParams.get('topicId');
    if (topicId) {
      const params = new URLSearchParams(searchParams.toString());
      params.set('mode', 'topic');
      router.push(`/dashboard/quiz/test?${params.toString()}`);
    }
  };

  if (loading) {
    return <Loading text={`Loading ${currentLevel}s...`} />;
  }

  const config = levelConfig[currentLevel];
  const Icon = config?.icon;
  const canStartQuiz = ['topic', 'subTopic', 'section', 'subSection'].includes(currentLevel);

  return (
    <div>
      <HierarchyBreadcrumb navigation={navigation} />
      
      <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100">{config?.title}</h1>
          <p className="text-gray-600 dark:text-gray-400 dark:text-gray-500 mt-2">{config?.subtitle}</p>
        </div>

        {/* Quick Start Button */}
        {canStartQuiz && (
          <Card className="mb-6 bg-gradient-to-r from-success/10 to-success/5 border-2 border-success/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <BoltIcon className="w-8 h-8 text-success" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Quick Start</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-500 mt-1">
                    Start a quiz with all available questions from this level
                  </p>
                </div>
              </div>
              <Button
                onClick={handleStartQuiz}
                variant="secondary"
                size="medium"
              >
                Start Quiz
              </Button>
            </div>
          </Card>
        )}

        {/* Items List */}
        <div className="space-y-4">
          {items.map((item) => (
            <Card key={item.id} padding="none">
              <button
                onClick={() => handleItemSelect(item)}
                className="w-full p-4 flex items-center hover:bg-gray-50 dark:bg-gray-800 transition text-left"
              >
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mr-4">
                  {Icon && <Icon className="w-6 h-6 text-primary" />}
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">{item.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-500 mt-1">{item.description}</p>
                </div>
                <ChevronRightIcon className="w-5 h-5 text-gray-400 dark:text-gray-500" />
              </button>
            </Card>
          ))}

          {items.length === 0 && (
            <Card className="text-center py-12">
              {Icon && <Icon className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />}
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                No {config?.title?.split(' ')[1]}s Available
              </h3>
              <p className="text-gray-600 dark:text-gray-400 dark:text-gray-500">Content will appear here once it&apos;s added to the system.</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
