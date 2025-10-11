'use client';
import { useState, useEffect } from 'react';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { DataTable } from '@/components/ui/common/DataTable';
import { Modal } from '@/components/ui/common/Modal';
import { subsectionService, sectionService } from '@/services/admin/adminService';
import { Subsection, CreateSubsection, Section } from '@/types/admin';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import Link from 'next/link';

export default function SubsectionsPage() {
  const [subsections, setSubsections] = useState<Subsection[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<Subsection | null>(null);
  const [filterSectionId, setFilterSectionId] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateSubsection>();

  useEffect(() => { fetchSections(); }, []);
  useEffect(() => { fetchSubsections(); }, [filterSectionId]);

  const fetchSections = async () => { try { setSections(await sectionService.getAll()); } catch { toast.error('Failed'); } };
  const fetchSubsections = async () => { try { setLoading(true); setSubsections(await subsectionService.getAll(filterSectionId || undefined)); } finally { setLoading(false); } };
  const handleCreate = () => { setEditing(null); reset({ name: '', code: '', description: '', sectionId: filterSectionId, order: 0, isActive: true }); setIsModalOpen(true); };
  const handleEdit = (s: Subsection) => { setEditing(s); reset({ name: s.name, code: s.code, description: s.description || '', sectionId: s.sectionId, order: s.order, isActive: s.isActive }); setIsModalOpen(true); };
  const handleDelete = async (s: Subsection) => { if (!confirm(`Delete "${s.name}"?`)) return; try { await subsectionService.delete(s.id); toast.success('Deleted'); fetchSubsections(); } catch { toast.error('Failed'); } };
  const onSubmit = async (data: CreateSubsection) => { try { editing ? await subsectionService.update(editing.id, data) : await subsectionService.create(data); toast.success(editing ? 'Updated' : 'Created'); setIsModalOpen(false); fetchSubsections(); } catch { toast.error('Failed'); } };
  const handleBatchDelete = async () => { if (!selectedIds.length || !confirm(`Delete ${selectedIds.length}?`)) return; try { await Promise.all(selectedIds.map(id => subsectionService.delete(id))); toast.success(`Deleted ${selectedIds.length}`); setSelectedIds([]); fetchSubsections(); } catch { toast.error('Failed'); } };

  const columns = [
    { key: 'code', header: 'Code', sortable: true, render: (s: Subsection) => <span className="font-mono font-semibold text-primary-600">{s.code}</span> },
    { key: 'name', header: 'Name', sortable: true },
    { key: 'section', header: 'Section', render: (s: Subsection) => s.section?.name || 'N/A' },
    { key: 'order', header: 'Order', sortable: true },
    { key: 'isActive', header: 'Status', render: (s: Subsection) => <span className={`px-2 py-1 text-xs rounded-full ${s.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100'}`}>{s.isActive ? 'Active' : 'Inactive'}</span> },
    { key: 'questions', header: 'Questions', render: (s: Subsection) => s.questions?.length || 0 },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b"><div className="px-4 sm:px-6 lg:px-8 py-6"><div className="flex justify-between"><div><h1 className="text-2xl font-bold">Subsections Management</h1><p className="text-sm text-gray-600">Level 7</p></div><div className="flex space-x-3">{selectedIds.length > 0 && <button onClick={handleBatchDelete} className="btn-secondary flex items-center space-x-2"><TrashIcon className="h-5 w-5" /><span>Delete ({selectedIds.length})</span></button>}<button onClick={handleCreate} className="btn-primary flex items-center space-x-2"><PlusIcon className="h-5 w-5" /><span>Add Subsection</span></button></div></div></div></div>
      <div className="px-4 sm:px-6 lg:px-8 py-4"><nav className="flex justify-between"><ol className="flex items-center space-x-2"><li><Link href="/dashboard" className="text-gray-500 hover:text-gray-700">Dashboard</Link></li><li><span className="mx-2">/</span><span>Subsections</span></li></ol><select value={filterSectionId} onChange={(e) => setFilterSectionId(e.target.value)} className="input"><option value="">All Sections</option>{sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></nav></div>
      <div className="px-4 sm:px-6 lg:px-8 py-8"><DataTable data={subsections} columns={columns} loading={loading} onEdit={handleEdit} onDelete={handleDelete} searchPlaceholder="Search..." emptyMessage="No subsections" selectable selectedIds={selectedIds} onSelectionChange={setSelectedIds} /></div>
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editing ? 'Edit Subsection' : 'Create Subsection'} size="lg"><form onSubmit={handleSubmit(onSubmit)} className="space-y-4"><div><label className="block text-sm font-medium mb-1">Section *</label><select {...register('sectionId', { required: 'Required' })} className="input w-full"><option value="">Select</option>{sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select>{errors.sectionId && <p className="text-sm text-red-600">{errors.sectionId.message}</p>}</div><div><label>Name *</label><input {...register('name', { required: 'Required' })} className="input w-full" />{errors.name && <p className="text-sm text-red-600">{errors.name.message}</p>}</div><div><label>Code *</label><input {...register('code', { required: 'Required' })} className="input w-full uppercase" /></div><div><label>Description</label><textarea {...register('description')} rows={3} className="input w-full" /></div><div><label>Order</label><input type="number" {...register('order', { valueAsNumber: true })} className="input w-full" /></div><div className="flex items-center"><input type="checkbox" {...register('isActive')} id="isActive" className="rounded" /><label htmlFor="isActive" className="ml-2 text-sm">Active</label></div><div className="flex justify-end space-x-3 pt-4"><button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">Cancel</button><button type="submit" className="btn-primary">{editing ? 'Update' : 'Create'}</button></div></form></Modal>
    </div>
  );
}
