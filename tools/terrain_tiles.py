"""Download Terrarium elevation tiles (AWS open data, from SRTM and national elevation models) and resample a grid.
usage: python3 tools/terrain_tiles.py <out.npy> <zoom> <west> <south> <east> <north> <cols> <rows>"""
import sys, math, io, os, requests, numpy as np
from PIL import Image
URL = 'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'
S = requests.Session()
def tile_xy(lon, lat, z):
    n = 2 ** z; x = (lon + 180) / 360 * n
    y = (1 - math.log(math.tan(math.radians(lat)) + 1 / math.cos(math.radians(lat))) / math.pi) / 2 * n
    return x, y
def main():
    out, z = sys.argv[1], int(sys.argv[2]); w, s, e, n = map(float, sys.argv[3:7]); cols, rows = int(sys.argv[7]), int(sys.argv[8])
    x0, y0 = tile_xy(w, n, z); x1, y1 = tile_xy(e, s, z)
    tx0, ty0, tx1, ty1 = int(x0), int(y0), int(x1), int(y1)
    W, H = (tx1 - tx0 + 1) * 256, (ty1 - ty0 + 1) * 256
    mosaic = np.zeros((H, W), np.float32)
    cache = os.path.join(os.path.dirname(out) or '.', 'tiles'); os.makedirs(cache, exist_ok=True)
    for ty in range(ty0, ty1 + 1):
        for tx in range(tx0, tx1 + 1):
            p = f'{cache}/{z}_{tx}_{ty}.png'
            if not os.path.exists(p): open(p, 'wb').write(S.get(URL.format(z=z, x=tx, y=ty), timeout=60).content)
            a = np.asarray(Image.open(p).convert('RGB'), np.float32)
            mosaic[(ty - ty0) * 256:(ty - ty0 + 1) * 256, (tx - tx0) * 256:(tx - tx0 + 1) * 256] = a[..., 0] * 256 + a[..., 1] + a[..., 2] / 256 - 32768
    # bilinear sample at grid points (row 0 = north)
    lons = np.linspace(w, e, cols); lats = np.linspace(n, s, rows)
    gx = np.array([tile_xy(lo, n, z)[0] for lo in lons]) - tx0
    gy = np.array([tile_xy(w, la, z)[1] for la in lats]) - ty0
    px = gx * 256 - 0.5; py = gy * 256 - 0.5
    X, Y = np.meshgrid(px, py)
    i = np.clip(np.floor(X).astype(int), 0, W - 2); j = np.clip(np.floor(Y).astype(int), 0, H - 2)
    u = np.clip(X - i, 0, 1); v = np.clip(Y - j, 0, 1)
    g = (mosaic[j, i] * (1 - u) + mosaic[j, i + 1] * u) * (1 - v) + (mosaic[j + 1, i] * (1 - u) + mosaic[j + 1, i + 1] * u) * v
    np.save(out, g.astype(np.float32))
    print(out, g.shape, 'min', g.min(), 'max', g.max(), 'tiles', (tx1 - tx0 + 1) * (ty1 - ty0 + 1))
main()
