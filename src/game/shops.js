// What there is to buy in Jiquilpan: clothes and hats, gifts, land, businesses, and what the albañiles can build.
// Prices are game pesos, chosen for play rather than for the real market.

/* clothes: slot hat | top | bottom | shoes | extra. style: how sharp you look. luck: a little fortune. */
export const CLOTHES = {
  // Boutique Rosa Mexicano, on the Jardín
  camisaBlanca: { name: 'White cotton shirt', slot: 'top', color: 0xe8e2d4, price: 0, style: 1, shop: 'boutique' },
  manta: { name: 'Camisa de manta (embroidered collar)', slot: 'top', color: 0xf2ecdc, price: 320, style: 3, shop: 'boutique' },
  guayabera: { name: 'Guayabera, pale blue', slot: 'top', color: 0xbfd6e8, price: 560, style: 5, shop: 'boutique' },
  blusa: { name: 'Blusa bordada (flowers in red and blue)', slot: 'top', color: 0xf0e0e8, price: 480, style: 5, shop: 'boutique' },
  deportivo: { name: 'Camiseta del Deportivo Jiquilpan', slot: 'top', color: 0x2e7a3a, price: 0, style: 2, shop: 'reward' },
  chamarra: { name: 'Chamarra de mezclilla (denim jacket)', slot: 'top', color: 0x3a5a8a, coat: 0x34507a, price: 780, style: 4, shop: 'boutique' },
  traje: { name: 'Traje oscuro (dark suit, for weddings and the cabildo)', slot: 'top', color: 0xe8e8e8, coat: 0x1e2230, price: 2600, style: 9, shop: 'boutique' },
  vestido: { name: 'Vestido de fiesta, magenta', slot: 'top', color: 0xc02870, dress: true, price: 1400, style: 8, shop: 'boutique' },
  mezclilla: { name: 'Jeans', slot: 'bottom', color: 0x2a3a5a, price: 0, style: 1, shop: 'boutique' },
  pantalonVestir: { name: 'Pantalón de vestir', slot: 'bottom', color: 0x22242c, price: 520, style: 3, shop: 'boutique' },
  falda: { name: 'Falda larga de manta', slot: 'bottom', color: 0xe8dcc8, dress: true, price: 460, style: 4, shop: 'boutique' },
  // Sombrerería La Texana
  palma: { name: 'Sombrero de palma', slot: 'hat', hat: 'wide', color: 0xd8c8a0, price: 260, style: 3, shop: 'sombreros' },
  texana: { name: 'Texana (cowboy hat), black', slot: 'hat', hat: 'wide', color: 0x1e1c1a, price: 1200, style: 6, shop: 'sombreros' },
  gorra: { name: 'Gorra del Deportivo', slot: 'hat', hat: 'cap', color: 0x2e7a3a, price: 180, style: 1, shop: 'sombreros' },
  tenis: { name: 'Sneakers', slot: 'shoes', color: 0xe8e8e8, price: 0, style: 1, shop: 'sombreros' },
  botas: { name: 'Botas vaqueras (cowboy boots)', slot: 'shoes', color: 0x5a3a20, price: 1500, style: 6, shop: 'sombreros' },
  huaraches: { name: 'Huaraches de Sahuayo', slot: 'shoes', color: 0x8a5a30, price: 350, style: 4, shop: 'sombreros' },
  cinto: { name: 'Cinto piteado (embroidered belt)', slot: 'extra', accessory: 'belt', color: 0x6a4a2a, price: 900, style: 5, shop: 'sombreros' },
  // Casita de Piedra and the Mercado de Artesanías
  rebozo: { name: 'Rebozo, rose and grey', slot: 'extra', accessory: 'rebozo', color: 0xb05a6a, price: 650, style: 5, shop: 'casita' },
  rebozoAnil: { name: 'Rebozo de añil (dyed by your own hands)', slot: 'extra', accessory: 'rebozo', color: 0x26346e, price: 0, style: 9, luck: 10, shop: 'reward' },
  sarape: { name: 'Sarape de Saltillo stripes', slot: 'extra', accessory: 'sarape', color: 0xc8502a, price: 700, style: 4, shop: 'mercado' },
  collar: { name: 'Collar de plata (silver necklace)', slot: 'extra', accessory: 'necklace', color: 0xd8d8e0, price: 1100, style: 6, luck: 4, shop: 'casita' },
  ojoVenado: { name: 'Ojo de venado (a seed amulet on a red thread)', slot: 'extra', accessory: 'amulet', color: 0xc02820, price: 120, style: 1, luck: 15, shop: 'mercado' }
};

