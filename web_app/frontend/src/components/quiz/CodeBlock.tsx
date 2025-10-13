import React from 'react';

interface CodeBlockProps {
  code: string;
  language?: string;
}

export function CodeBlock({ code, language = 'javascript' }: CodeBlockProps) {
  // Basic syntax highlighting (in production, use a library like Prism.js or highlight.js)
  const highlightCode = (code: string, lang: string) => {
    // For now, return formatted code with basic styling
    return code;
  };

  return (
    <div className="code-block-container my-4">
      {language && (
        <div className="code-language bg-gray-700 text-white text-xs px-3 py-1 rounded-t-lg font-mono">
          {language}
        </div>
      )}
      <pre className="bg-gray-900 text-gray-100 p-4 rounded-b-lg overflow-x-auto">
        <code className={`language-${language} text-sm font-mono`}>
          {code}
        </code>
      </pre>
    </div>
  );
}

export function renderCodeBlocks(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  
  // Pattern for code blocks: ```language\ncode\n```
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
  
  let lastIndex = 0;
  let match;
  let key = 0;
  
  while ((match = codeBlockRegex.exec(text)) !== null) {
    // Add text before the code block
    if (match.index > lastIndex) {
      parts.push(
        <span key={`text-${key++}`}>{text.slice(lastIndex, match.index)}</span>
      );
    }
    
    const language = match[1] || 'text';
    const code = match[2].trim();
    
    parts.push(
      <CodeBlock key={`code-${key++}`} code={code} language={language} />
    );
    
    lastIndex = match.index + match[0].length;
  }
  
  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(
      <span key={`text-${key++}`}>{text.slice(lastIndex)}</span>
    );
  }
  
  return parts.length > 0 ? parts : [text];
}

// Inline code renderer for `code`
export function renderInlineCode(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const inlineCodeRegex = /`([^`]+)`/g;
  
  let lastIndex = 0;
  let match;
  let key = 0;
  
  while ((match = inlineCodeRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(
        <span key={`text-${key++}`}>{text.slice(lastIndex, match.index)}</span>
      );
    }
    
    parts.push(
      <code 
        key={`code-${key++}`}
        className="inline-code bg-gray-100 text-red-600 px-1.5 py-0.5 rounded text-sm font-mono"
      >
        {match[1]}
      </code>
    );
    
    lastIndex = match.index + match[0].length;
  }
  
  if (lastIndex < text.length) {
    parts.push(
      <span key={`text-${key++}`}>{text.slice(lastIndex)}</span>
    );
  }
  
  return parts.length > 0 ? parts : [text];
}

export default CodeBlock;
