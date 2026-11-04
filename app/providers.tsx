'use client';

import * as React from 'react';
import {
  createDOMRenderer,
  RendererProvider,
  FluentProvider,
  SSRProvider,
  renderToStyleElements,
  webLightTheme,
  webDarkTheme,
} from '@fluentui/react-components';
import { useServerInsertedHTML } from 'next/navigation';

type Mode = 'light' | 'dark';
const ThemeCtx = React.createContext<{ mode: Mode; toggle: () => void }>({ mode: 'light', toggle: () => {} });
export const useThemeMode = () => React.useContext(ThemeCtx);

const THEME_KEY = 'jaf:theme';

/** Microsoft Fluent UI setup for the Next.js App Router, with light/dark mode. */
export function Providers({ children }: { children: React.ReactNode }) {
  const [renderer] = React.useState(() => createDOMRenderer());
  const didRenderRef = React.useRef(false);
  const [mode, setMode] = React.useState<Mode>('light');

  useServerInsertedHTML(() => {
    if (didRenderRef.current) return;
    didRenderRef.current = true;
    return <>{renderToStyleElements(renderer)}</>;
  });

  React.useEffect(() => {
    let saved: string | null = null;
    try {
      saved = localStorage.getItem(THEME_KEY);
    } catch {
      /* storage blocked */
    }
    const initial: Mode =
      saved === 'dark' || saved === 'light' ? saved : window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    // The saved theme is only readable in the browser, after the first render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMode(initial);
  }, []);

  React.useEffect(() => {
    document.documentElement.dataset.theme = mode;
  }, [mode]);

  const toggle = React.useCallback(() => {
    setMode((m) => {
      const next = m === 'light' ? 'dark' : 'light';
      try {
        localStorage.setItem(THEME_KEY, next);
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  return (
    <ThemeCtx.Provider value={{ mode, toggle }}>
      <RendererProvider renderer={renderer}>
        <SSRProvider>
          <FluentProvider theme={mode === 'dark' ? webDarkTheme : webLightTheme}>
            <div className="app-root">{children}</div>
          </FluentProvider>
        </SSRProvider>
      </RendererProvider>
    </ThemeCtx.Provider>
  );
}