/* things to carry: gifts and tools. tags decide who loves what. */
export const ITEMS = {
  flores: { name: 'Ramo de flores (a bunch of flowers)', price: 90, gift: true, tags: ['romance', 'pious', 'warm', 'shy'], shop: 'floreria' },
  pan: { name: 'Pan dulce (conchas and orejas)', price: 30, gift: true, tags: ['elder', 'parental', 'warm', 'kid'], shop: 'mercado' },
  gaspacho: { name: 'Gaspacho de Tía Cuca', price: 40, gift: true, tags: ['teen', 'kid', 'warm'], shop: 'cuca' },
  queso: { name: 'Queso Cotija and crema from the cremería', price: 85, gift: true, tags: ['cook', 'parental', 'elder'], shop: 'cremeria' },
  ate: { name: 'Ate de membrillo', price: 55, gift: true, tags: ['elder', 'kid', 'pious'], shop: 'cremeria' },
  charanda: { name: 'Charanda (Michoacán cane spirit)', price: 220, gift: true, tags: ['adult', 'dry', 'political'], dislike: ['pious', 'kid', 'teen'], shop: 'mercado' },
  alebrije: { name: 'Alebrije (a painted fantastic animal)', price: 320, gift: true, tags: ['artist', 'teen', 'shy', 'kid'], shop: 'mercado' },
  libro: { name: 'Libro: historia de Jiquilpan', price: 150, gift: true, tags: ['teacher', 'elder', 'political', 'shy'], shop: 'casita' },
  balon: { name: 'Balón de fútbol', price: 180, gift: true, tags: ['kid', 'teen', 'sport'], shop: 'mercado' },
  veladora: { name: 'Veladora de la Virgen (a votive candle)', price: 25, gift: true, tags: ['pious', 'elder'], shop: 'floreria' },
  anillo: { name: 'Anillo de compromiso (engagement ring)', price: 6000, gift: false, shop: 'casita' },
  amuleto: { name: 'Lucky charm from Doña Petra', price: 0, gift: false },
  cachito: { name: 'Cachito de lotería (a lottery ticket)', price: 30, gift: false, shop: 'mercado' }
};

/* the stores: where, who keeps them, what they sell */
export const SHOPS = {
  boutique: { place: 'boutique', name: 'Boutique Rosa Mexicano', keeper: 'Doña Maru', sells: 'clothes', sign: 'BOUTIQUE ROSA MEXICANO', color: 0xc02870 },
  sombreros: { place: 'sombreros', name: 'Sombrerería La Texana', keeper: 'Don Fermín', sells: 'clothes', sign: 'SOMBRERERÍA LA TEXANA', color: 0x6a4a2a },
  casita: { place: 'casita', name: 'La Casita de Piedra', keeper: 'Doña Lucha', sells: 'both', sign: 'LA CASITA DE PIEDRA · ARTESANÍAS', color: 0x5a6a4a },
  mercado: { place: 'mercado', name: 'Mercado de Artesanías', keeper: 'Don Goyo', sells: 'both', sign: 'MERCADO DE ARTESANÍAS', color: 0xd8a020 },
  floreria: { place: 'floreria', name: 'Florería Las Jacarandas', keeper: 'Itzel', sells: 'items', sign: 'FLORERÍA LAS JACARANDAS', color: 0x8a74c8 },
  cremeria: { place: 'cremeria', name: 'La Cremería', keeper: 'Don Amparo', sells: 'items', sign: 'CREMERÍA', color: 0xe8e0c8 },
  peluqueria: { place: 'peluqueria', name: 'Peluquería Don Beto', keeper: 'Don Beto', sells: 'looks', sign: 'PELUQUERÍA DON BETO', color: 0x2850a0 },
  notaria: { place: 'notaria', name: 'Bienes Raíces Jiquilpan', keeper: 'Lic. Yolanda Partida', sells: 'land', sign: 'BIENES RAÍCES · SE VENDEN TERRENOS', color: 0x2d4a3a },
  ferreteria: { place: 'ferreteria', name: 'Ferretería y Materiales El Albañil', keeper: 'Maestro Chuy', sells: 'builders', sign: 'MATERIALES EL ALBAÑIL', color: 0xd86a1a }
};

