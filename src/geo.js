// Shared geography: projection, real landmark coordinates, parks and district styles.
// Used by tools/build-data.mjs (to keep generated buildings off landmarks and parks) and by the game.
// Coordinates are WGS84 lat/lon; the game world is metres, x = east, z = south, y = up.

export const LAT0 = 37.7705, LON0 = -122.4360;
const KX = 111320 * Math.cos(LAT0 * Math.PI / 180), KZ = 110574;
export const toXZ = (lat, lon) => [(lon - LON0) * KX, -(lat - LAT0) * KZ];
export const toLatLon = (x, z) => [LAT0 - z / KZ, LON0 + x / KX];
export const HALF = 7200;   // the world spans -HALF..HALF metres on both axes

// District → architecture style (neighbourhood names as published in the city's GIS)
export const DISTRICT_STYLE = {
  'Seacliff': 'mansion', 'Marina': 'marina', 'Pacific Heights': 'victorian', 'Nob Hill': 'apartment',
  'Presidio Heights': 'mansion', 'Downtown/Civic Center': 'civic', 'Excelsior': 'sunset', 'Bernal Heights': 'cottage',
  'Western Addition': 'victorian', 'Chinatown': 'chinatown', 'North Beach': 'northbeach', 'Haight Ashbury': 'victorian',
  'Outer Mission': 'cottage', 'Crocker Amazon': 'sunset', 'West of Twin Peaks': 'suburb', 'South of Market': 'soma',
  'Potrero Hill': 'cottage', 'Inner Richmond': 'edwardian', 'Bayview': 'industrial', 'Noe Valley': 'victorian',
  'Inner Sunset': 'edwardian', 'Diamond Heights': 'suburb', 'Lakeshore': 'parkmerced', 'Russian Hill': 'apartment',
  'Treasure Island/YBI': 'industrial', 'Twin Peaks': 'suburb', 'Outer Richmond': 'sunset', 'Visitacion Valley': 'cottage',
  'Golden Gate Park': 'park', 'Parkside': 'sunset', 'Financial District': 'downtown', 'Ocean View': 'cottage',
  'Mission': 'mission', 'Presidio': 'presidio', 'Castro/Upper Market': 'victorian', 'Outer Sunset': 'sunset', 'Glen Park': 'cottage'
};
// lot width (m), depth range, height range (m), houses per row, gap between rows
export const STYLES = {
  victorian:  { lot: 7.6, depth: [20, 26], h: [9, 13], row: [2, 5], id: 1 },
  edwardian:  { lot: 7.6, depth: [20, 26], h: [9, 12], row: [2, 5], id: 2 },
  marina:     { lot: 9, depth: [20, 26], h: [9, 12], row: [2, 4], id: 3 },
  mansion:    { lot: 16, depth: [18, 26], h: [10, 14], row: [1, 1], id: 4, gap: 4 },
  sunset:     { lot: 7.6, depth: [18, 22], h: [7, 9], row: [3, 6], id: 5 },
  cottage:    { lot: 7.6, depth: [14, 20], h: [6, 9], row: [1, 3], id: 6, gap: 2 },
  suburb:     { lot: 12, depth: [14, 18], h: [7, 10], row: [1, 1], id: 7, gap: 4 },
  apartment:  { lot: 14, depth: [22, 30], h: [14, 40], row: [1, 3], id: 8 },
  northbeach: { lot: 9, depth: [20, 26], h: [11, 18], row: [2, 4], id: 9 },
  chinatown:  { lot: 9, depth: [20, 28], h: [12, 22], row: [2, 4], id: 10 },
  mission:    { lot: 8, depth: [20, 26], h: [9, 14], row: [2, 5], id: 11 },
  soma:       { lot: 20, depth: [26, 44], h: [12, 42], row: [1, 3], id: 12 },
  civic:      { lot: 22, depth: [26, 40], h: [18, 44], row: [1, 2], id: 13 },
  downtown:   { lot: 24, depth: [26, 40], h: [30, 120], row: [1, 2], id: 14 },
  industrial: { lot: 22, depth: [24, 44], h: [7, 13], row: [1, 2], id: 15, gap: 3 },
  parkmerced: { lot: 30, depth: [14, 20], h: [8, 11], row: [1, 1], id: 16, gap: 8 },
  presidio:   { lot: 26, depth: [14, 18], h: [8, 12], row: [1, 1], id: 17, gap: 18 }
};
export const STYLE_BY_ID = Object.fromEntries(Object.entries(STYLES).map(([k, v]) => [v.id, k]));

