// Aurelio's lost notebook pages (scattered through town), the field notes (real history), and the achievements.
import { PLACES } from '../geo.js';

// each page lies near a real place; the history in them is true, the memories are Aurelio's (invented)
export const PAGES = [
  { at: 'jardin', dx: -24, dz: 18, title: 'The kiosco', text: 'Sunday nights the band plays on the kiosco and the whole town walks around the Jardín, the girls one way and the boys the other, like in my father\'s time. Your grandmother walked the wrong way on purpose. That is how I met her.' },
  { at: 'parroquia', dx: -40, dz: -10, title: 'The bells of San Francisco', text: 'The Parroquia de San Francisco is eighteenth-century. I rang its big bell once when I was nine. The sacristan chased me down Calle Morelos. Worth it.' },
  { at: 'biblioteca', dx: 10, dz: 24, title: 'Orozco\'s walls', text: 'José Clemente Orozco painted the Biblioteca Gabino Ortiz between 1940 and 1942, in what had been the town\'s first sanctuary of the Virgin of Guadalupe. My father mixed his lime. He said the maestro had one hand and needed none.' },
  { at: 'casaLC', dx: -18, dz: -14, title: 'The General', text: 'Lázaro Cárdenas del Río was born in Jiquilpan on 21 May 1895. President from 1934 to 1940. People here still call him the General, as if he might come round the corner.' },
  { at: 'portada', dx: 10, dz: -8, title: '18 de marzo de 1938', text: 'On 18 March 1938, Cárdenas announced the expropriation of the oil industry. People gave what they had to pay the debt: chickens, wedding rings. My father said the town cried at the radio. Forty years later I worked for PEMEX. I cried at my retirement party. Different reasons.' },
  { at: 'monumento', dx: 6, dz: 10, title: 'The monument', text: 'The General died in Mexico City on 19 October 1970. The town put him in bronze. He looks a little uncomfortable. He always did, in photographs.' },
  { at: 'presidencia', dx: 20, dz: -14, title: 'Two presidents', text: 'People forget: Jiquilpan gave Mexico two presidents. Anastasio Bustamante, born here in 1780, was president three times. The town prefers the other one.' },
  { at: 'guadalupe', dx: 0, dz: -30, title: 'The Virgin moved house', text: 'When the old sanctuary became the library, the Virgin of Guadalupe got a new house on the west side of town. On the twelfth of December the whole barrio walks there before dawn with mariachis.' },
  { at: 'toros', dx: 10, dz: -44, title: 'Alberto Balderas', text: 'The bullring is named for Alberto Balderas, a matador from the golden age of the thirties. I went to one corrida and cheered for the bull. I was asked to leave.' },
  { at: 'bosque', dx: -80, dz: -120, title: 'The Bosque', text: 'Under the old trees of the Parque Juárez it is always five degrees cooler. Every couple in Jiquilpan has argued here, and most of them made up here too.' },
  { at: 'cumbre', dx: -8, dz: 6, title: 'From the top', text: 'From the cross on the Cerro de San Francisco you can see the whole Ciénega, the fields, Sahuayo stuck to our side like a twin, and on clear days the shine of Lake Chapala, the biggest lake in Mexico.' },
  { at: 'cayetano', dx: 14, dz: 18, title: 'Añil', text: 'Jiquilpan comes from the Nahuatl for the place of the jiquilite, the plant that gives añil, indigo. Before the town was a town, people dyed cloth blue in the springs of the cerro. We have been the blue town for longer than we have been anything else.' }
].map((p, i) => Object.assign(p, { id: i, x: PLACES[p.at].x + p.dx, z: PLACES[p.at].z + p.dz }));

export const NOTES = [
  { title: 'Jiquilpan de Juárez', text: 'A town of about 35,000 in the northwest of Michoacán, at around 1,560 metres, in the Ciénega de Chapala, beside its twin town, Sahuayo. It was named a Pueblo Mágico in 2012. The name comes from the Nahuatl for the place of the jiquilite, the plant used to make indigo (añil).' },
  { title: 'Lázaro Cárdenas', text: 'Born in Jiquilpan on 21 May 1895; President of Mexico from 1934 to 1940. He carried out a vast land reform, granting land to ejidos, and on 18 March 1938 announced the expropriation of the foreign oil companies, creating PEMEX. He died in 1970. The Estadio 18 de Marzo is named for that day, and its portada carries his words about natural resources.' },
  { title: 'Orozco in Jiquilpan', text: 'José Clemente Orozco painted the murals of the Biblioteca Pública Gabino Ortiz between 1940 and 1942, in a 19th-century building that had been the town\'s first sanctuary of the Virgin of Guadalupe. Among them is the Alegoría de México. The library\'s bronze-clad door shows 22 illustrious figures of the Americas.' },
  { title: 'The town, as built here', text: 'Streets, buildings and places come from Overture Maps (built from OpenStreetMap and other open data); the terrain from open elevation data. The centro\'s whitewashed walls with a red guardapolvo, the painted houses of the barrios, the tinacos on the roofs, the cobbled empedrado streets: the town\'s own idiom. Where the exact form of a building isn\'t recorded (the portada, the kiosco, the bullring), it is modelled in the regional style.' },
  { title: 'What is invented', text: 'Everyone in this story is invented: the Valdovinos family, Inés Zepeda, Padre Tomás, Chema, Don Emeterio, Doña Petra, Lic. Barragán and Güero Mendoza. So are Manantiales del Cerro S.A., the 1938 title to the Ojo del Añil, the hollow stone in the portada, the notes in the parish book, the Cueva del Añil and Aurelio\'s jetpack. No real person, company or document is meant.' },
  { title: 'Two presidents', text: 'Jiquilpan is also the birthplace of Anastasio Bustamante (1780), three times President of Mexico in the 19th century.' },
  { title: 'Water in Michoacán', text: 'Water is contested across Michoacán: wells in towns run low while demand grows from agriculture and industry. The story\'s company is invented; the question it raises is real.' }
];

