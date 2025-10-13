// LaTeX Rendering Utility for Math Formulas
import React from 'react';

interface LatexProps {
  content: string;
  inline?: boolean;
}

export function renderLatex(text: string): React.ReactNode[] {
  // Simple LaTeX parser for common patterns
  // In production, you'd use a library like KaTeX or MathJax
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
    
    parts.push(
      <span 
        key={`latex-${key++}`}
        className={`latex-formula ${isDisplay ? 'display' : 'inline'}`}
        style={{
          fontFamily: 'serif',
          fontStyle: 'italic',
          display: isDisplay ? 'block' : 'inline',
          margin: isDisplay ? '1rem 0' : '0 0.2rem',
          padding: isDisplay ? '0.5rem' : '0',
          textAlign: isDisplay ? 'center' : 'left',
          fontSize: isDisplay ? '1.2em' : '1em',
        }}
        title={`LaTeX: ${formula}`}
      >
        {formatLatex(formula)}
      </span>
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

function formatLatex(formula: string): string {
  // Basic LaTeX to Unicode conversion for common symbols
  const replacements: Record<string, string> = {
    '\\alpha': 'α',
    '\\beta': 'β',
    '\\gamma': 'γ',
    '\\delta': 'δ',
    '\\epsilon': 'ε',
    '\\theta': 'θ',
    '\\lambda': 'λ',
    '\\mu': 'μ',
    '\\pi': 'π',
    '\\sigma': 'σ',
    '\\phi': 'φ',
    '\\omega': 'ω',
    '\\times': '×',
    '\\div': '÷',
    '\\le': '≤',
    '\\ge': '≥',
    '\\ne': '≠',
    '\\approx': '≈',
    '\\sum': '∑',
    '\\prod': '∏',
    '\\int': '∫',
    '\\infty': '∞',
    '\\sqrt': '√',
    '\\pm': '±',
    '\\to': '→',
    '\\rightarrow': '→',
    '\\leftarrow': '←',
    '\\Rightarrow': '⇒',
    '\\Leftarrow': '⇐',
    '\\in': '∈',
    '\\subset': '⊂',
    '\\cup': '∪',
    '\\cap': '∩',
    '\\forall': '∀',
    '\\exists': '∃',
  };
  
  let result = formula;
  for (const [latex, unicode] of Object.entries(replacements)) {
    result = result.replace(new RegExp(latex.replace('\\', '\\\\'), 'g'), unicode);
  }
  
  // Handle fractions: \frac{a}{b} -> a/b
  result = result.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1)/($2)');
  
  // Handle superscripts: ^{...} or ^x
  result = result.replace(/\^{([^}]+)}/g, (_, p1) => {
    return toSuperscript(p1);
  });
  result = result.replace(/\^(\w)/g, (_, p1) => toSuperscript(p1));
  
  // Handle subscripts: _{...} or _x
  result = result.replace(/_{([^}]+)}/g, (_, p1) => {
    return toSubscript(p1);
  });
  result = result.replace(/_(\w)/g, (_, p1) => toSubscript(p1));
  
  // Clean up remaining braces
  result = result.replace(/[{}]/g, '');
  
  return result;
}

function toSuperscript(str: string): string {
  const superscripts: Record<string, string> = {
    '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
    '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
    'a': 'ᵃ', 'b': 'ᵇ', 'c': 'ᶜ', 'd': 'ᵈ', 'e': 'ᵉ',
    'i': 'ⁱ', 'n': 'ⁿ', 'o': 'ᵒ', 'x': 'ˣ', 'y': 'ʸ',
    '+': '⁺', '-': '⁻', '=': '⁼', '(': '⁽', ')': '⁾',
  };
  return str.split('').map(c => superscripts[c] || c).join('');
}

function toSubscript(str: string): string {
  const subscripts: Record<string, string> = {
    '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄',
    '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉',
    'a': 'ₐ', 'e': 'ₑ', 'i': 'ᵢ', 'o': 'ₒ', 'x': 'ₓ',
    '+': '₊', '-': '₋', '=': '₌', '(': '₍', ')': '₎',
  };
  return str.split('').map(c => subscripts[c] || c).join('');
}

export default renderLatex;
