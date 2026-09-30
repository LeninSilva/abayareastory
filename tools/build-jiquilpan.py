"""Build data/jiquilpan.bin + data/jiquilpan.json from Overture Maps features and Terrarium elevation.
Run tools/overture.py and tools/terrain_tiles.py first (see README)."""
import json, math, random, numpy as np
from PIL import Image, ImageDraw
from shapely.geometry import shape, Point, Polygon, box
from shapely.strtree import STRtree

RAW = 'raw/jiquilpan'
LAT0, LON0, BASE = 19.9905, -102.7175, 1540.0          # origin at the Jardín; y = metres above 1540 m
KX = 111320 * math.cos(math.radians(LAT0)); KZ = 110574
xz = lambda lon, lat: ((lon - LON0) * KX, -(lat - LAT0) * KZ)
TOWN = (-102.7560, 19.9530, -102.6780, 20.0280); MID = (-102.8000, 19.9000, -102.6300, 20.0700); REGION = (-103.05, 19.72, -102.38, 20.30)
random.seed(7); rng = np.random.default_rng(7)

def grid_meta(bb, n):
    (x0, z1), (x1, z0) = xz(bb[0], bb[1]), xz(bb[2], bb[3])
    return {'x0': x0, 'x1': x1, 'z0': z0, 'z1': z1, 'n': n}
demT = np.load(f'{RAW}/dem_town.npy') - BASE; demM = np.load(f'{RAW}/dem_mid.npy') - BASE; demR = np.load(f'{RAW}/dem_region.npy') - BASE
mT, mM, mR = grid_meta(TOWN, demT.shape[0]), grid_meta(MID, demM.shape[0]), grid_meta(REGION, demR.shape[0])
def height(x, z):
    for d, m in ((demT, mT), (demM, mM), (demR, mR)):
        fx = (x - m['x0']) / (m['x1'] - m['x0']) * (m['n'] - 1); fz = (z - m['z0']) / (m['z1'] - m['z0']) * (m['n'] - 1)
        if 0 <= fx < m['n'] - 1 and 0 <= fz < m['n'] - 1:
            i, j = int(fx), int(fz); u, v = fx - i, fz - j
            return (d[j, i] * (1 - u) + d[j, i + 1] * u) * (1 - v) + (d[j + 1, i] * (1 - u) + d[j + 1, i + 1] * u) * v
    return 0.0

def geoms(name):
    out = []
    for f in json.load(open(f'{RAW}/{name}.json')):
        g = f['geometry']
        def tr(c): return [xz(p[0], p[1]) for p in c]
        if g['type'] == 'Polygon': gg = Polygon(tr(g['coordinates'][0]), [tr(h) for h in g['coordinates'][1:]])
        elif g['type'] == 'MultiPolygon': gg = [Polygon(tr(p[0])) for p in g['coordinates']]
        elif g['type'] == 'LineString': gg = tr(g['coordinates'])
        elif g['type'] == 'Point': gg = xz(*g['coordinates'][:2])
        else: continue
        out.append((f, gg))
    return out

HALF = 4000
# ---------------- streets ----------------
W = {'primary': 14, 'secondary': 12.5, 'tertiary': 11, 'residential': 9.5, 'unclassified': 9, 'living_street': 7.5, 'service': 6.5, 'pedestrian': 7, 'footway': 3, 'path': 2.5, 'steps': 3, 'track': 4, 'cycleway': 3, 'unknown': 8}
KIND = {'footway': 1, 'path': 1, 'steps': 2, 'track': 3, 'pedestrian': 4}   # 0 road with sidewalks
names, name_ix, streets = [], {}, []
for f, pts in geoms('segments'):
    if not isinstance(pts, list) or f.get('subtype') != 'road': continue
    cls = f.get('class') or 'unknown'
    if cls in ('motorway',): continue
    if all(abs(x) > HALF or abs(z) > HALF for x, z in pts): continue
    n = (f.get('names') or {}).get('primary') or ''
    if n not in name_ix: name_ix[n] = len(names); names.append(n)
    streets.append({'pts': pts, 'w': W.get(cls, 8), 'kind': KIND.get(cls, 0), 'cls': cls, 'name': name_ix[n]})
print('streets', len(streets))

# ---------------- places ----------------
places = []
for f, p in geoms('places'):
    n = (f.get('names') or {}).get('primary')
    if not n or not isinstance(p, tuple): continue
    places.append({'name': n, 'cat': f.get('basic_category') or '', 'x': round(p[0], 1), 'z': round(p[1], 1)})
shopcats = ('store', 'restaurant', 'eatery', 'shop', 'bar', 'cafe', 'pharmacy', 'service', 'bank', 'bakery', 'hotel')
shop_pts = [Point(p['x'], p['z']) for p in places if any(k in p['cat'] for k in shopcats)]

