---
name: underwriting
description: "Commercial real estate (CRE) underwriting and investment analysis. Use when analyzing property acquisitions, running cash flow projections, calculating IRR/equity multiple/DSCR/cap rates, creating investment memos, or performing sensitivity analysis on real estate deals. Triggers on: property underwriting, deal analysis, investment memo, cap rate analysis, cash flow projection, debt service coverage, CRE acquisition analysis."
---

# CRE Underwriting Skill

Run full commercial real estate underwriting analysis with configurable market assumptions.

## Quick Start

1. Gather property details from user (address, property type, asking price, NOI, units/sqft)
2. Load market config from `references/` or use user-provided assumptions
3. Run the underwriting script:

```bash
python3 /home/openclaw/openclaw/skills/underwriting/scripts/underwrite.py --config /path/to/config.json
```

Or pipe JSON directly:

```bash
echo '{"property": {...}, "assumptions": {...}}' | python3 /home/openclaw/openclaw/skills/underwriting/scripts/underwrite.py
```

## Workflow

### 1. Collect Property Inputs

Required:
- `asking_price` — Purchase price ($)
- `noi` — Current Net Operating Income ($) OR gross income + expenses
- `property_type` — multifamily | office | industrial | retail
- `square_feet` or `units` — Size metric

Optional (enriches analysis):
- `address`, `year_built`, `occupancy`
- `in_place_rents`, `market_rents` (per unit or per sqft)
- `capital_expenditure` — Near-term capex budget

### 2. Apply Assumptions

The script uses a JSON config with these sections. See `references/market-configs.md` for examples.

```json
{
  "property": { "asking_price": 5000000, "noi": 400000, "property_type": "multifamily", "units": 40 },
  "assumptions": {
    "market": "Austin, TX",
    "cap_rate_market": 0.055,
    "rent_growth_pct": 0.03,
    "expense_growth_pct": 0.02,
    "vacancy_pct": 0.05,
    "exit_cap_rate": 0.06,
    "hold_period_years": 5,
    "capex_annual": 50000
  },
  "financing": {
    "ltv": 0.70,
    "interest_rate": 0.065,
    "loan_term_years": 10,
    "amortization_years": 30,
    "io_period_years": 0
  },
  "targets": {
    "min_irr": 0.15,
    "min_dscr": 1.25,
    "min_cash_on_cash": 0.08,
    "min_equity_multiple": 1.8
  }
}
```

### 3. Run Analysis

The script outputs a full investment memo to stdout (Markdown format). Sections:

- **Deal Summary** — Price, price/unit, price/sqft, going-in cap rate
- **Financing Summary** — Loan amount, debt service, LTV
- **Year-by-Year Cash Flow** — NOI, debt service, cash flow, DSCR, cash-on-cash
- **Return Metrics** — IRR, equity multiple, NPV, profit
- **Sensitivity Tables** — Cap rate × vacancy, IRR × rent growth × exit cap, DSCR × interest rate

### 4. Interpret Results

Present the memo to the user. Flag any metrics that miss targets (the script marks these with ⚠️). Offer to adjust assumptions and re-run.

## Key Formulas Reference

- **Cap Rate** = NOI / Purchase Price
- **DSCR** = NOI / Annual Debt Service
- **Debt Yield** = NOI / Loan Amount
- **Cash-on-Cash** = Pre-Tax Cash Flow / Total Equity
- **Equity Multiple** = Total Distributions / Total Equity
- **IRR** = Rate where NPV of all cash flows = 0 (uses Newton's method)

## Market Configs

See `references/market-configs.md` for ready-made configs:
- Multifamily in Austin, TX
- Office in New York, NY
- Industrial in Dallas, TX

Users should customize these for their specific market. Copy and modify.

## Customization Guide

To configure for a new market:

1. Copy the closest example config from `references/market-configs.md`
2. Update cap rates from recent comps (CoStar, CBRE reports)
3. Adjust rent growth to local forecast
4. Set expense ratio for property type (typically 30-50% for multifamily, 40-55% for office)
5. Set exit cap rate (typically 25-75bps above going-in for conservative underwriting)
6. Save as JSON and pass to the script via `--config`
