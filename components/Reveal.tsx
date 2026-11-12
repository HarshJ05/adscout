'use client';

import * as React from 'react';

/** Blur-and-rise entrance that plays once when the element scrolls into view. */
export function Reveal({
  children,
  delay = 0,
  threshold = 0.25,
  as: Tag = 'div',
  className = '',
  style,
}: {
  children: React.ReactNode;
  delay?: number;
  threshold?: number;
  as?: 'div' | 'section' | 'p' | 'h2' | 'span' | 'li';
  className?: string;
  style?: React.CSSProperties;
}) {
  const ref = React.useRef<HTMLElement | null>(null);
  const [inView, setInView] = React.useState(false);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);

  return React.createElement(
    Tag,
    {
      ref,
      className: `reveal${inView ? ' is-in' : ''}${className ? ` ${className}` : ''}`,
      style: { transitionDelay: `${delay}s`, ...style },
    },
    children
  );
}
