import type { ReactNode } from 'react';

interface MarkdownContentProps {
  value: string;
  emptyText?: string;
  className?: string;
}

type Block =
  | { type: 'heading'; level: 2 | 3; content: string }
  | { type: 'paragraph'; content: string }
  | { type: 'quote'; content: string }
  | { type: 'list'; ordered: boolean; items: string[] }
  | { type: 'code'; content: string };

export default function MarkdownContent({
  value,
  emptyText = '아직 적힌 내용이 없어요.',
  className = '',
}: MarkdownContentProps) {
  const blocks = parseMarkdownBlocks(value);

  if (blocks.length === 0) {
    return <p className={`text-base leading-7 text-mt-text-secondary ${className}`}>{emptyText}</p>;
  }

  return (
    <div className={`space-y-4 break-words text-base leading-7 text-mt-text-nav ${className}`}>
      {blocks.map((block, index) => renderBlock(block, index))}
    </div>
  );
}

function parseMarkdownBlocks(value: string) {
  const lines = value.replace(/\r\n/g, '\n').split('\n');
  const blocks: Block[] = [];
  let paragraph: string[] = [];
  let listItems: string[] = [];
  let listOrdered = false;
  let codeLines: string[] = [];
  let inCode = false;

  const flushParagraph = () => {
    if (paragraph.length === 0) {
      return;
    }

    blocks.push({ type: 'paragraph', content: paragraph.join('\n') });
    paragraph = [];
  };

  const flushList = () => {
    if (listItems.length === 0) {
      return;
    }

    blocks.push({ type: 'list', ordered: listOrdered, items: listItems });
    listItems = [];
  };

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith('```')) {
      flushParagraph();
      flushList();

      if (inCode) {
        blocks.push({ type: 'code', content: codeLines.join('\n') });
        codeLines = [];
        inCode = false;
      } else {
        inCode = true;
      }

      continue;
    }

    if (inCode) {
      codeLines.push(line);
      continue;
    }

    if (!trimmed) {
      flushParagraph();
      flushList();
      continue;
    }

    const headingMatch = /^(#{1,3})\s+(.+)$/.exec(trimmed);
    if (headingMatch) {
      flushParagraph();
      flushList();
      blocks.push({
        type: 'heading',
        level: headingMatch[1].length === 1 ? 2 : 3,
        content: headingMatch[2],
      });
      continue;
    }

    const quoteMatch = /^>\s?(.+)$/.exec(trimmed);
    if (quoteMatch) {
      flushParagraph();
      flushList();
      blocks.push({ type: 'quote', content: quoteMatch[1] });
      continue;
    }

    const unorderedListMatch = /^[-*]\s+(.+)$/.exec(trimmed);
    const orderedListMatch = /^\d+[.)]\s+(.+)$/.exec(trimmed);

    if (unorderedListMatch || orderedListMatch) {
      flushParagraph();

      const ordered = Boolean(orderedListMatch);
      if (listItems.length > 0 && listOrdered !== ordered) {
        flushList();
      }

      listOrdered = ordered;
      listItems.push((orderedListMatch ?? unorderedListMatch)?.[1] ?? '');
      continue;
    }

    flushList();
    paragraph.push(line);
  }

  if (inCode && codeLines.length > 0) {
    blocks.push({ type: 'code', content: codeLines.join('\n') });
  }

  flushParagraph();
  flushList();

  return blocks;
}

function renderBlock(block: Block, index: number) {
  switch (block.type) {
    case 'heading': {
      const className =
        block.level === 2
          ? 'text-xl leading-7 font-bold text-mt-text-primary'
          : 'text-lg leading-7 font-bold text-mt-text-primary';

      return (
        <h3 key={index} className={className}>
          {renderInlineMarkdown(block.content)}
        </h3>
      );
    }
    case 'quote':
      return (
        <blockquote
          key={index}
          className="border-l-4 border-mt-border bg-mt-badge-bg px-4 py-3 text-mt-text-nav"
        >
          {renderInlineMarkdown(block.content)}
        </blockquote>
      );
    case 'list': {
      const ListTag = block.ordered ? 'ol' : 'ul';
      const listClassName = block.ordered
        ? 'list-decimal space-y-2 pl-6 text-mt-text-nav'
        : 'list-disc space-y-2 pl-6 text-mt-text-nav';

      return (
        <ListTag key={index} className={listClassName}>
          {block.items.map((item, itemIndex) => (
            <li key={`${index}-${itemIndex}`}>{renderInlineMarkdown(item)}</li>
          ))}
        </ListTag>
      );
    }
    case 'code':
      return (
        <pre
          key={index}
          className="overflow-x-auto rounded-xl border border-mt-border bg-mt-bg-soft px-4 py-3 text-sm leading-6 text-mt-text-primary"
        >
          <code>{block.content}</code>
        </pre>
      );
    case 'paragraph':
    default:
      return (
        <p key={index} className="whitespace-break-spaces text-mt-text-nav">
          {renderInlineMarkdown(block.content)}
        </p>
      );
  }
}

function renderInlineMarkdown(value: string) {
  const parts: ReactNode[] = [];
  const pattern = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;
  let cursor = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(value))) {
    if (match.index > cursor) {
      parts.push(value.slice(cursor, match.index));
    }

    const token = match[0];

    if (token.startsWith('**')) {
      parts.push(
        <strong key={parts.length} className="font-bold text-mt-text-primary">
          {token.slice(2, -2)}
        </strong>,
      );
    } else if (token.startsWith('`')) {
      parts.push(
        <code
          key={parts.length}
          className="rounded-md bg-mt-bg-soft px-1.5 py-0.5 text-sm text-mt-text-nav"
        >
          {token.slice(1, -1)}
        </code>,
      );
    } else {
      const linkMatch = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(token);
      const href = linkMatch?.[2] ?? '';

      parts.push(
        isSafeLink(href) ? (
          <a
            key={parts.length}
            href={href}
            target="_blank"
            rel="noreferrer"
            className="font-semibold text-mt-primary underline underline-offset-4"
          >
            {linkMatch?.[1]}
          </a>
        ) : (
          linkMatch?.[1]
        ),
      );
    }

    cursor = match.index + token.length;
  }

  if (cursor < value.length) {
    parts.push(value.slice(cursor));
  }

  return parts.length > 0 ? parts : value;
}

function isSafeLink(href: string) {
  return /^(https?:\/\/|mailto:)/i.test(href);
}
