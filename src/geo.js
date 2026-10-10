// Jiquilpan de Juárez, Michoacán: projection, the landmarks at their real positions, and building styles.
// World: metres, x = east, z = south, y = metres above 1540 m (the valley floor is near 15; the Jardín is at 17).
// Positions of places come from Overture Maps / OpenStreetMap; the summit from the elevation model.

export const LAT0 = 19.9905, LON0 = -102.7175, BASE = 1540;
const KX = 111320 * Math.cos(LAT0 * Math.PI / 180), KZ = 110574;
export const toXZ = (lat, lon) => [(lon - LON0) * KX, -(lat - LAT0) * KZ];
export const toLatLon = (x, z) => [LAT0 - z / KZ, LON0 + x / KX];
export const HALF = 4000;          // the detailed town; the valley and the mountains go on beyond it
export const FLY_LIMIT = 11000;    // how far the jetpack can take you

// building styles (ids are what the facade shader switches on)
export const STYLE = { centro: 40, barrio: 41, obra: 42, comercio: 43, bodega: 44, escuela: 45 };

/* The places the story and the map know. x, z in metres from the Jardín. r: how close counts as "there". */
export const PLACES = {
  jardin:     { name: 'Jardín Colón (the main square)', x: -178, z: -52, r: 30 },
  parroquia:  { name: 'Parroquia de San Francisco', x: -18, z: -48, r: 30 },
  biblioteca: { name: 'Biblioteca Gabino Ortiz', x: 38, z: -89, r: 24 },
  presidencia:{ name: 'Presidencia Municipal', x: -132, z: 92, r: 26 },
  plazaSur:   { name: 'Plaza Aguadora and its fountain', x: -152, z: -1, r: 22 },
  casaLC:     { name: 'Casa de Lázaro Cárdenas', x: 38, z: 22, r: 24 },
  estadio:    { name: 'Estadio 18 de Marzo', x: -45, z: 360, r: 60 },
  portada:    { name: 'Portada del Estadio 18 de Marzo', x: -40, z: 300, r: 14 },
  feria:      { name: 'Plaza de la Feria', x: 40, z: 258, r: 40 },
  bosque:     { name: 'Parque Juárez (the Bosque)', x: 222, z: 900, r: 120 },
  museo:      { name: 'Museo Vida y Obra de Lázaro Cárdenas (UNAM)', x: 284, z: 489, r: 30 },
  monumento:  { name: 'Monumento al General Lázaro Cárdenas', x: 372, z: 8, r: 18 },
  guadalupe:  { name: 'Santuario de Guadalupe (the nuns\' sanctuary)', x: -806, z: -647, r: 30 },
  cayetano:   { name: 'Templo de San Cayetano', x: 414, z: -238, r: 26 },
  santaAnita: { name: 'Capilla de Santa Anita', x: -300, z: -169, r: 18 },
  toros:      { name: 'Plaza de Toros Alberto Balderas', x: 1149, z: 424, r: 45 },
  taller:     { name: 'Taller El Pistón (Rosa\'s garage)', x: 560, z: 330, r: 20 },
  casaAurelio:{ name: 'Casa de Aurelio Valdovinos, Barrio de San Cayetano', x: 470, z: -330, r: 14 },
  sendero:    { name: 'Trailhead to the Cerro de San Francisco', x: 380, z: 1350, r: 30 },
  petra:      { name: 'Doña Petra\'s house on the trail', x: 700, z: 2250, r: 20 },
  cueva:      { name: 'La Cueva del Añil (the indigo cave)', x: 1560, z: 4520, r: 22 },
  cumbre:     { name: 'Summit of the Cerro de San Francisco (2,483 m)', x: 1841, z: 5071, r: 40 },
  // added from the real map (Overture Maps) and from people who know the town
  jardinPaz:  { name: 'Jardín de la Paz', x: -58, z: -567, r: 34 },
  cremeria:   { name: 'La Cremería (by the Jardín de la Paz)', x: -40, z: -628, r: 12 },
  panteon:    { name: 'Panteón Municipal', x: -330, z: -1331, r: 55 },
  casita:     { name: 'La Casita de Piedra', x: -100, z: 640, r: 18 },
  azulPortal: { name: 'Azul Portal (restaurant under the arches)', x: -127, z: -44, r: 14 },
  sitioAbasolo:{ name: 'Sitio de taxis, Calle Abasolo', x: -45, z: -9, r: 12 },
  sitioFajardo:{ name: 'Sitio de taxis, Avenida Fajardo', x: -92, z: -24, r: 12 },
  sanFrancisco:{ name: 'San Francisco del Cerro (the hamlet on the summit)', x: 1790, z: 5010, r: 60 },
  ranchoNovoa: { name: 'Rancho de Novoa', x: 1153, z: 2417, r: 34 },
  ranchoSalazar:{ name: 'Rancho de los Salazar', x: 1113, z: 3685, r: 34 },
  casaCecilia:{ name: 'Francisco and Cecilia\'s milpa', x: 1176, z: 3748, r: 24 },
  boutique:   { name: 'Boutique Rosa Mexicano (clothes)', x: -206, z: -24, r: 8 },
  sombreros:  { name: 'Sombrerería La Texana (hats and boots)', x: -178, z: -18, r: 8 },
  peluqueria: { name: 'Peluquería Don Beto (barber and salon)', x: -214, z: -68, r: 8 },
  mercado:    { name: 'Mercado de Artesanías', x: -135, z: 41, r: 14 },
  floreria:   { name: 'Florería Las Jacarandas', x: -60, z: -8, r: 8 },
  notaria:    { name: 'Bienes Raíces Jiquilpan (land for sale)', x: -196, z: -86, r: 8 },
  ferreteria: { name: 'Ferretería y Materiales El Albañil', x: -92, z: -86, r: 8 },
  ferreLuis:  { name: 'Ferretería La Esperanza (by the Monumento)', x: 396, z: 22, r: 8 },
  bache:      { name: 'The famous bache of Calle Morelos', x: 94, z: -200, r: 10 }
};

