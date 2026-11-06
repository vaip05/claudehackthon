import { Fragment, type ReactNode } from 'react';

// Tiny, dependency-free markdown renderer for chat replies and the doctor brief.
// Supports: #/##/### headings, -/*/• bullets, 1. lists, **bold**, *italic*, paragraphs.
// Everything is rendered as React elements (no raw HTML), so model output can't inject markup.

function inline(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern = /(\*\*[^*]+\*\*|\*[^*\s][^*]*\*|_[^_\s][^_]*_)/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let i = 0;
  while ((match = pattern.exec(text))) {
    if (match.index > last) nodes.push(text.slice(last, match.index));
    const token = match[0];
    if (token.startsWith('**')) nodes.push(<strong key={i++}>{token.slice(2, -2)}</strong>);
    else nodes.push(<em key={i++}>{token.slice(1, -1)}</em>);
    last = match.index + token.length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

type Block =
  | { kind: 'heading'; level: number; text: string }
  | { kind: 'ul' | 'ol'; items: string[] }
  | { kind: 'p'; text: string };

function parse(source: string): Block[] {
  const blocks: Block[] = [];
  let paragraph: string[] = [];
  let list: { kind: 'ul' | 'ol'; items: string[] } | null = null;

  const flushParagraph = () => {
    if (paragraph.length) blocks.push({ kind: 'p', text: paragraph.join(' ') });
    paragraph = [];
  };
  const flushList = () => {
    if (list) blocks.push(list);
    list = null;
  };

  for (const raw of source.split('\n')) {
    const line = raw.trimEnd();
    const trimmed = line.trim();
    const heading = /^(#{1,3})\s+(.*)$/.exec(trimmed);
    const bullet = /^[-*•]\s+(.*)$/.exec(trimmed);
    const numbered = /^\d+[.)]\s+(.*)$/.exec(trimmed);

    if (!trimmed) {
      flushParagraph();
      flushList();
    } else if (heading) {
      flushParagraph();
      flushList();
      blocks.push({ kind: 'heading', level: heading[1].length, text: heading[2] });
    } else if (bullet || numbered) {
      flushParagraph();
      const kind = bullet ? 'ul' : 'ol';
      if (!list || list.kind !== kind) {
        flushList();
        list = { kind, items: [] };
      }
      list.items.push((bullet ?? numbered)![1]);
    } else {
      flushList();
      paragraph.push(trimmed);
    }
  }
  flushParagraph();
  flushList();
  return blocks;
}

export default function Markdown({ text, className = '' }: { text: string; className?: string }) {
  const blocks = parse(text);
  return (
    <div className={`space-y-2 ${className}`}>
      {blocks.map((block, i) => {
        if (block.kind === 'heading') {
          const cls =
            block.level === 1
              ? 'font-serif text-2xl text-rose-900'
              : block.level === 2
                ? 'pt-3 font-serif text-xl text-rose-900'
                : 'font-semibold';
          return (
            <h3 key={i} className={cls}>
              {inline(block.text)}
            </h3>
          );
        }
        if ('items' in block) {
          const Tag = block.kind;
          return (
            <Tag key={i} className={`ml-5 space-y-1 ${block.kind === 'ul' ? 'list-disc' : 'list-decimal'}`}>
              {block.items.map((item, j) => (
                <li key={j}>{inline(item)}</li>
              ))}
            </Tag>
          );
        }
        return (
          <Fragment key={i}>
            <p>{inline(block.text)}</p>
          </Fragment>
        );
      })}
    </div>
  );
}
