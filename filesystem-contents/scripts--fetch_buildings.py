#!/usr/bin/env python3
import json, time, urllib.request, urllib.parse, ssl

ssl._create_default_https_context = ssl._create_unverified_context
UA = "ArchitectureHelper/1.0 (atlas@architecturehelper.com)"
SKIP = ['.pdf','.tif','plan','diagram','plaque','marker','painting','interior','map','logo','stamp','coin']
PREFER = ['facade','exterior','building','view']

CITIES = {
    "edinburgh": [
        {"name":"Edinburgh Castle","city":"Edinburgh","address":"Castlehill, Edinburgh EH1 2NG, United Kingdom","latitude":55.9486,"longitude":-3.1999},
        {"name":"St Giles' Cathedral","city":"Edinburgh","address":"High Street, Edinburgh EH1 1RE, United Kingdom","latitude":55.9494,"longitude":-3.1905},
        {"name":"Scott Monument","city":"Edinburgh","address":"East Princes Street Gardens, Edinburgh EH2 2EJ, United Kingdom","latitude":55.9524,"longitude":-3.1934},
        {"name":"Palace of Holyroodhouse","city":"Edinburgh","address":"Canongate, Edinburgh EH8 8DX, United Kingdom","latitude":55.9527,"longitude":-3.1718},
        {"name":"Scottish National Gallery","city":"Edinburgh","address":"The Mound, Edinburgh EH2 2EL, United Kingdom","latitude":55.9509,"longitude":-3.1957},
        {"name":"Balmoral Hotel","city":"Edinburgh","address":"1 Princes Street, Edinburgh EH2 2EQ, United Kingdom","latitude":55.9530,"longitude":-3.1884},
        {"name":"McEwan Hall","city":"Edinburgh","address":"Teviot Place, Edinburgh EH1 1NE, United Kingdom","latitude":55.9462,"longitude":-3.1917},
        {"name":"National Museum of Scotland","city":"Edinburgh","address":"Chambers Street, Edinburgh EH1 1JF, United Kingdom","latitude":55.9469,"longitude":-3.1893},
        {"name":"St Mary's Cathedral, Edinburgh","city":"Edinburgh","address":"Palmerston Place, Edinburgh EH12 5AW, United Kingdom","latitude":55.9483,"longitude":-3.2149},
        {"name":"General Register House","city":"Edinburgh","address":"2 Princes Street, Edinburgh EH1 3YY, United Kingdom","latitude":55.9536,"longitude":-3.1887},
        {"name":"Royal Scottish Academy","city":"Edinburgh","address":"The Mound, Edinburgh EH2 2EL, United Kingdom","latitude":55.9517,"longitude":-3.1960},
        {"name":"Greyfriars Kirk","city":"Edinburgh","address":"Greyfriars Place, Edinburgh EH1 2QQ, United Kingdom","latitude":55.9470,"longitude":-3.1912},
        {"name":"Scottish Parliament Building","city":"Edinburgh","address":"Horse Wynd, Edinburgh EH99 1SP, United Kingdom","latitude":55.9516,"longitude":-3.1745},
        {"name":"Jenners Building","city":"Edinburgh","address":"47 Princes Street, Edinburgh EH2 2DG, United Kingdom","latitude":55.9534,"longitude":-3.1933},
        {"name":"St Andrew's House","city":"Edinburgh","address":"Regent Road, Edinburgh EH1 3DG, United Kingdom","latitude":55.9543,"longitude":-3.1829},
        {"name":"Usher Hall","city":"Edinburgh","address":"Lothian Road, Edinburgh EH1 2EA, United Kingdom","latitude":55.9473,"longitude":-3.2046},
    ],
    "bruges": [
        {"name":"Belfry of Bruges","city":"Bruges","address":"Markt 7, 8000 Brugge, Belgium","latitude":51.2082,"longitude":3.2247},
        {"name":"Church of Our Lady Bruges","city":"Bruges","address":"Mariastraat, 8000 Brugge, Belgium","latitude":51.2042,"longitude":3.2245},
        {"name":"Basilica of the Holy Blood","city":"Bruges","address":"Burg 13, 8000 Brugge, Belgium","latitude":51.2083,"longitude":3.2270},
        {"name":"Bruges City Hall","city":"Bruges","address":"Burg 12, 8000 Brugge, Belgium","latitude":51.2085,"longitude":3.2265},
        {"name":"Provinciaal Hof","city":"Bruges","address":"Markt 3, 8000 Brugge, Belgium","latitude":51.2088,"longitude":3.2240},
        {"name":"Sint-Salvatorskathedraal","city":"Bruges","address":"Sint-Salvatorskoorstraat 8, 8000 Brugge, Belgium","latitude":51.2062,"longitude":3.2218},
        {"name":"Gruuthusemuseum","city":"Bruges","address":"Dijver 17C, 8000 Brugge, Belgium","latitude":51.2044,"longitude":3.2258},
        {"name":"Jan Van Eyckplein Tolhuis","city":"Bruges","address":"Jan van Eyckplein, 8000 Brugge, Belgium","latitude":51.2120,"longitude":3.2265},
        {"name":"Concertgebouw Brugge","city":"Bruges","address":"'t Zand 34, 8000 Brugge, Belgium","latitude":51.2046,"longitude":3.2162},
        {"name":"Sint-Jakobskerk","city":"Bruges","address":"Sint-Jakobsplein, 8000 Brugge, Belgium","latitude":51.2107,"longitude":3.2222},
        {"name":"Hof Bladelin","city":"Bruges","address":"Naaldenstraat 19, 8000 Brugge, Belgium","latitude":51.2098,"longitude":3.2255},
        {"name":"Jeruzalemkerk","city":"Bruges","address":"Peperstraat 3, 8000 Brugge, Belgium","latitude":51.2127,"longitude":3.2310},
        {"name":"Brugse Vrije","city":"Bruges","address":"Burg 11A, 8000 Brugge, Belgium","latitude":51.2084,"longitude":3.2275},
        {"name":"Poortersloge","city":"Bruges","address":"Academiestraat 14, 8000 Brugge, Belgium","latitude":51.2112,"longitude":3.2268},
        {"name":"Sint-Annakerk","city":"Bruges","address":"Sint-Annaplein, 8000 Brugge, Belgium","latitude":51.2118,"longitude":3.2320},
        {"name":"Onze-Lieve-Vrouw ter Potterie","city":"Bruges","address":"Potterierei 79B, 8000 Brugge, Belgium","latitude":51.2168,"longitude":3.2337},
    ],
    "krakow": [
        {"name":"Wawel Castle","city":"Kraków","address":"Wawel 5, 31-001 Kraków, Poland","latitude":50.0540,"longitude":19.9354},
        {"name":"St. Mary's Basilica","city":"Kraków","address":"Plac Mariacki 5, 31-042 Kraków, Poland","latitude":50.0616,"longitude":19.9394},
        {"name":"Cloth Hall","city":"Kraków","address":"Rynek Główny 1/3, 31-042 Kraków, Poland","latitude":50.0617,"longitude":19.9373},
        {"name":"Wawel Cathedral","city":"Kraków","address":"Wawel 3, 31-001 Kraków, Poland","latitude":50.0543,"longitude":19.9352},
        {"name":"Collegium Maius","city":"Kraków","address":"Jagiellońska 15, 31-010 Kraków, Poland","latitude":50.0613,"longitude":19.9330},
        {"name":"Barbican of Kraków","city":"Kraków","address":"Basztowa, 30-547 Kraków, Poland","latitude":50.0654,"longitude":19.9416},
        {"name":"St. Peter and Paul Church","city":"Kraków","address":"Grodzka 52A, 31-044 Kraków, Poland","latitude":50.0573,"longitude":19.9383},
        {"name":"St. Andrew's Church, Kraków","city":"Kraków","address":"Grodzka 56, 31-044 Kraków, Poland","latitude":50.0570,"longitude":19.9381},
        {"name":"Town Hall Tower, Kraków","city":"Kraków","address":"Rynek Główny 1, 31-042 Kraków, Poland","latitude":50.0615,"longitude":19.9365},
        {"name":"Juliusz Słowacki Theatre","city":"Kraków","address":"Plac Świętego Ducha 1, 31-023 Kraków, Poland","latitude":50.0640,"longitude":19.9408},
        {"name":"National Museum in Kraków","city":"Kraków","address":"al. 3 Maja 1, 30-062 Kraków, Poland","latitude":50.0603,"longitude":19.9236},
        {"name":"Kraków Philharmonic","city":"Kraków","address":"Zwierzyniecka 1, 31-103 Kraków, Poland","latitude":50.0560,"longitude":19.9310},
        {"name":"Palace of Art, Kraków","city":"Kraków","address":"Plac Szczepański 4, 31-011 Kraków, Poland","latitude":50.0632,"longitude":19.9328},
        {"name":"Globe House","city":"Kraków","address":"Długa 1, 31-147 Kraków, Poland","latitude":50.0647,"longitude":19.9418},
        {"name":"Wyspiański Pavilion","city":"Kraków","address":"Plac Wszystkich Świętych 2, 31-004 Kraków, Poland","latitude":50.0587,"longitude":19.9337},
        {"name":"Old Synagogue, Kraków","city":"Kraków","address":"Szeroka 24, 31-053 Kraków, Poland","latitude":50.0514,"longitude":19.9459},
        {"name":"ICE Kraków Congress Centre","city":"Kraków","address":"Marii Konopnickiej 17, 30-302 Kraków, Poland","latitude":50.0478,"longitude":19.9337},
    ],
}

