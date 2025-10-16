'use client';

import { useState, useEffect, useMemo } , useCallback , useCallback } from 'react';
import { PlusIcon, TrashIcon, SparklesIcon, ClockIcon, StarIcon } from '@heroicons/react/24/outline';
import { DataTable } from '@/components/ui/common/DataTable';
import { Modal } from '@/components/ui/common/Modal';
import { QuestionEditor } from '@/components/ui/advanced/QuestionEditor';
import { BatchOperations } from '@/components/ui/advanced/BatchOperations';
import { questionService, subsectionService, aiService } from '@/services/admin/adminService';
import { Question, CreateQuestion, Subsection } from '@/types/admin';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import Link from 'next/link';

export default function QuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [subsections, setSubsections] = useState<Subsection[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [editing, setEditing] = useState<Question | null>(null);
  const [filterSubsectionId, setFilterSubsectionId] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [aiGenerating, setAIGenerating] = useState(false);

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<CreateQuestion>();

  const [questionText, setQuestionText] = useState('');
  const [explanation, setExplanation] = useState('');

  useEffect(() => { fetchSubsections(); }, []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchQuestions(); }, [filterSubsectionId, filterDifficulty, currentPage]);

  const fetchSubsections = async () => {
    try {
      setSubsections(await subsectionService.getAll());
    } catch (error: any) {
      toast.error('Failed to fetch subsections');
    }
  };

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const response = await questionService.getAll({
        subsectionId: filterSubsectionId || undefined,
        difficulty: filterDifficulty || undefined,
        page: currentPage,
        limit: 10
      });
      setQuestions(response.questions || []);
      setTotalPages(response.pagination.pages);
    } catch (error: any) {
      toast.error('Failed to fetch questions');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditing(null);
    reset({
      text: '',
      options: ['', '', '', ''],
      correctAnswer: 0,
      explanation: '',
      difficulty: 'medium',
      tags: [],
      timeLimit: 60,
      marks: 1,
      negativeMarks: 0,
      subsectionId: filterSubsectionId || '',
      isActive: true
    });
    setQuestionText('');
    setExplanation('');
    setIsModalOpen(true);
  };

  const handleEdit = (q: Question) => {
    setEditing(q);
    reset({
      text: q.text,
      options: q.options,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation || '',
      difficulty: q.difficulty,
      tags: q.tags,
      timeLimit: q.timeLimit || 60,
      marks: q.marks,
      negativeMarks: q.negativeMarks || 0,
      subsectionId: q.subsectionId,
      isActive: q.isActive
    });
    setQuestionText(q.text);
    setExplanation(q.explanation || '');
    setIsModalOpen(true);
  };

  const handleDelete = async (q: Question) => {
    if (!confirm(`Delete this question?`)) return;
    try {
      await questionService.delete(q.id);
      toast.success('Deleted');
      fetchQuestions();
    } catch (error: any) {
      toast.error('Failed to delete');
    }
  };

  const onSubmit = async (data: CreateQuestion) => {
    try {
      const submitData = {
        ...data,
        text: questionText,
        explanation
      };

      if (editing) {
        await questionService.update(editing.id, submitData);
        toast.success('Updated');
      } else {
        await questionService.create(submitData);
        toast.success('Created');
      }
      setIsModalOpen(false);
      fetchQuestions();
    } catch (error: any) {
      toast.error('Failed to save');
    }
  };

  const handleBatchDelete = async () => {
    if (!selectedIds.length || !confirm(`Delete ${selectedIds.length} question(s)?`)) return;
    try {
      await questionService.batchDelete(selectedIds);
      toast.success(`Deleted ${selectedIds.length}`);
      setSelectedIds([]);
      fetchQuestions();
    } catch (error: any) {
      toast.error('Failed to delete');
    }
  };

  const handleBatchUpdate = async (updates: any) => {
    if (!selectedIds.length) {
      toast.error('No questions selected');
      return;
    }
    try {
      await questionService.batchUpdate({ ids: selectedIds, updates });
      toast.success(`Updated ${selectedIds.length} question(s)`);
      setSelectedIds([]);
      setIsBatchModalOpen(false);
      fetchQuestions();
    } catch (error: any) {
      toast.error('Failed to update');
    }
  };

  const handleAIGenerate = async (
    topic: string,
    difficulty: "easy" | "medium" | "hard",
    count: number
  ) => {    
    setAIGenerating(true);
    try {
      const response = await aiService.generateQuestions({ topic, difficulty, count });
      toast.success(`Generated ${response.questions.length} question(s)`);
      // Create questions
      for (const q of response.questions) {
        await questionService.create({ ...q, subsectionId: filterSubsectionId });
      }
      setIsAIModalOpen(false);
      fetchQuestions();
    } catch (error: any) {
      toast.error('Failed to generate questions');
    } finally {
      setAIGenerating(false);
    }
  };

  const handleAISuggestDifficulty = async () => {
    if (!questionText) {
      toast.error('Enter question text first');
      return;
    }
    try {
      const response = await aiService.suggestDifficulty(questionText);
      setValue('difficulty', response.difficulty as any);
      toast.success(`Suggested: ${response.difficulty}`);
    } catch (error: any) {
      toast.error('Failed to suggest difficulty');
    }
  };

  const handleAIGenerateExplanation = async () => {
    if (!questionText) {
      toast.error('Enter question text first');
      return;
    }
    const options = watch('options');
    const correctAnswer = watch('correctAnswer');
    if (!options || !options[correctAnswer]) {
      toast.error('Set correct answer first');
      return;
    }
    try {
      const response = await aiService.generateExplanation(questionText, options[correctAnswer]);
      setExplanation(response.explanation);
      toast.success('Generated explanation');
    } catch (error: any) {
      toast.error('Failed to generate explanation');
    }
  };

  const columns = [
    { key: 'text', header: 'Question', render: (q: Question) => (
      <div className="max-w-md" dangerouslySetInnerHTML={{ __html: q.text.substring(0, 100) + '...' }} />
    )},
    { key: 'difficulty', header: 'Difficulty', sortable: true, render: (q: Question) => (
      <span className={`px-2 py-1 text-xs rounded-full ${
        q.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
        q.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
        'bg-red-100 text-red-800'
      }`}>{q.difficulty}</span>
    )},
    { key: 'marks', header: 'Marks', sortable: true },
    { key: 'timeLimit', header: 'Time (s)', sortable: true },
    { key: 'subsection', header: 'Subsection', render: (q: Question) => q.subsection?.name || 'N/A' },
    { key: 'isActive', header: 'Status', render: (q: Question) => (
      <span className={`px-2 py-1 text-xs rounded-full ${q.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100'}`}>
        {q.isActive ? 'Active' : 'Inactive'}
      </span>
    )}
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between">
            <div>
              <h1 className="text-2xl font-bold">Questions Management</h1>
              <p className="text-sm text-gray-600">Level 8 - Manage quiz questions</p>
            </div>
            <div className="flex space-x-3">
              {selectedIds.length > 0 && (
                <>
                  <button onClick={handleBatchDelete} className="btn-secondary flex items-center space-x-2">
                    <TrashIcon className="h-5 w-5" /><span>Delete ({selectedIds.length})</span>
                  </button>
                  <button onClick={() => setIsBatchModalOpen(true)} className="btn-secondary flex items-center space-x-2">
                    <ClockIcon className="h-5 w-5" /><span>Batch Edit</span>
                  </button>
                </>
              )}
              <button onClick={() => setIsAIModalOpen(true)} className="btn-secondary flex items-center space-x-2">
                <SparklesIcon className="h-5 w-5" /><span>AI Generate</span>
              </button>
              <button onClick={handleCreate} className="btn-primary flex items-center space-x-2">
                <PlusIcon className="h-5 w-5" /><span>Add Question</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 py-4">
        <nav className="flex justify-between">
          <ol className="flex items-center space-x-2">
            <li><Link href="/dashboard" className="text-gray-500 hover:text-gray-700">Dashboard</Link></li>
            <li><span className="mx-2">/</span><span>Questions</span></li>
          </ol>
          <div className="flex space-x-2">
            <select value={filterSubsectionId} onChange={(e) => setFilterSubsectionId(e.target.value)} className="input">
              <option value="">All Subsections</option>
              {subsections.map(ss => <option key={ss.id} value={ss.id}>{ss.name}</option>)}
            </select>
            <select value={filterDifficulty} onChange={(e) => setFilterDifficulty(e.target.value)} className="input">
              <option value="">All Difficulties</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
        </nav>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <DataTable data={questions} columns={columns} loading={loading} onEdit={handleEdit} onDelete={handleDelete} searchPlaceholder="Search questions..." emptyMessage="No questions" selectable selectedIds={selectedIds} onSelectionChange={setSelectedIds} />
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-4 flex justify-center space-x-2">
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="btn-secondary">Previous</button>
            <span className="py-2 px-4">Page {currentPage} of {totalPages}</span>
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="btn-secondary">Next</button>
          </div>
        )}
      </div>

      {/* Batch Operations */}
      <BatchOperations 
        selectedIds={selectedIds}
        selectedItems={questions.filter(q => selectedIds.includes(q.id))}
        onClearSelection={() => setSelectedIds([])}
        onRefresh={fetchQuestions}
        entityType="questions"
      />

      {/* Create/Edit Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editing ? 'Edit Question' : 'Create Question'} size="2xl">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto">
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-medium">Question Text *</label>
              <button type="button" onClick={handleAISuggestDifficulty} className="text-xs text-primary-600 hover:text-primary-700 flex items-center">
                <SparklesIcon className="h-4 w-4 mr-1" />AI Suggest Difficulty
              </button>
            </div>
            <QuestionEditor 
              value={questionText} 
              onChange={setQuestionText} 
              placeholder="Enter your question here..."
              enableAI={true}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Subsection *</label>
            <select {...register('subsectionId', { required: 'Required' })} className="input w-full">
              <option value="">Select</option>
              {subsections.map(ss => <option key={ss.id} value={ss.id}>{ss.name}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[0, 1, 2, 3].map(i => (
              <div key={i}>
                <label className="block text-sm font-medium mb-1">Option {String.fromCharCode(65 + i)} *</label>
                <input {...register(`options.${i}` as any, { required: 'Required' })} className="input w-full" placeholder={`Option ${String.fromCharCode(65 + i)}`} />
              </div>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Correct Answer *</label>
              <select {...register('correctAnswer', { required: 'Required', valueAsNumber: true })} className="input w-full">
                <option value={0}>A</option>
                <option value={1}>B</option>
                <option value={2}>C</option>
                <option value={3}>D</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Difficulty *</label>
              <select {...register('difficulty', { required: 'Required' })} className="input w-full">
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Time Limit (s)</label>
              <input type="number" {...register('timeLimit', { valueAsNumber: true })} className="input w-full" placeholder="60" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Marks</label>
              <input type="number" {...register('marks', { valueAsNumber: true })} className="input w-full" placeholder="1" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Negative Marks</label>
              <input type="number" step="0.1" {...register('negativeMarks', { valueAsNumber: true })} className="input w-full" placeholder="0" />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-medium">Explanation</label>
              <button type="button" onClick={handleAIGenerateExplanation} className="text-xs text-primary-600 hover:text-primary-700 flex items-center">
                <SparklesIcon className="h-4 w-4 mr-1" />AI Generate
              </button>
            </div>
            <QuestionEditor 
              value={explanation} 
              onChange={setExplanation} 
              placeholder="Enter explanation here..."
              enableAI={true}
            />
          </div>

          <div className="flex items-center">
            <input type="checkbox" {...register('isActive')} id="isActive" className="rounded" />
            <label htmlFor="isActive" className="ml-2 text-sm">Active</label>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">{editing ? 'Update' : 'Create'}</button>
          </div>
        </form>
      </Modal>

      {/* Batch Edit Modal */}
      <Modal isOpen={isBatchModalOpen} onClose={() => setIsBatchModalOpen(false)} title="Batch Update Questions" size="lg">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Update {selectedIds.length} selected question(s)</p>
          <button onClick={() => handleBatchUpdate({ difficulty: 'easy' })} className="btn-secondary w-full">Set Difficulty: Easy</button>
          <button onClick={() => handleBatchUpdate({ difficulty: 'medium' })} className="btn-secondary w-full">Set Difficulty: Medium</button>
          <button onClick={() => handleBatchUpdate({ difficulty: 'hard' })} className="btn-secondary w-full">Set Difficulty: Hard</button>
          <button onClick={() => handleBatchUpdate({ timeLimit: 60 })} className="btn-secondary w-full">Set Time: 60s</button>
          <button onClick={() => handleBatchUpdate({ timeLimit: 90 })} className="btn-secondary w-full">Set Time: 90s</button>
          <button onClick={() => handleBatchUpdate({ marks: 1 })} className="btn-secondary w-full">Set Marks: 1</button>
          <button onClick={() => handleBatchUpdate({ marks: 2 })} className="btn-secondary w-full">Set Marks: 2</button>
          <button onClick={() => handleBatchUpdate({ isActive: true })} className="btn-secondary w-full">Activate All</button>
          <button onClick={() => handleBatchUpdate({ isActive: false })} className="btn-secondary w-full">Deactivate All</button>
        </div>
      </Modal>

      {/* AI Generate Modal */}
      <Modal isOpen={isAIModalOpen} onClose={() => setIsAIModalOpen(false)} title="AI Generate Questions" size="lg">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target as any);

              const topic = formData.get('topic') as string;
              const difficulty = formData.get('difficulty') as 'easy' | 'medium' | 'hard';
              const count = parseInt(formData.get('count') as string);

              handleAIGenerate(topic, difficulty, count);
            }}
            className="space-y-4"
          >          
          <div>
            <label className="block text-sm font-medium mb-1">Topic</label>
            <input name="topic" className="input w-full" placeholder="e.g., Newton's Laws of Motion" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Difficulty</label>
            <select name="difficulty" className="input w-full" defaultValue="medium">
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Count</label>
            <input name="count" type="number" min="1" max="10" defaultValue="3" className="input w-full" />
          </div>
          {filterSubsectionId && <p className="text-sm text-gray-600">Questions will be added to the selected subsection</p>}
          {!filterSubsectionId && <p className="text-sm text-red-600">Please select a subsection filter first</p>}
          <div className="flex justify-end space-x-3">
            <button type="button" onClick={() => setIsAIModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={aiGenerating || !filterSubsectionId} className="btn-primary">
              {aiGenerating ? 'Generating...' : 'Generate'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