/* Landmark sites where generated houses must not stand (the hand-built models go there). [x, z, halfW, halfD, ang] */
export const CLEAR = [
  [-178, -52, 40, 34, 0],        // Jardín
  [-152, -1, 17, 15, 0],         // Plaza Aguadora
  [-10, -48, 44, 18, 0],         // Parroquia and its atrio
  [38, -89, 18, 9, 0],           // Biblioteca
  [38, 22, 11, 14, 0],           // Casa de Lázaro Cárdenas
  [-132, 95, 22, 10, 0],         // Presidencia
  [284, 489, 24, 13, 0],         // museum
  [-40, 305, 30, 12, 0],         // the Portada
  [-45, 365, 70, 60, 0],         // the stadium
  [372, 8, 14, 14, 0],           // Monumento
  [-806, -647, 18, 30, 0],       // Guadalupe
  [414, -238, 18, 8, 0],         // San Cayetano
  [1149, 424, 40, 40, 0],        // Plaza de toros
  [560, 330, 14, 12, 0],         // Rosa's garage
  [-58, -567, 36, 30, 0],        // Jardín de la Paz
  [-100, 640, 14, 12, 0],        // Casita de Piedra
  [-127, -44, 9, 17, 0],         // Azul Portal
  [-330, -1331, 48, 42, 0]       // Panteón
];

/* Where the barrios are, roughly, for who lives where and what the map calls a place. */
export function barrio(x, z) {
  const d = Math.hypot(x + 60, z + 20);
  if (d < 420) return 'Centro';
  if (z > 4700) return 'San Francisco del Cerro';
  if (z > 2000) return 'Cerro de San Francisco';
  if (z < -1150 && z > -1500 && x > -600 && x < 0) return 'El Panteón';
  if (z < -440 && z > -1150 && x > -300 && x < 250) return 'La Paz';
  if (z > 700) return 'El Bosque';
  if (x > 900 && z > 100) return 'Salida a Morelia';
  if (z < -1400) return 'Rumbo a Sahuayo';
  if (x < -500 && z < 0) return 'Barrio de Guadalupe';
  if (x > 200 && z < 0) return 'Barrio de San Cayetano';
  if (x < -300) return 'Poniente';
  return 'Oriente';
}

/* The camino empedrado up the Cerro de San Francisco: from the trailhead to the hamlet on the summit, planned on the
   elevation model to keep the grade climbable (about 12% on average, with a few steep ramps). Stones and dust, few cars. */
