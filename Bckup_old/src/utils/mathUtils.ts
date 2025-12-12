/**
 * Mathematical Utilities for React Native Math Editor
 * Phase 20: Rich Mathematical Editor
 * Provides LaTeX validation, symbol management, and equation processing
 */

// Common Mathematical Symbols
export const MATH_SYMBOLS = {
  // Basic Operations
  basic: [
    { symbol: '+', latex: '+', name: 'Plus' },
    { symbol: '−', latex: '-', name: 'Minus' },
    { symbol: '×', latex: '\\times', name: 'Multiply' },
    { symbol: '÷', latex: '\\div', name: 'Divide' },
    { symbol: '=', latex: '=', name: 'Equals' },
    { symbol: '≠', latex: '\\neq', name: 'Not Equal' },
    { symbol: '±', latex: '\\pm', name: 'Plus Minus' },
    { symbol: '∓', latex: '\\mp', name: 'Minus Plus' },
  ],
  
  // Fractions and Powers
  fractions: [
    { symbol: '½', latex: '\\frac{1}{2}', name: 'One Half' },
    { symbol: '⅓', latex: '\\frac{1}{3}', name: 'One Third' },
    { symbol: '¼', latex: '\\frac{1}{4}', name: 'One Quarter' },
    { symbol: 'x²', latex: 'x^2', name: 'X Squared' },
    { symbol: 'x³', latex: 'x^3', name: 'X Cubed' },
    { symbol: 'xⁿ', latex: 'x^n', name: 'X to Power N' },
  ],
  
  // Greek Letters
  greek: [
    { symbol: 'α', latex: '\\alpha', name: 'Alpha' },
    { symbol: 'β', latex: '\\beta', name: 'Beta' },
    { symbol: 'γ', latex: '\\gamma', name: 'Gamma' },
    { symbol: 'δ', latex: '\\delta', name: 'Delta' },
    { symbol: 'ε', latex: '\\epsilon', name: 'Epsilon' },
    { symbol: 'θ', latex: '\\theta', name: 'Theta' },
    { symbol: 'λ', latex: '\\lambda', name: 'Lambda' },
    { symbol: 'μ', latex: '\\mu', name: 'Mu' },
    { symbol: 'π', latex: '\\pi', name: 'Pi' },
    { symbol: 'σ', latex: '\\sigma', name: 'Sigma' },
    { symbol: 'φ', latex: '\\phi', name: 'Phi' },
    { symbol: 'ω', latex: '\\omega', name: 'Omega' },
  ],
  
  // Comparison
  comparison: [
    { symbol: '<', latex: '<', name: 'Less Than' },
    { symbol: '>', latex: '>', name: 'Greater Than' },
    { symbol: '≤', latex: '\\leq', name: 'Less Than or Equal' },
    { symbol: '≥', latex: '\\geq', name: 'Greater Than or Equal' },
    { symbol: '≈', latex: '\\approx', name: 'Approximately' },
    { symbol: '∝', latex: '\\propto', name: 'Proportional' },
  ],
  
  // Set Theory
  sets: [
    { symbol: '∈', latex: '\\in', name: 'Element Of' },
    { symbol: '∉', latex: '\\notin', name: 'Not Element Of' },
    { symbol: '⊆', latex: '\\subseteq', name: 'Subset Of' },
    { symbol: '⊇', latex: '\\supseteq', name: 'Superset Of' },
    { symbol: '∪', latex: '\\cup', name: 'Union' },
    { symbol: '∩', latex: '\\cap', name: 'Intersection' },
    { symbol: '∅', latex: '\\emptyset', name: 'Empty Set' },
  ],
  
  // Calculus
  calculus: [
    { symbol: '∫', latex: '\\int', name: 'Integral' },
    { symbol: '∮', latex: '\\oint', name: 'Contour Integral' },
    { symbol: '∂', latex: '\\partial', name: 'Partial Derivative' },
    { symbol: '∇', latex: '\\nabla', name: 'Nabla' },
    { symbol: '∞', latex: '\\infty', name: 'Infinity' },
    { symbol: '∑', latex: '\\sum', name: 'Summation' },
    { symbol: '∏', latex: '\\prod', name: 'Product' },
    { symbol: 'lim', latex: '\\lim', name: 'Limit' },
  ],
  
  // Logic
  logic: [
    { symbol: '∧', latex: '\\land', name: 'Logical And' },
    { symbol: '∨', latex: '\\lor', name: 'Logical Or' },
    { symbol: '¬', latex: '\\neg', name: 'Logical Not' },
    { symbol: '⊕', latex: '\\oplus', name: 'XOR' },
    { symbol: '→', latex: '\\rightarrow', name: 'Implies' },
    { symbol: '↔', latex: '\\leftrightarrow', name: 'If and Only If' },
    { symbol: '∀', latex: '\\forall', name: 'For All' },
    { symbol: '∃', latex: '\\exists', name: 'There Exists' },
  ],
};

