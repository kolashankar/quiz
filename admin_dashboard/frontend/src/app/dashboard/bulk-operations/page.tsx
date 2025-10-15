'use client';

import { useState, useEffect } from 'react';
import { api } from '@/services/auth/authService';
import { Spinner } from '@/components/ui/common/Spinner';
import { 
  PencilIcon, 
  TrashIcon, 
  ArrowDownTrayIcon,
  CheckIcon
} from '@heroicons/react/24/outline';

export default function BulkOperationsPage() {
  const [loading, setLoading] = useState(false);
  const [statistics, setStatistics] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'edit' | 'delete' | 'export' | 'batch'>('edit');
  
  // Edit state
  const [editQuestionIds, setEditQuestionIds] = useState('');
  const [editDifficulty, setEditDifficulty] = useState('');
  const [editTags, setEditTags] = useState('');
  const [editMarks, setEditMarks] = useState('');
  const [editIsActive, setEditIsActive] = useState<boolean | ''>('');
  
  // Delete state
  const [deleteQuestionIds, setDeleteQuestionIds] = useState('');
  const [deleteDifficulty, setDeleteDifficulty] = useState('');
  const [deleteIsActive, setDeleteIsActive] = useState<boolean | ''>('');
  
  // Export state
  const [exportFormat, setExportFormat] = useState('csv');
  const [exportDifficulty, setExportDifficulty] = useState('');
  
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      const response = await api.get('/admin/bulk-operations/statistics');
      setStatistics(response.data);
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  const handleBulkEdit = async () => {
    if (!editQuestionIds.trim()) {
      setMessage({ type: 'error', text: 'Please enter question IDs' });
      return;
    }

    setLoading(true);
    try {
      const questionIds = editQuestionIds.split(',').map(id => id.trim());
      const updates: any = {};
      
      if (editDifficulty) updates.difficulty = editDifficulty;
      if (editTags) updates.tags = editTags.split(',').map(t => t.trim());
      if (editMarks) updates.marks = parseInt(editMarks);
      if (editIsActive !== '') updates.isActive = editIsActive;

      const response = await api.post('/admin/bulk-operations/questions/edit', {
        questionIds,
        updates
      });

      setMessage({ type: 'success', text: response.data.message });
      fetchStatistics();
      // Reset form
      setEditQuestionIds('');
      setEditDifficulty('');
      setEditTags('');
      setEditMarks('');
      setEditIsActive('');
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Bulk edit failed' });
    } finally {
      setLoading(false);
    }
  };

  const handleBulkDelete = async () {
    if (!deleteQuestionIds.trim() && !deleteDifficulty && deleteIsActive === '') {
      setMessage({ type: 'error', text: 'Please provide question IDs or filters' });
      return;
    }

    const confirmed = window.confirm('Are you sure you want to delete these questions? This action cannot be undone.');
    if (!confirmed) {
      return;
    }

    setLoading(true);
    try {
      const payload: any = {};
      
      if (deleteQuestionIds.trim()) {
        payload.questionIds = deleteQuestionIds.split(',').map(id => id.trim());
      } else {
        const filters: any = {};
        if (deleteDifficulty) filters.difficulty = deleteDifficulty;
        if (deleteIsActive !== '') filters.isActive = deleteIsActive;
        payload.filters = filters;
      }

      const response = await api.post('/admin/bulk-operations/questions/delete', payload);
      setMessage({ type: 'success', text: response.data.message });
      fetchStatistics();
      // Reset form
      setDeleteQuestionIds('');
      setDeleteDifficulty('');
      setDeleteIsActive('');
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Bulk delete failed' });
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('format', exportFormat);
      if (exportDifficulty) params.append('difficulty', exportDifficulty);

      const response = await api.get(`/admin/bulk-operations/questions/export?${params.toString()}`, {
        responseType: 'blob'
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `questions_export.${exportFormat}`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      setMessage({ type: 'success', text: 'Export completed successfully' });
    } catch (error: any) {
      setMessage({ type: 'error', text: 'Export failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Bulk Operations</h1>

      {/* Statistics */}
      {statistics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Questions</p>
            <p className="text-2xl font-bold">{statistics.totalQuestions}</p>
          </div>
          <div className="card p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">Active</p>
            <p className="text-2xl font-bold text-green-600">{statistics.activeQuestions}</p>
          </div>
          <div className="card p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">Inactive</p>
            <p className="text-2xl font-bold text-red-600">{statistics.inactiveQuestions}</p>
          </div>
          <div className="card p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">By Difficulty</p>
            <p className="text-xs mt-1">
              Easy: {statistics.byDifficulty?.easy || 0}, 
              Medium: {statistics.byDifficulty?.medium || 0}, 
              Hard: {statistics.byDifficulty?.hard || 0}
            </p>
          </div>
        </div>
      )}

      {/* Message */}
      {message && (
        <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-200' : 'bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-200'}`}>
          {message.text}
        </div>
      )}

      {/* Tabs */}
      <div className="card">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6 pt-6" aria-label="Tabs">
            {[
              { id: 'edit', name: 'Bulk Edit', icon: PencilIcon },
              { id: 'delete', name: 'Bulk Delete', icon: TrashIcon },
              { id: 'export', name: 'Export', icon: ArrowDownTrayIcon },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } flex items-center whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                >
                  <Icon className="h-5 w-5 mr-2" />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {/* Bulk Edit Tab */}
          {activeTab === 'edit' && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Bulk Edit Questions</h3>
              <div>
                <label className="block text-sm font-medium mb-1">Question IDs (comma-separated)</label>
                <textarea
                  value={editQuestionIds}
                  onChange={(e) => setEditQuestionIds(e.target.value)}
                  placeholder="e.g., 60f7b3d4e8f0a2b3c4d5e6f7, 60f7b3d4e8f0a2b3c4d5e6f8"
                  className="input"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Difficulty</label>
                  <select value={editDifficulty} onChange={(e) => setEditDifficulty(e.target.value)} className="input">
                    <option value="">No change</option>
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Marks</label>
                  <input
                    type="number"
                    value={editMarks}
                    onChange={(e) => setEditMarks(e.target.value)}
                    placeholder="Leave empty for no change"
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Tags (comma-separated)</label>
                  <input
                    value={editTags}
                    onChange={(e) => setEditTags(e.target.value)}
                    placeholder="e.g., physics, mechanics"
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Active Status</label>
                  <select value={editIsActive.toString()} onChange={(e) => setEditIsActive(e.target.value === '' ? '' : e.target.value === 'true')} className="input">
                    <option value="">No change</option>
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
              </div>
              <button onClick={handleBulkEdit} disabled={loading} className="btn-primary">
                {loading ? <Spinner size="sm" /> : 'Apply Bulk Edit'}
              </button>
            </div>
          )}

          {/* Bulk Delete Tab */}
          {activeTab === 'delete' && (
            <div className="space-y-4">
              <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <p className="text-sm text-red-800 dark:text-red-200">⚠️ Warning: Bulk delete is permanent and cannot be undone!</p>
              </div>
              <h3 className="text-lg font-medium">Bulk Delete Questions</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Provide either specific question IDs OR filters (not both)</p>
              <div>
                <label className="block text-sm font-medium mb-1">Question IDs (comma-separated)</label>
                <textarea
                  value={deleteQuestionIds}
                  onChange={(e) => setDeleteQuestionIds(e.target.value)}
                  placeholder="e.g., 60f7b3d4e8f0a2b3c4d5e6f7, 60f7b3d4e8f0a2b3c4d5e6f8"
                  className="input"
                  rows={3}
                />
              </div>
              <p className="text-sm text-gray-500">OR use filters:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Difficulty</label>
                  <select value={deleteDifficulty} onChange={(e) => setDeleteDifficulty(e.target.value)} className="input">
                    <option value="">All</option>
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Status</label>
                  <select value={deleteIsActive.toString()} onChange={(e) => setDeleteIsActive(e.target.value === '' ? '' : e.target.value === 'true')} className="input">
                    <option value="">All</option>
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
              </div>
              <button onClick={handleBulkDelete} disabled={loading} className="btn-danger">
                {loading ? <Spinner size="sm" /> : 'Delete Questions'}
              </button>
            </div>
          )}

          {/* Export Tab */}
          {activeTab === 'export' && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Export Questions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Format</label>
                  <select value={exportFormat} onChange={(e) => setExportFormat(e.target.value)} className="input">
                    <option value="csv">CSV</option>
                    <option value="json">JSON</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Difficulty Filter (Optional)</label>
                  <select value={exportDifficulty} onChange={(e) => setExportDifficulty(e.target.value)} className="input">
                    <option value="">All</option>
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
              </div>
              <button onClick={handleExport} disabled={loading} className="btn-primary">
                {loading ? <Spinner size="sm" /> : 'Export Questions'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}