'use client';

import Link from 'next/link';
import { Button, Dropdown, Option } from '@fluentui/react-components';
import { PersonAdd20Regular } from '@fluentui/react-icons';
import type { Company } from '@/lib/types';
import { useLocalStore } from '@/lib/store';
import { leadStore, cityStore } from '@/lib/stores';
import { LEAD_STATUSES, leadFromCompany, setStatus, statusLabel, type LeadStatus } from '@/lib/leads';

/** Save a company as a lead, or change its status, from anywhere it is shown. */
export function LeadControl({ company, sample }: { company: Company; sample: boolean }) {
  const leads = useLocalStore(leadStore);
  const lead = leads[company.id];

  if (!lead) {
    return (
      <div className="lead-box">
        <p>Track this company: save it as a lead and record each call or message.</p>
        <Button appearance="primary" icon={<PersonAdd20Regular />} onClick={() => leadStore.set((m) => ({ ...m, [company.id]: leadFromCompany(company, sample, new Date(), cityStore.get()) }))}>
          Save as lead
        </Button>
      </div>
    );
  }
  return (
    <div className="lead-box">
      <p>
        Saved as a lead. <Link href="/leads">Open lead tracker</Link>
      </p>
      <Dropdown
        aria-label="Lead status"
        value={statusLabel(lead.status)}
        selectedOptions={[lead.status]}
        onOptionSelect={(_, d) => leadStore.set((m) => setStatus(m, company.id, d.optionValue as LeadStatus))}
        style={{ minWidth: 170 }}
      >
        {LEAD_STATUSES.map((s) => (
          <Option key={s.id} value={s.id}>{s.label}</Option>
        ))}
      </Dropdown>
    </div>
  );
}
