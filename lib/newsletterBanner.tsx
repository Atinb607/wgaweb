import React from 'react';

export const DEFAULT_NEWSLETTER_BANNER = {
  newsletter_title: 'Want 15% off and the inside scoop?',
  newsletter_subtitle:
    'Get 15% off your first order, plus early access to new varieties, growing tips and exclusive seasonal drops.',
  newsletter_button_text: 'Sign Up',
  newsletter_placeholder: 'your@email.com',
  newsletter_disclaimer: 'No spam. Unsubscribe anytime.',
};

/**
 * Renders the newsletter headline with support for:
 * - *asterisks* or _underscores_ to highlight phrases in italic lime-green (#CFFA57)
 * - Automatic highlighting for legacy/default phrase 'inside scoop?'
 * - Preserving line breaks (\n)
 */
export function renderNewsletterTitle(rawTitle?: string) {
  if (!rawTitle) {
    return (
      <>
        Want 15% off and<br />
        the <em className="italic text-[#CFFA57] font-normal">inside scoop?</em>
      </>
    );
  }

  // If text contains markdown *highlight* or _highlight_
  if (/\*([^*]+)\*/.test(rawTitle) || /_([^_]+)_/.test(rawTitle)) {
    const parts = rawTitle.split(/(\*[^*]+\*|_[^_]+_)/g);
    return (
      <>
        {parts.map((part, i) => {
          if ((part.startsWith('*') && part.endsWith('*')) || (part.startsWith('_') && part.endsWith('_'))) {
            return (
              <em key={i} className="italic text-[#CFFA57] font-normal">
                {part.slice(1, -1)}
              </em>
            );
          }
          return part.split('\n').map((line, j, arr) => (
            <React.Fragment key={j}>
              {line}
              {j < arr.length - 1 && <br />}
            </React.Fragment>
          ));
        })}
      </>
    );
  }

  // Fallback for default 'inside scoop?'
  if (rawTitle.includes('inside scoop?')) {
    const [before, after] = rawTitle.split('inside scoop?');
    return (
      <>
        {before}
        <em className="italic text-[#CFFA57] font-normal">inside scoop?</em>
        {after}
      </>
    );
  }

  // Default: preserve newlines
  return (
    <>
      {rawTitle.split('\n').map((line, idx, arr) => (
        <React.Fragment key={idx}>
          {line}
          {idx < arr.length - 1 && <br />}
        </React.Fragment>
      ))}
    </>
  );
}