/* land for sale: the lot is found on the ground near (x, z) when the town loads */
export const LOTS = [
  { id: 'lotPaz', name: 'Lote junto al Jardín de la Paz', x: 30, z: -560, price: 26000, desc: 'A corner lot two steps from the Jardín de la Paz. Quiet, shaded, near the cremería.' },
  { id: 'lotCayetano', name: 'Lote en el Barrio de San Cayetano', x: 520, z: -380, price: 18000, desc: 'Cobbled street, neighbours who know everything, a view of San Cayetano\'s tower.' },
  { id: 'lotGuadalupe', name: 'Lote en el Barrio de Guadalupe', x: -700, z: -560, price: 15000, desc: 'Near the Santuario. The mañanitas will wake you on the twelfth of December.' },
  { id: 'lotCerro', name: 'Terreno camino al cerro, con vista', x: 900, z: 2120, price: 9000, desc: 'On the stone road up the Cerro de San Francisco. Oaks, wind, the whole Ciénega below. Few neighbours, fewer cars.' },
  { id: 'lotCentro', name: 'Casa vieja en el Centro (to rebuild)', x: -250, z: 40, price: 42000, desc: 'Three blocks from the Jardín. The walls are tired, the location is not.' }
];

/* businesses you can buy and run. income: pesos per day at level 1 */
export const BUSINESSES = [
  { id: 'nieves', name: 'Puesto de nieves en el Jardín', place: 'jardin', price: 6000, income: 320, upgrades: ['a second cart', 'pistachio and mamey flavours'], desc: 'A cart of nieves de garrafa on the Jardín, next to Tía Cuca (she approves, mostly).' },
  { id: 'taqueria', name: 'Taquería La Paz', place: 'jardinPaz', price: 15000, income: 820, upgrades: ['a trompo for al pastor', 'tables on the sidewalk'], desc: 'Tacos de carnitas by the Jardín de la Paz. Saturday nights the line goes round the block.' },
  { id: 'cremeriaBiz', name: 'La Cremería (a partnership)', place: 'cremeria', price: 21000, income: 1100, upgrades: ['a cold room', 'deliveries to Sahuayo'], desc: 'Cheese, crema, cajeta and gossip. Don Amparo wants a partner who will not change anything.' },
  { id: 'tiendita', name: 'La tiendita del cerro', place: 'sanFrancisco', price: 9000, income: 380, upgrades: ['a refrigerator for sodas', 'a solar panel'], desc: 'The store at the top of the cerro: sodas, candles, bread on Sundays. The hamlet would be grateful.' },
  { id: 'taxi', name: 'Un taxi propio (with a driver)', place: 'sitioAbasolo', price: 18000, income: 650, upgrades: ['a second taxi', 'radio dispatch'], desc: 'Your own taxi on the Sitio Abasolo, driven by Don Refugio\'s nephew. You can drive fares yourself too.' },
  { id: 'anil', name: 'Taller de añil', place: 'casita', price: 12000, income: 700, upgrades: ['a second dye vat', 'a stall in Morelia'], desc: 'Indigo-dyed rebozos made the old way and sold at the Casita de Piedra. Needs Doña Petra\'s recipe.', needs: 'anilRecipe' }
];