// Mathematical Templates
export const MATH_TEMPLATES = {
  fraction: { latex: '\\frac{numerator}{denominator}', name: 'Fraction' },
  power: { latex: 'base^{exponent}', name: 'Power/Exponent' },
  subscript: { latex: 'base_{subscript}', name: 'Subscript' },
  squareRoot: { latex: '\\sqrt{expression}', name: 'Square Root' },
  nthRoot: { latex: '\\sqrt[n]{expression}', name: 'Nth Root' },
  integral: { latex: '\\int_{lower}^{upper} expression \\, dx', name: 'Definite Integral' },
  indefiniteIntegral: { latex: '\\int expression \\, dx', name: 'Indefinite Integral' },
  summation: { latex: '\\sum_{i=lower}^{upper} expression', name: 'Summation' },
  limit: { latex: '\\lim_{x \\to value} expression', name: 'Limit' },
  matrix2x2: { latex: '\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}', name: '2x2 Matrix' },
  matrix3x3: { latex: '\\begin{pmatrix} a & b & c \\\\ d & e & f \\\\ g & h & i \\end{pmatrix}', name: '3x3 Matrix' },
  vector: { latex: '\\vec{v}', name: 'Vector' },
  derivative: { latex: '\\frac{d}{dx} f(x)', name: 'Derivative' },
  partialDerivative: { latex: '\\frac{\\partial f}{\\partial x}', name: 'Partial Derivative' },
  binomial: { latex: '\\binom{n}{k}', name: 'Binomial Coefficient' },
};

// LaTeX Validation Patterns
export const LATEX_PATTERNS = {
  // Basic validation patterns
  balanced_braces: /^[^{}]*(\{[^{}]*\}[^{}]*)*$/,
  valid_commands: /^[^\\]*(\\\w+(\[[^\]]*\])?(\{[^{}]*\})*[^\\]*)*$/,
  paired_delimiters: /^[^()]*(\([^()]*\)[^()]*)*$/,
};

// Validation Functions
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export const validateLatex = (latex: string): ValidationResult => {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
  };

  if (!latex.trim()) {
    result.isValid = false;
    result.errors.push('LaTeX expression cannot be empty');
    return result;
  }

  // Check for balanced braces
  const braceCount = { '{': 0, '}': 0 };
  for (const char of latex) {
    if (char === '{') braceCount['{']++;
    if (char === '}') braceCount['}']++;
  }
  
  if (braceCount['{'] !== braceCount['}']) {
    result.isValid = false;
    result.errors.push('Unbalanced braces in LaTeX expression');
  }

  // Check for balanced parentheses
  const parenCount = { '(': 0, ')': 0 };
  for (const char of latex) {
    if (char === '(') parenCount['(']++;
    if (char === ')') parenCount[')']++;
  }
  
  if (parenCount['('] !== parenCount[')']) {
    result.isValid = false;
    result.errors.push('Unbalanced parentheses in LaTeX expression');
  }

  // Check for common LaTeX command patterns
  const invalidCommands = latex.match(/\\[^a-zA-Z]/g);
  if (invalidCommands) {
    result.warnings.push('Possible invalid LaTeX commands detected');
  }

  // Check for empty groups
  if (latex.includes('{}')) {
    result.warnings.push('Empty braces detected - consider removing');
  }

  return result;
};

