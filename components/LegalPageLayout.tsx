import React from 'react';
import { CLOUDINARY_ASSETS } from '@/lib/publicImages';

interface LegalPageLayoutProps {
  pageTitle: string;
  docHeading?: string;
  preamble?: string;
  content: string;
  lastUpdated?: string;
  showFssai?: boolean;
}

/**
 * Formats inline bold (**text**) and markdown links ([text](url) or naked URLs) safely.
 */
function renderInlineFormatted(text: string): React.ReactNode {
  // Regex to split by bold (**bold**) and markdown links [text](url) and plain links
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\)|https?:\/\/[^\s)]+)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    const token = match[0];
    if (token.startsWith('**') && token.endsWith('**')) {
      parts.push(
        <strong key={match.index} className="font-semibold text-[#151F19]">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith('[') && token.includes('](')) {
      const closeBracket = token.indexOf('](');
      const linkText = token.slice(1, closeBracket);
      const linkUrl = token.slice(closeBracket + 2, -1);
      parts.push(
        <a
          key={match.index}
          href={linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-[#1C3F2D] transition-colors"
        >
          {linkText}
        </a>
      );
    } else if (token.startsWith('http')) {
      parts.push(
        <a
          key={match.index}
          href={token}
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-[#1C3F2D] transition-colors"
        >
          {token}
        </a>
      );
    }
    lastIndex = match.index + token.length;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts.length > 0 ? parts : text;
}

/**
 * Checks whether a single short line is an all-caps section header (like "OVERVIEW", "SECTION 1 - ...")
 */
function isSectionHeading(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed || trimmed.length > 120) return false;
  if (trimmed.startsWith('#')) return true;

  // Has letters, and all letters are uppercase
  const letters = trimmed.replace(/[^a-zA-Z]/g, '');
  if (letters.length >= 3 && letters === letters.toUpperCase()) {
    // Exclude long legal disclaimers (e.g. over 150 chars or multi-sentence)
    if (trimmed.split('. ').length > 1) return false;
    return true;
  }
  return false;
}

export default function LegalPageLayout({
  pageTitle,
  docHeading,
  preamble,
  content,
  lastUpdated,
  showFssai = false,
}: LegalPageLayoutProps) {
  const isHtml = /<[a-z][\s\S]*>/i.test(content);

  // Parse plain text / markdown into structured blocks if not raw HTML
  const blocks = React.useMemo(() => {
    if (isHtml) return [];
    return content
      .split(/\n{2,}/)
      .map((b) => b.trim())
      .filter(Boolean);
  }, [content, isHtml]);

  return (
    <div className="bg-white min-h-screen text-[#151F19] font-sans">
      <main className="max-w-6xl xl:max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 pt-28 sm:pt-36 pb-20 sm:pb-28">
        {/* Page Title: Top Left, Simple Bold Sans-Serif */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 sm:mb-10">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#151F19] font-sans">
            {pageTitle}
          </h1>
          {showFssai && (
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FAF7F0] border border-[#E4DDC8] text-xs font-mono text-[#1C3F2D] w-fit shadow-xs">
              <span className="w-2 h-2 rounded-full bg-[#2E7D32]" />
              <span>FSSAI Registered</span>
            </div>
          )}
        </div>

        {/* Centered Document Heading (e.g. TERMS OF SERVICE) */}
        {docHeading && (
          <div className="text-center mb-8 sm:mb-10">
            <h2 className="inline-block font-sans font-bold text-sm sm:text-base uppercase tracking-wider underline text-[#151F19]">
              {docHeading}
            </h2>
          </div>
        )}

        {/* Preamble / Electronic Record Disclaimer */}
        {preamble && (
          <div className="mb-8 sm:mb-10 font-sans font-bold uppercase text-xs sm:text-sm text-[#151F19] leading-relaxed">
            {preamble}
          </div>
        )}

        {/* Policy Body */}
        {isHtml ? (
          <div
            className="legal-content font-sans text-sm sm:text-base text-[#151F19] leading-relaxed sm:leading-7 space-y-4
              [&_h2]:font-bold [&_h2]:uppercase [&_h2]:underline [&_h2]:text-sm sm:[&_h2]:text-base [&_h2]:mt-8 [&_h2]:mb-4
              [&_h3]:font-bold [&_h3]:uppercase [&_h3]:underline [&_h3]:text-sm sm:[&_h3]:text-base [&_h3]:mt-6 [&_h3]:mb-3
              [&_p]:mb-4 [&_p]:leading-relaxed sm:[&_p]:leading-7
              [&_ul]:list-disc [&_ul]:pl-5 sm:[&_ul]:pl-6 [&_ul]:space-y-2 [&_ul]:mb-4
              [&_ol]:list-decimal [&_ol]:pl-5 sm:[&_ol]:pl-6 [&_ol]:space-y-2 [&_ol]:mb-4
              [&_a]:underline hover:[&_a]:text-[#1C3F2D]"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        ) : (
          <div className="legal-content font-sans text-sm sm:text-base text-[#151F19] leading-relaxed sm:leading-7 space-y-4">
            {blocks.map((block, idx) => {
              // Heading with Markdown ## or all-caps header
              if (block.startsWith('#') || isSectionHeading(block)) {
                const headingText = block.replace(/^#+\s*/, '').trim();
                return (
                  <h3
                    key={idx}
                    className="font-sans font-bold uppercase text-sm sm:text-base underline text-[#151F19] mt-8 mb-4 block"
                  >
                    {headingText}
                  </h3>
                );
              }

              const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);

              // Bullet List
              if (lines.length > 0 && lines.every((l) => /^[-*•]\s+/.test(l))) {
                return (
                  <ul key={idx} className="list-disc pl-5 sm:pl-6 space-y-2 mb-4 text-sm sm:text-base text-[#151F19] leading-relaxed">
                    {lines.map((item, itemIdx) => (
                      <li key={itemIdx}>
                        {renderInlineFormatted(item.replace(/^[-*•]\s+/, ''))}
                      </li>
                    ))}
                  </ul>
                );
              }

              // Numbered List
              if (lines.length > 0 && lines.every((l) => /^\d+\.\s+/.test(l))) {
                return (
                  <ol key={idx} className="list-decimal pl-5 sm:pl-6 space-y-2 mb-4 text-sm sm:text-base text-[#151F19] leading-relaxed">
                    {lines.map((item, itemIdx) => (
                      <li key={itemIdx}>
                        {renderInlineFormatted(item.replace(/^\d+\.\s+/, ''))}
                      </li>
                    ))}
                  </ol>
                );
              }

              // Standard Paragraph with support for line breaks inside
              return (
                <p key={idx} className="font-sans text-sm sm:text-base text-[#151F19] leading-relaxed sm:leading-7 mb-4">
                  {lines.map((line, lineIdx) => (
                    <React.Fragment key={lineIdx}>
                      {renderInlineFormatted(line)}
                      {lineIdx < lines.length - 1 && <br />}
                    </React.Fragment>
                  ))}
                </p>
              );
            })}
          </div>
        )}

        {/* FSSAI Registration Compliance Card */}
        {showFssai && (
          <div className="mt-14 pt-8 border-t border-[#E4DDC8]">
            <div className="p-6 sm:p-8 bg-[#FAF7F0] border border-[#E4DDC8] rounded-2xl flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
              <a
                href={CLOUDINARY_ASSETS.fssai}
                target="_blank"
                rel="noopener noreferrer"
                title="View FSSAI Registration Certificate"
                className="bg-white p-3.5 sm:p-4 rounded-xl border border-[#E4DDC8] shadow-sm flex items-center justify-center flex-shrink-0 hover:border-[#1C3F2D] transition-all group cursor-zoom-in"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={CLOUDINARY_ASSETS.fssai}
                  alt="FSSAI Registration"
                  width={160}
                  height={80}
                  loading="lazy"
                  decoding="async"
                  className="h-16 sm:h-20 w-auto object-contain group-hover:scale-105 transition-transform"
                />
              </a>
              <div>
                <span className="font-mono text-[11px] uppercase tracking-wider text-[#1C3F2D] font-bold block mb-1">
                  Food Safety Compliance &amp; Standards
                </span>
                <h3 className="font-serif text-base sm:text-lg font-bold text-[#151F19] mb-1">
                  Food Safety and Standards Authority of India (FSSAI)
                </h3>
                <p className="text-xs sm:text-sm text-[#5C6B60] leading-relaxed">
                  Wild About Greens is certified and registered with the Food Safety and Standards Authority of India (FSSAI). All harvesting, handling, packaging, and distribution operations comply with statutory hygiene requirements and food safety regulations under the Food Safety and Standards Act, 2006.

                </p>
              </div>
            </div>
          </div>
        )}

        {/* Optional Last Updated Note */}
        {lastUpdated && (
          <div className="mt-10 pt-4 border-t border-[#E4DDC8] text-xs text-[#5C6B60] font-sans">
            Last Updated: {lastUpdated}
          </div>
        )}
      </main>
    </div>
  );
}
