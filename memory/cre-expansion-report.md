# CRE Software Directory Expansion Report
**Date:** 2026-02-19
**Prepared by:** Atlas (subagent)

## Summary
- **New products researched:** 35
- **Existing products in directory:** 174
- **Output file:** `memory/cre-new-products.json`

## New Products by Category Coverage

| Category | New Products |
|---|---|
| Lease Management | 11 |
| Facility Management | 11 |
| Investment & Valuation | 11 |
| Property Management | 9 |
| Asset Management | 9 |
| Accounting | 8 |
| Debt & Equity | 6 |
| Brokerage | 6 |
| Market Research | 5 |
| AI & Automation | 4 |
| CRM | 4 |
| Data & Analytics | 4 |
| Tenant Experience | 3 |
| Construction Management | 1 |
| Appraisal | 1 |

## Products Added

### Enterprise Platforms
1. **MRI Software** — Open and connected property management platform (45K+ clients, 170+ countries)
2. **IBM TRIRIGA** — Enterprise IWMS with AI/IoT capabilities
3. **Planon** — Market-leading smart building management (Gartner/Verdantix recognized)
4. **Accruent** — Facilities, asset, and lease management (Fortive company)
5. **Sage 300 CRE** — Construction and real estate accounting (formerly Timberline)

### Property & Building Operations
6. **Building Engines** — AI-powered CRE ops platform (JLL company, 6B+ sq ft)
7. **Re-Leased** — Cloud-based commercial property management (NZ-based)
8. **MRI Angus** — Building operations and tenant experience (IDC CSAT Award)
9. **Corrigo** — Enterprise CMMS by JLL Technologies
10. **Lessen** — Property maintenance at scale (280K+ properties, AI-powered)
11. **STRATAFOLIO** — Commercial property management for QuickBooks

### Lease Management & Abstraction
12. **Prophia** — AI-powered lease abstraction (493M+ sq ft processed)
13. **Dottid** — Leasing workflow management (SOC II compliant)
14. **Tango** — Real estate lifecycle management (corporate/retail)
15. **Nakisa** — AI-driven lease accounting (IFRS 16, ASC 842, GASB 87)
16. **Occupier** — Tenant-side lease and transaction management
17. **Quarem** — Corporate real estate and lease administration

### Investment & Syndication
18. **InvestNext** — Investment management platform for GPs
19. **Agora Real Estate** — Investment management with accounting services (4.8/5 G2, 900+ customers)
20. **Covercy** — Investment management with embedded banking
21. **Janover Connect** — Real estate syndication (formerly Groundbreaker, 52K+ investor network)
22. **CrowdStreet** — Private market real estate investing platform
23. **Cadre** — Private market real estate investment (now with Willow Wealth)

### AI & Lending
24. **Blooma** — AI-powered CRE lending intelligence platform
25. **Lobby CRE** — AI-powered deal management for top RE firms

### Brokerage & Marketing
26. **ClientLook (LightBox)** — CRE CRM for brokers
27. **CommissionTrac** — Commission management for CRE brokerages
28. **SharpLaunch** — Digital marketing platform for CRE
29. **TheAnalyst PRO** — CRE investment analysis and marketing

### Data & Market Research
30. **LightBox** — CRE data, analytics, and workflow platform
31. **PropertyShark** — Property data and analytics (Yardi company)
32. **MSCI Real Capital Analytics** — Global CRE transaction data
33. **Moody's REIS** — CRE market analytics and forecasting

### Smart Buildings & Sustainability
34. **Noda (formerly Aquicore)** — AI-powered building orchestration for energy/sustainability
35. **Brivo** — Cloud-based access control and security for CRE

## Methodology
- Extracted existing 174 product slugs from products.json to avoid duplicates
- Researched product websites directly via web_fetch (many review aggregator sites blocked by Cloudflare)
- Verified each product exists and is actively operating as of Feb 2026
- Gathered descriptions, company info, and features from official websites
- Left pricing fields empty when not publicly available (rather than guessing)
- Used Clearbit logo URLs for all products

## Notes for Integration
- Schema matches the existing products.json format with standard fields
- Some products span multiple categories (e.g., MRI Software covers property management, accounting, facility management)
- Several products have been acquired/rebranded: Aquicore → Noda, Groundbreaker → Janover Connect, ClientLook → LightBox
- Cadre is transitioning to Willow Wealth partnership
- Feature groups and detailed pricing plans are mostly empty—recommend enriching before publishing
- All products are marked `is_verified: false` for review before going live