// Wide streets: right-of-way in metres (curb to curb plus sidewalks). Everything else defaults to 20 m.
export const STREET_WIDTH = {
  'Market St': 36, 'Van Ness Ave': 38, 'Geary Blvd': 32, '19th Ave': 32, 'The Embarcadero': 42, 'Great Hwy': 34,
  'Sunset Blvd': 40, 'Park Presidio Blvd': 40, 'Dolores St': 32, 'Octavia Blvd': 40, 'South Van Ness Ave': 30,
  'Divisadero St': 24, 'Mission St': 25, '3rd St': 25, 'Folsom St': 25, 'Howard St': 25, 'Harrison St': 25,
  'Bryant St': 25, 'Brannan St': 25, 'Townsend St': 25, 'King St': 32, 'Lombard St': 26, 'Fulton St': 24,
  'Lincoln Way': 26, 'Alemany Blvd': 32, 'Cesar Chavez St': 32, 'Junipero Serra Blvd': 34, 'Portola Dr': 28,
  'Monterey Blvd': 26, 'Oak St': 24, 'Fell St': 24, 'Masonic Ave': 24, 'Columbus Ave': 25, 'Broadway': 24,
  'Mission Bay Blvd': 30, 'Brotherhood Way': 30, 'Sloat Blvd': 30, 'Skyline Blvd': 30, 'Bayshore Blvd': 30,
  'San Jose Ave': 26, 'Ocean Ave': 26, 'Geneva Ave': 24, 'Stanyan St': 22, 'Arguello Blvd': 26, 'Marina Blvd': 30
};

