// LaTeX Rendering Utility for Math Formulas using KaTeX
import React from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface LatexProps {
  content: string;
  inline?: boolean;
}

export function renderLatex(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  
  // Pattern for inline math: $...$
  // Pattern for display math: $$...$$
  const latexRegex = /\$\$([^\$]+)\$\$|\$([^\$]+)\$/g;
  
  let lastIndex = 0;
  let match;
  let key = 0;
  
  while ((match = latexRegex.exec(text)) !== null) {
    // Add text before the LaTeX
    if (match.index > lastIndex) {
      parts.push(
        <span key={`text-${key++}`}>{text.slice(lastIndex, match.index)}</span>
      );
    }
    
    // Add the LaTeX formula (display or inline)
    const formula = match[1] || match[2];
    const isDisplay = !!match[1];
    
    try {
      const html = katex.renderToString(formula, {
        throwOnError: false,
        displayMode: isDisplay,
        output: 'html',
      });
      
      parts.push(
        <span 
          key={`latex-${key++}`}
          className={`latex-formula ${isDisplay ? 'display' : 'inline'}`}
          dangerouslySetInnerHTML={{ __html: html }}
          style={{
            display: isDisplay ? 'block' : 'inline',
            margin: isDisplay ? '1rem 0' : '0',
            textAlign: isDisplay ? 'center' : 'left',
          }}
        />
      );
    } catch (error) {
      // Fallback to plain text if KaTeX fails
      parts.push(
        <span 
          key={`latex-${key++}`}
          className="latex-error text-red-600 italic"
          title={`LaTeX Error: ${error}`}
        >
          {formula}
        </span>
      );
    }
    
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

export default renderLatex;
