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
  plazaSur:   { name: 'Plaza Aguadora', x: -118, z: 10, r: 30 },
  casaLC:     { name: 'Casa de Lázaro Cárdenas', x: 38, z: 22, r: 24 },
  estadio:    { name: 'Estadio 18 de Marzo', x: -45, z: 360, r: 60 },
  portada:    { name: 'Portada del Estadio 18 de Marzo', x: -40, z: 300, r: 14 },
  feria:      { name: 'Plaza de la Feria', x: 40, z: 258, r: 40 },
  bosque:     { name: 'Parque Juárez (the Bosque)', x: 222, z: 900, r: 120 },
  museo:      { name: 'Museo Vida y Obra de Lázaro Cárdenas (UNAM)', x: 284, z: 489, r: 30 },
  monumento:  { name: 'Monumento al General Lázaro Cárdenas', x: 372, z: 8, r: 18 },
  guadalupe:  { name: 'Santuario de Guadalupe', x: -806, z: -647, r: 30 },
  cayetano:   { name: 'Templo de San Cayetano', x: 414, z: -238, r: 26 },
  santaAnita: { name: 'Capilla de Santa Anita', x: -300, z: -169, r: 18 },
  toros:      { name: 'Plaza de Toros Alberto Balderas', x: 1149, z: 424, r: 45 },
  taller:     { name: 'Taller El Pistón (Rosa\'s garage)', x: 560, z: 330, r: 20 },
  casaAurelio:{ name: 'Casa de Aurelio Valdovinos, Barrio de San Cayetano', x: 470, z: -330, r: 14 },
  sendero:    { name: 'Trailhead to the Cerro de San Francisco', x: 380, z: 1350, r: 30 },
  petra:      { name: 'Doña Petra\'s house on the trail', x: 700, z: 2250, r: 20 },
  cueva:      { name: 'La Cueva del Añil (the indigo cave)', x: 1560, z: 4520, r: 22 },
  cumbre:     { name: 'Summit of the Cerro de San Francisco (2,470 m)', x: 1841, z: 5071, r: 40 }
};

/* Landmark sites where generated houses must not stand (the hand-built models go there). [x, z, halfW, halfD, ang] */
export const CLEAR = [
  [-178, -52, 40, 34, 0],        // Jardín
  [-118, 12, 34, 38, 0],         // Plaza Aguadora
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
  [560, 330, 14, 12, 0]          // Rosa's garage
];

/* Where the barrios are, roughly, for who lives where and what the map calls a place. */
export function barrio(x, z) {
  const d = Math.hypot(x + 60, z + 20);
  if (d < 420) return 'Centro';
  if (z > 2000) return 'Cerro de San Francisco';
  if (z > 700) return 'El Bosque';
  if (x > 900 && z > 100) return 'Salida a Morelia';
  if (z < -1400) return 'Rumbo a Sahuayo';
  if (x < -500 && z < 0) return 'Barrio de Guadalupe';
  if (x > 200 && z < 0) return 'Barrio de San Cayetano';
  if (x < -300) return 'Poniente';
  return 'Oriente';
}
