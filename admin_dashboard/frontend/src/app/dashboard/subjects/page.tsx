'use client';

import { useState, useEffect, useCallback } from 'react';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { DataTable } from '@/components/ui/common/DataTable';
import { Modal } from '@/components/ui/common/Modal';
import { subjectService, examService } from '@/services/admin/adminService';
import { Subject, CreateSubject, Exam } from '@/types/admin';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import Link from 'next/link';

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [filterExamId, setFilterExamId] = useState<string>('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateSubject>();

  useEffect(() => {
    fetchExams();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchSubjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterExamId]);

  const fetchExams = async () => {
    try {
      const data = await examService.getAll();
      setExams(data);
    } catch (error: any) {
      toast.error('Failed to fetch exams');
    }
  };

  const fetchSubjects = useCallback(async () => {
    try {
      setLoading(true);
      const data = await subjectService.getAll(filterExamId || undefined);
      setSubjects(data);
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch subjects');
    } finally {
      setLoading(false);
    }
  };}, []);

  useEffect(() => { fetchSubjects(); }, [fetchSubjects]);

  const handleCreate = () => {
    setEditingSubject(null);
    reset({ name: '', code: '', description: '', examId: filterExamId || '', order: 0, isActive: true });
    setIsModalOpen(true);
  };

  const handleEdit = (subject: Subject) => {
    setEditingSubject(subject);
    reset({
      name: subject.name,
      code: subject.code,
      description: subject.description || '',
      examId: subject.examId,
      order: subject.order,
      isActive: subject.isActive,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (subject: Subject) => {
    if (!confirm(`Are you sure you want to delete "${subject.name}"?`)) return;

    try {
      await subjectService.delete(subject.id);
      toast.success('Subject deleted successfully');
      fetchSubjects();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete subject');
    }
  };

  const onSubmit = async (data: CreateSubject) => {
    try {
      if (editingSubject) {
        await subjectService.update(editingSubject.id, data);
        toast.success('Subject updated successfully');
      } else {
        await subjectService.create(data);
        toast.success('Subject created successfully');
      }
      setIsModalOpen(false);
      fetchSubjects();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save subject');
    }
  };

  const handleBatchDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Delete ${selectedIds.length} subject(s)?`)) return;

    try {
      await Promise.all(selectedIds.map(id => subjectService.delete(id)));
      toast.success(`${selectedIds.length} subject(s) deleted`);
      setSelectedIds([]);
      fetchSubjects();
    } catch (error: any) {
      toast.error('Failed to delete subjects');
    }
  };

  const columns = [
    {
      key: 'code',
      header: 'Code',
      sortable: true,
      render: (subject: Subject) => (
        <span className="font-mono font-semibold text-primary-600 dark:text-primary-400">
          {subject.code}
        </span>
      ),
    },
    {
      key: 'name',
      header: 'Name',
      sortable: true,
    },
    {
      key: 'exam',
      header: 'Exam',
      render: (subject: Subject) => (
        <span className="text-gray-600 dark:text-gray-400">
          {subject.exam?.name || 'N/A'}
        </span>
      ),
    },
    {
      key: 'order',
      header: 'Order',
      sortable: true,
    },
    {
      key: 'isActive',
      header: 'Status',
      sortable: true,
      render: (subject: Subject) => (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
          subject.isActive
            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
        }`}>
          {subject.isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'chapters',
      header: 'Chapters',
      render: (subject: Subject) => (
        <span className="text-gray-600 dark:text-gray-400">
          {subject.chapters?.length || 0}
        </span>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Subjects Management</h1>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Manage subjects under exams (Level 2)
              </p>
            </div>
            <div className="flex items-center space-x-3">
              {selectedIds.length > 0 && (
                <button onClick={handleBatchDelete} className="btn-secondary flex items-center space-x-2">
                  <TrashIcon className="h-5 w-5" />
                  <span>Delete ({selectedIds.length})</span>
                </button>
              )}
              <button onClick={handleCreate} className="btn-primary flex items-center space-x-2">
                <PlusIcon className="h-5 w-5" />
                <span>Add Subject</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 py-4">
        <nav className="flex items-center justify-between" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2">
            <li>
              <Link href="/dashboard" className="text-gray-500 hover:text-gray-700 dark:text-gray-400">
                Dashboard
              </Link>
            </li>
            <li className="flex items-center">
              <span className="mx-2 text-gray-400">/</span>
              <span className="text-gray-900 dark:text-white font-medium">Subjects</span>
            </li>
          </ol>
          <div>
            <select
              value={filterExamId}
              onChange={(e) => setFilterExamId(e.target.value)}
              className="input"
            >
              <option value="">All Exams</option>
              {exams.map((exam) => (
                <option key={exam.id} value={exam.id}>
                  {exam.name}
                </option>
              ))}
            </select>
          </div>
        </nav>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <DataTable
          data={subjects}
          columns={columns}
          loading={loading}
          onEdit={handleEdit}
          onDelete={handleDelete}
          searchPlaceholder="Search subjects..."
          emptyMessage="No subjects found."
          selectable
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
        />
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingSubject ? 'Edit Subject' : 'Create New Subject'}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Exam *
            </label>
            <select {...register('examId', { required: 'Exam is required' })} className="input w-full">
              <option value="">Select Exam</option>
              {exams.map((exam) => (
                <option key={exam.id} value={exam.id}>
                  {exam.name}
                </option>
              ))}
            </select>
            {errors.examId && <p className="mt-1 text-sm text-red-600">{errors.examId.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name *</label>
            <input
              type="text"
              {...register('name', { required: 'Name is required', minLength: 2 })}
              className="input w-full"
              placeholder="e.g., Physics"
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Code *</label>
            <input
              type="text"
              {...register('code', { required: 'Code is required' })}
              className="input w-full uppercase"
              placeholder="e.g., PHYS"
            />
            {errors.code && <p className="mt-1 text-sm text-red-600">{errors.code.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
            <textarea {...register('description')} rows={3} className="input w-full" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Display Order</label>
            <input
              type="number"
              {...register('order', { valueAsNumber: true })}
              className="input w-full"
              placeholder="0"
            />
          </div>

          <div className="flex items-center">
            <input type="checkbox" {...register('isActive')} id="isActive" className="rounded" />
            <label htmlFor="isActive" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
              Active
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {editingSubject ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
