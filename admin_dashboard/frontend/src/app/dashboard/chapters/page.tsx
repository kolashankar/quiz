'use client';

import { useState, useEffect } from 'react';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { DataTable } from '@/components/ui/common/DataTable';
import { Modal } from '@/components/ui/common/Modal';
import { chapterService, subjectService, examService } from '@/services/admin/adminService';
import { Chapter, CreateChapter, Subject, Exam } from '@/types/admin';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import Link from 'next/link';

export default function ChaptersPage() {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null);
  const [filterExamId, setFilterExamId] = useState<string>('');
  const [filterSubjectId, setFilterSubjectId] = useState<string>('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateChapter>();

  useEffect(() => {
    fetchExams();
  }, []);

  useEffect(() => {
    if (filterExamId) {
      fetchSubjects();
    }
  }, [filterExamId]);

  useEffect(() => {
    fetchChapters();
  }, [filterSubjectId]);

  const fetchExams = async () => {
    try {
      const data = await examService.getAll();
      setExams(data);
    } catch (error: any) {
      toast.error('Failed to fetch exams');
    }
  };

  const fetchSubjects = async () => {
    try {
      const data = await subjectService.getAll(filterExamId || undefined);
      setSubjects(data);
    } catch (error: any) {
      toast.error('Failed to fetch subjects');
    }
  };

  const fetchChapters = async () => {
    try {
      setLoading(true);
      const data = await chapterService.getAll(filterSubjectId || undefined);
      setChapters(data);
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch chapters');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingChapter(null);
    reset({ name: '', code: '', description: '', subjectId: filterSubjectId || '', order: 0, isActive: true });
    setIsModalOpen(true);
  };

  const handleEdit = (chapter: Chapter) => {
    setEditingChapter(chapter);
    reset({
      name: chapter.name,
      code: chapter.code,
      description: chapter.description || '',
      subjectId: chapter.subjectId,
      order: chapter.order,
      isActive: chapter.isActive,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (chapter: Chapter) => {
    if (!confirm(`Delete "${chapter.name}"?`)) return;
    try {
      await chapterService.delete(chapter.id);
      toast.success('Chapter deleted');
      fetchChapters();
    } catch (error: any) {
      toast.error('Failed to delete chapter');
    }
  };

  const onSubmit = async (data: CreateChapter) => {
    try {
      if (editingChapter) {
        await chapterService.update(editingChapter.id, data);
        toast.success('Chapter updated');
      } else {
        await chapterService.create(data);
        toast.success('Chapter created');
      }
      setIsModalOpen(false);
      fetchChapters();
    } catch (error: any) {
      toast.error('Failed to save chapter');
    }
  };

  const handleBatchDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Delete ${selectedIds.length} chapter(s)?`)) return;
    try {
      await Promise.all(selectedIds.map(id => chapterService.delete(id)));
      toast.success(`Deleted ${selectedIds.length} chapter(s)`);
      setSelectedIds([]);
      fetchChapters();
    } catch (error: any) {
      toast.error('Failed to delete');
    }
  };

  const columns = [
    { key: 'code', header: 'Code', sortable: true, render: (c: Chapter) => <span className="font-mono font-semibold text-primary-600">{c.code}</span> },
    { key: 'name', header: 'Name', sortable: true },
    { key: 'subject', header: 'Subject', render: (c: Chapter) => <span className="text-gray-600">{c.subject?.name || 'N/A'}</span> },
    { key: 'order', header: 'Order', sortable: true },
    { key: 'isActive', header: 'Status', sortable: true, render: (c: Chapter) => (
      <span className={`px-2 py-1 text-xs rounded-full ${c.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
        {c.isActive ? 'Active' : 'Inactive'}
      </span>
    )},
    { key: 'topics', header: 'Topics', render: (c: Chapter) => <span>{c.topics?.length || 0}</span> },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Chapters Management</h1>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Manage chapters under subjects (Level 3)</p>
            </div>
            <div className="flex items-center space-x-3">
              {selectedIds.length > 0 && (
                <button onClick={handleBatchDelete} className="btn-secondary flex items-center space-x-2">
                  <TrashIcon className="h-5 w-5" /><span>Delete ({selectedIds.length})</span>
                </button>
              )}
              <button onClick={handleCreate} className="btn-primary flex items-center space-x-2">
                <PlusIcon className="h-5 w-5" /><span>Add Chapter</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 py-4">
        <nav className="flex items-center justify-between">
          <ol className="flex items-center space-x-2">
            <li><Link href="/dashboard" className="text-gray-500 hover:text-gray-700">Dashboard</Link></li>
            <li><span className="mx-2 text-gray-400">/</span><span className="text-gray-900 font-medium">Chapters</span></li>
          </ol>
          <div className="flex space-x-2">
            <select value={filterExamId} onChange={(e) => { setFilterExamId(e.target.value); setFilterSubjectId(''); }} className="input">
              <option value="">All Exams</option>
              {exams.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
            <select value={filterSubjectId} onChange={(e) => setFilterSubjectId(e.target.value)} className="input" disabled={!filterExamId}>
              <option value="">All Subjects</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        </nav>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <DataTable data={chapters} columns={columns} loading={loading} onEdit={handleEdit} onDelete={handleDelete} searchPlaceholder="Search chapters..." emptyMessage="No chapters found" selectable selectedIds={selectedIds} onSelectionChange={setSelectedIds} />
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingChapter ? 'Edit Chapter' : 'Create Chapter'} size="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Subject *</label>
            <select {...register('subjectId', { required: 'Subject required' })} className="input w-full">
              <option value="">Select Subject</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            {errors.subjectId && <p className="text-sm text-red-600">{errors.subjectId.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Name *</label>
            <input {...register('name', { required: 'Required' })} className="input w-full" placeholder="e.g., Mechanics" />
            {errors.name && <p className="text-sm text-red-600">{errors.name.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Code *</label>
            <input {...register('code', { required: 'Required' })} className="input w-full uppercase" placeholder="MECH" />
            {errors.code && <p className="text-sm text-red-600">{errors.code.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea {...register('description')} rows={3} className="input w-full" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Order</label>
            <input type="number" {...register('order', { valueAsNumber: true })} className="input w-full" />
          </div>
          <div className="flex items-center">
            <input type="checkbox" {...register('isActive')} id="isActive" className="rounded" />
            <label htmlFor="isActive" className="ml-2 text-sm">Active</label>
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">{editingChapter ? 'Update' : 'Create'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
