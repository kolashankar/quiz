'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { 
  CloudArrowUpIcon, 
  DocumentArrowDownIcon, 
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XMarkIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { api } from '@/services/auth/authService';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface CSVRow {
  subsectionId: string;
  questionText: string;
  option1: string;
  option2: string;
  option3: string;
  option4: string;
  correctAnswer: number;
  difficulty: string;
  tags: string;
  explanation: string;
  timeLimit?: number;
  marks?: number;
}

interface ValidationError {
  row: number;
  field: string;
  message: string;
}

export default function BulkUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<CSVRow[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResults, setUploadResults] = useState<any>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const csvFile = acceptedFiles[0];
    if (csvFile && csvFile.type === 'text/csv') {
      setFile(csvFile);
      parseCSVFile(csvFile);
    } else {
      toast.error('Please select a valid CSV file');
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv']
    },
    multiple: false,
    maxSize: 5 * 1024 * 1024 // 5MB
  });

  const parseCSVFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n');
      const headers = lines[0].split(',').map(h => h.trim());
      
      const rows: CSVRow[] = [];
      const errors: ValidationError[] = [];
      
      for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim() === '') continue;
        
        const values = lines[i].split(',').map(v => v.trim());
        
        if (values.length < 10) {
          errors.push({
            row: i + 1,
            field: 'general',
            message: 'Insufficient columns'
          });
          continue;
        }

        const row: CSVRow = {
          subsectionId: values[0],
          questionText: values[1],
          option1: values[2],
          option2: values[3],
          option3: values[4],
          option4: values[5],
          correctAnswer: parseInt(values[6]) || 0,
          difficulty: values[7] || 'medium',
          tags: values[8] || '',
          explanation: values[9] || '',
          timeLimit: parseInt(values[10]) || 60,
          marks: parseInt(values[11]) || 1
        };

        // Validate row
        if (!row.subsectionId) {
          errors.push({ row: i + 1, field: 'subsectionId', message: 'Subsection ID is required' });
        }
        if (!row.questionText) {
          errors.push({ row: i + 1, field: 'questionText', message: 'Question text is required' });
        }
        if (!row.option1 || !row.option2 || !row.option3 || !row.option4) {
          errors.push({ row: i + 1, field: 'options', message: 'All 4 options are required' });
        }
        if (row.correctAnswer < 0 || row.correctAnswer > 3) {
          errors.push({ row: i + 1, field: 'correctAnswer', message: 'Correct answer must be 0-3' });
        }
        if (!['easy', 'medium', 'hard'].includes(row.difficulty.toLowerCase())) {
          errors.push({ row: i + 1, field: 'difficulty', message: 'Difficulty must be easy, medium, or hard' });
        }

        rows.push(row);
      }
      
      setPreview(rows);
      setValidationErrors(errors);
    };
    reader.readAsText(file);
  };

  const handleUpload = async () => {
    if (!file || validationErrors.length > 0) {
      toast.error('Please fix validation errors before uploading');
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      const response = await api.post('/admin/questions/bulk-upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      setUploadResults(response.data);
      toast.success(`Successfully uploaded ${response.data.successful} questions`);
      
      // Reset form
      setTimeout(() => {
        setFile(null);
        setPreview([]);
        setUploadProgress(0);
        setUploadResults(null);
      }, 3000);
      
    } catch (error: any) {
      toast.error('Upload failed: ' + (error.response?.data?.message || error.message));
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = () => {
    const csvContent = [
      'subsectionId,questionText,option1,option2,option3,option4,correctAnswer,difficulty,tags,explanation,timeLimit,marks',
      '641e4f5b2c8d4b0012345678,"What is 2+2?","2","3","4","5",2,"easy","math,arithmetic","Simple addition",60,1',
      '641e4f5b2c8d4b0012345679,"What is the capital of France?","London","Berlin","Paris","Madrid",2,"easy","geography,europe","Paris is the capital and largest city of France",45,1'
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'questions_template.csv';
    link.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                CSV Bulk Upload
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Upload multiple questions using CSV format
              </p>
            </div>
            <button
              onClick={downloadTemplate}
              className="btn-secondary flex items-center space-x-2"
            >
              <DocumentArrowDownIcon className="h-5 w-5" />
              <span>Download Template</span>
            </button>
          </div>
          
          {/* Breadcrumb */}
          <nav className="flex mt-4">
            <ol className="flex items-center space-x-2">
              <li><Link href="/dashboard" className="text-gray-500 hover:text-gray-700">Dashboard</Link></li>
              <li><span className="mx-2">/</span><span>Bulk Upload</span></li>
            </ol>
          </nav>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-4xl mx-auto">
        {/* File Upload Area */}
        <div className="card p-8 mb-6">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive 
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
            }`}
          >
            <input {...getInputProps()} />
            <CloudArrowUpIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            
            {file ? (
              <div>
                <p className="text-lg font-medium text-gray-900 dark:text-white">
                  Selected: {file.name}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              </div>
            ) : (
              <div>
                <p className="text-lg font-medium text-gray-900 dark:text-white">
                  {isDragActive ? 'Drop the CSV file here' : 'Drag & drop your CSV file here'}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  Or click to select a file (Max 5MB)
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Upload Progress */}
        {uploading && (
          <div className="card p-6 mb-6">
            <div className="flex items-center mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Uploading... {uploadProgress}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Upload Results */}
        {uploadResults && (
          <div className="card p-6 mb-6 border-green-200 bg-green-50 dark:bg-green-900/20">
            <div className="flex items-center mb-4">
              <CheckCircleIcon className="h-6 w-6 text-green-600 mr-2" />
              <h3 className="text-lg font-semibold text-green-800 dark:text-green-200">
                Upload Completed
              </h3>
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-green-600 font-medium">{uploadResults.successful}</span>
                <span className="text-gray-600 dark:text-gray-400 ml-1">Successful</span>
              </div>
              <div>
                <span className="text-red-600 font-medium">{uploadResults.failed || 0}</span>
                <span className="text-gray-600 dark:text-gray-400 ml-1">Failed</span>
              </div>
              <div>
                <span className="text-blue-600 font-medium">{uploadResults.total}</span>
                <span className="text-gray-600 dark:text-gray-400 ml-1">Total</span>
              </div>
            </div>
          </div>
        )}

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="card p-6 mb-6 border-red-200 bg-red-50 dark:bg-red-900/20">
            <div className="flex items-center mb-4">
              <ExclamationTriangleIcon className="h-6 w-6 text-red-600 mr-2" />
              <h3 className="text-lg font-semibold text-red-800 dark:text-red-200">
                Validation Errors ({validationErrors.length})
              </h3>
            </div>
            <div className="max-h-48 overflow-y-auto">
              {validationErrors.map((error, index) => (
                <div key={index} className="flex items-center py-2 text-sm">
                  <span className="text-red-600 font-medium mr-2">Row {error.row}:</span>
                  <span className="text-red-800 dark:text-red-200">
                    {error.field} - {error.message}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Data Preview */}
        {preview.length > 0 && (
          <div className="card p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Data Preview ({preview.length} rows)
              </h3>
              {file && (
                <button
                  onClick={() => {
                    setFile(null);
                    setPreview([]);
                    setValidationErrors([]);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              )}
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium text-gray-900 dark:text-white">Question</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-900 dark:text-white">Options</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-900 dark:text-white">Correct</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-900 dark:text-white">Difficulty</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                  {preview.slice(0, 5).map((row, index) => (
                    <tr key={index}>
                      <td className="px-3 py-2 max-w-xs truncate">
                        {row.questionText}
                      </td>
                      <td className="px-3 py-2">
                        <div className="text-xs space-y-1">
                          <div>A: {row.option1}</div>
                          <div>B: {row.option2}</div>
                          <div>C: {row.option3}</div>
                          <div>D: {row.option4}</div>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        {String.fromCharCode(65 + row.correctAnswer)}
                      </td>
                      <td className="px-3 py-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          row.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                          row.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {row.difficulty}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {preview.length > 5 && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  ... and {preview.length - 5} more rows
                </p>
              )}
            </div>
          </div>
        )}

        {/* Upload Button */}
        {file && preview.length > 0 && (
          <div className="flex justify-center">
            <button
              onClick={handleUpload}
              disabled={uploading || validationErrors.length > 0}
              className={`px-8 py-3 rounded-lg font-medium flex items-center space-x-2 ${
                uploading || validationErrors.length > 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              <DocumentTextIcon className="h-5 w-5" />
              <span>
                {uploading ? 'Uploading...' : `Upload ${preview.length} Questions`}
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}