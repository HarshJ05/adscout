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
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  DialogActions,
  Input,
  Field,
} from '@fluentui/react-components';
import { Play20Filled, Sparkle20Regular, Checkmark12Filled, Dismiss24Regular, LockClosed20Regular } from '@fluentui/react-icons';
import { CATEGORIES } from '@/lib/categories';
import { STEP_LABELS, savedLivePassword, saveLivePassword } from './useScan';
import { CityPicker } from './CityPicker';

interface Props {
  liveReady: boolean | null;
  /** Live search needs a password (sample data never does) */
  locked: boolean;
  running: boolean;
  step: number;
  detail: string;
  error: string | null;
  onLive: (categories: string[], limit: number, password: string) => void;
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
  const [limit, setLimit] = React.useState(150);
  const [askPass, setAskPass] = React.useState(false);
  const [pass, setPass] = React.useState('');

  const startLive = () => {
    if (!p.locked) return p.onLive(picked, limit, '');
    const saved = savedLivePassword();
    if (saved) return p.onLive(picked, limit, saved);
    setAskPass(true);
  };
  const submitPass = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!pass.trim()) return;
    saveLivePassword(pass.trim());
    setAskPass(false);
    p.onLive(picked, limit, pass.trim());
    setPass('');
  };

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
              icon={p.locked ? <LockClosed20Regular /> : <Play20Filled />}
              disabled={p.liveReady === false}
              onClick={startLive}
            >
              Find companies
            </Button>
            <Button appearance="secondary" size="large" icon={<Sparkle20Regular />} onClick={p.onDemo}>
              Show sample data
            </Button>
          </>
        )}
      </div>

      {p.locked && p.liveReady && !p.running && (
        <p className="sub" style={{ margin: '12px 0 0', fontSize: 13 }}>
          Live search uses real Meta ads and needs a password. Anyone can try it with sample data.
        </p>
      )}

      <Dialog open={askPass} onOpenChange={(_, d) => setAskPass(d.open)}>
        <DialogSurface style={{ maxWidth: 420 }}>
          <form onSubmit={submitPass}>
            <DialogBody>
              <DialogTitle>Enter the live search password</DialogTitle>
              <DialogContent>
                <p style={{ marginTop: 0, color: 'var(--colorNeutralForeground3)', fontSize: 14 }}>
                  Live searches read real ads and use the owner’s credit. Don’t have the password? Use “Show sample data”.
                </p>
                <Field label="Password">
                  <Input type="password" value={pass} onChange={(_, d) => setPass(d.value)} autoFocus />
                </Field>
              </DialogContent>
              <DialogActions>
                <Button appearance="secondary" type="button" onClick={() => setAskPass(false)}>Cancel</Button>
                <Button appearance="primary" type="submit" disabled={!pass.trim()}>Start search</Button>
              </DialogActions>
            </DialogBody>
          </form>
        </DialogSurface>
      </Dialog>

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
