import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const articleModule = await import('../components/tasks/instruction-article.mjs').catch(() => null);

const brief = `## Məqsəd
API-nin davranışını sənədləşdir.

1. Endpoint-i təsvir et.
2. Sorğunu sına.

- README əlavə et.
- Uğursuz ssenarini qeyd et.`;

test('renders task brief headings and steps as readable semantic HTML', () => {
  assert.ok(articleModule, 'task instruction article component should exist');
  const html = renderToStaticMarkup(
    React.createElement(articleModule.TaskInstructionArticle, { content: brief }),
  );
  assert.match(html, /<h3[^>]*>Məqsəd<\/h3>/);
  assert.match(html, /<p[^>]*>API-nin davranışını sənədləşdir\.<\/p>/);
  assert.match(html, /<ol[^>]*><li[^>]*>Endpoint-i təsvir et\.<\/li><li[^>]*>Sorğunu sına\.<\/li><\/ol>/);
  assert.match(html, /<ul[^>]*><li[^>]*>README əlavə et\.<\/li><li[^>]*>Uğursuz ssenarini qeyd et\.<\/li><\/ul>/);
});

test('escapes HTML inside task content instead of injecting markup', () => {
  assert.ok(articleModule, 'task instruction article component should exist');
  const html = renderToStaticMarkup(
    React.createElement(articleModule.TaskInstructionArticle, { content: '<script>alert(1)</script>' }),
  );
  assert.doesNotMatch(html, /<script>/i);
  assert.match(html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/i);
});

test('highlights inline code and emphasis in paragraphs, steps and headings', () => {
  const html = renderToStaticMarkup(React.createElement(articleModule.TaskInstructionArticle, {
    content: '## `README.md` faylı\n\n`GET /projects` sorğusu və **vacib nəticə**.\n\n1. `openapi.yaml` yarat.\n2. **`README.md` əlavə et.**',
  }));
  assert.match(html, /<h3[^>]*><code class="task-brief-inline-code">README.md<\/code> faylı<\/h3>/);
  assert.match(html, /<code class="task-brief-inline-code">GET \/projects<\/code>/);
  assert.match(html, /<strong class="task-brief-emphasis">vacib nəticə<\/strong>/);
  assert.match(html, /<li[^>]*><code class="task-brief-inline-code">openapi.yaml<\/code> yarat\.<\/li>/);
  assert.match(html, /<strong class="task-brief-emphasis"><code class="task-brief-inline-code">README.md<\/code> əlavə et\.<\/strong>/);
});

test('code tokens escape HTML and fenced code stays literal', () => {
  const html = renderToStaticMarkup(React.createElement(articleModule.TaskInstructionArticle, {
    content: '`<img src=x onerror=alert(1)>`\n\n```html\n**literal** `code` <script>alert(1)</script>\n```',
  }));
  assert.doesNotMatch(html, /<img|<script/i);
  assert.match(html, /&lt;img src=x onerror=alert\(1\)&gt;/);
  assert.match(html, /<pre[^>]*><code>\*\*literal\*\* `code` &lt;script&gt;/);
});
