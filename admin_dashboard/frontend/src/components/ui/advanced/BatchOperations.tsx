'use client';

import { useState } from 'react';
import { 
  TrashIcon,
  PencilIcon,
  DocumentArrowDownIcon,
  CheckCircleIcon,
  XCircleIcon,
  TagIcon,
  ClockIcon,
  StarIcon
} from '@heroicons/react/24/outline';
import { Modal } from '@/components/ui/common/Modal';
import toast from 'react-hot-toast';
import { api } from '@/services/auth/authService';

interface BatchOperationsProps {
  selectedIds: string[];
  selectedItems: any[];
  onClearSelection: () => void;
  onRefresh: () => void;
  entityType: 'questions' | 'exams' | 'subjects' | 'chapters' | 'topics' | 'subtopics' | 'sections' | 'subsections';
}

interface BatchAction {
  id: string;
  label: string;
  icon: any;
  color: string;
  description: string;
  requiresInput?: boolean;
  inputType?: 'text' | 'select' | 'number';
  inputOptions?: { value: string; label: string }[];
}

export function BatchOperations({ 
  selectedIds, 
  selectedItems, 
  onClearSelection, 
  onRefresh,
  entityType 
}: BatchOperationsProps) {
  const [showModal, setShowModal] = useState(false);
  const [selectedAction, setSelectedAction] = useState<BatchAction | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);

  const batchActions: BatchAction[] = [
    {
      id: 'delete',
      label: 'Delete Selected',
      icon: TrashIcon,
      color: 'text-red-600',
      description: 'Permanently delete selected items'
    },
    {
      id: 'activate',
      label: 'Activate',
      icon: CheckCircleIcon,
      color: 'text-green-600',
      description: 'Mark selected items as active'
    },
    {
      id: 'deactivate',
      label: 'Deactivate',
      icon: XCircleIcon,
      color: 'text-gray-600',
      description: 'Mark selected items as inactive'
    },
    {
      id: 'export',
      label: 'Export CSV',
      icon: DocumentArrowDownIcon,
      color: 'text-blue-600',
      description: 'Export selected items to CSV'
    }
  ];

  // Add entity-specific actions
  if (entityType === 'questions') {
    batchActions.push(
      {
        id: 'difficulty',
        label: 'Set Difficulty',
        icon: StarIcon,
        color: 'text-yellow-600',
        description: 'Change difficulty level of selected questions',
        requiresInput: true,
        inputType: 'select',
        inputOptions: [
          { value: 'easy', label: 'Easy' },
          { value: 'medium', label: 'Medium' },
          { value: 'hard', label: 'Hard' }
        ]
      },
      {
        id: 'timeLimit',
        label: 'Set Time Limit',
        icon: ClockIcon,
        color: 'text-purple-600',
        description: 'Set time limit for selected questions',
        requiresInput: true,
        inputType: 'number'
      },
      {
        id: 'tags',
        label: 'Add Tags',
        icon: TagIcon,
        color: 'text-indigo-600',
        description: 'Add tags to selected questions',
        requiresInput: true,
        inputType: 'text'
      }
    );
  }

  const handleActionClick = (action: BatchAction) => {
    setSelectedAction(action);
    setInputValue('');
    
    if (!action.requiresInput) {
      handleExecuteAction(action);
    } else {
      setShowModal(true);
    }
  };

  const handleExecuteAction = async (action: BatchAction, input?: string) => {
    setLoading(true);
    
    try {
      switch (action.id) {
        case 'delete':
          await handleBatchDelete();
          break;
        case 'activate':
          await handleBatchUpdate({ isActive: true });
          break;
        case 'deactivate':
          await handleBatchUpdate({ isActive: false });
          break;
        case 'export':
          await handleExport();
          break;
        case 'difficulty':
          await handleBatchUpdate({ difficulty: input });
          break;
        case 'timeLimit':
          await handleBatchUpdate({ timeLimit: parseInt(input || '60') });
          break;
        case 'tags':
          const tags = input?.split(',').map(tag => tag.trim()) || [];
          await handleBatchUpdate({ tags });
          break;
        default:
          toast.error('Unknown action');
      }
    } catch (error) {
      console.error('Batch operation failed:', error);
    } finally {
      setLoading(false);
      setShowModal(false);
      setSelectedAction(null);
    }
  };

  const handleBatchDelete = async () => {
    const confirmed = confirm(`Are you sure you want to delete ${selectedIds.length} ${entityType}?`);
    if (!confirmed) return;

    try {
      await api.delete(`/admin/${entityType}/batch`, {
        data: { ids: selectedIds }
      });
      
      toast.success(`Deleted ${selectedIds.length} ${entityType}`);
      onClearSelection();
      onRefresh();
    } catch (error: any) {
      toast.error('Failed to delete items');
    }
  };

  const handleBatchUpdate = async (updates: any) => {
    try {
      await api.patch(`/admin/${entityType}/batch`, {
        ids: selectedIds,
        updates
      });
      
      toast.success(`Updated ${selectedIds.length} ${entityType}`);
      onClearSelection();
      onRefresh();
    } catch (error: any) {
      toast.error('Failed to update items');
    }
  };

  const handleExport = async () => {
    try {
      const response = await api.post(`/admin/${entityType}/export`, {
        ids: selectedIds
      }, {
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${entityType}_export_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      window.URL.revokeObjectURL(url);
      
      toast.success(`Exported ${selectedIds.length} ${entityType}`);
      onClearSelection();
    } catch (error: any) {
      toast.error('Failed to export items');
    }
  };

  if (selectedIds.length === 0) {
    return null;
  }

  return (
    <>
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40">
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg border border-gray-200 dark:border-gray-600 p-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {selectedIds.length} {entityType} selected
              </span>
              <button
                onClick={onClearSelection}
                className="text-gray-500 hover:text-gray-700 text-sm"
              >
                Clear
              </button>
            </div>
            
            <div className="flex items-center space-x-2">
              {batchActions.map((action) => (
                <button
                  key={action.id}
                  onClick={() => handleActionClick(action)}
                  disabled={loading}
                  className={`flex items-center space-x-1 px-3 py-2 text-sm font-medium rounded-lg border border-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 ${action.color} ${
                    loading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  title={action.description}
                >
                  <action.icon className="h-4 w-4" />
                  <span>{action.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Input Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={`${selectedAction?.label} - ${selectedIds.length} items`}
        size="md"
      >
        {selectedAction && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {selectedAction.description}
            </p>
            
            {selectedAction.inputType === 'select' && selectedAction.inputOptions ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select Value
                </label>
                <select
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  className="input w-full"
                >
                  <option value="">Choose...</option>
                  {selectedAction.inputOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            ) : selectedAction.inputType === 'number' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Enter Value
                </label>
                <input
                  type="number"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  className="input w-full"
                  placeholder="Enter number..."
                />
              </div>
            ) : selectedAction.inputType === 'text' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Enter Text
                </label>
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  className="input w-full"
                  placeholder="Enter text (comma-separated for tags)..."
                />
              </div>
            ) : null}
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowModal(false)}
                className="btn-secondary"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={() => handleExecuteAction(selectedAction, inputValue)}
                className="btn-primary"
                disabled={loading || (selectedAction.requiresInput && !inputValue.trim())}
              >
                {loading ? 'Processing...' : 'Apply'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}