# ---------------- cover raster (1024 over the town box) ----------------
CN = 1024; cx0, cx1, cz0, cz1 = mT['x0'], mT['x1'], mT['z0'], mT['z1']
cov = Image.new('L', (CN, CN), 0); dr = ImageDraw.Draw(cov)
tp = lambda x, z: ((x - cx0) / (cx1 - cx0) * CN, (z - cz0) / (cz1 - cz0) * CN)
COVER = {'urban': 1, 'forest': 2, 'shrub': 3, 'crop': 4, 'barren': 5, 'grass': 6, 'wetland': 6, 'moss': 6, 'mangrove': 2, 'snow': 5}
def fill(g, v):
    for p in (g if isinstance(g, list) else [g]):
        if isinstance(p, Polygon) and len(p.exterior.coords) > 2: dr.polygon([tp(*c) for c in p.exterior.coords], fill=v)
for f, g in geoms('land_cover'): fill(g, COVER.get(f.get('subtype'), 6))
parks = []
LU = {'park': 7, 'recreation': 8, 'education': 11, 'resource_extraction': 10, 'protected': 2, 'horticulture': 7, 'residential': 1, 'military': 11}
for f, g in geoms('land_use'):
    v = LU.get(f.get('subtype')); 
    if not v: continue
    fill(g, v)
    if f.get('subtype') in ('park', 'horticulture'): parks.append((f, g))
water_lines = []
for f, g in geoms('water'):
    if isinstance(g, list) and g and isinstance(g[0], tuple): water_lines.append({'pts': [[round(x, 1), round(z, 1)] for x, z in g], 'cls': f.get('subtype')})
    else: fill(g, 9)
cover = np.asarray(cov, np.uint8)

# ---------------- buildings ----------------
plaza = (0.0, 0.0)
def dist_c(x, z): return math.hypot(x - plaza[0], z - plaza[1])
segs = []
for s in streets:
    for a, b in zip(s['pts'], s['pts'][1:]): segs.append((a, b, s))
from shapely.geometry import LineString
seg_lines = [LineString([a, b]) for a, b, _ in segs]; seg_tree = STRtree(seg_lines)
shop_tree = STRtree(shop_pts) if shop_pts else None
blds, mask = [], Image.new('L', (4096, 4096), 0); md = ImageDraw.Draw(mask)
mp = lambda x, z: ((x + HALF) / (2 * HALF) * 4096, (z + HALF) / (2 * HALF) * 4096)
STY = {'centro': 40, 'barrio': 41, 'obra': 42, 'comercio': 43, 'bodega': 44, 'escuela': 45}
for f, g in geoms('buildings'):
    for p in (g if isinstance(g, list) else [g]):
        if not isinstance(p, Polygon) or p.area < 14: continue
        c = p.centroid
        if abs(c.x) > HALF - 50 or abs(c.y) > HALF - 50: continue
        md.polygon([mp(*q) for q in p.exterior.coords], fill=255)
        r = p.minimum_rotated_rectangle; cs = list(r.exterior.coords)[:4]
        e0 = (cs[1][0] - cs[0][0], cs[1][1] - cs[0][1]); e1 = (cs[2][0] - cs[1][0], cs[2][1] - cs[1][1])
        L0, L1 = math.hypot(*e0), math.hypot(*e1)
        # the long side toward the nearest street is the front (local x runs along the front)
        near = seg_tree.query(c.buffer(40)); best, bd = None, 1e9
        for k in near:
            d = seg_lines[k].distance(c)
            if d < bd: bd, best = d, k
        ang0 = math.atan2(e0[1], e0[0]); w, d = L0, L1
        if best is not None:
            (ax, az), (bx, bz), s = segs[best]; sa = math.atan2(bz - az, bx - ax)
            # choose the edge most parallel to the street as the front
            if abs(math.sin(ang0 - sa)) > abs(math.cos(ang0 - sa)): ang0 += math.pi / 2; w, d = L1, L0
        ys = [height(q[0], q[1]) for q in cs]; y = min(ys)
        dc = dist_c(c.x, c.y); area = p.area
        street = segs[best][2] if best is not None else None
        big_street = street is not None and street['cls'] in ('primary', 'secondary', 'tertiary') and bd < 25
        shop = shop_tree is not None and len(shop_tree.query(p)) > 0
        cls = f.get('class')
        if cls in ('school', 'university', 'library') or area > 2500: style = 'escuela' if cls in ('school', 'university') else 'bodega'
        elif area > 900 and dc > 400: style = 'bodega'
        elif dc < 420 and random.random() < 0.85: style = 'centro'
        elif shop or (big_street and random.random() < 0.6): style = 'comercio'
        elif random.random() < (0.12 if dc < 900 else 0.22): style = 'obra'
        else: style = 'barrio'
        r_ = random.random()
        floors = (1 if r_ < 0.3 else 2 if r_ < 0.88 else 3) if dc < 500 else (1 if r_ < 0.55 else 2 if r_ < 0.95 else 3)
        if style == 'bodega': floors = 1
        if area < 40: floors = 1
        h = floors * (3.4 if style in ('centro', 'escuela') else 3.0) + (0.9 if style == 'centro' else 0.5) + (1.5 if style == 'bodega' else 0)
        houses = max(1, round(w / 8.5))
        blds.append([round(c.x, 2), round(c.y, 2), round(w, 2), round(d, 2), round(ang0, 4), round(h, 2), round(y, 2), STY[style], random.randrange(256), houses, floors])