export const ACHIEVEMENTS = {
  bienvenido: { name: 'Bienvenido a Jiquilpan', desc: 'Arrive on the Jardín.' },
  vuelo: { name: 'Mochila cohete', desc: 'Take off with Aurelio\'s jetpack.' },
  supersonico: { name: 'Supersónico', desc: 'Fly faster than 400 km/h.' },
  alto: { name: 'Above the Ciénega', desc: 'Fly 1,000 metres above the town.' },
  volante: { name: 'Al volante', desc: 'Drive a car.' },
  kilometros: { name: 'Carretera', desc: 'Drive 10 kilometres.' },
  salto: { name: 'Fuera de pista', desc: 'Keep a car in the air for a second and a half.' },
  azotea: { name: 'Azotea', desc: 'Land on a rooftop.' },
  cumbre: { name: 'La cumbre', desc: 'Stand beside the cross on the summit of the Cerro de San Francisco.' },
  veintidos: { name: 'Veintidós', desc: 'Count the figures on the bronze door.' },
  archivista: { name: 'Archivista', desc: 'Find Cuco\'s note in the book of 1940.' },
  recursos: { name: 'Los recursos del país', desc: 'Read the General\'s words on the portada.' },
  persecucion: { name: 'Persecución', desc: 'Escape Güero\'s black pickup.' },
  caraacara: { name: 'Cara a cara', desc: 'Confront Maestra Inés.' },
  anil: { name: 'Añil', desc: 'Find your grandfather.' },
  contrareloj: { name: 'Contrarreloj', desc: 'Get the title to the Presidencia in time.' },
  pueblo: { name: 'El agua es del pueblo', desc: 'Read the title aloud to the town.' },
  museo: { name: 'La vitrina', desc: 'Give the title to the museum.' },
  trato: { name: 'El trato', desc: 'Sell the title.' },
  postales: { name: 'Postales', desc: 'Visit twelve landmarks of Jiquilpan.' },
  cuaderno: { name: 'El cuaderno', desc: 'Find all twelve of Aurelio\'s lost pages.' },
  platica: { name: 'Plática', desc: 'Talk with ten people on the street.' },
  noctambulo: { name: 'Noctámbulo', desc: 'Be out in the streets at three in the morning.' },
  campanas: { name: 'Las campanas', desc: 'Be on the Jardín when San Francisco rings noon.' },
  carreras: { name: 'Campeón', desc: 'Win gold in every race.' },
  // a life in Jiquilpan
  comico: { name: 'Cómico', desc: 'Make people laugh with ten jokes.' },
  detallista: { name: 'Detallista', desc: 'Give ten gifts.' },
  novios: { name: 'Novios', desc: 'Ask someone to be your sweetheart, and hear yes.' },
  boda: { name: '¡Que vivan los novios!', desc: 'Get married at the Parroquia de San Francisco.' },
  compadres: { name: 'Compadres', desc: 'Become compadre (the closest of friends) with five people.' },
  justo: { name: 'Corazón de oro', desc: 'Reach the height of compassion.' },
  picaro: { name: 'Lengua de plata', desc: 'Become known as a liar of great talent.' },
  famoso: { name: 'Todo Jiquilpan te conoce', desc: 'Become famous in town.' },
  avistamiento: { name: 'Avistamiento', desc: 'See the Presidente Municipal outside the Presidencia.' },
  regidores: { name: 'El cabildo completo', desc: 'Find all five regidores.' },
  hagalo: { name: 'Hágalo usted mismo', desc: 'Fix the bache of Calle Morelos, since nobody else would.' },
  llorona: { name: 'La Llorona', desc: 'Solve the weeping in the panteón.' },
  padrino: { name: 'Padrino de anillos', desc: 'End the feud between the Novoa and the Salazar.' },
  vaquero: { name: 'Vaquero', desc: 'Bring La Güera home.' },
  arriero: { name: 'Arriero', desc: 'Haul Doña Toña\'s eggs up the cerro without breaking them.' },
  loteriaWin: { name: '¡Lotería!', desc: 'Win a game of lotería on the Jardín.' },
  goleador: { name: 'Goleador', desc: 'Score four penalties against Chema.' },
  historiador: { name: 'Historiador', desc: 'Pass Don Emeterio\'s examination on the General.' },
  manosAzules: { name: 'Manos azules', desc: 'Dye a rebozo with Doña Petra\'s añil.' },
  buscador: { name: 'El regidor perdido', desc: 'Bring Regidor Kevin back to the cabildo.' },
  vecino: { name: 'Buen vecino', desc: 'Help eight of your neighbours with their troubles.' },
  taxista: { name: 'Taxista', desc: 'Drive ten taxi fares.' },
  casaPropia: { name: 'Casa propia', desc: 'Build a house with at least six parts.' },
  empresario: { name: 'Empresario', desc: 'Own three businesses.' },
  rico: { name: 'Billetes', desc: 'Have $100,000 in your pocket.' },
  elegante: { name: 'Bien vestido', desc: 'Dress in style (style 25 or more).' },
  danza: { name: 'Los Negritos', desc: 'Watch the Danza de los Negritos on the Jardín.' }
};
