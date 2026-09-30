"""Fetch Overture Maps features (open data built from OpenStreetMap and others) inside a bounding box,
reading only the parquet row groups whose bbox statistics overlap it (HTTP range requests, no SDK needed).
usage: python3 tools/overture.py <out_dir> <west> <south> <east> <north>"""
import sys, json, io, re, os, concurrent.futures as cf
import requests, pyarrow.parquet as pq, pyarrow as pa
from shapely import wkb

BUCKET = 'https://overturemaps-us-west-2.s3.us-west-2.amazonaws.com'
RELEASE = os.environ.get('OVERTURE_RELEASE', '2026-09-23.1')
S = requests.Session()

class Remote(io.RawIOBase):
    """A seekable file over HTTP range requests."""
    def __init__(self, url, size): self.url, self.size, self.pos = url, size, 0
    def readable(self): return True
    def seekable(self): return True
    def tell(self): return self.pos
    def seek(self, off, whence=0):
        self.pos = off if whence == 0 else self.pos + off if whence == 1 else self.size + off
        return self.pos
    def read(self, n=-1):
        if n < 0: n = self.size - self.pos
        if n == 0: return b''
        for _ in range(4):
            try:
                r = S.get(self.url, headers={'Range': f'bytes={self.pos}-{self.pos + n - 1}'}, timeout=120)
                if r.status_code in (200, 206): break
            except Exception: pass
        data = r.content; self.pos += len(data); return data
    def readinto(self, b): d = self.read(len(b)); b[:len(d)] = d; return len(d)

def listing(prefix):
    out, token = [], None
    while True:
        u = f'{BUCKET}/?list-type=2&prefix={prefix}' + (f'&continuation-token={requests.utils.quote(token)}' if token else '')
        t = S.get(u, timeout=60).text
        out += [(k, int(s)) for k, s in re.findall(r'<Key>([^<]*)</Key>.*?<Size>(\d+)</Size>', t)]
        m = re.search(r'<NextContinuationToken>([^<]*)</NextContinuationToken>', t)
        if not m: return out
        token = m.group(1)

def groups(key, size, bb):
    """Row groups of one file overlapping bb, from footer statistics."""
    f = pq.ParquetFile(Remote(f'{BUCKET}/{key}', size))
    md, names = f.metadata, f.schema_arrow.names
    cols = {md.schema.column(i).path: i for i in range(md.num_columns)}
    idx = [cols.get('bbox.xmin'), cols.get('bbox.xmax'), cols.get('bbox.ymin'), cols.get('bbox.ymax')]
    hit = []
    for g in range(md.num_row_groups):
        rg = md.row_group(g); st = [rg.column(i).statistics for i in idx]
        if any(s is None or not s.has_min_max for s in st): hit.append(g); continue
        if st[0].min <= bb[2] and st[1].max >= bb[0] and st[2].min <= bb[3] and st[3].max >= bb[1]: hit.append(g)
    return key, size, hit

def fetch(theme, typ, bb, columns):
    files = listing(f'release/{RELEASE}/theme={theme}/type={typ}/')
    files = [f for f in files if f[0].endswith('.parquet') or 'part-' in f[0]]
    with cf.ThreadPoolExecutor(16) as ex: found = [r for r in ex.map(lambda f: groups(f[0], f[1], bb), files) if r[2]]
    feats = []
    for key, size, gs in found:
        f = pq.ParquetFile(Remote(f'{BUCKET}/{key}', size))
        cols = [c for c in columns if c in f.schema_arrow.names] + ['geometry', 'bbox']
        for g in gs:
            t = f.read_row_group(g, columns=cols).to_pylist()
            for row in t:
                b = row['bbox']
                if b['xmin'] > bb[2] or b['xmax'] < bb[0] or b['ymin'] > bb[3] or b['ymax'] < bb[1]: continue
                geom = wkb.loads(row.pop('geometry')); row.pop('bbox')
                row['geometry'] = geom.__geo_interface__
                feats.append(row)
    print(f'{theme}/{typ}: {len(files)} files, {sum(len(g[2]) for g in found)} row groups, {len(feats)} features', flush=True)
    return feats

def clean(o):
    if isinstance(o, dict): return {k: clean(v) for k, v in o.items() if v is not None}
    if isinstance(o, (list, tuple)): return [clean(v) for v in o]
    if isinstance(o, (bytes, bytearray)): return None
    if hasattr(o, 'isoformat'): return o.isoformat()
    return o

if __name__ == '__main__':
    out = sys.argv[1]; bb = [float(v) for v in sys.argv[2:6]]
    os.makedirs(out, exist_ok=True)
    jobs = {
        'segments': ('transportation', 'segment', ['id', 'subtype', 'class', 'names', 'road_surface', 'subclass']),
        'buildings': ('buildings', 'building', ['id', 'names', 'height', 'num_floors', 'class', 'subtype', 'roof_shape', 'facade_color', 'roof_color']),
        'places': ('places', 'place', ['id', 'names', 'categories', 'basic_category', 'addresses', 'confidence']),
        'land_use': ('base', 'land_use', ['id', 'names', 'class', 'subtype']),
        'water': ('base', 'water', ['id', 'names', 'class', 'subtype']),
        'infrastructure': ('base', 'infrastructure', ['id', 'names', 'class', 'subtype']),
        'land_cover': ('base', 'land_cover', ['id', 'subtype']),
    }
    for name in (sys.argv[6:] or jobs.keys()):
        th, ty, cols = jobs[name]
        feats = fetch(th, ty, bb, cols)
        json.dump(clean(feats), open(f'{out}/{name}.json', 'w'), ensure_ascii=False)
