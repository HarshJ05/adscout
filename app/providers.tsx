'use client';

import * as React from 'react';
import {
  createDOMRenderer,
  RendererProvider,
  FluentProvider,
  SSRProvider,
  renderToStyleElements,
  webLightTheme,
} from '@fluentui/react-components';
import { useServerInsertedHTML } from 'next/navigation';

/** Microsoft Fluent UI setup for the Next.js App Router (styles rendered on the server too). */
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
        <FluentProvider theme={webLightTheme}>
          <div className="app-root">{children}</div>
        </FluentProvider>
      </SSRProvider>
    </RendererProvider>
  );
}
