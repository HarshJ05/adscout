'use client';

import * as React from 'react';
import {
  createDOMRenderer,
  RendererProvider,
  FluentProvider,
  SSRProvider,
  renderToStyleElements,
} from '@fluentui/react-components';
import { useServerInsertedHTML } from 'next/navigation';
import { emeraldTheme } from '@/lib/theme';

/** Microsoft Fluent UI setup for the Next.js App Router, in the black + emerald theme. */
export function Providers({ children }: { children: React.ReactNode }) {
  const [renderer] = React.useState(() => createDOMRenderer());
  const didRenderRef = React.useRef(false);

  useServerInsertedHTML(() => {
    if (didRenderRef.current) return;
    didRenderRef.current = true;
    return <>{renderToStyleElements(renderer)}</>;
  });

  return (
    <RendererProvider renderer={renderer}>
      <SSRProvider>
        <FluentProvider theme={emeraldTheme} style={{ background: "transparent" }}>
          {children}
        </FluentProvider>
      </SSRProvider>
    </RendererProvider>
  );
}
