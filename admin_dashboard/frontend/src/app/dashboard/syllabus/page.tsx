'use client';

import { useState, useEffect } from 'react';
import { PlusIcon, TrashIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { Modal } from '@/components/ui/common/Modal';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import axios from 'axios';

interface Syllabus {
  id: string;
  examId: string;
  title: string;
  content: string;
  aiGenerated: boolean;
  exam?: { name: string };
  createdAt: string;
}

interface Exam {
  id: string;
  name: string;
}

interface CreateSyllabus {
  examId: string;
  title: string;
  content: string;
  aiGenerated?: boolean;
}

export default function SyllabusPage() {
  const [syllabuses, setSyllabuses] = useState<Syllabus[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSyllabus, setEditingSyllabus] = useState<Syllabus | null>(null);
  const [generatingAI, setGeneratingAI] = useState(false);
  const [aiContent, setAiContent] = useState('');

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<CreateSyllabus>();

  const selectedExamId = watch('examId');

  useEffect(() => {
    fetchSyllabuses();
    fetchExams();
  }, []);

  const fetchSyllabuses = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/syllabus`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSyllabuses(response.data);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to fetch syllabuses');
    } finally {
      setLoading(false);
    }
  };

  const fetchExams = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/exams`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setExams(response.data);
    } catch (error: any) {
      toast.error('Failed to fetch exams');
    }
  };

  const handleCreate = () => {
    setEditingSyllabus(null);
    setAiContent('');
    reset({ examId: '', title: '', content: '', aiGenerated: false });
    setIsModalOpen(true);
  };

  const handleEdit = (syllabus: Syllabus) => {
    setEditingSyllabus(syllabus);
    setAiContent('');
    reset({
      examId: syllabus.examId,
      title: syllabus.title,
      content: syllabus.content,
      aiGenerated: syllabus.aiGenerated,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (syllabus: Syllabus) => {
    if (!confirm(`Are you sure you want to delete "${syllabus.title}"?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/syllabus/${syllabus.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Syllabus deleted successfully');
      fetchSyllabuses();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to delete syllabus');
    }
  };

  const handleGenerateAI = async () => {
    if (!selectedExamId) {
      toast.error('Please select an exam first');
      return;
    }

    const exam = exams.find(e => e.id === selectedExamId);
    if (!exam) return;

    setGeneratingAI(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/syllabus/generate-ai`,
        { examName: exam.name },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const generatedContent = response.data.generatedContent;
      setAiContent(generatedContent);
      setValue('content', generatedContent);
      setValue('aiGenerated', true);
      toast.success('Syllabus generated successfully!');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to generate syllabus');
    } finally {
      setGeneratingAI(false);
    }
  };

  const onSubmit = async (data: CreateSyllabus) => {
    try {
      const token = localStorage.getItem('token');
      if (editingSyllabus) {
        await axios.put(
          `${process.env.NEXT_PUBLIC_API_URL}/api/admin/syllabus/${editingSyllabus.id}`,
          data,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success('Syllabus updated successfully');
      } else {
        await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/api/admin/syllabus`,
          data,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success('Syllabus created successfully');
      }
      setIsModalOpen(false);
      fetchSyllabuses();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to save syllabus');
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Exam Syllabuses
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Manage exam syllabuses manually or generate them using AI
        </p>
      </div>

      <div className="mb-4 flex justify-between items-center">
        <button
          onClick={handleCreate}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Add Syllabus
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {syllabuses.map((syllabus) => (
            <div
              key={syllabus.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition"
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {syllabus.title}
                </h3>
                {syllabus.aiGenerated && (
                  <span className="flex items-center text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                    <SparklesIcon className="w-3 h-3 mr-1" />
                    AI
                  </span>
                )}
              </div>
              
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {syllabus.exam?.name || 'Unknown Exam'}
              </p>

              <div className="text-sm text-gray-700 dark:text-gray-300 mb-4 line-clamp-3">
                {syllabus.content.substring(0, 150)}...
              </div>

              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => handleEdit(syllabus)}
                  className="flex-1 px-3 py-2 text-sm bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(syllabus)}
                  className="px-3 py-2 text-sm bg-red-50 text-red-600 rounded hover:bg-red-100 transition"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {syllabuses.length === 0 && !loading && (
        <div className="text-center py-12 text-gray-500">
          No syllabuses found. Create one to get started!
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingSyllabus ? 'Edit Syllabus' : 'Create Syllabus'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Exam <span className="text-red-500">*</span>
            </label>
            <select
              {...register('examId', { required: 'Exam is required' })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="">Select Exam</option>
              {exams.map((exam) => (
                <option key={exam.id} value={exam.id}>
                  {exam.name}
                </option>
              ))}
            </select>
            {errors.examId && (
              <p className="text-red-500 text-sm mt-1">{errors.examId.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              {...register('title', { required: 'Title is required' })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="e.g., Complete UPSC Syllabus 2024"
            />
            {errors.title && (
              <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>
            )}
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Content <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={handleGenerateAI}
                disabled={generatingAI || !selectedExamId}
                className="flex items-center px-3 py-1 text-sm bg-purple-600 text-white rounded hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <SparklesIcon className="w-4 h-4 mr-1" />
                {generatingAI ? 'Generating...' : 'Generate with AI'}
              </button>
            </div>
            <textarea
              {...register('content', { required: 'Content is required' })}
              rows={12}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white font-mono text-sm"
              placeholder="Syllabus content (supports Markdown)..."
            />
            {errors.content && (
              <p className="text-red-500 text-sm mt-1">{errors.content.message}</p>
            )}
          </div>

          <div className="flex gap-2 pt-4">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              {editingSyllabus ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