export const CERRO_ROAD = [[384,1349],[384,1376],[388,1404],[398,1426],[420,1414],[431,1395],[451,1379],[476,1382],[504,1395],[504,1426],[520,1443],[555,1448],[595,1458],[627,1465],[634,1493],[613,1527],[598,1555],[590,1580],[593,1611],[602,1643],[607,1670],[607,1693],[607,1717],[615,1743],[626,1765],[643,1787],[651,1811],[651,1834],[672,1848],[677,1870],[696,1887],[721,1899],[751,1911],[771,1923],[787,1940],[803,1958],[808,1984],[815,2011],[825,2043],[829,2070],[829,2093],[843,2117],[862,2129],[893,2140],[914,2152],[926,2173],[949,2173],[971,2190],[984,2212],[1002,2229],[1024,2240],[1046,2252],[1067,2264],[1088,2281],[1105,2299],[1118,2323],[1131,2345],[1160,2367],[1185,2390],[1199,2414],[1207,2440],[1207,2464],[1188,2479],[1169,2492],[1177,2523],[1196,2549],[1227,2564],[1244,2581],[1246,2605],[1267,2623],[1258,2646],[1269,2670],[1258,2693],[1269,2717],[1258,2740],[1265,2764],[1237,2781],[1216,2799],[1199,2826],[1191,2846],[1199,2873],[1189,2895],[1185,2917],[1185,2940],[1189,2965],[1199,3008],[1206,3042],[1207,3064],[1207,3087],[1207,3111],[1209,3137],[1216,3164],[1227,3200],[1238,3243],[1244,3267],[1251,3300],[1251,3323],[1233,3345],[1209,3348],[1180,3334],[1157,3323],[1135,3311],[1144,3333],[1155,3355],[1125,3355],[1105,3364],[1110,3387],[1093,3405],[1063,3417],[1043,3428],[1029,3452],[1021,3475],[1000,3493],[979,3505],[960,3522],[931,3534],[917,3561],[910,3587],[901,3618],[921,3631],[926,3661],[939,3683],[940,3705],[965,3717],[996,3706],[1021,3702],[1054,3711],[1085,3721],[1110,3725],[1132,3725],[1157,3734],[1178,3745],[1202,3750],[1191,3771],[1216,3772],[1238,3772],[1235,3795],[1233,3817],[1216,3834],[1201,3855],[1180,3887],[1170,3909],[1194,3914],[1194,3943],[1227,3946],[1256,3934],[1280,3922],[1305,3914],[1334,3918],[1374,3928],[1394,3940],[1369,3958],[1347,3969],[1326,3981],[1305,3999],[1319,4017],[1315,4043],[1305,4075],[1324,4087],[1349,4078],[1349,4108],[1374,4117],[1397,4111],[1420,4108],[1423,4130],[1413,4152],[1393,4187],[1377,4222],[1367,4255],[1363,4281],[1363,4305],[1363,4328],[1377,4308],[1399,4299],[1419,4287],[1450,4275],[1475,4268],[1500,4271],[1514,4289],[1516,4311],[1533,4328],[1533,4352],[1533,4375],[1511,4393],[1494,4415],[1483,4437],[1472,4461],[1461,4484],[1461,4508],[1450,4527],[1430,4546],[1405,4558],[1374,4569],[1355,4581],[1341,4605],[1369,4605],[1394,4596],[1423,4600],[1463,4611],[1495,4618],[1522,4615],[1539,4597],[1550,4578],[1562,4556],[1587,4555],[1619,4558],[1642,4564],[1682,4575],[1717,4587],[1742,4594],[1767,4596],[1789,4596],[1820,4600],[1850,4611],[1875,4618],[1872,4641],[1850,4643],[1866,4662],[1839,4666],[1814,4675],[1793,4689],[1817,4690],[1839,4690],[1818,4709],[1845,4714],[1867,4714],[1889,4714],[1911,4714],[1934,4714],[1956,4714],[1978,4714],[2003,4722],[2024,4736],[2000,4737],[1975,4741],[1945,4752],[1923,4775],[1897,4787],[1881,4803],[1906,4808],[1928,4808],[1950,4808],[1929,4827],[1956,4831],[1989,4840],[2014,4852],[1989,4869],[2006,4893],[2031,4905],[2048,4921],[2048,4944],[2048,4968],[2023,4972],[1993,4977],[1953,4987],[1921,4994],[1899,5000],[1884,5019],[1861,5034],[1845,5052],[1831,5066]];

