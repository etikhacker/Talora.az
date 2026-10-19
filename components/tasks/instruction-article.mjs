import React, { createElement } from 'react';
import { parseTaskMarkdown } from '../../lib/tasks/content.mjs';

const headingClass = 'font-semibold tracking-tight text-slate-900';

// Keep task content as React text nodes, including HTML-looking code examples.
function renderInline(text) {
  return text.split(/(`[^`\n]+`|\*\*[^*\n]+\*\*)/g).filter(Boolean).map((part, index) => {
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      return createElement('code', { key: index, className: 'task-brief-inline-code' }, part.slice(1, -1));
    }
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return createElement('strong', { key: index, className: 'task-brief-emphasis' }, ...renderInline(part.slice(2, -2)));
    }
    return part;
  });
}

/**
 * Render the supported task-brief Markdown subset as safe, semantic HTML.
 * Task content is always emitted as text; raw HTML is never interpreted.
 *
 * @param {{ content: string, className?: string }} props
 * @returns {React.ReactElement}
 */
export function TaskInstructionArticle({ content, className = '' }) {
  const blocks = parseTaskMarkdown(content);

  return createElement(
    'article',
    { className: `task-brief space-y-5 text-base leading-7 text-slate-700 ${className}`.trim() },
    ...blocks.map((block, index) => {
      if (block.type === 'heading') {
        const tag = block.level === 1 ? 'h2' : block.level === 2 ? 'h3' : 'h4';
        const size = block.level === 1 ? 'text-xl' : block.level === 2 ? 'text-base' : 'text-sm';
        return createElement(tag, { key: index, className: `${headingClass} ${size}` }, ...renderInline(block.text));
      }

      if (block.type === 'paragraph') {
        return createElement('p', { key: index, className: 'whitespace-pre-wrap' }, ...renderInline(block.text));
      }

      if (block.type === 'ordered-list' || block.type === 'unordered-list') {
        const tag = block.type === 'ordered-list' ? 'ol' : 'ul';
        const listStyle = block.type === 'ordered-list' ? 'list-decimal' : 'list-disc';
        return createElement(
          tag,
          { key: index, className: `${listStyle} space-y-2 pl-6` },
          ...block.items.map((item, itemIndex) => createElement('li', { key: itemIndex, className: 'pl-1' }, ...renderInline(item))),
        );
      }

      if (block.type === 'blockquote') {
        return createElement('blockquote', { key: index, className: 'border-l border-amber-400 bg-amber-50 px-4 py-2 text-slate-700 rounded-r-lg whitespace-pre-wrap' }, ...renderInline(block.text));
      }

      return createElement(
        'pre',
        { key: index, className: 'overflow-x-auto rounded-xl border border-slate-200 bg-slate-950 px-4 py-3 text-xs leading-6 text-slate-100' },
        createElement('code', null, block.text),
      );
    }),
  );
}
