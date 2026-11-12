'use client';

import * as React from 'react';
import {
  Button,
  ToggleButton,
  Dropdown,
  Option,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
  ProgressBar,
  Spinner,
} from '@fluentui/react-components';
import { Play20Filled, Sparkle20Regular, Checkmark12Filled, Dismiss24Regular } from '@fluentui/react-icons';
import { CATEGORIES } from '@/lib/categories';
import { STEP_LABELS } from './useScan';
import { CityPicker } from './CityPicker';

interface Props {
  liveReady: boolean | null;
  running: boolean;
  step: number;
  detail: string;
  error: string | null;
  onLive: (categories: string[], limit: number) => void;
  onDemo: () => void;
  onCancel: () => void;
  onDismissError: () => void;
}

const LIMITS = [
  { value: 150, label: 'Quick — about 150 ads' },
  { value: 300, label: 'Standard — about 300 ads' },
  { value: 600, label: 'Deep — about 600 ads' },
];

export function ScanPanel(p: Props) {
  const [picked, setPicked] = React.useState<string[]>([]);
  const [limit, setLimit] = React.useState(300);

  const toggle = (id: string) => setPicked((x) => (x.includes(id) ? x.filter((y) => y !== id) : [...x, id]));
  const all = picked.length === 0;

  return (
    <section className="surface scan-card" aria-label="Search settings">
      <span className="field-label" id="city-label">City</span>
      <div style={{ marginBottom: 18 }}><CityPicker disabled={p.running} /></div>

      <span className="field-label">Which businesses?</span>
      <div className="chip-row" role="group" aria-label="Business types">
        <ToggleButton shape="circular" checked={all} onClick={() => setPicked([])} disabled={p.running}>
          All businesses
        </ToggleButton>
        {CATEGORIES.map((c) => (
          <ToggleButton key={c.id} shape="circular" checked={picked.includes(c.id)} onClick={() => toggle(c.id)} disabled={p.running}>
            {c.label}
          </ToggleButton>
        ))}
      </div>

      <span className="field-label" id="depth-label">How many ads to check</span>
      <Dropdown
        aria-labelledby="depth-label"
        value={LIMITS.find((l) => l.value === limit)?.label}
        selectedOptions={[String(limit)]}
        onOptionSelect={(_, d) => setLimit(Number(d.optionValue))}
        disabled={p.running}
        style={{ minWidth: 260, marginBottom: 20 }}
      >
        {LIMITS.map((l) => (
          <Option key={l.value} value={String(l.value)}>
            {l.label}
          </Option>
        ))}
      </Dropdown>

      <div className="scan-actions">
        {p.running ? (
          <Button appearance="secondary" size="large" icon={<Dismiss24Regular />} onClick={p.onCancel}>
            Stop
          </Button>
        ) : (
          <>
            <Button
              appearance="primary"
              size="large"
              icon={<Play20Filled />}
              disabled={p.liveReady === false}
              onClick={() => p.onLive(picked, limit)}
            >
              Find companies
            </Button>
            <Button appearance="secondary" size="large" icon={<Sparkle20Regular />} onClick={p.onDemo}>
              Show sample data
            </Button>
          </>
        )}
      </div>

      {p.liveReady === false && !p.running && (
        <MessageBar layout="multiline" intent="info" style={{ marginTop: 16 }}>
          <MessageBarBody>
            <MessageBarTitle>Live search is not connected yet.</MessageBarTitle>
            Add an Apify key (APIFY_TOKEN) in the Vercel settings to search real ads. Until then, use “Show sample data”.
          </MessageBarBody>
        </MessageBar>
      )}

      {p.error && (
        <MessageBar layout="multiline" intent="error" style={{ marginTop: 16 }}>
          <MessageBarBody>
            <MessageBarTitle>The search could not finish.</MessageBarTitle>
            {p.error}
          </MessageBarBody>
          <Button appearance="transparent" size="small" onClick={p.onDismissError}>
            Close
          </Button>
        </MessageBar>
      )}

      {p.running && (
        <div className="progress" aria-live="polite">
          <ProgressBar thickness="large" value={p.step < 0 ? undefined : (p.step + 0.5) / 4} />
          <ol className="progress-steps">
            {STEP_LABELS.map((label, i) => {
              const state = i < p.step ? 'done' : i === p.step ? 'active' : '';
              return (
                <li key={label} className={state}>
                  <span className="progress-icon">
                    {state === 'done' ? <Checkmark12Filled /> : state === 'active' ? <Spinner size="extra-tiny" /> : i + 1}
                  </span>
                  <span>
                    {label}
                    {state === 'active' && p.detail ? <span style={{ fontWeight: 400, color: 'var(--colorNeutralForeground3)' }}> — {p.detail}</span> : null}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>
      )}
    </section>
  );
}