/* The back road: from San Francisco del Cerro down the far side toward Paredones (and on to Abadiano): the only way a car reaches the hamlet. */
export const BACK_ROAD = [[1831,5066],[1850,5046],[1867,5028],[1892,5028],[1917,5043],[1953,5069],[1975,5087],[1996,5106],[2016,5127],[2034,5149],[2051,5172],[2066,5194],[2080,5215],[2092,5234],[2113,5268],[2128,5296],[2142,5319],[2167,5343],[2201,5366],[2234,5390],[2265,5412],[2284,5428],[2301,5459],[2312,5502],[2319,5535],[2320,5558],[2322,5583],[2334,5613],[2354,5633],[2384,5646],[2409,5653],[2397,5674],[2421,5674],[2451,5663],[2476,5656],[2501,5655],[2524,5655],[2546,5655],[2565,5669],[2565,5693],[2574,5719],[2585,5743],[2596,5766],[2608,5791],[2626,5822],[2646,5855],[2654,5875],[2650,5902],[2640,5934],[2638,5969],[2646,6005],[2653,6031],[2653,6053],[2640,6084],[2629,6103],[2613,6122],[2596,6140],[2587,6163],[2587,6187],[2587,6210],[2574,6234],[2554,6246],[2524,6257],[2490,6269],[2457,6281],[2432,6293],[2414,6310],[2409,6334],[2409,6357],[2409,6381],[2409,6404],[2408,6428],[2391,6452],[2389,6475],[2408,6499],[2437,6516],[2462,6534],[2483,6552],[2504,6563],[2530,6579],[2562,6602],[2575,6621],[2557,6640],[2576,6651],[2599,6657],[2631,6669],[2651,6687],[2668,6704],[2679,6729],[2690,6772],[2702,6806],[2718,6829],[2729,6849],[2741,6871],[2757,6893],[2741,6919],[2711,6941],[2699,6963],[2699,6987],[2685,7010],[2663,7004],[2646,7022],[2636,7054],[2632,7081],[2640,7107],[2649,7128],[2632,7146],[2640,7169],[2640,7193],[2632,7216],[2613,7231],[2590,7231],[2567,7235],[2551,7254],[2529,7254],[2525,7281],[2540,7298],[2557,7316],[2568,7337],[2579,7369],[2590,7400],[2601,7425],[2601,7451],[2585,7469],[2571,7490],[2574,7516],[2585,7548],[2596,7569],[2610,7593],[2601,7616],[2585,7638],[2574,7660],[2565,7687],[2547,7703],[2543,7728],[2543,7751],[2535,7772],[2519,7791],[2498,7804],[2498,7828],[2498,7851],[2498,7875],[2479,7890],[2455,7894],[2441,7920],[2412,7943],[2387,7962],[2368,7981],[2351,7998],[2329,8007],[2312,8025],[2301,8047],[2284,8069],[2265,8094],[2251,8113],[2234,8137],[2220,8160],[2209,8184],[2201,8207],[2195,8231],[2188,8265],[2185,8291],[2179,8325],[2173,8348],[2167,8370],[2156,8410],[2142,8444],[2117,8472],[2087,8498],[2067,8537],[2062,8560],[2056,8584],[2051,8607],[2045,8631],[2039,8654],[2028,8692],[2017,8719],[2006,8742],[1995,8766],[1984,8798],[1973,8842],[1966,8876],[1966,8903],[1973,8936],[1978,8960],[1985,8994],[1988,9020],[1995,9054],[2000,9078],[2003,9101],[2003,9125],[2000,9148],[1995,9172],[1989,9195],[1984,9219],[1978,9242],[1973,9266],[1967,9289],[1961,9313],[1956,9336],[1950,9360],[1945,9383],[1939,9407],[1934,9431],[1928,9454],[1923,9478],[1917,9501],[1911,9525],[1906,9548],[1900,9572],[1895,9595],[1889,9619],[1884,9642],[1878,9666],[1872,9689],[1867,9713],[1861,9736],[1856,9758],[1845,9798],[1835,9829],[1831,9842]];
