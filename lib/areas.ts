/**
 * Approximate centre points (latitude, longitude) of Jaipur areas, used to place
 * advertisers on the schematic city map. Positions are approximate by design —
 * the map shows where advertisers cluster, it is not a navigation map.
 */
export const AREA_COORDS: Record<string, [number, number]> = {
  'malviya nagar': [26.855, 75.815],
  'vaishali nagar': [26.912, 75.742],
  mansarovar: [26.866, 75.762],
  'c-scheme': [26.906, 75.806],
  'c scheme': [26.906, 75.806],
  'raja park': [26.897, 75.828],
  jagatpura: [26.83, 75.862],
  'tonk road': [26.862, 75.8],
  'ajmer road': [26.887, 75.73],
  'sikar road': [26.968, 75.778],
  jhotwara: [26.95, 75.752],
  sanganer: [26.822, 75.79],
  'bani park': [26.93, 75.796],
  'mi road': [26.916, 75.811],
  'm.i. road': [26.916, 75.811],
  'civil lines': [26.903, 75.784],
  sodala: [26.906, 75.77],
  durgapura: [26.85, 75.792],
  'pratap nagar': [26.8, 75.82],
  'shyam nagar': [26.89, 75.766],
  'nirman nagar': [26.885, 75.755],
  'vidhyadhar nagar': [26.96, 75.786],
  'vidyadhar nagar': [26.96, 75.786],
  gopalpura: [26.866, 75.79],
  'tilak nagar': [26.891, 75.825],
  'adarsh nagar': [26.903, 75.837],
  'bapu nagar': [26.889, 75.815],
  lalkothi: [26.885, 75.801],
  'lal kothi': [26.885, 75.801],
  'johari bazaar': [26.921, 75.826],
  'bais godam': [26.905, 75.79],
  murlipura: [26.966, 75.77],
  'kalwar road': [26.962, 75.73],
  'jawahar nagar': [26.88, 75.833],
  sitapura: [26.78, 75.848],
  mahapura: [26.85, 75.685],
  bhankrota: [26.872, 75.69],
  kukas: [27.0, 75.885],
  chitrakoot: [26.902, 75.726],
  'gandhi path': [26.9, 75.733],
  'sirsi road': [26.93, 75.72],
  'agra road': [26.906, 75.88],
  'delhi road': [26.962, 75.852],
  'amer road': [26.95, 75.84],
  gopalbari: [26.918, 75.797],
  'ashok nagar': [26.909, 75.801],
  'shastri nagar': [26.94, 75.81],
  'mahesh nagar': [26.874, 75.79],
  'triveni nagar': [26.86, 75.785],
  muhana: [26.8, 75.77],
  khatipura: [26.92, 75.75],
  'bhrigu path': [26.86, 75.822],
  kanakpura: [26.92, 75.712],
  vatika: [26.76, 75.83],
  'hawa mahal': [26.924, 75.827],
  'world trade park': [26.854, 75.806],
  'gaurav tower': [26.856, 75.804],
  'jaipur international airport': [26.826, 75.812],
  'sms hospital': [26.905, 75.815],
  'mansarovar metro': [26.87, 75.766],
};

/** Centre of the walled city (old Jaipur) — used when an advertiser names Jaipur but no area. */
export const CITY_CENTRE: [number, number] = [26.924, 75.823];

export const coordsFor = (area: string | null): [number, number] | null =>
  area ? AREA_COORDS[area.toLowerCase()] ?? null : null;

/** The first named area found by the Jaipur check, e.g. "Jaipur area: Malviya Nagar" → "Malviya Nagar". */
export const areaFromSignals = (signals: string[]): string | null => {
  const s = signals.find((x) => x.startsWith('Jaipur area: '));
  return s ? s.slice('Jaipur area: '.length) : null;
};
