'use client';

import { useState } from 'react';
import { aiService } from '@/services/admin/adminService';

export default function CSVGeneratorPage() {
  const [selectedExam, setSelectedExam] = useState<string>('JEE');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [questionsPerSubject, setQuestionsPerSubject] = useState<number>(40);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string>('');

  const exams = ['JEE', 'GATE', 'UPSC', 'NEET', 'NMMS', 'EAPCET'];

  const subjectsByExam: Record<string, string[]> = {
    JEE: ['Physics', 'Chemistry', 'Mathematics'],
    GATE: ['Electrical', 'Computer Science', 'Mechanical', 'Civil'],
    UPSC: ['General Studies', 'History', 'Geography', 'Polity'],
    NEET: ['Physics', 'Chemistry', 'Biology'],
    NMMS: ['Mathematics', 'Science', 'Social Science'],
    EAPCET: ['Physics', 'Chemistry', 'Mathematics']
  };

  const handleSubjectToggle = (subject: string) => {
    if (selectedSubjects.includes(subject)) {
      setSelectedSubjects(selectedSubjects.filter(s => s !== subject));
    } else {
      setSelectedSubjects([...selectedSubjects, subject]);
    }
  };

  const handleExamChange = (exam: string) => {
    setSelectedExam(exam);
    setSelectedSubjects([]);
    setResult(null);
    setError('');
  };

  const generateCSV = async () => {
    if (selectedSubjects.length === 0) {
      setError('Please select at least one subject');
      return;
    }

    try {
      setGenerating(true);
      setError('');
      setResult(null);

      const response = await aiService.generateCSV(
        selectedExam,
        selectedSubjects,
        questionsPerSubject
      );

      setResult(response);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to generate CSV');
      console.error('Error generating CSV:', err);
    } finally {
      setGenerating(false);
    }
  };

  const downloadCSV = () => {
    if (!result?.csv_content) return;

    const blob = new Blob([result.csv_content], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${selectedExam}_Questions_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-2">AI CSV Generator</h1>
      <p className="text-gray-600 mb-6">
        Generate high-quality exam questions in CSV format using AI
      </p>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-2xl font-semibold mb-4">Configuration</h2>

        {/* Exam Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Exam <span className="text-red-500">*</span>
          </label>
          <select
            value={selectedExam}
            onChange={(e) => handleExamChange(e.target.value)}
            className="w-full max-w-md border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={generating}
          >
            {exams.map((exam) => (
              <option key={exam} value={exam}>
                {exam}
              </option>
            ))}
          </select>
        </div>

        {/* Subject Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Subjects <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {subjectsByExam[selectedExam]?.map((subject) => (
              <label
                key={subject}
                className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition-all ${
                  selectedSubjects.includes(subject)
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedSubjects.includes(subject)}
                  onChange={() => handleSubjectToggle(subject)}
                  disabled={generating}
                  className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-sm font-medium">{subject}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Questions per Subject */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Questions per Subject
          </label>
          <input
            type="number"
            value={questionsPerSubject}
            onChange={(e) => setQuestionsPerSubject(parseInt(e.target.value) || 10)}
            min="10"
            max="100"
            step="10"
            className="w-full max-w-md border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={generating}
          />
          <p className="text-xs text-gray-500 mt-1">
            Estimated total: {questionsPerSubject * selectedSubjects.length} questions
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* Generate Button */}
        <button
          onClick={generateCSV}
          disabled={generating || selectedSubjects.length === 0}
          className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {generating ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Generating CSV...
            </span>
          ) : (
            'Generate CSV'
          )}
        </button>
      </div>

      {/* Result Section */}
      {result && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-2xl font-semibold text-green-600 mb-2">
                ✓ Generation Complete!
              </h2>
              <p className="text-gray-600">{result.message}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Exam</p>
              <p className="text-xl font-bold text-blue-700">{result.exam}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Total Questions</p>
              <p className="text-xl font-bold text-green-700">{result.total_questions}</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Subjects</p>
              <p className="text-xl font-bold text-purple-700">{selectedSubjects.length}</p>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">CSV Format (24 Columns):</h3>
            <p className="text-xs text-gray-600 mb-2">
              UID, Exam, Year, Subject, Chapter, Topic, QuestionType, QuestionText, OptionA, OptionB, OptionC, OptionD, 
              CorrectAnswer, AnswerChoicesCount, Marks, NegativeMarks, TimeLimitSeconds, Difficulty, Tags, 
              FormulaLaTeX, ImageUploadThingURL, ImageAltText, Explanation, ConfidenceScore, SourceNotes
            </p>
            <p className="text-xs text-green-600">
              ✓ Ready to upload directly to the system or import into Excel
            </p>
          </div>

          <button
            onClick={downloadCSV}
            className="bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 transition-colors flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Download CSV
          </button>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">📝 How to Use</h3>
        <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
          <li>Select the exam type (JEE, NEET, UPSC, etc.)</li>
          <li>Choose one or more subjects to generate questions for</li>
          <li>Set the number of questions per subject (10-100)</li>
          <li>Click "Generate CSV" and wait for AI to create questions</li>
          <li>Download the CSV file when generation is complete</li>
          <li>Use the CSV to bulk upload questions or review in Excel</li>
        </ol>
        <div className="mt-4 p-3 bg-white rounded border border-blue-200">
          <p className="text-xs font-semibold text-blue-900 mb-1">Note:</p>
          <p className="text-xs text-blue-700">
            Generated questions include explanations, difficulty levels, formulas (LaTeX), and tricks/shortcuts. 
            The CSV follows the 24-column format for direct system upload.
          </p>
        </div>
      </div>
    </div>
  );
}
