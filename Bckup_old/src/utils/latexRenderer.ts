/**
 * LaTeX Renderer Utilities for React Native
 * Phase 20: Rich Mathematical Editor
 * Provides LaTeX to MathML conversion and rendering utilities
 */

// LaTeX to MathML conversion utilities
export interface RenderOptions {
  inline?: boolean;
  fontSize?: number;
  color?: string;
  backgroundColor?: string;
  padding?: number;
  scale?: number;
}

export interface RenderResult {
  html: string;
  width: number;
  height: number;
  error?: string;
}

// Common LaTeX commands to MathML mapping
export const LATEX_TO_MATHML_MAP = {
  // Basic operations
  '\\times': '×',
  '\\div': '÷',
  '\\pm': '±',
  '\\mp': '∓',
  '\\neq': '≠',
  '\\leq': '≤',
  '\\geq': '≥',
  '\\approx': '≈',
  '\\propto': '∝',
  
  // Greek letters
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
  
  // Set theory
  '\\in': '∈',
  '\\notin': '∉',
  '\\subseteq': '⊆',
  '\\supseteq': '⊇',
  '\\cup': '∪',
  '\\cap': '∩',
  '\\emptyset': '∅',
  
  // Calculus
  '\\int': '∫',
  '\\oint': '∮',
  '\\partial': '∂',
  '\\nabla': '∇',
  '\\infty': '∞',
  '\\sum': '∑',
  '\\prod': '∏',
  
  // Logic
  '\\land': '∧',
  '\\lor': '∨',
  '\\neg': '¬',
  '\\oplus': '⊕',
  '\\rightarrow': '→',
  '\\leftrightarrow': '↔',
  '\\forall': '∀',
  '\\exists': '∃',
};

// Convert simple LaTeX to HTML for basic rendering
export const latexToHtml = (latex: string, options: RenderOptions = {}): string => {
  const {
    inline = true,
    fontSize = 16,
    color = '#000000',
    backgroundColor = 'transparent',
    padding = 4,
  } = options;

  // Start with basic HTML structure
  let html = latex;

  // Replace LaTeX symbols with HTML entities
  for (const [latexCmd, htmlEntity] of Object.entries(LATEX_TO_MATHML_MAP)) {
    const regex = new RegExp(latexCmd.replace(/\\/g, '\\\\'), 'g');
    html = html.replace(regex, htmlEntity);
  }

  // Handle fractions
  html = html.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, 
    '<div class="fraction"><div class="numerator">$1</div><div class="denominator">$2</div></div>');

  // Handle superscripts
  html = html.replace(/\^\{([^}]+)\}/g, '<sup>$1</sup>');
  html = html.replace(/\^([a-zA-Z0-9])/g, '<sup>$1</sup>');

  // Handle subscripts
  html = html.replace(/_\{([^}]+)\}/g, '<sub>$1</sub>');
  html = html.replace(/_([a-zA-Z0-9])/g, '<sub>$1</sub>');

  // Handle square roots
  html = html.replace(/\\sqrt\{([^}]+)\}/g, '√($1)');
  html = html.replace(/\\sqrt\[([^\]]+)\]\{([^}]+)\}/g, '<sup style="font-size:0.7em">$1</sup>√($2)');

  // Handle integrals
  html = html.replace(/\\int_\{([^}]+)\}\^\{([^}]+)\}/g, '∫<sub>$1</sub><sup>$2</sup>');
  html = html.replace(/\\int/g, '∫');

  // Handle summations
  html = html.replace(/\\sum_\{([^}]+)\}\^\{([^}]+)\}/g, '∑<sub>$1</sub><sup>$2</sup>');
  html = html.replace(/\\sum/g, '∑');

  // Handle limits
  html = html.replace(/\\lim_\{([^}]+)\}/g, 'lim<sub>$1</sub>');

  // Handle common functions
  html = html.replace(/\\sin/g, 'sin');
  html = html.replace(/\\cos/g, 'cos');
  html = html.replace(/\\tan/g, 'tan');
  html = html.replace(/\\log/g, 'log');
  html = html.replace(/\\ln/g, 'ln');

  // Handle matrices (simple 2x2 for now)
  html = html.replace(/\\begin\{pmatrix\}([^\\]+)\\end\{pmatrix\}/g, (match, content) => {
    const rows = content.split('\\\\').map((row: string) => 
      row.split('&').map((cell: string) => `<td>${cell.trim()}</td>`).join('')
    ).map((row: string) => `<tr>${row}</tr>`).join('');
    
    return `<table class="matrix" style="display: inline-table; border-collapse: collapse; vertical-align: middle;">
      <tbody>${rows}</tbody>
    </table>`;
  });

  // Wrap in appropriate container
  const containerTag = inline ? 'span' : 'div';
  const containerStyle = `
    font-size: ${fontSize}px;
    color: ${color};
    background-color: ${backgroundColor};
    padding: ${padding}px;
    font-family: 'Times New Roman', serif;
    line-height: 1.2;
    vertical-align: middle;
  `;

  return `<${containerTag} style="${containerStyle}">${html}</${containerTag}>`;
};

