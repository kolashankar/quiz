'use client';

import { useState, useRef } from 'react';
import { 
  PhotoIcon, 
  CodeBracketIcon, 
  AcademicCapIcon, 
  XMarkIcon,
  DocumentTextIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import dynamic from 'next/dynamic';
import 'react-quill/dist/quill.snow.css';
import 'katex/dist/katex.min.css';
import { api } from '@/services/auth/authService';
import toast from 'react-hot-toast';

// Dynamically import ReactQuill with KaTeX support
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });

interface QuestionEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  enableAI?: boolean;
}

export function QuestionEditor({ 
  value, 
  onChange, 
  placeholder = "Enter your question...", 
  className = "",
  enableAI = false
}: QuestionEditorProps) {
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [showFormulaModal, setShowFormulaModal] = useState(false);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [formula, setFormula] = useState('');
  const [codeSnippet, setCodeSnippet] = useState('');
  const [codeLanguage, setCodeLanguage] = useState('javascript');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const quillRef = useRef<any>(null);

  // QuillJS modules configuration with KaTeX support
  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'script': 'sub'}, { 'script': 'super' }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'indent': '-1'}, { 'indent': '+1' }],
      ['blockquote', 'code-block'],
      ['link', 'image', 'formula'],
      ['clean']
    ],
    formula: true,
  };

  const formats = [
    'header', 'font', 'size',
    'bold', 'italic', 'underline', 'strike', 'blockquote',
    'list', 'bullet', 'indent',
    'link', 'image', 'color', 'background',
    'script', 'formula', 'code-block'
  ];

  const handleImageUpload = async (file: File) => {
    if (file.size > 2 * 1024 * 1024) { // 2MB limit
      toast.error('Image size should be less than 2MB');
      return;
    }

    try {
      // Convert to base64
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        
        // Insert image into quill editor
        const quill = (quillRef.current as any)?.getEditor?.();
        if (quill) {
          const range = quill.getSelection(true);
          quill.insertEmbed(range.index, 'image', base64);
          quill.setSelection(range.index + 1);
        }
        
        toast.success('Image uploaded successfully');
        setShowImageUpload(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast.error('Failed to upload image');
    }
  };

  const insertFormula = () => {
    if (!formula.trim()) return;
    
    const quill = (quillRef.current as any)?.getEditor?.();
    if (quill) {
      const range = quill.getSelection(true);
      quill.insertEmbed(range.index, 'formula', formula);
      quill.setSelection(range.index + 1);
    }
    
    setFormula('');
    setShowFormulaModal(false);
    toast.success('Formula inserted');
  };

  const insertCodeSnippet = () => {
    if (!codeSnippet.trim()) return;
    
    const quill = (quillRef.current as any)?.getEditor?.();
    if (quill) {
      const range = quill.getSelection(true);
      const codeWithLanguage = `\`\`\`${codeLanguage}\n${codeSnippet}\n\`\`\``;
      quill.insertText(range.index, codeWithLanguage, 'code-block', true);
      quill.setSelection(range.index + codeWithLanguage.length);
    }
    
    setCodeSnippet('');
    setShowCodeModal(false);
    toast.success('Code snippet inserted');
  };

  const improveWithAI = async () => {
    if (!value.trim()) {
      toast.error('Please enter some text first');
      return;
    }

    try {
      const response = await api.post('/admin/ai/improve-question', {
        questionText: value
      });
      
      onChange(response.data.improvedText);
      toast.success('Text improved with AI');
    } catch (error) {
      toast.error('Failed to improve text');
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Custom Toolbar */}
      <div className="flex items-center space-x-2 mb-2 p-2 bg-gray-50 dark:bg-gray-700 rounded-t-lg border border-b-0">
        <button
          type="button"
          onClick={() => setShowImageUpload(!showImageUpload)}
          className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded"
          title="Insert Image"
        >
          <PhotoIcon className="h-4 w-4" />
        </button>
        
        <button
          type="button"
          onClick={() => setShowFormulaModal(true)}
          className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded"
          title="Insert Formula"
        >
          <AcademicCapIcon className="h-4 w-4" />
        </button>
        
        <button
          type="button"
          onClick={() => setShowCodeModal(true)}
          className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded"
          title="Insert Code"
        >
          <CodeBracketIcon className="h-4 w-4" />
        </button>

        {enableAI && (
          <button
            type="button"
            onClick={improveWithAI}
            className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded"
            title="Improve with AI"
          >
            <SparklesIcon className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Image Upload Panel */}
      {showImageUpload && (
        <div className="absolute top-14 left-0 z-10 bg-white dark:bg-gray-800 border rounded-lg shadow-lg p-4 w-64">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-gray-900 dark:text-white">Upload Image</h4>
            <button
              onClick={() => setShowImageUpload(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleImageUpload(file);
            }}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          <p className="text-xs text-gray-500 mt-2">Max size: 2MB</p>
        </div>
      )}

      {/* Main Editor */}
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
        className="bg-white"
      />

      {/* Formula Modal */}
      {showFormulaModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Insert Formula</h3>
              <button
                onClick={() => setShowFormulaModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  LaTeX Formula
                </label>
                <textarea
                  value={formula}
                  onChange={(e) => setFormula(e.target.value)}
                  placeholder="e.g., E = mc^2"
                  className="input w-full h-24"
                />
              </div>
              
              <div className="text-xs text-gray-500">
                <p>Examples:</p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>E = mc^2</li>
                  <li>\frac{a}{b}</li>
                  <li>\sqrt{x + y}</li>
                  <li>\sum_{i=1}^{n} x_i</li>
                </ul>
              </div>
              
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setShowFormulaModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={insertFormula}
                  className="btn-primary"
                >
                  Insert Formula
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Code Modal */}
      {showCodeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Insert Code</h3>
              <button
                onClick={() => setShowCodeModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Language
                </label>
                <select
                  value={codeLanguage}
                  onChange={(e) => setCodeLanguage(e.target.value)}
                  className="input w-full"
                >
                  <option value="javascript">JavaScript</option>
                  <option value="python">Python</option>
                  <option value="java">Java</option>
                  <option value="cpp">C++</option>
                  <option value="c">C</option>
                  <option value="html">HTML</option>
                  <option value="css">CSS</option>
                  <option value="sql">SQL</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Code
                </label>
                <textarea
                  value={codeSnippet}
                  onChange={(e) => setCodeSnippet(e.target.value)}
                  placeholder="Enter your code here..."
                  className="input w-full h-32 font-mono text-sm"
                />
              </div>
              
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setShowCodeModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={insertCodeSnippet}
                  className="btn-primary"
                >
                  Insert Code
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}