print('buildings', len(blds))
bmask = np.asarray(mask) > 0

# ---------------- trees ----------------
trees = []
def free(x, z):
    """Somewhere a tree can grow: not inside a house, and more than 5 m from any street's centre line."""
    i, j = int((x + HALF) / (2 * HALF) * 4096), int((z + HALF) / (2 * HALF) * 4096)
    if not (0 <= i < 4096 and 0 <= j < 4096) or bmask[max(0, j - 2):j + 3, max(0, i - 2):i + 3].any(): return False
    pt = Point(x, z)
    return all(seg_lines[k].distance(pt) > 5 for k in seg_tree.query(pt.buffer(5.5)))
def cov_at(x, z):
    i, j = int((x - cx0) / (cx1 - cx0) * CN), int((z - cz0) / (cz1 - cz0) * CN)
    return cover[j, i] if 0 <= i < CN and 0 <= j < CN else 0
# types: 0 laurel (clipped, dense), 1 palm, 2 pine/oak (hills), 3 ahuehuete / eucalyptus (tall, parks), 4 jacaranda, 5 huizache/scrub
for f, g in parks:
    for p in (g if isinstance(g, list) else [g]):
        if not isinstance(p, Polygon): continue
        x0, z0, x1, z1 = p.bounds
        for _ in range(int(p.area / 55)):
            x, z = random.uniform(x0, x1), random.uniform(z0, z1)
            if p.contains(Point(x, z)) and free(x, z): trees.append([x, z, random.choice([3, 3, 0, 4, 3]), random.uniform(0.8, 1.35)])
for _ in range(90000):
    x, z = random.uniform(-HALF + 100, HALF - 100), random.uniform(-HALF + 100, HALF - 100)
    c = cov_at(x, z)
    if c == 2 and random.random() < 0.9: t = 2 if height(x, z) > 180 else random.choice([2, 3, 5])
    elif c == 3 and random.random() < 0.35: t = 5
    elif c == 1 and random.random() < 0.05: t = random.choice([0, 4, 1, 0, 4])
    elif c in (6, 4) and random.random() < 0.03: t = 5
    else: continue
    if free(x, z): trees.append([x, z, t, random.uniform(0.7, 1.3)])
print('trees', len(trees))

# ---------------- write ----------------
sections, blobs, off = {}, [], 0
def add(name, arr, typ):
    global off
    a = np.ascontiguousarray(arr, dtype=typ); b = a.tobytes()
    pad = (-off) % 8; blobs.append(b'\0' * pad); off += pad
    sections[name] = {'offset': off, 'length': a.size, 'type': {np.float32: 'Float32Array', np.int16: 'Int16Array', np.uint8: 'Uint8Array', np.uint32: 'Uint32Array', np.uint16: 'Uint16Array'}[typ]}
    blobs.append(b); off += len(b)
add('demTown', np.round(demT * 10), np.int16); add('demMid', np.round(demM * 10), np.int16); add('demRegion', np.round(demR), np.int16); add('cover', cover, np.uint8)
sp, so, sw = [], [0], []
for s in streets: sp += [c for q in s['pts'] for c in q]; so.append(len(sp) // 2); sw.append([s['w'], s['kind'], s['name']])
add('streetPts', sp, np.float32); add('streetOff', so, np.uint32); add('streetInfo', np.array(sw).ravel(), np.float32)
add('bld', np.array(blds, np.float32).ravel(), np.float32); add('trees', np.array(trees, np.float32).ravel(), np.float32)
open('data/jiquilpan.bin', 'wb').write(b''.join(blobs))
json.dump({'sections': sections, 'lat0': LAT0, 'lon0': LON0, 'base': BASE, 'half': HALF, 'demTown': mT, 'demMid': mM, 'demRegion': mR,
           'cover': {'x0': cx0, 'x1': cx1, 'z0': cz0, 'z1': cz1, 'n': CN}, 'streetNames': names, 'places': places, 'streams': water_lines,
           'credits': 'Overture Maps Foundation (OpenStreetMap contributors and others, ODbL); elevation: Mapzen Terrarium tiles on AWS (SRTM, INEGI and others)'},
          open('data/jiquilpan.json', 'w'), ensure_ascii=False)
print('bin', off, 'bytes')
