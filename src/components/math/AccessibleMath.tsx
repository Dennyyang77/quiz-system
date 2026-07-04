import { useEffect, useRef } from 'react';
import katex from 'katex';

interface AccessibleMathProps {
  latex: string;
  spoken: string;
  display?: boolean;
}

export function AccessibleMath({ latex, spoken, display = false }: AccessibleMathProps) {
  const mathRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (mathRef.current) {
      katex.render(latex, mathRef.current, {
        displayMode: display,
        throwOnError: false,
        output: 'html',
      });
    }
  }, [latex, display]);

  return (
    <span className="math-container inline-flex items-center gap-2">
      {/* Screen reader only - spoken version */}
      <span className="sr-only">{spoken}</span>

      {/* Visual rendering - hidden from screen readers */}
      <span
        ref={mathRef}
        aria-hidden="true"
        className={display ? 'block my-4' : 'inline'}
      />
    </span>
  );
}
