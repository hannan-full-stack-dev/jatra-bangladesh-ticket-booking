"""
Shared helpers for build-bangladesh-map.py and build-upazila-map.py.

geoBoundaries ships TopoJSON next to GeoJSON. In TopoJSON a border between two districts is stored once, as an "arc".
We simplify every arc on its own, so the two neighbours still share exactly the same border afterwards: no gaps, no overlaps.
"""
import glob, json, math, os, re

# The map frame, shared by every layer and by src/lib/geo.js. Do not change one without the other.
WIDTH, HEIGHT = 340, 466
LNG = (87.971, 92.741)
LAT = (20.678, 26.671)
SRC_PLACES = os.path.join(os.path.dirname(__file__), '..', 'src', 'data', 'places.js')


SPELLING = [('Chittagong', 'Chattogram'), ('Comilla', 'Cumilla'), ('Barisal', 'Barishal'), ('Bogra', 'Bogura'), ('Jessore', 'Jashore')]
# geoBoundaries spells a few districts differently from places.js
RENAMED = {'Brahamanbaria': 'Brahmanbaria', 'Maulvibazar': 'Moulvibazar', 'Nawabganj': 'Chapainawabganj', 'Netrakona': 'Netrokona'}


def district_name(name):
    for a, b in SPELLING: name = name.replace(a, b)
    return RENAMED.get(name, name)


def find(folder, ext):
    """The *_simplified file of a geoBoundaries download folder."""
    return glob.glob(os.path.join(folder, f'*_simplified.{ext}'))[0]


def px(lng, lat, s=1):
    """Longitude/latitude to map coordinates. s > 1 draws the same frame bigger, for zoomed-in detail."""
    return ((lng - LNG[0]) / (LNG[1] - LNG[0]) * WIDTH * s, (LAT[1] - lat) / (LAT[1] - LAT[0]) * HEIGHT * s)


def decode_arcs(topo):
    sx, sy = topo['transform']['scale']
    tx, ty = topo['transform']['translate']
    out = []
    for arc in topo['arcs']:
        x = y = 0
        pts = []
        for dx, dy in arc:
            x += dx; y += dy
            pts.append((x * sx + tx, y * sy + ty))
        out.append(pts)
    return out


def dp(points, tol):
    """Douglas-Peucker. Keeps both end points."""
    if len(points) < 3: return list(points)
    (x1, y1), (x2, y2) = points[0], points[-1]
    dx, dy = x2 - x1, y2 - y1
    norm = math.hypot(dx, dy) or 1e-12
    best, idx = 0, 0
    for i in range(1, len(points) - 1):
        d = abs(dy * points[i][0] - dx * points[i][1] + x2 * y1 - y2 * x1) / norm
        if d > best: best, idx = d, i
    if best <= tol: return [points[0], points[-1]]
    return dp(points[:idx + 1], tol)[:-1] + dp(points[idx:], tol)


def simplify_arc(pts, tol):
    if len(pts) > 3 and pts[0] == pts[-1]:      # an arc that is a whole ring: simplify its two halves separately
        mid = len(pts) // 2
        return dp(pts[:mid + 1], tol)[:-1] + dp(pts[mid:], tol)
    return dp(pts, tol)


def ring_points(refs, arcs):
    """Join arcs into one closed ring. A negative reference means the arc is walked backwards."""
    pts = []
    for ref in refs:
        a = arcs[ref] if ref >= 0 else arcs[~ref][::-1]
        pts += a if not pts else a[1:]
    return pts


def polygons(geom):
    """Each polygon as a list of rings, each ring a list of arc references."""
    return geom['arcs'] if geom['type'] == 'MultiPolygon' else [geom['arcs']]


def area(r):
    return abs(sum(r[i][0] * r[(i + 1) % len(r)][1] - r[(i + 1) % len(r)][0] * r[i][1] for i in range(len(r)))) / 2


def centroid(r):
    a = cx = cy = 0
    for i in range(len(r)):
        x0, y0 = r[i][:2]; x1, y1 = r[(i + 1) % len(r)][:2]
        c = x0 * y1 - x1 * y0
        a += c; cx += (x0 + x1) * c; cy += (y0 + y1) * c
    a /= 2
    return (cx / (6 * a), cy / (6 * a)) if a else (r[0][0], r[0][1])


def inside(x, y, ring):
    ok = False
    for i in range(len(ring)):
        (x1, y1), (x2, y2) = ring[i][:2], ring[i - 1][:2]
        if (y1 > y) != (y2 > y) and x < (x2 - x1) * (y - y1) / (y2 - y1) + x1: ok = not ok
    return ok


def num(v):
    s = f'{v:.1f}'
    return s[:-2] if s.endswith('.0') else s


def places_const(name):
    """Reads one of the JSON lists out of src/data/places.js."""
    text = open(SRC_PLACES, encoding='utf-8').read()
    return json.loads(re.search(r'export const ' + name + r' = (\[.*\])\n', text).group(1))
