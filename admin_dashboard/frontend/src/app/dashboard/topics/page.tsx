'use client';

import { useState, useEffect } from 'react';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { DataTable } from '@/components/ui/common/DataTable';
import { Modal } from '@/components/ui/common/Modal';
import { topicService, chapterService, subjectService, examService } from '@/services/admin/adminService';
import { Topic, CreateTopic, Chapter, Subject, Exam } from '@/types/admin';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import Link from 'next/link';

export default function TopicsPage() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);
  const [filterExamId, setFilterExamId] = useState('');
  const [filterSubjectId, setFilterSubjectId] = useState('');
  const [filterChapterId, setFilterChapterId] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateTopic>();

  useEffect(() => { fetchExams(); }, []);
  useEffect(() => { if (filterExamId) fetchSubjects(); }, [filterExamId]);
  useEffect(() => { if (filterSubjectId) fetchChapters(); }, [filterSubjectId]);
  useEffect(() => { fetchTopics(); }, [filterChapterId]);

  const fetchExams = async () => { try { setExams(await examService.getAll()); } catch { toast.error('Failed to fetch exams'); } };
  const fetchSubjects = async () => { try { setSubjects(await subjectService.getAll(filterExamId)); } catch { toast.error('Failed to fetch subjects'); } };
  const fetchChapters = async () => { try { setChapters(await chapterService.getAll(filterSubjectId)); } catch { toast.error('Failed to fetch chapters'); } };
  
  const fetchTopics = async () => {
    try {
      setLoading(true);
      setTopics(await topicService.getAll(filterChapterId || undefined));
    } catch (error: any) {
      toast.error('Failed to fetch topics');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => { setEditingTopic(null); reset({ name: '', code: '', description: '', chapterId: filterChapterId || '', order: 0, isActive: true }); setIsModalOpen(true); };
  const handleEdit = (t: Topic) => { setEditingTopic(t); reset({ name: t.name, code: t.code, description: t.description || '', chapterId: t.chapterId, order: t.order, isActive: t.isActive }); setIsModalOpen(true); };
  const handleDelete = async (t: Topic) => { if (!confirm(`Delete "${t.name}"?`)) return; try { await topicService.delete(t.id); toast.success('Deleted'); fetchTopics(); } catch { toast.error('Failed'); } };
  const onSubmit = async (data: CreateTopic) => { try { if (editingTopic) { await topicService.update(editingTopic.id, data); toast.success('Updated'); } else { await topicService.create(data); toast.success('Created'); } setIsModalOpen(false); fetchTopics(); } catch { toast.error('Failed'); } };
  const handleBatchDelete = async () => { if (selectedIds.length === 0) return; if (!confirm(`Delete ${selectedIds.length} topic(s)?`)) return; try { await Promise.all(selectedIds.map(id => topicService.delete(id))); toast.success(`Deleted ${selectedIds.length}`); setSelectedIds([]); fetchTopics(); } catch { toast.error('Failed'); } };

  const columns = [
    { key: 'code', header: 'Code', sortable: true, render: (t: Topic) => <span className="font-mono font-semibold text-primary-600">{t.code}</span> },
    { key: 'name', header: 'Name', sortable: true },
    { key: 'chapter', header: 'Chapter', render: (t: Topic) => <span className="text-gray-600">{t.chapter?.name || 'N/A'}</span> },
    { key: 'order', header: 'Order', sortable: true },
    { key: 'isActive', header: 'Status', render: (t: Topic) => <span className={`px-2 py-1 text-xs rounded-full ${t.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100'}`}>{t.isActive ? 'Active' : 'Inactive'}</span> },
    { key: 'subtopics', header: 'Subtopics', render: (t: Topic) => <span>{t.subtopics?.length || 0}</span> },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b"><div className="px-4 sm:px-6 lg:px-8 py-6"><div className="flex items-center justify-between"><div><h1 className="text-2xl font-bold text-gray-900 dark:text-white">Topics Management</h1><p className="mt-1 text-sm text-gray-600">Level 4</p></div><div className="flex space-x-3">{selectedIds.length > 0 && <button onClick={handleBatchDelete} className="btn-secondary flex items-center space-x-2"><TrashIcon className="h-5 w-5" /><span>Delete ({selectedIds.length})</span></button>}<button onClick={handleCreate} className="btn-primary flex items-center space-x-2"><PlusIcon className="h-5 w-5" /><span>Add Topic</span></button></div></div></div></div>
      <div className="px-4 sm:px-6 lg:px-8 py-4"><nav className="flex items-center justify-between"><ol className="flex items-center space-x-2"><li><Link href="/dashboard" className="text-gray-500 hover:text-gray-700">Dashboard</Link></li><li><span className="mx-2">/</span><span className="font-medium">Topics</span></li></ol><div className="flex space-x-2"><select value={filterExamId} onChange={(e) => { setFilterExamId(e.target.value); setFilterSubjectId(''); setFilterChapterId(''); }} className="input"><option value="">All Exams</option>{exams.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}</select><select value={filterSubjectId} onChange={(e) => { setFilterSubjectId(e.target.value); setFilterChapterId(''); }} className="input" disabled={!filterExamId}><option value="">All Subjects</option>{subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select><select value={filterChapterId} onChange={(e) => setFilterChapterId(e.target.value)} className="input" disabled={!filterSubjectId}><option value="">All Chapters</option>{chapters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div></nav></div>
      <div className="px-4 sm:px-6 lg:px-8 py-8"><DataTable data={topics} columns={columns} loading={loading} onEdit={handleEdit} onDelete={handleDelete} searchPlaceholder="Search topics..." emptyMessage="No topics" selectable selectedIds={selectedIds} onSelectionChange={setSelectedIds} /></div>
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingTopic ? 'Edit Topic' : 'Create Topic'} size="lg"><form onSubmit={handleSubmit(onSubmit)} className="space-y-4"><div><label className="block text-sm font-medium mb-1">Chapter *</label><select {...register('chapterId', { required: 'Required' })} className="input w-full"><option value="">Select</option>{chapters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>{errors.chapterId && <p className="text-sm text-red-600">{errors.chapterId.message}</p>}</div><div><label className="block text-sm font-medium mb-1">Name *</label><input {...register('name', { required: 'Required' })} className="input w-full" />{errors.name && <p className="text-sm text-red-600">{errors.name.message}</p>}</div><div><label className="block text-sm font-medium mb-1">Code *</label><input {...register('code', { required: 'Required' })} className="input w-full uppercase" />{errors.code && <p className="text-sm text-red-600">{errors.code.message}</p>}</div><div><label>Description</label><textarea {...register('description')} rows={3} className="input w-full" /></div><div><label>Order</label><input type="number" {...register('order', { valueAsNumber: true })} className="input w-full" /></div><div className="flex items-center"><input type="checkbox" {...register('isActive')} id="isActive" className="rounded" /><label htmlFor="isActive" className="ml-2 text-sm">Active</label></div><div className="flex justify-end space-x-3 pt-4"><button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">Cancel</button><button type="submit" className="btn-primary">{editingTopic ? 'Update' : 'Create'}</button></div></form></Modal>
    </div>
  );
}
