'use client';

import { useState, useEffect } from 'react';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { DataTable } from '@/components/ui/common/DataTable';
import { Modal } from '@/components/ui/common/Modal';
import { examService } from '@/services/admin/adminService';
import { Exam, CreateExam } from '@/types/admin';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import Link from 'next/link';

export default function ExamsPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateExam>();

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    try {
      setLoading(true);
      const data = await examService.getAll();
      setExams(data);
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch exams');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingExam(null);
    reset({ name: '', code: '', description: '', isActive: true });
    setIsModalOpen(true);
  };

  const handleEdit = (exam: Exam) => {
    setEditingExam(exam);
    reset({
      name: exam.name,
      code: exam.code,
      description: exam.description || '',
      isActive: exam.isActive,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (exam: Exam) => {
    if (!confirm(`Are you sure you want to delete "${exam.name}"? This will delete all related subjects, chapters, and questions.`)) {
      return;
    }

    try {
      await examService.delete(exam.id);
      toast.success('Exam deleted successfully');
      fetchExams();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete exam');
    }
  };

  const onSubmit = async (data: CreateExam) => {
    try {
      if (editingExam) {
        await examService.update(editingExam.id, data);
        toast.success('Exam updated successfully');
      } else {
        await examService.create(data);
        toast.success('Exam created successfully');
      }
      setIsModalOpen(false);
      fetchExams();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save exam');
    }
  };

  const handleBatchDelete = async () => {
    if (selectedIds.length === 0) {
      toast.error('Please select exams to delete');
      return;
    }

    if (!confirm(`Are you sure you want to delete ${selectedIds.length} exam(s)?`)) {
      return;
    }

    try {
      await Promise.all(selectedIds.map(id => examService.delete(id)));
      toast.success(`${selectedIds.length} exam(s) deleted successfully`);
      setSelectedIds([]);
      fetchExams();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete exams');
    }
  };

  const columns = [
    {
      key: 'code',
      header: 'Code',
      sortable: true,
      render: (exam: Exam) => (
        <span className="font-mono font-semibold text-primary-600 dark:text-primary-400">
          {exam.code}
        </span>
      ),
    },
    {
      key: 'name',
      header: 'Name',
      sortable: true,
    },
    {
      key: 'description',
      header: 'Description',
      render: (exam: Exam) => (
        <span className="text-gray-600 dark:text-gray-400">
          {exam.description || 'N/A'}
        </span>
      ),
    },
    {
      key: 'isActive',
      header: 'Status',
      sortable: true,
      render: (exam: Exam) => (
        <span
          className={`px-2 py-1 text-xs font-medium rounded-full ${
            exam.isActive
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
          }`}
        >
          {exam.isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'subjects',
      header: 'Subjects',
      render: (exam: Exam) => (
        <span className="text-gray-600 dark:text-gray-400">
          {exam.subjects?.length || 0}
        </span>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Exams Management</h1>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Manage competitive exams and their hierarchy
              </p>
            </div>
            <div className="flex items-center space-x-3">
              {selectedIds.length > 0 && (
                <button
                  onClick={handleBatchDelete}
                  className="btn-secondary flex items-center space-x-2"
                >
                  <TrashIcon className="h-5 w-5" />
                  <span>Delete ({selectedIds.length})</span>
                </button>
              )}
              <button onClick={handleCreate} className="btn-primary flex items-center space-x-2">
                <PlusIcon className="h-5 w-5" />
                <span>Add Exam</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="px-4 sm:px-6 lg:px-8 py-4">
        <nav className="flex" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2">
            <li>
              <Link href="/dashboard" className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
                Dashboard
              </Link>
            </li>
            <li className="flex items-center">
              <span className="mx-2 text-gray-400">/</span>
              <span className="text-gray-900 dark:text-white font-medium">Exams</span>
            </li>
          </ol>
        </nav>
      </div>

      {/* Content */}
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <DataTable
          data={exams}
          columns={columns}
          loading={loading}
          onEdit={handleEdit}
          onDelete={handleDelete}
          searchPlaceholder="Search exams by name or code..."
          emptyMessage="No exams found. Create your first exam to get started."
          selectable
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
        />
      </div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingExam ? 'Edit Exam' : 'Create New Exam'}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Exam Name *
            </label>
            <input
              type="text"
              {...register('name', { required: 'Name is required', minLength: { value: 2, message: 'Name must be at least 2 characters' } })}
              className="input w-full"
              placeholder="e.g., UPSC Civil Services"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Exam Code *
            </label>
            <input
              type="text"
              {...register('code', { required: 'Code is required', minLength: { value: 2, message: 'Code must be at least 2 characters' } })}
              className="input w-full uppercase"
              placeholder="e.g., UPSC"
              style={{ textTransform: 'uppercase' }}
            />
            {errors.code && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.code.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              {...register('description')}
              rows={3}
              className="input w-full"
              placeholder="Brief description of the exam"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              {...register('isActive')}
              id="isActive"
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <label htmlFor="isActive" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
              Active (visible to users)
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {editingExam ? 'Update' : 'Create'} Exam
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