// Generate complete HTML document for WebView rendering
export const generateMathHtml = (latex: string, options: RenderOptions = {}): string => {
  const {
    fontSize = 16,
    color = '#000000',
    backgroundColor = 'transparent',
    scale = 1,
  } = options;

  const mathHtml = latexToHtml(latex, options);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=${scale}">
  <style>
    body {
      margin: 0;
      padding: 8px;
      font-family: 'Times New Roman', serif;
      font-size: ${fontSize}px;
      color: ${color};
      background-color: ${backgroundColor};
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      overflow: hidden;
    }
    
    .fraction {
      display: inline-block;
      vertical-align: middle;
      text-align: center;
      margin: 0 2px;
    }
    
    .fraction .numerator {
      border-bottom: 1px solid currentColor;
      padding-bottom: 2px;
      margin-bottom: 2px;
    }
    
    .fraction .denominator {
      padding-top: 2px;
    }
    
    .matrix {
      border-left: 1px solid currentColor;
      border-right: 1px solid currentColor;
      border-radius: 4px;
      padding: 4px 8px;
    }
    
    .matrix td {
      padding: 2px 8px;
      text-align: center;
    }
    
    sup, sub {
      font-size: 0.75em;
      line-height: 0;
    }
    
    /* Math symbols styling */
    .math-symbol {
      font-size: 1.2em;
      font-weight: bold;
    }
    
    /* Error styling */
    .math-error {
      color: #d32f2f;
      font-style: italic;
      border: 1px solid #d32f2f;
      background-color: #ffebee;
      padding: 4px 8px;
      border-radius: 4px;
    }
  </style>
</head>
<body>
  <div id="math-container">
    ${mathHtml}
  </div>
  
  <script>
    // Auto-resize functionality
    const resizeHandler = () => {
      const container = document.getElementById('math-container');
      const rect = container.getBoundingClientRect();
      
      // Send size information back to React Native
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'resize',
          width: rect.width,
          height: rect.height
        }));
      }
    };
    
    // Initial resize
    setTimeout(resizeHandler, 100);
    
    // Listen for resize events
    window.addEventListener('resize', resizeHandler);
    
    // Handle LaTeX rendering errors
    window.addEventListener('error', (event) => {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'error',
          message: event.message,
          filename: event.filename,
          line: event.lineno
        }));
      }
    });
    
    // Send ready signal
    setTimeout(() => {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'ready'
        }));
      }
    }, 50);
  </script>
</body>
</html>`;
};

// Validate LaTeX before rendering
export const validateLatexForRendering = (latex: string): { isValid: boolean; error?: string } => {
  if (!latex || !latex.trim()) {
    return { isValid: false, error: 'Empty LaTeX expression' };
  }

  // Check for balanced braces
  const braceCount = { '{': 0, '}': 0 };
  for (const char of latex) {
    if (char === '{') braceCount['{']++;
    if (char === '}') braceCount['}']++;
  }
  
  if (braceCount['{'] !== braceCount['}']) {
    return { isValid: false, error: 'Unbalanced braces in LaTeX expression' };
  }

  // Check for balanced parentheses
  const parenCount = { '(': 0, ')': 0 };
  for (const char of latex) {
    if (char === '(') parenCount['(']++;
    if (char === ')') parenCount[')']++;
  }
  
  if (parenCount['('] !== parenCount[')']) {
    return { isValid: false, error: 'Unbalanced parentheses in LaTeX expression' };
  }

  // Check for unsupported complex constructs
  const unsupportedPatterns = [
    /\\begin\{(?!pmatrix)[^}]+\}/g,
    /\\end\{(?!pmatrix)[^}]+\}/g,
  ];

  for (const pattern of unsupportedPatterns) {
    if (pattern.test(latex)) {
      return { isValid: false, error: 'Unsupported LaTeX construct detected' };
    }
  }

  return { isValid: true };
};

// Generate error HTML for invalid LaTeX
export const generateErrorHtml = (error: string, options: RenderOptions = {}): string => {
  const {
    fontSize = 16,
    backgroundColor = 'transparent',
    scale = 1,
  } = options;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=${scale}">
  <style>
    body {
      margin: 0;
      padding: 8px;
      font-family: system-ui, -apple-system, sans-serif;
      font-size: ${fontSize}px;
      background-color: ${backgroundColor};
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
    }
    
    .error-container {
      color: #d32f2f;
      background-color: #ffebee;
      border: 1px solid #d32f2f;
      border-radius: 4px;
      padding: 8px 12px;
      font-size: 0.9em;
      max-width: 300px;
      text-align: center;
    }
    
    .error-icon {
      font-size: 1.2em;
      margin-bottom: 4px;
    }
  </style>
</head>
<body>
  <div class="error-container">
    <div class="error-icon">⚠️</div>
    <div>${error}</div>
  </div>
  
  <script>
    // Send error info back to React Native
    setTimeout(() => {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'error',
          message: '${error}',
          isLatexError: true
        }));
      }
    }, 50);
  </script>
</body>
</html>`;
};

// Convert LaTeX to plain text for accessibility
export const latexToPlainText = (latex: string): string => {
  let plainText = latex;

  // Replace symbols with their spoken names
  for (const [latexCmd, symbol] of Object.entries(LATEX_TO_MATHML_MAP)) {
    const regex = new RegExp(latexCmd.replace(/\\/g, '\\\\'), 'g');
    plainText = plainText.replace(regex, ` ${symbol} `);
  }

  // Handle fractions
  plainText = plainText.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1 divided by $2)');

  // Handle powers
  plainText = plainText.replace(/\^\{([^}]+)\}/g, ' to the power of $1');
  plainText = plainText.replace(/\^([a-zA-Z0-9])/g, ' to the power of $1');

  // Handle subscripts
  plainText = plainText.replace(/_\{([^}]+)\}/g, ' subscript $1');
  plainText = plainText.replace(/_([a-zA-Z0-9])/g, ' subscript $1');

  // Handle square roots
  plainText = plainText.replace(/\\sqrt\{([^}]+)\}/g, 'square root of ($1)');

  // Clean up multiple spaces and return
  return plainText.replace(/\s+/g, ' ').trim();
};

export default {
  latexToHtml,
  generateMathHtml,
  validateLatexForRendering,
  generateErrorHtml,
  latexToPlainText,
  LATEX_TO_MATHML_MAP,
};