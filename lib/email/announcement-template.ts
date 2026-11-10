import { parseAnnouncementText } from '../announcements/text-format.ts';

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[char]!);
}

function inlineHtml(text: string): string {
  const urls = /https?:\/\/[^\s<>"']+/gi;
  let result = '';
  let cursor = 0;

  for (const match of text.matchAll(urls)) {
    const original = match[0];
    const position = match.index;
    result += escapeHtml(text.slice(cursor, position));
    const urlText = original.replace(/[.,!?;:)]+$/g, '');
    const punctuation = original.slice(urlText.length);
    if (urlText) {
      const safe = escapeHtml(urlText);
      result += '<a href="' + safe +
        '" style="color:#465ed3;text-decoration:underline;overflow-wrap:anywhere;word-break:break-word;">' +
        safe + '</a>';
    }
    result += escapeHtml(punctuation);
    cursor = position + original.length;
  }

  result += escapeHtml(text.slice(cursor));
  return result;
}

export function renderAnnouncementEmailHtml(input: {
  title: string;
  body: string;
}): string {
  const blocks = parseAnnouncementText(input.body);
  const content = blocks.map(block => {
    if (block.kind === 'paragraph') {
      return '<p style="margin:0 0 18px;line-height:1.65;font-size:16px;color:#283650;' +
        'white-space:normal;overflow-wrap:break-word;word-break:normal;">' +
        block.lines.map(inlineHtml).join('<br>') + '</p>';
    }
    const tag = block.kind === 'ordered' ? 'ol' : 'ul';
    const items = block.items.map(item =>
      '<li style="margin:0 0 8px;line-height:1.6;overflow-wrap:break-word;word-break:normal;">' +
      inlineHtml(item) + '</li>'
    ).join('');
    return '<' + tag + ' style="margin:0 0 20px;padding:0 0 0 27px;font-size:16px;' +
      'line-height:1.6;color:#283650;">' + items + '</' + tag + '>';
  }).join('\n');

  return [
    '<!doctype html>',
    '<html lang="az">',
    '<head>',
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width,initial-scale=1">',
    '<title>' + escapeHtml(input.title) + '</title>',
    '</head>',
    '<body style="margin:0;padding:0;background:#f1f4fa;font-family:Arial,Helvetica,sans-serif;color:#283650;">',
    '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse:collapse;background:#f1f4fa;">',
    '<tr><td align="center" style="padding:24px 12px;">',
    '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse:collapse;max-width:600px;width:100%;background:#ffffff;">',
    '<tr><td style="background:#17223d;padding:20px 24px;border-top:4px solid #5369d9;">',
    '<span style="color:#ffffff;font-size:23px;font-weight:700;">Talora</span>',
    '<span style="color:#afbcff;font-size:13px;margin-left:12px;">Bildirişlər</span>',
    '</td></tr>',
    '<tr><td style="padding:28px 24px 12px;">',
    '<h1 style="margin:0 0 24px;color:#182340;font-size:23px;line-height:1.35;overflow-wrap:break-word;word-break:normal;">' +
      escapeHtml(input.title) + '</h1>',
    content,
    '</td></tr>',
    '<tr><td style="padding:18px 24px;border-top:1px solid #e4e9f2;color:#65728a;font-size:12px;line-height:1.5;">',
    'Bu məktub Talora platforması vasitəsilə göndərilib.',
    '</td></tr>',
    '</table>',
    '</td></tr>',
    '</table>',
    '</body>',
    '</html>',
  ].join('\n');
}
