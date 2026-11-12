'use client';

import * as React from 'react';
import Link from 'next/link';
import { Badge, Button, Dropdown, Option, Textarea, Tooltip } from '@fluentui/react-components';
import {
  ArrowDownload20Regular,
  Call16Regular,
  Chat16Regular,
  Delete16Regular,
  Mail16Regular,
  Note16Regular,
  PeopleAdd20Regular,
} from '@fluentui/react-icons';
import { useLocalStore } from '@/lib/store';
import { leadStore, resultStore, templateStore } from '@/lib/stores';
import {
  DEFAULT_TEMPLATE,
  LEAD_STATUSES,
  countByStatus,
  fillTemplate,
  leadFromCompany,
  leadsToCsv,
  setStatus,
  statusLabel,
  type Lead,
  type LeadStatus,
} from '@/lib/leads';
import { Reveal } from './Reveal';
import { cityById } from '@/lib/cities';

const digits = (s: string) => s.replace(/\D/g, '');

function download(name: string, text: string) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' }));
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

export function LeadsView() {
  const leads = useLocalStore(leadStore);
  const result = useLocalStore(resultStore);
  const template = useLocalStore(templateStore);
  const [tab, setTab] = React.useState<LeadStatus | 'all'>('all');
  const [noteOpen, setNoteOpen] = React.useState<string | null>(null);

  const all = Object.values(leads).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const counts = countByStatus(leads);
  const shown = tab === 'all' ? all : all.filter((l) => l.status === tab);
  const total = all.length || 1;

  const addTop = () => {
    if (!result) return;
    leadStore.set((m) => {
      const next = { ...m };
      for (const c of result.companies.slice(0, 10)) if (!next[c.id]) next[c.id] = leadFromCompany(c, result.mode === 'demo', new Date(), result.city);
      return next;
    });
  };
  const update = (id: string, patch: Partial<Lead>) =>
    leadStore.set((m) => (m[id] ? { ...m, [id]: { ...m[id], ...patch, updatedAt: new Date().toISOString() } } : m));
  const remove = (id: string) =>
    leadStore.set((m) => {
      const next = { ...m };
      delete next[id];
      return next;
    });

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Lead tracker</h1>
          <p>Companies you have saved and where each conversation stands. Leads are kept in this browser.</p>
        </div>
        <div className="page-actions">
          <Button icon={<PeopleAdd20Regular />} onClick={addTop} disabled={!result}>
            Add top 10 from latest search
          </Button>
          <Button icon={<ArrowDownload20Regular />} disabled={all.length === 0} onClick={() => download(`jaipur-leads-${new Date().toISOString().slice(0, 10)}.csv`, leadsToCsv(all))}>
            Download CSV
          </Button>
        </div>
      </div>

      <Reveal className="pipeline">
        {LEAD_STATUSES.map((s) => (
          <div className="pipe" key={s.id}>
            <span>{s.label}</span>
            <b>{counts[s.id]}</b>
            <div className="pipe-bar"><i style={{ width: `${(counts[s.id] / total) * 100}%` }} /></div>
          </div>
        ))}
      </Reveal>

      {all.length === 0 ? (
        <div className="surface empty">
          <h3>No leads yet</h3>
          <p>Open any company on the dashboard and choose Save as lead, or add the top 10 from your latest search in one go.</p>
          <div className="page-actions" style={{ justifyContent: 'center' }}>
            <Button appearance="primary" onClick={addTop} disabled={!result}>Add top 10</Button>
            <Link href="/dashboard"><Button>Go to dashboard</Button></Link>
          </div>
        </div>
      ) : (
        <>
          <div className="lead-tabs" role="group" aria-label="Filter by status">
            <button className="lead-tab" aria-pressed={tab === 'all'} onClick={() => setTab('all')}>All <b>{all.length}</b></button>
            {LEAD_STATUSES.map((s) => (
              <button key={s.id} className="lead-tab" aria-pressed={tab === s.id} onClick={() => setTab(s.id)}>
                {s.label} <b>{counts[s.id]}</b>
              </button>
            ))}
          </div>

          <div className="lead-list">
            {shown.length === 0 && <div className="surface empty"><p>No leads with this status.</p></div>}
            {shown.map((l) => {
              const msg = fillTemplate(template, l, cityById(l.city).name);
              const wa = l.whatsapp ?? (l.phone && /^\+91 [6-9]/.test(l.phone) ? l.phone : null);
              return (
                <div className="lead-row" key={l.id}>
                  <div>
                    <div className="lead-name">
                      {l.name} {l.sample && <Badge appearance="tint" color="warning" size="small">Sample</Badge>}
                    </div>
                    <div className="lead-meta">
                      {l.category}{l.area ? ` in ${l.area}` : ''}, {cityById(l.city).name}, score {l.score}
                      {l.note && !noteOpen ? ` · Note: ${l.note.slice(0, 60)}${l.note.length > 60 ? '…' : ''}` : ''}
                    </div>
                  </div>
                  <Dropdown
                    aria-label={`Status for ${l.name}`}
                    value={statusLabel(l.status)}
                    selectedOptions={[l.status]}
                    onOptionSelect={(_, d) => leadStore.set((m) => setStatus(m, l.id, d.optionValue as LeadStatus))}
                    style={{ minWidth: 150 }}
                  >
                    {LEAD_STATUSES.map((s) => (
                      <Option key={s.id} value={s.id}>{s.label}</Option>
                    ))}
                  </Dropdown>
                  <div className="lead-contact">
                    <span>{l.phone ?? 'No phone found'}</span>
                    <span>{l.email ?? l.website?.replace(/^https?:\/\//, '') ?? ''}</span>
                  </div>
                  <div className="lead-actions">
                    {wa && (
                      <Tooltip content="Open WhatsApp with your message filled in" relationship="description">
                        <Button size="small" appearance="primary" icon={<Chat16Regular />} as="a" href={`https://wa.me/${digits(wa)}?text=${encodeURIComponent(msg)}`} target="_blank" rel="noreferrer"
                          onClick={() => l.status === 'new' && update(l.id, { status: 'contacted' })}>
                          WhatsApp
                        </Button>
                      </Tooltip>
                    )}
                    {l.email && (
                      <Button size="small" icon={<Mail16Regular />} as="a" href={`mailto:${l.email}?subject=${encodeURIComponent(`Ideas for ${l.name}`)}&body=${encodeURIComponent(msg)}`}
                        onClick={() => l.status === 'new' && update(l.id, { status: 'contacted' })}>
                        Email
                      </Button>
                    )}
                    {l.phone && <Button size="small" icon={<Call16Regular />} as="a" href={`tel:${digits(l.phone)}`} aria-label={`Call ${l.name}`} />}
                    <Tooltip content="Note" relationship="label">
                      <Button size="small" icon={<Note16Regular />} onClick={() => setNoteOpen(noteOpen === l.id ? null : l.id)} />
                    </Tooltip>
                    <Tooltip content="Remove lead" relationship="label">
                      <Button size="small" appearance="subtle" icon={<Delete16Regular />} onClick={() => remove(l.id)} />
                    </Tooltip>
                  </div>
                  {noteOpen === l.id && (
                    <div className="lead-note">
                      <Textarea
                        resize="vertical"
                        style={{ width: '100%' }}
                        defaultValue={l.note}
                        placeholder="What happened on the call, next step, budget…"
                        onBlur={(e) => update(l.id, { note: e.target.value })}
                        autoFocus
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      <div className="section-title">
        <h2>Your message</h2>
        <p>Used for WhatsApp and email. {'{name}'}, {'{category}'}, {'{area}'} and {'{city}'} are filled in for each lead.</p>
      </div>
      <div className="surface template-box">
        <Textarea
          resize="vertical"
          style={{ width: '100%' }}
          value={template}
          onChange={(_, d) => templateStore.set(d.value)}
          aria-label="Message template"
        />
        <div style={{ marginTop: 12, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <Button size="small" onClick={() => templateStore.set(DEFAULT_TEMPLATE)}>Reset to default</Button>
          {all[0] && <span style={{ fontSize: 13, color: '#93A89E' }}>Preview: {fillTemplate(template, all[0], cityById(all[0].city).name).slice(0, 140)}…</span>}
        </div>
      </div>
    </>
  );
}
