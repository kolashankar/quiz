'use client';
import { useState, useEffect, useCallback } from 'react';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { DataTable } from '@/components/ui/common/DataTable';
import { Modal } from '@/components/ui/common/Modal';
import { subtopicService, topicService } from '@/services/admin/adminService';
import { Subtopic, CreateSubtopic, Topic } from '@/types/admin';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import Link from 'next/link';

export default function SubtopicsPage() {
  const [subtopics, setSubtopics] = useState<Subtopic[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<Subtopic | null>(null);
  const [filterTopicId, setFilterTopicId] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateSubtopic>();

  useEffect(() => { fetchTopics(); }, []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchSubtopics(); }, [filterTopicId]);

  const fetchTopics = async () => { try { setTopics(await topicService.getAll()); } catch { toast.error('Failed to fetch topics'); } };
  const fetchSubtopics = async () => { try { setLoading(true); setSubtopics(await subtopicService.getAll(filterTopicId || undefined)); } finally { setLoading(false); } };
  const handleCreate = () => { setEditing(null); reset({ name: '', code: '', description: '', topicId: filterTopicId, order: 0, isActive: true }); setIsModalOpen(true); };
  const handleEdit = (s: Subtopic) => { setEditing(s); reset({ name: s.name, code: s.code, description: s.description || '', topicId: s.topicId, order: s.order, isActive: s.isActive }); setIsModalOpen(true); };
  const handleDelete = async (s: Subtopic) => { if (!confirm(`Delete "${s.name}"?`)) return; try { await subtopicService.delete(s.id); toast.success('Deleted'); fetchSubtopics(); } catch { toast.error('Failed'); } };
  const onSubmit = async (data: CreateSubtopic) => { try { editing ? await subtopicService.update(editing.id, data) : await subtopicService.create(data); toast.success(editing ? 'Updated' : 'Created'); setIsModalOpen(false); fetchSubtopics(); } catch { toast.error('Failed'); } };
  const handleBatchDelete = async () => { if (!selectedIds.length || !confirm(`Delete ${selectedIds.length}?`)) return; try { await Promise.all(selectedIds.map(id => subtopicService.delete(id))); toast.success(`Deleted ${selectedIds.length}`); setSelectedIds([]); fetchSubtopics(); } catch { toast.error('Failed'); } };

  const columns = [
    { key: 'code', header: 'Code', sortable: true, render: (s: Subtopic) => <span className="font-mono font-semibold text-primary-600">{s.code}</span> },
    { key: 'name', header: 'Name', sortable: true },
    { key: 'topic', header: 'Topic', render: (s: Subtopic) => s.topic?.name || 'N/A' },
    { key: 'order', header: 'Order', sortable: true },
    { key: 'isActive', header: 'Status', render: (s: Subtopic) => <span className={`px-2 py-1 text-xs rounded-full ${s.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100'}`}>{s.isActive ? 'Active' : 'Inactive'}</span> },
    { key: 'sections', header: 'Sections', render: (s: Subtopic) => s.sections?.length || 0 },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b"><div className="px-4 sm:px-6 lg:px-8 py-6"><div className="flex justify-between"><div><h1 className="text-2xl font-bold">Subtopics Management</h1><p className="text-sm text-gray-600">Level 5</p></div><div className="flex space-x-3">{selectedIds.length > 0 && <button onClick={handleBatchDelete} className="btn-secondary flex items-center space-x-2"><TrashIcon className="h-5 w-5" /><span>Delete ({selectedIds.length})</span></button>}<button onClick={handleCreate} className="btn-primary flex items-center space-x-2"><PlusIcon className="h-5 w-5" /><span>Add Subtopic</span></button></div></div></div></div>
      <div className="px-4 sm:px-6 lg:px-8 py-4"><nav className="flex justify-between"><ol className="flex items-center space-x-2"><li><Link href="/dashboard" className="text-gray-500 hover:text-gray-700">Dashboard</Link></li><li><span className="mx-2">/</span><span>Subtopics</span></li></ol><select value={filterTopicId} onChange={(e) => setFilterTopicId(e.target.value)} className="input"><option value="">All Topics</option>{topics.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></nav></div>
      <div className="px-4 sm:px-6 lg:px-8 py-8"><DataTable data={subtopics} columns={columns} loading={loading} onEdit={handleEdit} onDelete={handleDelete} searchPlaceholder="Search..." emptyMessage="No subtopics" selectable selectedIds={selectedIds} onSelectionChange={setSelectedIds} /></div>
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editing ? 'Edit Subtopic' : 'Create Subtopic'} size="lg"><form onSubmit={handleSubmit(onSubmit)} className="space-y-4"><div><label className="block text-sm font-medium mb-1">Topic *</label><select {...register('topicId', { required: 'Required' })} className="input w-full"><option value="">Select</option>{topics.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select>{errors.topicId && <p className="text-sm text-red-600">{errors.topicId.message}</p>}</div><div><label>Name *</label><input {...register('name', { required: 'Required' })} className="input w-full" />{errors.name && <p className="text-sm text-red-600">{errors.name.message}</p>}</div><div><label>Code *</label><input {...register('code', { required: 'Required' })} className="input w-full uppercase" /></div><div><label>Description</label><textarea {...register('description')} rows={3} className="input w-full" /></div><div><label>Order</label><input type="number" {...register('order', { valueAsNumber: true })} className="input w-full" /></div><div className="flex items-center"><input type="checkbox" {...register('isActive')} id="isActive" className="rounded" /><label htmlFor="isActive" className="ml-2 text-sm">Active</label></div><div className="flex justify-end space-x-3 pt-4"><button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">Cancel</button><button type="submit" className="btn-primary">{editing ? 'Update' : 'Create'}</button></div></form></Modal>
    </div>
  );
}