/* Landmarks: modelled by hand in the game. `r` is the radius (m) kept clear of generated buildings. */
export const LANDMARKS = [
  { id: 'ferry', name: 'Ferry Building', lat: 37.79553, lon: -122.39367, r: 110, district: 'Embarcadero' },
  { id: 'transamerica', name: 'Transamerica Pyramid', lat: 37.79518, lon: -122.40279, r: 45 },
  { id: 'salesforce', name: 'Salesforce Tower', lat: 37.78972, lon: -122.39680, r: 45 },
  { id: 'bofa', name: '555 California (Bank of America Center)', lat: 37.79205, lon: -122.40377, r: 50 },
  { id: 'coit', name: 'Coit Tower', lat: 37.80239, lon: -122.40582, r: 45 },
  { id: 'sutro', name: 'Sutro Tower', lat: 37.75523, lon: -122.45280, r: 70 },
  { id: 'cityhall', name: 'City Hall', lat: 37.77927, lon: -122.41924, r: 95 },
  { id: 'library', name: 'Main Library', lat: 37.77895, lon: -122.41586, r: 55 },
  { id: 'unplaza', name: 'United Nations Plaza', lat: 37.78015, lon: -122.41410, r: 45 },
  { id: 'warmemorial', name: 'War Memorial Veterans Building', lat: 37.77970, lon: -122.42100, r: 60 },
  { id: 'flood', name: 'Flood Building', lat: 37.78510, lon: -122.40782, r: 30 },
  { id: 'paintedladies', name: 'Painted Ladies', lat: 37.77618, lon: -122.43300, r: 40 },
  { id: 'alamo', name: 'Alamo Square', lat: 37.77630, lon: -122.43460, r: 110, park: true },
  { id: 'palacefa', name: 'Palace of Fine Arts', lat: 37.80286, lon: -122.44839, r: 130 },
  { id: 'missiondolores', name: 'Mission Dolores', lat: 37.76440, lon: -122.42700, r: 40 },
  { id: 'castro', name: 'Castro Theatre', lat: 37.76209, lon: -122.43481, r: 22 },
  { id: 'stignatius', name: 'St. Ignatius Church, University of San Francisco', lat: 37.77658, lon: -122.45179, r: 70 },
  { id: 'sfsu', name: 'San Francisco State University', lat: 37.72360, lon: -122.47900, r: 260 },
  { id: 'parkmerced', name: 'Parkmerced Towers', lat: 37.71870, lon: -122.48250, r: 120 },
  { id: 'dragongate', name: 'Dragon Gate, Chinatown', lat: 37.79077, lon: -122.40584, r: 14 },
  { id: 'tinhow', name: 'Tin How Temple', lat: 37.79418, lon: -122.40713, r: 14 },
  { id: 'peterpaul', name: 'Saints Peter and Paul Church', lat: 37.80016, lon: -122.41049, r: 35 },
  { id: 'washsq', name: 'Washington Square', lat: 37.80080, lon: -122.40980, r: 70, park: true },
  { id: 'citylights', name: 'City Lights Booksellers', lat: 37.79760, lon: -122.40650, r: 12 },
  { id: 'oracle', name: 'Oracle Park', lat: 37.77859, lon: -122.38927, r: 150 },
  { id: 'conservatory', name: 'Conservatory of Flowers', lat: 37.77260, lon: -122.46036, r: 60 },
  { id: 'deyoung', name: 'de Young Museum', lat: 37.77146, lon: -122.46869, r: 90 },
  { id: 'academy', name: 'California Academy of Sciences', lat: 37.76993, lon: -122.46610, r: 90 },
  { id: 'davidson', name: 'Mount Davidson Cross', lat: 37.73811, lon: -122.45434, r: 30 },
  { id: 'alcatraz', name: 'Alcatraz', lat: 37.82670, lon: -122.42300, r: 300 },
  { id: 'lombard', name: 'Lombard Street', lat: 37.80213, lon: -122.41874, r: 60 },
  { id: 'grace', name: 'Grace Cathedral', lat: 37.79197, lon: -122.41327, r: 45 },
  { id: 'cliffhouse', name: 'Cliff House and Sutro Baths', lat: 37.77900, lon: -122.51400, r: 90 },
  { id: 'legion', name: 'Legion of Honor', lat: 37.78450, lon: -122.50084, r: 80 },
  { id: 'fortpoint', name: 'Fort Point', lat: 37.81062, lon: -122.47701, r: 40 },
  { id: 'palacehotel', name: 'Palace Hotel', lat: 37.78806, lon: -122.40181, r: 40 },
  { id: 'pactel', name: '140 New Montgomery', lat: 37.78680, lon: -122.39960, r: 25 },
  { id: 'unionsq', name: 'Union Square', lat: 37.78800, lon: -122.40745, r: 60, park: true },
  { id: 'lotta', name: "Lotta's Fountain", lat: 37.78782, lon: -122.40330, r: 8 },
  { id: 'windmill', name: 'Dutch Windmill', lat: 37.77106, lon: -122.50974, r: 30 },
  { id: 'twinpeaks', name: 'Twin Peaks', lat: 37.75440, lon: -122.44770, r: 140, park: true },
  { id: 'excelsior', name: 'Excelsior Branch Library', lat: 37.72530, lon: -122.43360, r: 18 },
  { id: 'operahouse', name: 'War Memorial Opera House', lat: 37.77810, lon: -122.42090, r: 55 },
  { id: 'floodmansion', name: 'Flood Mansion, Nob Hill', lat: 37.79220, lon: -122.41190, r: 40 },
  { id: 'huntington', name: 'Huntington Park', lat: 37.79210, lon: -122.41250, r: 45, park: true },
  { id: 'cablebarn', name: 'Cable Car Barn', lat: 37.79460, lon: -122.41150, r: 30 },
  { id: 'baybridge-sf', name: 'Bay Bridge anchorage', lat: 37.78800, lon: -122.38950, r: 70 },
  // places of the story (the buildings are fictional; the streets are real)
  { id: 'esperanza', name: 'Hotel Esperanza', lat: 37.76500, lon: -122.42180, r: 16, fictional: true },
  { id: 'vanehouse', name: 'The Vane House, Broadway', lat: 37.79470, lon: -122.44300, r: 34, fictional: true },
  { id: 'southpark', name: 'South Park', lat: 37.78150, lon: -122.39360, r: 60, park: true },
  { id: 'remnant', name: 'Remnant, 2nd Street', lat: 37.78240, lon: -122.39240, r: 18, fictional: true },
  { id: 'lonemountain', name: 'Lone Mountain', lat: 37.77850, lon: -122.45280, r: 90, park: true }
];