def search_image(query):
    url = "https://commons.wikimedia.org/w/api.php?" + urllib.parse.urlencode({
        "action":"query","generator":"search","gsrnamespace":"6",
        "gsrsearch":query,"gsrlimit":"5","prop":"imageinfo",
        "iiprop":"url|size|mime","iiurlwidth":"1280","format":"json"
    })
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read())
    except Exception as e:
        print(f"  API error: {e}")
        return None
    
    pages = data.get("query",{}).get("pages",{})
    if not pages:
        return None
    
    candidates = []
    for p in pages.values():
        title = p.get("title","").lower()
        if any(s in title for s in SKIP):
            continue
        ii = p.get("imageinfo",[])
        if not ii:
            continue
        info = ii[0]
        mime = info.get("mime","")
        if mime not in ("image/jpeg","image/png"):
            continue
        thumb = info.get("thumburl") or info.get("url")
        if not thumb:
            continue
        score = sum(1 for kw in PREFER if kw in title)
        candidates.append((score, thumb))
    
    candidates.sort(key=lambda x: -x[0])
    for _, url in candidates:
        # HEAD check
        try:
            req2 = urllib.request.Request(url, method="HEAD", headers={"User-Agent": UA})
            with urllib.request.urlopen(req2, timeout=10) as r:
                if r.status == 200:
                    return url
        except:
            continue
    return None

no_image = []
for city_slug, buildings in CITIES.items():
    print(f"\n=== {city_slug} ({len(buildings)} buildings) ===")
    for b in buildings:
        q = f"{b['name']} {b['city']} building exterior"
        print(f"  Searching: {b['name']}...")
        img = search_image(q)
        if not img:
            # retry simpler query
            time.sleep(2)
            img = search_image(b['name'])
        if img:
            b['image_url'] = img
            print(f"    ✓ found")
        else:
            b['image_url'] = ""
            no_image.append(f"{city_slug}/{b['name']}")
            print(f"    ✗ NO IMAGE")
        time.sleep(2)
    
    outpath = f"/home/openclaw/.openclaw/workspace/scripts/{city_slug}.json"
    with open(outpath, "w") as f:
        json.dump(buildings, f, indent=2, ensure_ascii=False)
    print(f"  Wrote {outpath}")

print(f"\n=== SUMMARY ===")
for city_slug, buildings in CITIES.items():
    print(f"{city_slug}: {len(buildings)} buildings")
if no_image:
    print(f"\nNo image found for: {', '.join(no_image)}")
else:
    print("All buildings have images!")
