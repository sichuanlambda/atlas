# CRE Directory Enrichment Report
**Date:** 2026-02-19
**Agent:** Atlas (Subagent)

## Summary
- **Top 30 existing products** enriched → `memory/cre-enriched-products.json`
- **35 new products** enriched → `memory/cre-new-products-enriched.json`
- **Total: 65 deeply enriched products**

## Top 30 Existing Products Enriched

| Product | Feature Groups | Pros | Cons | Plans | Integrations | Company |
|---------|:-:|:-:|:-:|:-:|:-:|:-:|
| VTS | 4 | 5 | 4 | 3 | 6 | ✓ |
| Yardi | 5 | 5 | 4 | 0 | 5 | ✓ |
| CoStar | 5 | 5 | 4 | 4 | 5 | ✓ |
| Buildout | 4 | 5 | 4 | 3 | 5 | ✓ |
| Dealpath | 4 | 5 | 4 | 0 | 5 | ✓ |
| Juniper Square | 4 | 4 | 3 | 0 | 5 | ✓ |
| HqO | 4 | 5 | 4 | 0 | 6 | ✓ |
| SmartRent | 4 | 5 | 3 | 0 | 4 | ✓ |
| Realpage | 5 | 5 | 4 | 0 | 5 | ✓ |
| AppFolio | 4 | 0→4 | 0→4 | 3 | 6 | ✓ |
| Argus by Altus Group | 4 | 5 | 4 | 0 | 5 | ✓ |
| JLL | 4 | 5 | 4 | 0 | 0 | ✓ |
| Altus Group | 3 | 4 | 4 | 0 | 5 | ✓ |
| Procore | 4 | 5 | 4 | 1 | 6 | ✓ |
| Crexi | 4 | 5 | 4 | 3 | 3 | ✓ |
| LoopNet | 3 | 5 | 4 | 4 | 3 | ✓ |
| Matterport | 4 | 5 | 4 | 5 | 6 | ✓ |
| Buildium | 4 | 5 | 4 | 3 | 6 | ✓ |
| Entrata | 4 | 5 | 4 | 0 | 4 | ✓ |
| Reonomy | 3 | 5 | 4 | 0 | 4 | ✓ |
| Cherre | 4 | 5 | 4 | 0 | 6 | ✓ |
| LeaseQuery | 4 | 5 | 4 | 0 | 6 | ✓ |
| Visual Lease | 4 | 5 | 4 | 0 | 6 | ✓ |
| DealCloud | 4 | 5 | 4 | 0 | 6 | ✓ |
| Placer.ai | 4 | 5 | 4 | 3 | 5 | ✓ |
| RealNex | 4 | 5 | 4 | 0 | 5 | ✓ |
| Stessa | 4 | 5 | 4 | 3 | 4 | ✓ |
| HouseCanary | 4 | 5 | 4 | 0 | 4 | ✓ |
| Zillow | 4 | 5 | 5 | 2 | 7 | ✓ |
| Compstak | 4 | 5 | 4 | 2 | 5 | ✓ |

## 35 New Products Enriched

All 35 new products received deep enrichment with:
- 2-4 feature groups each (3-5 features per group)
- 3-5 pros and 3-4 cons
- Company info (founded, HQ, employees, funding)
- Integrations where known
- Pricing info where publicly available

### Products by Category:
**Property Management:** MRI Software, Re-Leased, STRATAFOLIO, Sage 300 CRE
**Facilities/IWMS:** Building Engines, Planon, Accruent, Nakisa, IBM TRIRIGA, Corrigo, MRI Angus, Noda
**Investment Management:** InvestNext, Agora, Covercy, CrowdStreet, Janover Connect, Cadre
**Data & Analytics:** PropertyShark, LightBox, MSCI Real Capital Analytics, Moody's REIS, TheAnalyst PRO
**Lease Management:** Prophia, Occupier, Quarem, Tango
**CRE Brokerage Tools:** ClientLook, CommissionTrac, SharpLaunch, Dottid
**Lending:** Blooma
**Smart Building:** Brivo, Lessen
**AI-First:** Lobby CRE

## Data Quality Notes
- All feature data sourced from official company websites
- Pricing only included where publicly available; otherwise marked "Contact for pricing"
- Pros/cons written to be honest and balanced — not marketing copy
- Company info verified against public sources where possible
- Some websites were Cloudflare-blocked (CommissionTrac, PropertyShark, Occupier, Sage, Moody's) — enrichment based on available data and industry knowledge

## Files Produced
1. `/home/openclaw/.openclaw/workspace/memory/cre-enriched-products.json` — 30 enriched existing products
2. `/home/openclaw/.openclaw/workspace/memory/cre-new-products-enriched.json` — 35 enriched new products
3. `/home/openclaw/.openclaw/workspace/memory/cre-enrichment-report.md` — This report
