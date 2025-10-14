'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8002/api';

interface Job {
  job_id: string;
  status: 'processing' | 'completed' | 'failed';
  progress: number;
  message: string;
  result?: any;
}

interface GeneratedFile {
  filename: string;
  size: number;
  created_at: string;
}

export default function CSVGeneratorPage() {
  const [selectedExam, setSelectedExam] = useState<string>('JEE');
  const [questionsPerSubject, setQuestionsPerSubject] = useState<number>(40);
  const [generating, setGenerating] = useState(false);
  const [currentJob, setCurrentJob] = useState<Job | null>(null);
  const [generatedFiles, setGeneratedFiles] = useState<GeneratedFile[]>([]);
  
  // PDF to CSV state
  const [pdfExamName, setPdfExamName] = useState<string>('JEE');
  const [pdfYear, setPdfYear] = useState<string>('2024');
  const [pdfSubject, setPdfSubject] = useState<string>('');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [answerKeyFile, setAnswerKeyFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadJob, setUploadJob] = useState<Job | null>(null);

  const exams = ['JEE', 'GATE', 'UPSC', 'NEET', 'NMMS'];

  useEffect(() => {
    loadGeneratedFiles();
  }, []);

  useEffect(() => {
    if (currentJob && currentJob.status === 'processing') {
      const interval = setInterval(() => checkJobStatus(currentJob.job_id, 'generate'), 2000);
      return () => clearInterval(interval);
    }
  }, [currentJob]);

  useEffect(() => {
    if (uploadJob && uploadJob.status === 'processing') {
      const interval = setInterval(() => checkJobStatus(uploadJob.job_id, 'upload'), 2000);
      return () => clearInterval(interval);
    }
  }, [uploadJob]);

  const loadGeneratedFiles = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/admin/csv-generator/files`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setGeneratedFiles(response.data.files || []);
    } catch (error) {
      console.error('Error loading files:', error);
    }
  };

  const generateExamCSV = async () => {
    try {
      setGenerating(true);
      const token = localStorage.getItem('token');
      
      const response = await axios.post(
        `${API_BASE_URL}/admin/csv-generator/generate-exam`,
        {
          exam_name: selectedExam,
          questions_per_subject: questionsPerSubject
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setCurrentJob({
        job_id: response.data.job_id,
        status: 'processing',
        progress: 0,
        message: response.data.message
      });
    } catch (error: any) {
      console.error('Error generating CSV:', error);
      alert(`Error: ${error.response?.data?.error || error.message}`);
      setGenerating(false);
    }
  };

  const convertPDFToCSV = async () => {
    if (!pdfFile || !pdfSubject) {
      alert('Please select a PDF file and enter a subject');
      return;
    }

    try {
      setUploading(true);
      const token = localStorage.getItem('token');
      
      const formData = new FormData();
      formData.append('pdf_file', pdfFile);
      if (answerKeyFile) {
        formData.append('answer_key_file', answerKeyFile);
      }
      formData.append('exam_name', pdfExamName);
      formData.append('year', pdfYear);
      formData.append('subject', pdfSubject);

      const response = await axios.post(
        `${API_BASE_URL}/admin/csv-generator/pdf-to-csv`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      setUploadJob({
        job_id: response.data.job_id,
        status: 'processing',
        progress: 0,
        message: response.data.message
      });
    } catch (error: any) {
      console.error('Error converting PDF:', error);
      alert(`Error: ${error.response?.data?.error || error.message}`);
      setUploading(false);
    }
  };

  const checkJobStatus = async (jobId: string, type: 'generate' | 'upload') => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_BASE_URL}/admin/csv-generator/job-status/${jobId}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      const job = response.data;
      
      if (type === 'generate') {
        setCurrentJob(job);
        if (job.status === 'completed' || job.status === 'failed') {
          setGenerating(false);
          loadGeneratedFiles();
        }
      } else {
        setUploadJob(job);
        if (job.status === 'completed' || job.status === 'failed') {
          setUploading(false);
          loadGeneratedFiles();
        }
      }
    } catch (error) {
      console.error('Error checking job status:', error);
    }
  };

  const downloadFile = async (filename: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_BASE_URL}/admin/csv-generator/download/${filename}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob'
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Failed to download file');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">CSV Generator & PDF Converter</h1>

      {/* AI Generate CSV Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-2xl font-semibold mb-4">AI-Powered CSV Generation</h2>
        <p className="text-gray-600 mb-4">
          Generate high-quality exam questions using AI for any of the supported exams.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Exam
            </label>
            <select
              value={selectedExam}
              onChange={(e) => setSelectedExam(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={generating}
            >
              {exams.map((exam) => (
                <option key={exam} value={exam}>
                  {exam}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Questions per Subject
            </label>
            <input
              type="number"
              value={questionsPerSubject}
              onChange={(e) => setQuestionsPerSubject(parseInt(e.target.value))}
              min="10"
              max="100"
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={generating}
            />
            <p className="text-xs text-gray-500 mt-1">
              Total questions: {questionsPerSubject * 3}
            </p>
          </div>
        </div>

        <button
          onClick={generateExamCSV}
          disabled={generating}
          className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {generating ? 'Generating...' : 'Generate CSV'}
        </button>

        {currentJob && (
          <div className="mt-4 p-4 bg-gray-50 rounded-md">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">Status: {currentJob.status}</span>
              <span className="text-sm text-gray-600">{currentJob.progress.toFixed(0)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${currentJob.progress}%` }}
              />
            </div>
            <p className="text-sm text-gray-600">{currentJob.message}</p>
            
            {currentJob.status === 'completed' && currentJob.result && (
              <div className="mt-3 p-3 bg-green-50 rounded-md">
                <p className="font-medium text-green-800 mb-2">✓ Generation Complete!</p>
                <p className="text-sm text-gray-700">
                  Total Questions: {currentJob.result.total_questions}
                </p>
                <button
                  onClick={() => downloadFile(currentJob.result.csv_file.split('/').pop())}
                  className="mt-2 bg-green-600 text-white px-4 py-1 rounded text-sm hover:bg-green-700"
                >
                  Download CSV
                </button>
              </div>
            )}

            {currentJob.status === 'failed' && (
              <div className="mt-3 p-3 bg-red-50 rounded-md">
                <p className="font-medium text-red-800">✗ Generation Failed</p>
                <p className="text-sm text-red-700">{currentJob.message}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* PDF to CSV Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-2xl font-semibold mb-4">PDF to CSV Converter</h2>
        <p className="text-gray-600 mb-4">
          Convert PDF question papers with answer keys to CSV format.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Exam Name
            </label>
            <select
              value={pdfExamName}
              onChange={(e) => setPdfExamName(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={uploading}
            >
              {exams.map((exam) => (
                <option key={exam} value={exam}>
                  {exam}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Year
            </label>
            <input
              type="text"
              value={pdfYear}
              onChange={(e) => setPdfYear(e.target.value)}
              placeholder="2024"
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={uploading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subject
            </label>
            <input
              type="text"
              value={pdfSubject}
              onChange={(e) => setPdfSubject(e.target.value)}
              placeholder="Physics"
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={uploading}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Question Paper PDF (Required)
            </label>
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              disabled={uploading}
            />
            {pdfFile && (
              <p className="text-sm text-gray-600 mt-1">
                Selected: {pdfFile.name}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Answer Key PDF (Optional)
            </label>
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => setAnswerKeyFile(e.target.files?.[0] || null)}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              disabled={uploading}
            />
            {answerKeyFile && (
              <p className="text-sm text-gray-600 mt-1">
                Selected: {answerKeyFile.name}
              </p>
            )}
          </div>
        </div>

        <button
          onClick={convertPDFToCSV}
          disabled={uploading || !pdfFile || !pdfSubject}
          className="bg-purple-600 text-white px-6 py-2 rounded-md hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {uploading ? 'Converting...' : 'Convert PDF to CSV'}
        </button>

        {uploadJob && (
          <div className="mt-4 p-4 bg-gray-50 rounded-md">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">Status: {uploadJob.status}</span>
              <span className="text-sm text-gray-600">{uploadJob.progress.toFixed(0)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
              <div
                className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadJob.progress}%` }}
              />
            </div>
            <p className="text-sm text-gray-600">{uploadJob.message}</p>
            
            {uploadJob.status === 'completed' && uploadJob.result && (
              <div className="mt-3 p-3 bg-green-50 rounded-md">
                <p className="font-medium text-green-800 mb-2">✓ Conversion Complete!</p>
                <p className="text-sm text-gray-700">
                  Questions Extracted: {uploadJob.result.total_questions}
                </p>
                {uploadJob.result.warnings && uploadJob.result.warnings.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm font-medium text-yellow-700">Warnings:</p>
                    <ul className="list-disc list-inside text-sm text-yellow-600">
                      {uploadJob.result.warnings.map((warning: string, idx: number) => (
                        <li key={idx}>{warning}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <button
                  onClick={() => downloadFile(uploadJob.result.csv_file.split('/').pop())}
                  className="mt-2 bg-green-600 text-white px-4 py-1 rounded text-sm hover:bg-green-700 mr-2"
                >
                  Download CSV
                </button>
                <button
                  onClick={() => downloadFile(uploadJob.result.report_file.split('/').pop())}
                  className="mt-2 bg-blue-600 text-white px-4 py-1 rounded text-sm hover:bg-blue-700"
                >
                  Download Report
                </button>
              </div>
            )}

            {uploadJob.status === 'failed' && (
              <div className="mt-3 p-3 bg-red-50 rounded-md">
                <p className="font-medium text-red-800">✗ Conversion Failed</p>
                <p className="text-sm text-red-700">{uploadJob.message}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Generated Files Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold">Generated Files</h2>
          <button
            onClick={loadGeneratedFiles}
            className="text-blue-600 hover:text-blue-700 text-sm"
          >
            Refresh
          </button>
        </div>

        {generatedFiles.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No files generated yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Filename
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Size
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {generatedFiles.map((file, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {file.filename}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatFileSize(file.size)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(file.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => downloadFile(file.filename)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Download
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
