'use client';

import { useState, useEffect } from 'react';
import { api } from '@/services/auth/authService';
import { Spinner } from '@/components/ui/common/Spinner';
import { 
  ClipboardDocumentListIcon,
  FlagIcon,
  AdjustmentsHorizontalIcon,
  DocumentDuplicateIcon,
  StarIcon
} from '@heroicons/react/24/outline';

export default function QuestionQualityPage() {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'review' | 'flagged' | 'adjust' | 'duplicates'>('review');
  
  const [reviewQueue, setReviewQueue] = useState<any[]>([]);
  const [flaggedQuestions, setFlaggedQuestions] = useState<any[]>([]);
  const [adjustmentResults, setAdjustmentResults] = useState<any>(null);
  const [duplicateGroups, setDuplicateGroups] = useState<any[]>([]);
  
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    if (activeTab === 'review') fetchReviewQueue();
    if (activeTab === 'flagged') fetchFlaggedQuestions();
  }, [activeTab]);

  const fetchReviewQueue = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/question-quality/review-queue?limit=20');
      setReviewQueue(response.data.questions || []);
    } catch (error) {
      console.error('Error fetching review queue:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFlaggedQuestions = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/question-quality/flagged?status=pending');
      setFlaggedQuestions(response.data.flaggedQuestions || []);
    } catch (error) {
      console.error('Error fetching flagged questions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAutoAdjust = async () => {
    setLoading(true);
    try {
      const response = await api.post('/admin/question-quality/auto-adjust-difficulty', {
        minAttempts: 10
      });
      setAdjustmentResults(response.data);
      setMessage({ type: 'success', text: response.data.message });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Auto-adjustment failed' });
    } finally {
      setLoading(false);
    }
  };

  const handleDetectDuplicates = async () => {
    setLoading(true);
    try {
      const response = await api.post('/admin/question-quality/detect-duplicates', {
        threshold: 0.8
      });
      setDuplicateGroups(response.data.duplicateGroups || []);
      setMessage({ 
        type: 'success', 
        text: `Found ${response.data.totalGroups} groups of duplicate questions` 
      });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Duplicate detection failed' });
    } finally {
      setLoading(false);
    }
  };

  const updateFlaggedStatus = async (id: string, status: string, notes: string) => {
    try {
      await api.put(`/admin/question-quality/flagged/${id}`, {
        status,
        reviewNotes: notes
      });
      setMessage({ type: 'success', text: 'Status updated successfully' });
      fetchFlaggedQuestions();
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update status' });
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Question Quality Tools</h1>

      {message && (
        <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {message.text}
        </div>
      )}

      {/* Tabs */}
      <div className="card">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6 pt-6" aria-label="Tabs">
            {[
              { id: 'review', name: 'Review Queue', icon: ClipboardDocumentListIcon },
              { id: 'flagged', name: 'Flagged Questions', icon: FlagIcon },
              { id: 'adjust', name: 'Auto-Adjust Difficulty', icon: AdjustmentsHorizontalIcon },
              { id: 'duplicates', name: 'Duplicate Detection', icon: DocumentDuplicateIcon },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
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
          {/* Review Queue Tab */}
          {activeTab === 'review' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Recently Added Questions</h3>
                <button onClick={fetchReviewQueue} className="btn-secondary text-sm">
                  Refresh
                </button>
              </div>
              {loading ? (
                <div className="flex justify-center py-8">
                  <Spinner size="lg" />
                </div>
              ) : reviewQueue.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No questions in review queue</p>
              ) : (
                <div className="space-y-3">
                  {reviewQueue.map((q: any, idx: number) => (
                    <div key={idx} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{q.text}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-600 dark:text-gray-400">
                            <span className="badge badge-{q.difficulty === 'easy' ? 'success' : q.difficulty === 'hard' ? 'danger' : 'warning'}">
                              {q.difficulty}
                            </span>
                            <span>{q.subsection?.section?.subtopic?.topic?.chapter?.subject?.exam?.name} - {q.subsection?.section?.subtopic?.topic?.chapter?.subject?.name}</span>
                            <span>Attempts: {q.statistics?.attemptCount || 0}</span>
                            <span>Success: {q.statistics?.successRate || 0}%</span>
                          </div>
                        </div>
                        <div className="ml-4">
                          {q.statistics?.attemptCount > 0 && (
                            <div className="flex items-center text-yellow-600">
                              <StarIcon className="h-5 w-5" />
                              <span className="ml-1 text-sm">Quality Score Available</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Flagged Questions Tab */}
          {activeTab === 'flagged' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Flagged Questions</h3>
                <button onClick={fetchFlaggedQuestions} className="btn-secondary text-sm">
                  Refresh
                </button>
              </div>
              {loading ? (
                <div className="flex justify-center py-8">
                  <Spinner size="lg" />
                </div>
              ) : flaggedQuestions.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No flagged questions</p>
              ) : (
                <div className="space-y-4">
                  {flaggedQuestions.map((flag: any, idx: number) => (
                    <div key={idx} className="border border-red-200 dark:border-red-700 rounded-lg p-4 bg-red-50 dark:bg-red-900/10">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium">{flag.question?.text || 'Question not found'}</p>
                          <div className="mt-2 space-y-1 text-sm">
                            <p><span className="font-medium">Reason:</span> {flag.reason}</p>
                            {flag.description && <p><span className="font-medium">Description:</span> {flag.description}</p>}
                            <p className="text-xs text-gray-600 dark:text-gray-400">Flagged on: {new Date(flag.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="ml-4 flex gap-2">
                          <button
                            onClick={() => updateFlaggedStatus(flag.id, 'resolved', 'Issue resolved')}
                            className="btn-success text-xs"
                          >
                            Resolve
                          </button>
                          <button
                            onClick={() => updateFlaggedStatus(flag.id, 'rejected', 'Not an issue')}
                            className="btn-secondary text-xs"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Auto-Adjust Difficulty Tab */}
          {activeTab === 'adjust' && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Auto-Adjust Question Difficulty</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Automatically adjust question difficulty levels based on success rates:
              </p>
              <ul className="text-sm text-gray-600 dark:text-gray-400 list-disc list-inside space-y-1">
                <li>Success rate &gt; 80% → Easy</li>
                <li>Success rate 50-80% → Medium</li>
                <li>Success rate &lt; 50% → Hard</li>
              </ul>
              <button 
                onClick={handleAutoAdjust} 
                disabled={loading} 
                className="btn-primary"
              >
                {loading ? <Spinner size="sm" /> : 'Run Auto-Adjustment'}
              </button>

              {adjustmentResults && (
                <div className="mt-6 space-y-4">
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="font-medium">
                      Adjusted {adjustmentResults.adjustedCount} questions
                    </p>
                  </div>
                  {adjustmentResults.adjustments?.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium">Adjustments Made:</h4>
                      {adjustmentResults.adjustments.slice(0, 10).map((adj: any, idx: number) => (
                        <div key={idx} className="p-3 border border-gray-200 dark:border-gray-700 rounded">
                          <p className="text-sm">
                            <span className="badge badge-secondary">{adj.oldDifficulty}</span>
                            {' → '}
                            <span className="badge badge-primary">{adj.newDifficulty}</span>
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            Success Rate: {adj.successRate}% | Attempts: {adj.attemptCount}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Duplicate Detection Tab */}
          {activeTab === 'duplicates' && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">AI-Powered Duplicate Detection</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Uses Gemini AI to detect semantically similar questions, not just exact matches.
              </p>
              <button 
                onClick={handleDetectDuplicates} 
                disabled={loading} 
                className="btn-primary"
              >
                {loading ? <Spinner size="sm" /> : 'Detect Duplicates'}
              </button>

              {duplicateGroups.length > 0 && (
                <div className="mt-6 space-y-4">
                  <h4 className="font-medium">Found {duplicateGroups.length} groups of similar questions:</h4>
                  {duplicateGroups.map((group: any, idx: number) => (
                    <div key={idx} className="border border-yellow-200 dark:border-yellow-700 rounded-lg p-4 bg-yellow-50 dark:bg-yellow-900/10">
                      <div className="flex items-center justify-between mb-3">
                        <p className="font-medium">Group {idx + 1}</p>
                        <span className="badge badge-warning">Similarity: {(group.similarityScore * 100).toFixed(0)}%</span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{group.reason}</p>
                      <div className="space-y-2">
                        {group.questions?.map((q: any, qIdx: number) => (
                          <div key={qIdx} className="p-3 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                            <p className="text-sm">{q.text}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {q.exam} - {q.subject} | Difficulty: {q.difficulty}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}