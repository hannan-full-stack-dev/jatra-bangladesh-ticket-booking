"""
Builds src/data/places.js from three files:
  ADM1 divisions   geoBoundaries-BGD-ADM1_simplified.geojson   (to find each place's division)
  ADM3 upazilas    geoBoundaries-BGD-ADM3_simplified.geojson   (name and centre of every upazila)
  stations         export.geojson from OpenStreetMap (railway=station)
Usage: python3 scripts/build-places.py ADM1.geojson ADM3.geojson export.geojson
Boundaries courtesy of geoBoundaries.org. Stations (c) OpenStreetMap contributors, ODbL.
"""
import json, math, re, sys

ADM1, ADM3, STATIONS = sys.argv[1:4]
DIVISIONS = ['barishal', 'chattogram', 'dhaka', 'khulna', 'mymensingh', 'rajshahi', 'rangpur', 'sylhet']
ADM1_NAMES = {'Chittagong': 'chattogram', 'Dhaka': 'dhaka', 'Mymensingh': 'mymensingh', 'Rajshani': 'rajshahi',
              'Rangpur': 'rangpur', 'Sylhet': 'sylhet', 'Khulna': 'khulna', 'Barisal': 'barishal'}
SPELLING = [('Chittagong', 'Chattogram'), ('Comilla', 'Cumilla'), ('Barisal', 'Barishal'), ('Bogra', 'Bogura'), ('Jessore', 'Jashore')]

def polys(g): return g['coordinates'] if g['type'] == 'MultiPolygon' else [g['coordinates']]
def area(r): return abs(sum(r[i][0] * r[(i + 1) % len(r)][1] - r[(i + 1) % len(r)][0] * r[i][1] for i in range(len(r)))) / 2
def centroid(r):
    a = cx = cy = 0
    for i in range(len(r)):
        x0, y0 = r[i][:2]; x1, y1 = r[(i + 1) % len(r)][:2]; c = x0 * y1 - x1 * y0
        a += c; cx += (x0 + x1) * c; cy += (y0 + y1) * c
    a /= 2
    return (cx / (6 * a), cy / (6 * a)) if a else (r[0][0], r[0][1])
def inside(x, y, ring):
    ok = False
    for i in range(len(ring)):
        (x1, y1), (x2, y2) = ring[i][:2], ring[i - 1][:2]
        if (y1 > y) != (y2 > y) and x < (x2 - x1) * (y - y1) / (y2 - y1) + x1: ok = not ok
    return ok
def km(a, b):
    p = math.radians
    h = math.sin(p(b[0] - a[0]) / 2) ** 2 + math.cos(p(a[0])) * math.cos(p(b[0])) * math.sin(p(b[1] - a[1]) / 2) ** 2
    return 2 * 6371 * math.asin(math.sqrt(h))
def slug(s): return re.sub(r'[^a-z0-9]+', '-', s.lower()).strip('-')
def spell(s):
    for a, b in SPELLING: s = s.replace(a, b)
    return s

div_rings = [(ADM1_NAMES[f['properties']['shapeName']], [p[0] for p in polys(f['geometry'])]) for f in json.load(open(ADM1))['features']]
div_centres = {d: centroid(max(rs, key=area)) for d, rs in div_rings}
def division_of(lng, lat):
    for d, rs in div_rings:
        if any(inside(lng, lat, r) for r in rs): return d
    return min(div_centres, key=lambda d: (div_centres[d][0] - lng) ** 2 + (div_centres[d][1] - lat) ** 2)