// Format LaTeX for display
export const formatLatexForDisplay = (latex: string): string => {
  // Add proper spacing around operators
  let formatted = latex
    .replace(/([^\\])\+/g, '$1 + ')
    .replace(/([^\\])-/g, '$1 - ')
    .replace(/([^\\])=/g, '$1 = ')
    .replace(/([^\\])<(?!=)/g, '$1 < ')
    .replace(/([^\\])>(?!=)/g, '$1 > ');

  // Clean up multiple spaces
  formatted = formatted.replace(/\s+/g, ' ').trim();

  return formatted;
};

// Convert common mathematical expressions to LaTeX
export const textToLatex = (text: string): string => {
  let latex = text
    // Fractions
    .replace(/(\d+)\/(\d+)/g, '\\frac{$1}{$2}')
    // Powers
    .replace(/\^(\d+)/g, '^{$1}')
    .replace(/\^([a-zA-Z]+)/g, '^{$1}')
    // Subscripts
    .replace(/_(\d+)/g, '_{$1}')
    .replace(/_([a-zA-Z]+)/g, '_{$1}')
    // Square roots
    .replace(/sqrt\(([^)]+)\)/g, '\\sqrt{$1}')
    // Common functions
    .replace(/\bsin\b/g, '\\sin')
    .replace(/\bcos\b/g, '\\cos')
    .replace(/\btan\b/g, '\\tan')
    .replace(/\blog\b/g, '\\log')
    .replace(/\bln\b/g, '\\ln')
    // Infinity
    .replace(/\binfinity\b/g, '\\infty')
    .replace(/\binf\b/g, '\\infty');

  return latex;
};

// Get symbol category
export const getSymbolsByCategory = (category: keyof typeof MATH_SYMBOLS) => {
  return MATH_SYMBOLS[category] || [];
};

// Search symbols
export const searchSymbols = (query: string) => {
  const results = [];
  const lowerQuery = query.toLowerCase();

  for (const [category, symbols] of Object.entries(MATH_SYMBOLS)) {
    for (const symbol of symbols) {
      if (
        symbol.name.toLowerCase().includes(lowerQuery) ||
        symbol.symbol.includes(query) ||
        symbol.latex.includes(query)
      ) {
        results.push({ ...symbol, category });
      }
    }
  }

  return results;
};

// Insert LaTeX at cursor position
export const insertLatexAtPosition = (
  currentLatex: string,
  insertText: string,
  cursorPosition: number
): { newLatex: string; newCursorPosition: number } => {
  const beforeCursor = currentLatex.slice(0, cursorPosition);
  const afterCursor = currentLatex.slice(cursorPosition);
  
  const newLatex = beforeCursor + insertText + afterCursor;
  const newCursorPosition = cursorPosition + insertText.length;

  return { newLatex, newCursorPosition };
};

// Extract placeholders from template
export const getTemplatePlaceholders = (template: string): string[] => {
  const placeholders = template.match(/\b[a-z_]+\b/g) || [];
  return placeholders.filter(p => !p.startsWith('\\'));
};

// Replace placeholders in template
export const fillTemplate = (template: string, values: { [key: string]: string }): string => {
  let result = template;
  
  for (const [placeholder, value] of Object.entries(values)) {
    const regex = new RegExp(`\\b${placeholder}\\b`, 'g');
    result = result.replace(regex, value);
  }

  return result;
};

export default {
  MATH_SYMBOLS,
  MATH_TEMPLATES,
  validateLatex,
  formatLatexForDisplay,
  textToLatex,
  getSymbolsByCategory,
  searchSymbols,
  insertLatexAtPosition,
  getTemplatePlaceholders,
  fillTemplate,
};