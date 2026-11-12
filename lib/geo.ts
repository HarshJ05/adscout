import type { GeoCheck } from './types';
import type { City } from './cities';

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const wordRe = (s: string) => new RegExp(/^[a-z]/i.test(s) ? `\\b${escape(s)}\\b` : escape(s), 'i');

/**
 * Score how strongly a piece of text points to a city.
 *   city name (any alias or script)     +3
 *   a city PIN code (e.g. 302xxx)       +3
 *   a city landline (STD code)          +3
 *   a known local area                  +2 each (max 2 counted)
 *   the city's nickname, if any         +1
 * High >= 5, Medium 3-4, Low 1-2, 0 = not in this city.
 */
export function checkCity(text: string, city: City): GeoCheck {
  const signals: string[] = [];
  let points = 0;

  if (city.aliases.some((a) => wordRe(a).test(text))) {
    points += 3;
    signals.push(`Mentions "${city.name}"`);
  }
  const pin = text.match(new RegExp(`\\b(?:${city.pinPrefixes.join('|')})\\s?\\d{3}\\b`));
  if (pin) {
    points += 3;
    signals.push(`${city.name} PIN code ${pin[0].replace(/\s/g, '')}`);
  }
  // A landline is 10 digits including the STD code, written with a leading 0 or +91.
  const rest = 10 - city.std.length;
  const landline = new RegExp(`(?:\\+91[\\s-]?|\\b0)${city.std}[\\s-]?\\d(?:[\\s-]?\\d){${rest - 1}}\\b`);
  if (landline.test(text)) {
    points += 3;
    signals.push(`${city.name} landline (0${city.std})`);
  }

  const names = [...Object.keys(city.areas), ...Object.keys(city.areaAliases ?? {})];
  const seen = new Set<string>();
  for (const name of names) {
    if (seen.size >= 2) break;
    const canonical = city.areaAliases?.[name] ?? name;
    if (seen.has(canonical)) continue;
    if (wordRe(name).test(text)) {
      seen.add(canonical);
      points += 2;
      signals.push(`Area: ${canonical}`);
    }
  }
  if (city.nickname && wordRe(city.nickname).test(text)) {
    points += 1;
    signals.push(`Mentions "${city.nickname.replace(/\b\w/g, (c) => c.toUpperCase())}"`);
  }

  const level = points >= 5 ? 'High' : points >= 3 ? 'Medium' : 'Low';
  return { points, level, signals };
}

/** The first area named by the location check, e.g. "Area: Malviya Nagar" → "Malviya Nagar". */
export const areaFromSignals = (signals: string[]): string | null => {
  const s = signals.find((x) => x.startsWith('Area: '));
  return s ? s.slice('Area: '.length) : null;
};
