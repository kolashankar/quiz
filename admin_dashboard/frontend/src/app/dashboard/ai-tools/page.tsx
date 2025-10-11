'use client';

import { useState, useEffect } from 'react';
import { 
  SparklesIcon,
  LightBulbIcon,
  DocumentTextIcon,
  AcademicCapIcon,
  ChartBarIcon,
  ClipboardDocumentCheckIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';
import { api } from '@/services/auth/authService';
import { subsectionService } from '@/services/admin/adminService';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { Spinner } from '@/components/ui/common/Spinner';
import { Modal } from '@/components/ui/common/Modal';
import dynamic from 'next/dynamic';
import 'react-quill/dist/quill.snow.css';

// Dynamically import ReactQuill to avoid SSR issues
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });

interface Subsection {
  id: string;
  name: string;
  section?: {
    subtopic?: {
      topic?: {
        chapter?: {
          subject?: {
            exam?: {
              name: string;
            }
          }
        }
      }
    }
  }
}

export default function AIToolsPage() {
  const [subsections, setSubsections] = useState<Subsection[]>([]);
  const [selectedSubsection, setSelectedSubsection] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('generate');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states for different AI tools
  const [generateForm, setGenerateForm] = useState({
    topic: '',
    difficulty: 'medium',
    count: 3,
    subsectionId: ''
  });

  const [improveForm, setImproveForm] = useState({
    questionText: '',
    improvedText: ''
  });

  const [analyzeForm, setAnalyzeForm] = useState({
    questionText: '',
    analysis: ''
  });

  const [contentForm, setContentForm] = useState({
    examType: 'UPSC',
    subject: 'Physics',
    topics: '',
    suggestions: ''
  });

  useEffect(() => {
    fetchSubsections();
  }, []);

  const fetchSubsections = async () => {
    try {
      const data = await subsectionService.getAll();
      setSubsections(data);
    } catch (error) {
      toast.error('Failed to fetch subsections');
    }
  };

  const handleGenerateQuestions = async () => {
    if (!generateForm.topic || !generateForm.subsectionId) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/admin/ai/generate-questions', {
        topic: generateForm.topic,
        difficulty: generateForm.difficulty,
        count: generateForm.count
      });

      // Now create the questions in the selected subsection
      for (const question of response.data.questions) {
        await api.post('/admin/questions', {
          ...question,
          subsectionId: generateForm.subsectionId
        });
      }

      setResults({
        type: 'questions',
        data: response.data.questions,
        count: response.data.questions.length
      });
      
      toast.success(`Generated ${response.data.questions.length} questions successfully!`);
      setIsModalOpen(true);
    } catch (error: any) {
      toast.error('Failed to generate questions: ' + error.response?.data?.error);
    } finally {
      setLoading(false);
    }
  };

  const handleImproveQuestion = async () => {
    if (!improveForm.questionText) {
      toast.error('Please enter a question to improve');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/admin/ai/improve-question', {
        questionText: improveForm.questionText
      });

      setImproveForm(prev => ({
        ...prev,
        improvedText: response.data.improvedText
      }));

      toast.success('Question improved successfully!');
    } catch (error: any) {
      toast.error('Failed to improve question');
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzeQuestion = async () => {
    if (!analyzeForm.questionText) {
      toast.error('Please enter a question to analyze');
      return;
    }

    setLoading(true);
    try {
      const [difficultyResponse, tagsResponse] = await Promise.all([
        api.post('/admin/ai/suggest-difficulty', { questionText: analyzeForm.questionText }),
        api.post('/admin/ai/generate-tags', { questionText: analyzeForm.questionText })
      ]);

      const analysis = `
**Difficulty Level:** ${difficultyResponse.data.difficulty}

**Suggested Tags:** ${tagsResponse.data.tags.join(', ')}

**Analysis:** This question appears to test knowledge in the ${difficultyResponse.data.difficulty} difficulty range. The recommended tags help categorize the content for better organization.
      `;

      setAnalyzeForm(prev => ({
        ...prev,
        analysis
      }));

      toast.success('Question analyzed successfully!');
    } catch (error: any) {
      toast.error('Failed to analyze question');
    } finally {
      setLoading(false);
    }
  };

  const handleContentSuggestions = async () => {
    setLoading(true);
    try {
      const response = await api.post('/admin/analytics/ai-suggestions', {
        type: 'content-analysis',
        context: {
          examType: contentForm.examType,
          subject: contentForm.subject,
          topics: contentForm.topics
        }
      });

      setContentForm(prev => ({
        ...prev,
        suggestions: response.data.suggestions
      }));

      toast.success('Content suggestions generated!');
    } catch (error: any) {
      toast.error('Failed to generate content suggestions');
    } finally {
      setLoading(false);
    }
  };

  const aiTools = [
    {
      id: 'generate',
      title: 'Generate Questions',
      description: 'AI-powered question generation based on topics and difficulty',
      icon: SparklesIcon,
      color: 'bg-blue-500'
    },
    {
      id: 'improve',
      title: 'Improve Questions',
      description: 'Enhance existing questions for clarity and professionalism',
      icon: LightBulbIcon,
      color: 'bg-green-500'
    },
    {
      id: 'analyze',
      title: 'Question Analysis',
      description: 'Analyze questions for difficulty level and generate tags',
      icon: ChartBarIcon,
      color: 'bg-purple-500'
    },
    {
      id: 'content',
      title: 'Content Suggestions',
      description: 'Get AI suggestions for content gaps and improvements',
      icon: DocumentTextIcon,
      color: 'bg-orange-500'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                <SparklesIcon className="h-8 w-8 text-blue-500 mr-3" />
                AI Tools
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Leverage AI to enhance your content creation and management
              </p>
            </div>
          </div>
          
          {/* Breadcrumb */}
          <nav className="flex mt-4">
            <ol className="flex items-center space-x-2">
              <li><Link href="/dashboard" className="text-gray-500 hover:text-gray-700">Dashboard</Link></li>
              <li><span className="mx-2">/</span><span>AI Tools</span></li>
            </ol>
          </nav>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 py-8">
        {/* AI Tool Categories */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {aiTools.map((tool) => (
            <button
              key={tool.id}
              onClick={() => setActiveTab(tool.id)}
              className={`card p-6 text-left hover:shadow-lg transition-shadow ${
                activeTab === tool.id ? 'ring-2 ring-blue-500' : ''
              }`}
            >
              <div className={`w-12 h-12 ${tool.color} rounded-lg flex items-center justify-center mb-4`}>
                <tool.icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {tool.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {tool.description}
              </p>
            </button>
          ))}
        </div>

        {/* Active Tool Interface */}
        <div className="card p-6">
          {activeTab === 'generate' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                Generate Questions with AI
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Topic *
                    </label>
                    <input
                      type="text"
                      value={generateForm.topic}
                      onChange={(e) => setGenerateForm(prev => ({ ...prev, topic: e.target.value }))}
                      placeholder="e.g., Newton's Laws of Motion"
                      className="input w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Subsection *
                    </label>
                    <select
                      value={generateForm.subsectionId}
                      onChange={(e) => setGenerateForm(prev => ({ ...prev, subsectionId: e.target.value }))}
                      className="input w-full"
                    >
                      <option value="">Select Subsection</option>
                      {subsections.map(sub => (
                        <option key={sub.id} value={sub.id}>
                          {sub.name} ({sub.section?.subtopic?.topic?.chapter?.subject?.exam?.name})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Difficulty
                      </label>
                      <select
                        value={generateForm.difficulty}
                        onChange={(e) => setGenerateForm(prev => ({ ...prev, difficulty: e.target.value }))}
                        className="input w-full"
                      >
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Count
                      </label>
                      <select
                        value={generateForm.count}
                        onChange={(e) => setGenerateForm(prev => ({ ...prev, count: parseInt(e.target.value) }))}
                        className="input w-full"
                      >
                        <option value={1}>1 Question</option>
                        <option value={3}>3 Questions</option>
                        <option value={5}>5 Questions</option>
                        <option value={10}>10 Questions</option>
                      </select>
                    </div>
                  </div>

                  <button
                    onClick={handleGenerateQuestions}
                    disabled={loading}
                    className="btn-primary w-full flex items-center justify-center space-x-2"
                  >
                    {loading ? <Spinner size="sm" /> : <SparklesIcon className="h-5 w-5" />}
                    <span>{loading ? 'Generating...' : 'Generate Questions'}</span>
                  </button>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Tips for Better Results:</h3>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <li>• Be specific with your topic (e.g., "Newton's First Law" vs "Physics")</li>
                    <li>• Choose appropriate difficulty level for your target audience</li>
                    <li>• Start with fewer questions to review quality</li>
                    <li>• Select the correct subsection to maintain content organization</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'improve' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                Improve Question Quality
              </h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Original Question *
                  </label>
                  <ReactQuill
                    theme="snow"
                    value={improveForm.questionText}
                    onChange={(value) => setImproveForm(prev => ({ ...prev, questionText: value }))}
                    className="bg-white"
                    placeholder="Paste your question here..."
                  />
                </div>

                <button
                  onClick={handleImproveQuestion}
                  disabled={loading || !improveForm.questionText}
                  className="btn-primary flex items-center space-x-2"
                >
                  {loading ? <Spinner size="sm" /> : <LightBulbIcon className="h-5 w-5" />}
                  <span>{loading ? 'Improving...' : 'Improve Question'}</span>
                </button>

                {improveForm.improvedText && (
                  <div className="border border-green-200 bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                    <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">Improved Version:</h4>
                    <div className="prose dark:prose-invert max-w-none">
                      <div dangerouslySetInnerHTML={{ __html: improveForm.improvedText }} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'analyze' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                Question Analysis
              </h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Question to Analyze *
                  </label>
                  <ReactQuill
                    theme="snow"
                    value={analyzeForm.questionText}
                    onChange={(value) => setAnalyzeForm(prev => ({ ...prev, questionText: value }))}
                    className="bg-white"
                    placeholder="Paste your question here for analysis..."
                  />
                </div>

                <button
                  onClick={handleAnalyzeQuestion}
                  disabled={loading || !analyzeForm.questionText}
                  className="btn-primary flex items-center space-x-2"
                >
                  {loading ? <Spinner size="sm" /> : <ChartBarIcon className="h-5 w-5" />}
                  <span>{loading ? 'Analyzing...' : 'Analyze Question'}</span>
                </button>

                {analyzeForm.analysis && (
                  <div className="border border-blue-200 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">Analysis Results:</h4>
                    <div className="prose dark:prose-invert max-w-none text-sm">
                      <pre className="whitespace-pre-wrap">{analyzeForm.analysis}</pre>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'content' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                Content Suggestions
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Exam Type
                    </label>
                    <select
                      value={contentForm.examType}
                      onChange={(e) => setContentForm(prev => ({ ...prev, examType: e.target.value }))}
                      className="input w-full"
                    >
                      <option value="UPSC">UPSC</option>
                      <option value="JEE">JEE</option>
                      <option value="NEET">NEET</option>
                      <option value="GATE">GATE</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Subject
                    </label>
                    <input
                      type="text"
                      value={contentForm.subject}
                      onChange={(e) => setContentForm(prev => ({ ...prev, subject: e.target.value }))}
                      placeholder="e.g., Physics, Chemistry, Mathematics"
                      className="input w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Current Topics (Optional)
                    </label>
                    <textarea
                      value={contentForm.topics}
                      onChange={(e) => setContentForm(prev => ({ ...prev, topics: e.target.value }))}
                      placeholder="List current topics you have questions for..."
                      className="input w-full h-24"
                    />
                  </div>

                  <button
                    onClick={handleContentSuggestions}
                    disabled={loading}
                    className="btn-primary w-full flex items-center justify-center space-x-2"
                  >
                    {loading ? <Spinner size="sm" /> : <DocumentTextIcon className="h-5 w-5" />}
                    <span>{loading ? 'Analyzing...' : 'Get Suggestions'}</span>
                  </button>
                </div>

                <div>
                  {contentForm.suggestions ? (
                    <div className="border border-purple-200 bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                      <h4 className="font-semibold text-purple-800 dark:text-purple-200 mb-2">AI Suggestions:</h4>
                      <div className="prose dark:prose-invert max-w-none text-sm">
                        <pre className="whitespace-pre-wrap">{contentForm.suggestions}</pre>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg h-full flex items-center justify-center">
                      <p className="text-gray-500 dark:text-gray-400 text-center">
                        AI suggestions will appear here after analysis
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Results Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Generated Questions" size="2xl">
        {results && results.type === 'questions' && (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Successfully generated {results.count} questions
            </div>
            {results.data.map((question: any, index: number) => (
              <div key={index} className="border border-gray-200 dark:border-gray-600 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                  Question {index + 1}:
                </h4>
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                  {question.text}
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                  {question.options.map((option: string, optIndex: number) => (
                    <div key={optIndex} className={`p-2 rounded ${question.correctAnswer === optIndex ? 'bg-green-100 dark:bg-green-900/20' : 'bg-gray-100 dark:bg-gray-700'}`}>
                      {String.fromCharCode(65 + optIndex)}: {option}
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Difficulty: {question.difficulty}</span>
                  <span>Correct: {String.fromCharCode(65 + question.correctAnswer)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}