/* Named skyscrapers: real positions, approximate heights (m) and footprints. Drawn as refined towers. */
export const TOWERS = [
  { name: '181 Fremont', lat: 37.78985, lon: -122.39550, h: 245, w: 36, d: 36 },
  { name: 'Millennium Tower', lat: 37.79045, lon: -122.39615, h: 197, w: 40, d: 30 },
  { name: 'One Rincon Hill', lat: 37.78565, lon: -122.39205, h: 188, w: 32, d: 32 },
  { name: '345 California', lat: 37.79280, lon: -122.39960, h: 212, w: 34, d: 30 },
  { name: '101 California', lat: 37.79290, lon: -122.39820, h: 183, w: 38, d: 38, round: true },
  { name: 'Embarcadero Center 4', lat: 37.79455, lon: -122.39630, h: 173, w: 30, d: 60 },
  { name: 'Embarcadero Center 3', lat: 37.79440, lon: -122.39800, h: 126, w: 30, d: 60 },
  { name: 'Embarcadero Center 2', lat: 37.79425, lon: -122.39960, h: 126, w: 30, d: 60 },
  { name: 'Embarcadero Center 1', lat: 37.79410, lon: -122.40120, h: 172, w: 30, d: 60 },
  { name: 'Park Tower', lat: 37.78965, lon: -122.39425, h: 184, w: 36, d: 36 },
  { name: '50 Fremont', lat: 37.79065, lon: -122.39705, h: 183, w: 34, d: 34 },
  { name: 'Wells Fargo Center', lat: 37.78985, lon: -122.40180, h: 172, w: 34, d: 34 },
  { name: 'One Market Spear Tower', lat: 37.79370, lon: -122.39470, h: 172, w: 36, d: 36 },
  { name: '333 Bush', lat: 37.79075, lon: -122.40270, h: 151, w: 30, d: 30 },
  { name: 'Shell Building', lat: 37.79060, lon: -122.40115, h: 118, w: 26, d: 26 },
  { name: 'Russ Building', lat: 37.79080, lon: -122.40220, h: 99, w: 40, d: 40 },
  { name: 'Marriott Marquis', lat: 37.78470, lon: -122.40460, h: 133, w: 40, d: 30 },
  { name: 'Hilton Union Square', lat: 37.78560, lon: -122.41030, h: 150, w: 38, d: 38 },
  { name: 'Four Seasons', lat: 37.78620, lon: -122.40450, h: 150, w: 30, d: 30 },
  { name: 'St. Regis', lat: 37.78580, lon: -122.40210, h: 147, w: 28, d: 28 },
  { name: 'The Avery', lat: 37.78960, lon: -122.39220, h: 188, w: 30, d: 30 },
  { name: 'Mark Hopkins Hotel', lat: 37.79180, lon: -122.41000, h: 60, w: 40, d: 30 },
  { name: 'Fairmont Hotel', lat: 37.79240, lon: -122.41020, h: 70, w: 60, d: 40 },
  { name: 'Hallidie Building', lat: 37.79010, lon: -122.40330, h: 30, w: 18, d: 20 },
  { name: 'Chase Center', lat: 37.76803, lon: -122.38770, h: 36, w: 150, d: 150, round: true }
];