# Upazilas
up = []
for f in json.load(open(ADM3))['features']:
    big = max((p[0] for p in polys(f['geometry'])), key=area)
    lng, lat = centroid(big)
    if not inside(lng, lat, big):                       # a bent shape can put its centroid outside, use its middle vertex then
        lng, lat = big[len(big) // 2][:2]
    up.append({'name': spell(f['properties']['shapeName'].strip()), 'lat': lat, 'lng': lng, 'div': division_of(lng, lat)})
sadar = [u for u in up if 'Sadar' in u['name']]
names = {}
for u in up: names[u['name']] = names.get(u['name'], 0) + 1
for u in up:
    if names[u['name']] > 1:   # same name in several districts: say which district it is near
        near = min((s for s in sadar if s is not u), key=lambda s: km((u['lat'], u['lng']), (s['lat'], s['lng'])))
        u['hint'] = re.sub(r'\s*Sadar.*$', '', near['name']).strip()
for u in up:
    u['id'] = slug(u['name'] + (' ' + u['hint'] if 'hint' in u else ''))

# Districts: all 64, by name. The position is the district's Sadar upazila where there is one,
# and the city centre for the six districts whose main upazilas have other names.
DISTRICTS = ["Bagerhat", "Bandarban", "Barguna", "Barishal", "Bhola", "Bogura", "Brahmanbaria", "Chandpur", "Chapainawabganj", "Chattogram",
             "Chuadanga", "Cox's Bazar", "Cumilla", "Dhaka", "Dinajpur", "Faridpur", "Feni", "Gaibandha", "Gazipur", "Gopalganj", "Habiganj",
             "Jamalpur", "Jashore", "Jhalokati", "Jhenaidah", "Joypurhat", "Khagrachhari", "Khulna", "Kishoreganj", "Kurigram", "Kushtia",
             "Lakshmipur", "Lalmonirhat", "Madaripur", "Magura", "Manikganj", "Meherpur", "Moulvibazar", "Munshiganj", "Mymensingh", "Naogaon",
             "Narail", "Narayanganj", "Narsingdi", "Natore", "Netrokona", "Nilphamari", "Noakhali", "Pabna", "Panchagarh", "Patuakhali",
             "Pirojpur", "Rajbari", "Rajshahi", "Rangamati", "Rangpur", "Satkhira", "Shariatpur", "Sherpur", "Sirajganj", "Sunamganj",
             "Sylhet", "Tangail", "Thakurgaon"]
CITY_CENTRES = {"Chattogram": (22.3569, 91.7832), "Dhaka": (23.8103, 90.4125), "Jashore": (23.1664, 89.2132),
                "Chapainawabganj": (24.5965, 88.2776), "Rajshahi": (24.3745, 88.6042), "Moulvibazar": (24.4829, 91.7774)}
assert len(DISTRICTS) == 64
dist = []
for name in DISTRICTS:
    hq = [u for u in up if name.lower() in u['name'].lower() and 'sadar' in u['name'].lower()]
    if hq:
        h = min(hq, key=lambda u: len(u['name'])); lat, lng = h['lat'], h['lng']
    else:
        lat, lng = CITY_CENTRES[name]
    dist.append({'name': name, 'lat': lat, 'lng': lng, 'div': division_of(lng, lat), 'id': 'district-' + slug(name)})

# Stations
BN_SUFFIX = re.compile(r'\s*(রেলওয়ে|রেল)?\s*স্টেশন\s*$')
EN_SUFFIX = re.compile(r'\s*(railway|rail)?\s*station\s*$', re.I)
BAD = re.compile(r',|hwy|highway|hotel|residential|\(|\bflag\b|\bcout\b', re.I)
seen, st = set(), []
for f in json.load(open(STATIONS))['features']:
    p = f['properties']
    if p.get('station') in ('subway', 'light_rail'): continue    # Dhaka metro is not intercity
    raw = p.get('name:en') or p.get('name')
    if not raw or BAD.search(raw): continue
    name = EN_SUFFIX.sub('', BN_SUFFIX.sub('', raw)).strip()
    name = re.sub(r'\bBramhonbaria\b', 'Brahmanbaria', name)
    key = name.lower()
    if not name or key in seen: continue
    seen.add(key)
    lng, lat = f['geometry']['coordinates'][:2]
    st.append({'name': name, 'lat': lat, 'lng': lng, 'div': division_of(lng, lat), 'id': 'st-' + (slug(name) or f['properties']['@id'].replace('/', '-'))})
ids = set()
for s in st:
    while s['id'] in ids: s['id'] += 'x'
    ids.add(s['id'])

def row(p): return [p['id'], p['name'], round(p['lat'], 4), round(p['lng'], 4), DIVISIONS.index(p['div'])] + ([p['hint']] if 'hint' in p else [])
latin = lambda s: not re.search(r'[\u0980-\u09ff]', s)
def order(p): return (not latin(p['name']), p['name'].lower())   # A to Z, Bangla-only names after them
up.sort(key=order); st.sort(key=order); dist.sort(key=order)

out = f"""// Generated by scripts/build-places.py. Do not edit by hand.
// Upazila names and boundaries: geoBoundaries.org (Runfola et al. 2020). Stations: OpenStreetMap contributors (ODbL).
// Row: [id, name, lat, lng, division index, hint?]. Both lists are sorted A to Z.
export const DIVISION_IDS = {json.dumps(DIVISIONS)}
export const UPAZILA_ROWS = {json.dumps([row(u) for u in up], ensure_ascii=False, separators=(',', ':'))}
export const DISTRICT_ROWS = {json.dumps([row(d) for d in dist], ensure_ascii=False, separators=(',', ':'))}
export const STATION_ROWS = {json.dumps([row(s) for s in st], ensure_ascii=False, separators=(',', ':'))}
"""
open('src/data/places.js', 'w').write(out)
print(len(dist), 'districts', len(up), 'upazilas', len(st), 'stations', len(out) // 1024, 'KB')
for want in ["Savar", "Cox's Bazar Sadar", 'Sylhet Sadar', 'Gazipur Sadar', 'Rajshahi Sadar', 'Khulna Sadar']:
    print(want, any(u['name'] == want for u in up))
print([s['name'] for s in st if s['name'] in ('Kamalapur', 'Chattogram', 'Sylhet', 'Rajshahi', 'Khulna Junction', 'Khulna', 'Rangpur', 'Cumilla')])
print([s['name'] for s in st][:12], [s['name'] for s in st if not latin(s['name'])][:3])