/* the house you build: styles (what it looks like) and parts (what the albañiles put up, one at a time) */
export const HOUSE_STYLES = {
  colonial: { name: 'Colonial del Centro', desc: 'Whitewash, a red guardapolvo along the bottom, clay tile at the eaves, wooden doors and iron balconies.', walls: [0xefe9dc, 0xf0dca8, 0xe8c4a8, 0xc8d8c0, 0xb8cde0, 0xf2c8c8], trim: 0x8a2a1e, roof: 'tile', price: 1 },
  adobe: { name: 'Adobe de rancho', desc: 'Thick earth walls, a gabled tile roof on wooden vigas, a deep porch.', walls: [0xa8805c, 0xb8906a, 0x9a7050, 0xc0a07a], trim: 0x5a3a24, roof: 'gable', price: 0.8 },
  piedra: { name: 'Casa de piedra', desc: 'Volcanic stone like the Casita de Piedra by the Bosque: grey-brown walls, tile, a stone stair.', walls: [0x6a625a, 0x7a7068, 0x5a524a], trim: 0x3a3430, roof: 'gable', price: 1.3 },
  moderna: { name: 'Moderna', desc: 'Flat white planes, big windows, wooden slats. The neighbours will talk.', walls: [0xf2f2f0, 0xd8d8d4, 0x3a3a3c, 0xc8b89a], trim: 0x6a4a30, roof: 'flat', price: 1.4 },
  nortena: { name: 'Norteña (built with dollars)', desc: 'Two-tone paint, columns, arches, a big iron portón: the house a son builds after twenty years in California.', walls: [0xf2b8c8, 0x7ad0c8, 0xf0d070, 0xb0a0e0, 0xf09a6a], trim: 0xffffff, roof: 'flat', price: 1.2 },
  obra: { name: 'Obra negra (rebar optimism)', desc: 'Grey block, no paint yet, rebar sticking up for the second floor that will come some day. Cheap. Very Michoacán.', walls: [0x8a8a86, 0x9a9690], trim: 0x6a6a66, roof: 'rebar', price: 0.55 }
};
export const HOUSE_PARTS = {
  cimientos: { name: 'Cimientos (foundations)', cost: 2500, hours: 3, needs: [], desc: 'Dig, pour, level. Nothing to see; everything rests on it.' },
  sala: { name: 'Sala (living room and the front of the house)', cost: 6000, hours: 5, needs: ['cimientos'], desc: 'The main room and the facade on the street. With it, the house is a home: you can sleep and save here.' },
  cocina: { name: 'Cocina (kitchen)', cost: 4200, hours: 4, needs: ['sala'], desc: 'A comal, a gas stove, a window over the patio. People will visit more.' },
  recamara: { name: 'Recámara (bedroom)', cost: 4500, hours: 4, needs: ['sala'], desc: 'A real bed, and a wardrobe for your clothes.' },
  bano: { name: 'Baño', cost: 2800, hours: 3, needs: ['sala'], desc: 'Hot water, when the boiler agrees.' },
  patio: { name: 'Patio con jardín', cost: 2200, hours: 2, needs: ['cimientos'], desc: 'Pots of geraniums, a lemon tree, a little fountain.' },
  cochera: { name: 'Cochera and portón', cost: 3600, hours: 3, needs: ['cimientos'], desc: 'A garage with an iron gate. Cars you park here are safe and wait for you.' },
  tienda: { name: 'Tiendita on the street', cost: 5200, hours: 4, needs: ['sala'], desc: 'A shop window on the front. It earns a little every day.' },
  segundo: { name: 'Segundo piso (upper floor)', cost: 9000, hours: 6, needs: ['sala', 'recamara'], desc: 'A second storey over the house, finally. The rebar can rest.' },
  balcon: { name: 'Balcón de herrería', cost: 2400, hours: 2, needs: ['segundo'], desc: 'Wrought-iron balconies on the upper floor.' },
  azotea: { name: 'Azotea with tinaco', cost: 1600, hours: 2, needs: ['sala'], desc: 'A roof terrace, a black water tank, a clothesline. Sunsets.' },
  barda: { name: 'Barda (wall around the lot)', cost: 2000, hours: 2, needs: ['cimientos'], desc: 'A wall and a gate all round, painted to match.' }
};
export const PART_ORDER = ['cimientos', 'sala', 'cocina', 'recamara', 'bano', 'patio', 'cochera', 'tienda', 'segundo', 'balcon', 'azotea', 'barda'];
