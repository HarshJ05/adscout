'use client';

import { Button } from '@fluentui/react-components';

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="surface empty" style={{ marginTop: 40 }}>
      <span className="eyebrow">Something went wrong</span>
      <h3>The page hit an unexpected error</h3>
      <p>Try again. If it keeps happening, reload the page.</p>
      {error.digest && <p style={{ fontSize: 12 }}>Error code: {error.digest}</p>}
      <Button appearance="primary" onClick={reset}>Try again</Button>
    </div>
  );
}
