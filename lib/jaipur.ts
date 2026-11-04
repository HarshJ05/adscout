import type { JaipurCheck } from './types';

/** Well-known Jaipur localities and landmarks. A match is strong evidence. */
export const JAIPUR_LOCALITIES = [
  'Malviya Nagar', 'Vaishali Nagar', 'Mansarovar', 'C-Scheme', 'C Scheme', 'Raja Park', 'Jagatpura',
  'Tonk Road', 'Ajmer Road', 'Sikar Road', 'Jhotwara', 'Sanganer', 'Bani Park', 'MI Road', 'M.I. Road',
  'Civil Lines', 'Sodala', 'Durgapura', 'Pratap Nagar', 'Shyam Nagar', 'Nirman Nagar', 'Vidhyadhar Nagar',
  'Vidyadhar Nagar', 'Gopalpura', 'Tilak Nagar', 'Adarsh Nagar', 'Bapu Nagar', 'Lalkothi', 'Lal Kothi',
  'Johari Bazaar', 'Bais Godam', 'Murlipura', 'Kalwar Road', 'Jawahar Nagar', 'Sitapura', 'Mahapura',
  'Bhankrota', 'Kukas', 'Chitrakoot', 'Gandhi Path', 'Sirsi Road', 'Agra Road', 'Delhi Road', 'Amer Road',
  'Gopalbari', 'Ashok Nagar', 'Shastri Nagar', 'Mahesh Nagar', 'Triveni Nagar', 'Muhana', 'Khatipura',
  'Bhrigu Path', 'Kanakpura', 'Vatika', 'Bagru', 'Chomu', 'Hawa Mahal', 'World Trade Park', 'Gaurav Tower',
  'Jaipur International Airport', 'SMS Hospital', 'Mansarovar Metro',
];

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const LOCALITY_RE = JAIPUR_LOCALITIES.map((l) => ({ name: l, re: new RegExp(`\\b${escape(l)}\\b`, 'i') }));

/**
 * Score how strongly a piece of text points to Jaipur.
 *   "Jaipur" / "जयपुर"            +3
 *   PIN code 302xxx / 303xxx      +3
 *   Jaipur landline (0141 / +91 141) +3
 *   a known locality               +2 each (max 2 counted)
 *   "Pink City"                    +1
 * High >= 5, Medium 3-4, Low 1-2, 0 = not Jaipur.
 */
export function checkJaipur(text: string): JaipurCheck {
  const signals: string[] = [];
  let points = 0;

  if (/\bjaipur\b|जयपुर/i.test(text)) {
    points += 3;
    signals.push('Mentions "Jaipur"');
  }
  const pin = text.match(/\b30[23]\s?\d{3}\b/);
  if (pin) {
    points += 3;
    signals.push(`Jaipur PIN code ${pin[0].replace(/\s/g, '')}`);
  }
  if (/(?:\+91[\s-]?|\b0)141[\s-]?\d{3}[\s-]?\d{4}\b/.test(text)) {
    points += 3;
    signals.push('Jaipur landline (0141)');
  }
  let localityHits = 0;
  const seenAreas = new Set<string>();
  for (const { name, re } of LOCALITY_RE) {
    if (localityHits >= 2) break;
    const key = name.toLowerCase().replace(/[^a-z]/g, '');
    if (seenAreas.has(key)) continue;
    if (re.test(text)) {
      seenAreas.add(key);
      localityHits++;
      points += 2;
      signals.push(`Jaipur area: ${name}`);
    }
  }
  if (/\bpink\s?city\b/i.test(text)) {
    points += 1;
    signals.push('Mentions "Pink City"');
  }

  const level = points >= 5 ? 'High' : points >= 3 ? 'Medium' : 'Low';
  return { points, level, signals };
}
