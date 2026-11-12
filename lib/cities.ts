/**
 * Supported cities. Each has the signals used to prove an advertiser is local
 * (names, PIN code prefixes, STD code) and approximate centre points of well-known
 * areas, used to place advertisers on the schematic map. Positions are approximate
 * on purpose: the map shows where advertisers cluster, it is not a navigation map.
 */
export interface City {
  id: string;
  name: string;
  /** Other spellings and scripts that count as the city name */
  aliases: string[];
  /** First three digits of the city's PIN codes */
  pinPrefixes: string[];
  /** STD code without the leading 0, e.g. "141" for Jaipur, "11" for Delhi */
  std: string;
  center: [number, number];
  bounds: { n: number; s: number; w: number; e: number };
  /** Area names (as people write them) → approximate [lat, lng] */
  areas: Record<string, [number, number]>;
  /** Extra spellings that should count as an area but are not drawn separately */
  areaAliases?: Record<string, string>;
  /** A nickname worth one point, e.g. "Pink City" */
  nickname?: string;
  /** Jaipur only: main roads and the walled city, drawn for orientation */
  landmarks?: 'jaipur';
}

export const CITIES: City[] = [
  {
    id: 'jaipur',
    name: 'Jaipur',
    aliases: ['jaipur', 'जयपुर'],
    pinPrefixes: ['302', '303'],
    std: '141',
    center: [26.924, 75.823],
    bounds: { n: 26.995, s: 26.775, w: 75.69, e: 75.9 },
    nickname: 'pink city',
    landmarks: 'jaipur',
    areas: {
      'Malviya Nagar': [26.855, 75.815], 'Vaishali Nagar': [26.912, 75.742], Mansarovar: [26.866, 75.762],
      'C-Scheme': [26.906, 75.806], 'Raja Park': [26.897, 75.828], Jagatpura: [26.83, 75.862], 'Tonk Road': [26.862, 75.8],
      'Ajmer Road': [26.887, 75.73], 'Sikar Road': [26.968, 75.778], Jhotwara: [26.95, 75.752], Sanganer: [26.822, 75.79],
      'Bani Park': [26.93, 75.796], 'MI Road': [26.916, 75.811], 'Civil Lines': [26.903, 75.784], Sodala: [26.906, 75.77],
      Durgapura: [26.85, 75.792], 'Pratap Nagar': [26.8, 75.82], 'Shyam Nagar': [26.89, 75.766], 'Nirman Nagar': [26.885, 75.755],
      'Vidhyadhar Nagar': [26.96, 75.786], Gopalpura: [26.866, 75.79], 'Tilak Nagar': [26.891, 75.825], 'Adarsh Nagar': [26.903, 75.837],
      'Bapu Nagar': [26.889, 75.815], Lalkothi: [26.885, 75.801], 'Johari Bazaar': [26.921, 75.826], 'Bais Godam': [26.905, 75.79],
      Murlipura: [26.966, 75.77], 'Kalwar Road': [26.962, 75.73], 'Jawahar Nagar': [26.88, 75.833], Sitapura: [26.78, 75.848],
      Mahapura: [26.85, 75.685], Bhankrota: [26.872, 75.69], Kukas: [27.0, 75.885], Chitrakoot: [26.902, 75.726],
      'Gandhi Path': [26.9, 75.733], 'Sirsi Road': [26.93, 75.72], 'Agra Road': [26.906, 75.88], 'Delhi Road': [26.962, 75.852],
      'Amer Road': [26.95, 75.84], Gopalbari: [26.918, 75.797], 'Ashok Nagar': [26.909, 75.801], 'Shastri Nagar': [26.94, 75.81],
      'Mahesh Nagar': [26.874, 75.79], 'Triveni Nagar': [26.86, 75.785], Muhana: [26.8, 75.77], Khatipura: [26.92, 75.75],
      'Bhrigu Path': [26.86, 75.822], Kanakpura: [26.92, 75.712], Vatika: [26.76, 75.83], 'Hawa Mahal': [26.924, 75.827],
      'World Trade Park': [26.854, 75.806], 'Gaurav Tower': [26.856, 75.804], 'SMS Hospital': [26.905, 75.815],
    },
    areaAliases: {
      'C Scheme': 'C-Scheme', 'M.I. Road': 'MI Road', 'Vidyadhar Nagar': 'Vidhyadhar Nagar', 'Lal Kothi': 'Lalkothi',
      'Mansarovar Metro': 'Mansarovar', 'Jaipur International Airport': 'Sanganer',
    },
  },
  {
    id: 'delhi',
    name: 'Delhi',
    aliases: ['delhi', 'new delhi', 'दिल्ली', 'नई दिल्ली'],
    pinPrefixes: ['110'],
    std: '11',
    center: [28.6139, 77.209],
    bounds: { n: 28.79, s: 28.48, w: 76.98, e: 77.36 },
    areas: {
      'Connaught Place': [28.6315, 77.2167], 'Karol Bagh': [28.6519, 77.1909], 'Lajpat Nagar': [28.5677, 77.2433],
      'South Extension': [28.5687, 77.2207], 'Hauz Khas': [28.5494, 77.2001], Saket: [28.5245, 77.2066], 'Vasant Kunj': [28.52, 77.159],
      Dwarka: [28.5921, 77.046], Janakpuri: [28.6219, 77.0878], 'Rajouri Garden': [28.6415, 77.1209], Pitampura: [28.7034, 77.1325],
      Rohini: [28.7495, 77.0565], 'Model Town': [28.7167, 77.19], 'Chandni Chowk': [28.6506, 77.2303], 'Laxmi Nagar': [28.6304, 77.2777],
      'Preet Vihar': [28.6417, 77.295], 'Mayur Vihar': [28.6081, 77.295], 'Greater Kailash': [28.5482, 77.238], 'Nehru Place': [28.5491, 77.2533],
      Okhla: [28.5355, 77.2732], Kalkaji: [28.545, 77.2588], 'Defence Colony': [28.5733, 77.2311], 'Paschim Vihar': [28.6688, 77.1018],
      'Punjabi Bagh': [28.6683, 77.1325],
    },
    areaAliases: { CP: 'Connaught Place', 'GK 1': 'Greater Kailash', 'GK 2': 'Greater Kailash', 'South Ex': 'South Extension' },
  },
  {
    id: 'mumbai',
    name: 'Mumbai',
    aliases: ['mumbai', 'bombay', 'मुंबई'],
    pinPrefixes: ['400'],
    std: '22',
    center: [19.076, 72.8777],
    bounds: { n: 19.27, s: 18.89, w: 72.77, e: 73.03 },
    areas: {
      Andheri: [19.1136, 72.8697], Bandra: [19.0596, 72.8295], Borivali: [19.2307, 72.8567], Dadar: [19.0178, 72.8478],
      Colaba: [18.9067, 72.8147], 'Lower Parel': [18.9952, 72.8295], Powai: [19.1176, 72.906], Goregaon: [19.1663, 72.8526],
      Malad: [19.1874, 72.8484], Kandivali: [19.2047, 72.8509], Juhu: [19.1075, 72.8263], Chembur: [19.0522, 72.9005],
      Ghatkopar: [19.086, 72.9081], Mulund: [19.1726, 72.9425], 'Vile Parle': [19.099, 72.845], Santacruz: [19.0843, 72.836],
      Worli: [19.0176, 72.8162], Kurla: [19.0726, 72.8845], Vikhroli: [19.111, 72.928], Fort: [18.9339, 72.8355],
      Thane: [19.2183, 72.9781], Vashi: [19.0771, 72.9986],
    },
  },
  {
    id: 'bengaluru',
    name: 'Bengaluru',
    aliases: ['bengaluru', 'bangalore', 'ಬೆಂಗಳೂರು', 'बेंगलुरु'],
    pinPrefixes: ['560'],
    std: '80',
    center: [12.9716, 77.5946],
    bounds: { n: 13.11, s: 12.83, w: 77.5, e: 77.77 },
    areas: {
      Koramangala: [12.9352, 77.6245], Indiranagar: [12.9784, 77.6408], Whitefield: [12.9698, 77.75], 'HSR Layout': [12.9116, 77.6474],
      Jayanagar: [12.925, 77.5938], 'JP Nagar': [12.9063, 77.5857], 'BTM Layout': [12.9166, 77.6101], 'Electronic City': [12.8452, 77.6602],
      Marathahalli: [12.9569, 77.7011], Malleshwaram: [13.0035, 77.571], Rajajinagar: [12.991, 77.555], Hebbal: [13.0358, 77.597],
      Yelahanka: [13.1005, 77.5963], Banashankari: [12.9255, 77.5468], 'MG Road': [12.9756, 77.605], Basavanagudi: [12.9422, 77.5755],
      'Sarjapur Road': [12.91, 77.685], Bellandur: [12.926, 77.6762], Yeshwanthpur: [13.0285, 77.5409], 'Bannerghatta Road': [12.888, 77.597],
    },
  },
  {
    id: 'pune',
    name: 'Pune',
    aliases: ['pune', 'poona', 'पुणे'],
    pinPrefixes: ['411', '412'],
    std: '20',
    center: [18.5204, 73.8567],
    bounds: { n: 18.65, s: 18.44, w: 73.71, e: 73.99 },
    areas: {
      'Koregaon Park': [18.5362, 73.893], Kothrud: [18.5074, 73.8077], Hinjewadi: [18.5913, 73.7389], Baner: [18.559, 73.7868],
      Wakad: [18.5989, 73.7653], 'Viman Nagar': [18.5679, 73.9143], Kharadi: [18.5515, 73.9348], Hadapsar: [18.5089, 73.926],
      Aundh: [18.558, 73.8075], Shivajinagar: [18.5308, 73.8475], Deccan: [18.5167, 73.8417], Camp: [18.515, 73.878],
      Magarpatta: [18.5136, 73.9286], Pimpri: [18.6279, 73.8009], Chinchwad: [18.6298, 73.7797], 'Kalyani Nagar': [18.5463, 73.9033],
      Wagholi: [18.5793, 73.9787], Katraj: [18.4575, 73.8677], 'Sinhagad Road': [18.48, 73.82], Bavdhan: [18.5126, 73.779],
    },
  },
  {
    id: 'hyderabad',
    name: 'Hyderabad',
    aliases: ['hyderabad', 'secunderabad', 'హైదరాబాద్', 'हैदराबाद'],
    pinPrefixes: ['500'],
    std: '40',
    center: [17.385, 78.4867],
    bounds: { n: 17.55, s: 17.32, w: 78.32, e: 78.6 },
    areas: {
      'Banjara Hills': [17.4156, 78.4347], 'Jubilee Hills': [17.4325, 78.4073], Gachibowli: [17.4401, 78.3489], 'HITEC City': [17.4435, 78.3772],
      Madhapur: [17.4483, 78.3915], Kondapur: [17.46, 78.364], Kukatpally: [17.4849, 78.4138], Ameerpet: [17.4375, 78.4482],
      Begumpet: [17.4447, 78.4664], Secunderabad: [17.4399, 78.4983], Himayatnagar: [17.401, 78.487], Abids: [17.392, 78.476],
      Dilsukhnagar: [17.3688, 78.5247], 'LB Nagar': [17.3457, 78.5522], Kompally: [17.536, 78.486], Miyapur: [17.4968, 78.3614],
      Manikonda: [17.405, 78.386], Charminar: [17.3616, 78.4747], Uppal: [17.4058, 78.5591], Mehdipatnam: [17.395, 78.44],
    },
  },
  {
    id: 'ahmedabad',
    name: 'Ahmedabad',
    aliases: ['ahmedabad', 'amdavad', 'અમદાવાદ', 'अहमदाबाद'],
    pinPrefixes: ['380', '382'],
    std: '79',
    center: [23.0225, 72.5714],
    bounds: { n: 23.125, s: 22.97, w: 72.45, e: 72.69 },
    areas: {
      Navrangpura: [23.0365, 72.5611], 'SG Highway': [23.03, 72.507], Satellite: [23.03, 72.517], Bodakdev: [23.04, 72.51],
      'Prahlad Nagar': [23.012, 72.51], Vastrapur: [23.037, 72.529], Maninagar: [22.996, 72.603], Bopal: [23.033, 72.469],
      Thaltej: [23.05, 72.5], Gota: [23.1, 72.54], Chandkheda: [23.109, 72.585], Naroda: [23.07, 72.655], Paldi: [23.011, 72.565],
      'Ashram Road': [23.03, 72.572], 'CG Road': [23.03, 72.558], 'Ellis Bridge': [23.0225, 72.565], Ghatlodia: [23.06, 72.54],
      Nikol: [23.045, 72.67], Vastral: [23.0, 72.66], 'Science City': [23.073, 72.515],
    },
  },
];

export const DEFAULT_CITY = CITIES[0];
export const cityById = (id: string | null | undefined): City => CITIES.find((c) => c.id === id) ?? DEFAULT_CITY;
export const totalAreas = () => CITIES.reduce((n, c) => n + Object.keys(c.areas).length, 0);

/** Map an area name (or one of its aliases) to its coordinates in a city. */
export function coordsIn(city: City, area: string | null): [number, number] | null {
  if (!area) return null;
  const key = Object.keys(city.areas).find((k) => k.toLowerCase() === area.toLowerCase());
  if (key) return city.areas[key];
  const alias = city.areaAliases && Object.entries(city.areaAliases).find(([a]) => a.toLowerCase() === area.toLowerCase());
  return alias ? city.areas[alias[1]] ?? null : null;
}