/* Parks and open ground (approximate): kept free of generated buildings, planted with trees. */
export const PARKS = [
  { name: 'Lincoln Park', lat: 37.7835, lon: -122.4985, r: 420, trees: 0.6 },
  { name: 'Lands End', lat: 37.7870, lon: -122.5055, r: 350, trees: 0.8 },
  { name: 'Sutro Heights', lat: 37.7780, lon: -122.5100, r: 140, trees: 0.5 },
  { name: 'Stern Grove', lat: 37.7355, lon: -122.4780, r: 330, trees: 1.0 },
  { name: 'Pine Lake', lat: 37.7362, lon: -122.4855, r: 180, trees: 0.8 },
  { name: 'Lake Merced', lat: 37.7250, lon: -122.4935, r: 750, trees: 0.25, lake: true },
  { name: 'Harding Park', lat: 37.7240, lon: -122.4930, r: 620, trees: 0.2 },
  { name: 'San Francisco Zoo', lat: 37.7330, lon: -122.5030, r: 260, trees: 0.6 },
  { name: 'Fort Funston', lat: 37.7150, lon: -122.5020, r: 380, trees: 0.1 },
  { name: 'McLaren Park', lat: 37.7185, lon: -122.4190, r: 700, trees: 0.8 },
  { name: 'Glen Canyon Park', lat: 37.7390, lon: -122.4410, r: 280, trees: 0.7 },
  { name: 'Mount Davidson', lat: 37.7385, lon: -122.4545, r: 230, trees: 1.0 },
  { name: 'Twin Peaks', lat: 37.7535, lon: -122.4476, r: 330, trees: 0.05 },
  { name: 'Mount Sutro', lat: 37.7580, lon: -122.4570, r: 330, trees: 1.0 },
  { name: 'Buena Vista Park', lat: 37.7683, lon: -122.4410, r: 190, trees: 0.9 },
  { name: 'Corona Heights', lat: 37.7650, lon: -122.4385, r: 110, trees: 0.2 },
  { name: 'Duboce Park', lat: 37.7692, lon: -122.4330, r: 70, trees: 0.4 },
  { name: 'Mission Dolores Park', lat: 37.7596, lon: -122.4269, r: 150, trees: 0.4 },
  { name: 'Bernal Heights Park', lat: 37.7430, lon: -122.4148, r: 250, trees: 0.1 },
  { name: 'Lafayette Park', lat: 37.7916, lon: -122.4274, r: 110, trees: 0.6 },
  { name: 'Alta Plaza', lat: 37.7912, lon: -122.4377, r: 100, trees: 0.5 },
  { name: 'Marina Green', lat: 37.8060, lon: -122.4410, r: 230, trees: 0 },
  { name: 'Fort Mason', lat: 37.8060, lon: -122.4290, r: 250, trees: 0.4 },
  { name: 'Aquatic Park', lat: 37.8065, lon: -122.4225, r: 120, trees: 0.2 },
  { name: 'Crocker Amazon Playground', lat: 37.7105, lon: -122.4370, r: 200, trees: 0.4 },
  { name: 'Balboa Park', lat: 37.7245, lon: -122.4455, r: 170, trees: 0.4 },
  { name: 'Candlestick Point', lat: 37.7100, lon: -122.3830, r: 500, trees: 0.2 },
  { name: 'Hunters Point Hill', lat: 37.7300, lon: -122.3710, r: 220, trees: 0.2 },
  { name: 'Grand View Park', lat: 37.7560, lon: -122.4715, r: 70, trees: 0.2 },
  { name: 'Mount Olympus', lat: 37.7630, lon: -122.4460, r: 40, trees: 0.4 },
  { name: 'Civic Center Plaza', lat: 37.77943, lon: -122.41742, r: 70, trees: 0.4 },
  { name: 'Yerba Buena Gardens', lat: 37.78490, lon: -122.40220, r: 80, trees: 0.4 },
  { name: 'Jefferson Square', lat: 37.7815, lon: -122.4260, r: 90, trees: 0.5 },
  { name: 'Mountain Lake', lat: 37.7880, lon: -122.4690, r: 140, trees: 0.6 },
  { name: 'Crissy Field', lat: 37.8045, lon: -122.4630, r: 400, trees: 0 }
];

/* The city's library branches: in the game they are safe houses (save and fast travel). */
export const LIBRARIES = [
  { id: 'lib-main', name: 'Main Library', lat: 37.77895, lon: -122.41586 },
  { id: 'lib-northbeach', name: 'North Beach Branch', lat: 37.80240, lon: -122.41350 },
  { id: 'lib-chinatown', name: 'Chinatown Branch', lat: 37.79530, lon: -122.41020 },
  { id: 'lib-mission', name: 'Mission Branch', lat: 37.75080, lon: -122.42020 },
  { id: 'lib-excelsior', name: 'Excelsior Branch', lat: 37.72530, lon: -122.43360 },
  { id: 'lib-park', name: 'Park Branch', lat: 37.77000, lon: -122.45400 },
  { id: 'lib-richmond', name: 'Richmond Branch', lat: 37.78150, lon: -122.46720 },
  { id: 'lib-sunset', name: 'Sunset Branch', lat: 37.76230, lon: -122.47600 },
  { id: 'lib-noe', name: 'Noe Valley Branch', lat: 37.75020, lon: -122.43230 },
  { id: 'lib-bernal', name: 'Bernal Heights Branch', lat: 37.73890, lon: -122.41670 },
  { id: 'lib-marina', name: 'Marina Branch', lat: 37.80030, lon: -122.43780 },
  { id: 'lib-merced', name: 'Merced Branch', lat: 37.72560, lon: -122.48210 }
];
