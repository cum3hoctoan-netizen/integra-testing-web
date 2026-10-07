'use client';

import React, { useMemo } from 'react';
import katex from 'katex';

interface MathContentProps {
  content: string;
  className?: string;
  as?: React.ElementType;
}

/**
 * Hàm parse chuỗi văn bản chứa LaTeX ($...$ và $$...$$) sang HTML chuẩn KaTeX.
 * Đảm bảo các lệnh \right, \dfrac, \frac,... được render mượt mà.
 */
export function renderLatexToHtml(text: string): string {
  if (!text) return '';

  // 1. Parse Block Math: $$...$$ hoặc \[...\]
  let result = text.replace(/\$\$([\s\S]*?)\$\$/g, (_, math) => {
    try {
      return `<div class="katex-display-wrapper my-2.5 overflow-x-auto text-center">${katex.renderToString(
        math.trim(),
        { displayMode: true, throwOnError: false, strict: false }
      )}</div>`;
    } catch {
      return `$$${math}$$`;
    }
  });

  result = result.replace(/\\\[([\s\S]*?)\\\]/g, (_, math) => {
    try {
      return `<div class="katex-display-wrapper my-2.5 overflow-x-auto text-center">${katex.renderToString(
        math.trim(),
        { displayMode: true, throwOnError: false, strict: false }
      )}</div>`;
    } catch {
      return `\\[${math}\\]`;
    }
  });

  // 2. Parse Inline Math: $...$ hoặc \(...\)
  result = result.replace(/\\\(([\s\S]*?)\\\)/g, (_, math) => {
    try {
      return katex.renderToString(math.trim(), {
        displayMode: false,
        throwOnError: false,
        strict: false,
      });
    } catch {
      return `\\(${math}\\)`;
    }
  });

  result = result.replace(/\$([^\$\n]+?)\$/g, (_, math) => {
    try {
      return katex.renderToString(math.trim(), {
        displayMode: false,
        throwOnError: false,
        strict: false,
      });
    } catch {
      return `$${math}$`;
    }
  });

  return result;
}

export default function MathContent({
  content,
  className = '',
  as: Component = 'div',
}: MathContentProps) {
  const html = useMemo(() => renderLatexToHtml(content), [content]);

  return (
    <Component
      className={className}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
