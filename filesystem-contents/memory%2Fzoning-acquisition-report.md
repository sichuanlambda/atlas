# Zoning Data Acquisition Report
**Date:** 2026-02-17  
**Task:** Build zoning data acquisition system and download zoning data for major US cities

## System Built
- **Script:** `zoning-data/acquire.py` — Downloads zoning GeoJSON from ArcGIS REST services with pagination, saves to organized directory structure, updates `coverage.json` metadata
- **Features:** `--batch` mode for bulk download, `--test` for point-in-polygon lookup, automatic pagination handling

## Cities Successfully Acquired (10 total)

| City | State | Zones | File Size | Source |
|------|-------|------:|----------:|--------|
| Los Angeles | CA | 58,873 | 377.9 MB | City Planning ZIMAS |
| Austin | TX | 22,496 | 72.0 MB | City of Austin Open Data |
| Sacramento | CA | 10,930 | 31.4 MB | City of Sacramento |
| Tampa | FL | 10,813 | 27.4 MB | City of Tampa |
| Miami-Dade | FL | 4,011 | 8.5 MB | Miami-Dade County |
| Dallas | TX | 3,808 | 9.4 MB | Dallas City Hall GIS |
| Orlando | FL | 2,082 | 4.6 MB | City of Orlando |
| San Francisco | CA | 1,645 | 8.1 MB | SF Planning Dept |
| Fort Lauderdale | FL | 739 | 1.2 MB | City of Fort Lauderdale |
| Norman | OK | 4,446 | 25.3 MB | (pre-existing proof of concept) |

**Total: ~566 MB of zoning geodata, ~119,843 zoning polygons**

## Cities Not Acquired

### Available but skipped
- **San Antonio, TX** — Service found (COSA_Zoning, 733,496 features) but too large (~4+ GB estimated). URL: `https://services.arcgis.com/g1fRTDLeMgspWrYp/arcgis/rest/services/COSA_Zoning/FeatureServer/12`

### No public ArcGIS zoning service found
- **Houston, TX** — Houston famously has NO zoning ordinance (only major US city without one). Uses deed restrictions instead.
- **Fort Worth, TX** — No public ArcGIS zoning feature service discovered. May use a different GIS platform.
- **San Diego, CA** — County org has no city zoning layer. City may use a different platform (e.g., their own OpenData portal or PermitPlace).
- **San Jose, CA** — GIS server didn't respond to probes. May require VPN or use non-ArcGIS platform.
- **Jacksonville, FL** — COJ maps server didn't have accessible zoning layer.

## ArcGIS Service URLs (for future use)

```json
{
  "Dallas": "https://gis.dallascityhall.com/arcgis/rest/services/sdc_public/Zoning/MapServer/15",
  "Austin": "https://services.arcgis.com/0L95CJ0VTaxqcmED/arcgis/rest/services/PLANNINGCADASTRE_zoning_small_map_scale/FeatureServer/0",
  "San Antonio": "https://services.arcgis.com/g1fRTDLeMgspWrYp/arcgis/rest/services/COSA_Zoning/FeatureServer/12",
  "Los Angeles": "https://services5.arcgis.com/7nsPwEMP38bSkCjy/arcgis/rest/services/Zoning/FeatureServer/15",
  "San Francisco": "https://services.arcgis.com/Zs2aNLFN00jrS4gG/arcgis/rest/services/SF_Zoning_Districts/FeatureServer/0",
  "Sacramento": "https://services5.arcgis.com/54falWtcpty3V47Z/arcgis/rest/services/Zoning/FeatureServer/0",
  "Miami-Dade": "https://services.arcgis.com/8Pc9XBTAsYuxx9Ny/arcgis/rest/services/ZonepolyU_gdb/FeatureServer/0",
  "Orlando": "https://services5.arcgis.com/mMuoPCaIYD4wEgDl/arcgis/rest/services/OrlandoLUZoning/FeatureServer/0",
  "Tampa": "https://services.arcgis.com/apTfC6SUmnNfnxuF/arcgis/rest/services/Zoning/FeatureServer/0",
  "Fort Lauderdale": "https://services3.arcgis.com/0OPQIK59PJJqLK0A/arcgis/rest/services/FTL_Zoning_Districts/FeatureServer/0"
}
```

## Directory Structure
```
zoning-data/
├── acquire.py          # Acquisition script
├── batch.json          # Batch download config
├── coverage.json       # Metadata for all acquired cities
├── norman-ok/zoning.geojson
├── tx/
│   ├── dallas/zoning.geojson
│   └── austin/zoning.geojson
├── ca/
│   ├── los-angeles/zoning.geojson
│   ├── san-francisco/zoning.geojson
│   └── sacramento/zoning.geojson
└── fl/
    ├── miami-dade/zoning.geojson
    ├── orlando/zoning.geojson
    ├── tampa/zoning.geojson
    └── fort-lauderdale/zoning.geojson
```

## Notes
- ArcGIS org ID search via `arcgis.com/sharing/rest/search` was essential for discovering service URLs
- Layer numbering varies wildly — LA's zoning is layer 15, SA's is layer 12, most others are layer 0
- San Antonio's 733K features suggest parcel-level zoning (vs district-level). Could download with more time/disk.
- Web search (Brave API) was unavailable, so all discovery was done via direct URL probing and ArcGIS API searches
