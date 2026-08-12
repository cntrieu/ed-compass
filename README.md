# ED COMPASS: A Governed Digital Front Door for Emergency-Care Navigation

**Academic Prototype for University of Toronto — EMHI1001H Course**

> [!IMPORTANT]
> **ACADEMIC & SAFETY DISCLAIMER**: ED Compass is an academic prototype for demonstration purposes only. It is **NOT a production clinical system** and does **NOT provide medical diagnosis**, perform official CTAS emergency department triage, or replace 9-1-1, HealthLink BC 8-1-1, HEiDi, Emergency Care BC Real-Time Virtual Support (RTVS), emergency departments, urgent/primary care, public health, or registered nurses.
>
> All care handoffs display: **“Conceptual handoff only—no information has been transmitted.”**

---

## 1. Product Overview & Core Principle

ED Compass is a web-accessible digital front door inspired conceptually by the **BC HealthLink 8-1-1 model**. It helps patients navigate emergency care, understand urgency levels, identify warning signs, and connect with appropriate BC healthcare services.

### Central Safety Invariant:
# The patient's clinical urgency does not change because care is difficult to access.

Clinical urgency is strictly determined by the version-controlled, deterministic clinical rule engine (`src/clinical/engine.ts`). **Geography, travel time, clinic closures, language, or access barriers NEVER lower clinical acuity.** The Access & Service Matching Engine determines *HOW* the patient can realistically access that level of care without altering the recommended disposition.

---

## 2. System Architecture: 3 Shared AI Agents, Rule Engine & Access Engine

ED Compass enforces a **strict physical separation** between the conversational/agent layer, deterministic clinical rule engine, and access matching engine.

```
PATIENT WEB INTERFACE (English / French / Language Options / Plain Language Mode)
         ↓
AGENT 1 — SAFETY & INTAKE (Collects Facts, Language, & Interpreter Needs)
         ↓
CANONICAL STRUCTURED FACTS (Language-Independent)
         ↓
DETERMINISTIC CLINICAL RULE ENGINE (Owns Disposition & Rule ID)
         ↓
CLINICAL DISPOSITION (CALL_911_NOW, GO_TO_ED_NOW, SAME_DAY, 811, HOME)
         ↓
ACCESS & SERVICE MATCHING ENGINE (Capability Matching & Access Burden — Disposition Unchanged)
         ↓
AGENT 2 — CARE NAVIGATION & ACCESS EXPLANATION (Plain Language Care Plan & BC Options)
         ↓
PATIENT CARE PLAN (FNHA Virtual Doctor, Northern Health Virtual, 8-1-1, Local Facilities)
         ↓
AGENT 3 — FEEDBACK & QUALITY (Captures Comprehension, Barriers, & Equity Feedback)
         ↓
STAFF DASHBOARD & ACCESS/EQUITY ANALYTICS (Human Governance Review)
```

---

## 3. Integrated New Capabilities

### Feature A — Access-Aware Care Navigation
- **Post-Disposition Location**: Requested **AFTER** clinical disposition is assigned. Options include browser Geolocation API (with permission denial fallback), postal code prefix, community lookup (Smithers, Hazelton, Terrace, Prince George, Fort St. John, Remote Northern BC), or skip.
- **Access Burden Assessment**: Captures estimated travel time (<15m, 15-30m, 30-60m, 1-2h, >2h), reliable transportation, and access barriers (distance, weather, childcare, mobility, cost).
- **Clinical Capability Matching**: Matches required capabilities (`wound_assessment`, `physical_examination`, `emergency_resuscitation`, `primary_care_assessment`).
- **Hands-On vs Virtual Care Protection**: Hands-on exams (wounds, neurovascular checks, emergencies) **CANNOT** be replaced by virtual care. Virtual care is offered as a bridge/support or for eligible non-emergency primary care cases.
- **First Nations Service Opt-In & FNHA Virtual Doctor**: Patient opt-in ("Would you like me to include First Nations-specific health services..."). Integrates **FNHA First Nations Virtual Doctor of the Day** (1-855-344-3800, 7 days/week ~8:30am-4:30pm PT). Identity is NEVER inferred from geography.
- **Northern Health Virtual Clinic & HealthLink BC 8-1-1**: Integrates Northern Health Virtual Clinic (1-844-645-7811, 10am-10pm PT) for Northern BC, and province-wide HealthLink BC 8-1-1 (24/7 TTY 7-1-1, >130 languages).
- **Capability Badges & Verification**: Displays `VERIFIED`, `NOT_VERIFIED`, or `NOT_AVAILABLE` badges for wound assessment, tetanus vaccine, TIg, imaging, and primary care. "Call before travelling."

### Feature B — Multilingual & Communication Accessibility
- **Prominent Language Selector**: Supports English (`en`), French (`fr` static translations), "Other language" (with 8-1-1 translation pathway notice and call button), and "I need help communicating" (interpreter & TTY picker).
- **Canonical Structured Variables**: Clinical decision logic operates on canonical variables (`severeBreathingDifficulty = true`). Identical clinical facts produce **100% IDENTICAL dispositions** regardless of UI language.
- **Plain-Language Mode**: Optional "Use simpler words" toggle simplifies medical jargon without weakening urgency.
- **Emergency Message Library**: Canonical message keys (`CALL_911_NOW_TITLE`, `THUNDERCLAP_EMERGENCY`) rendered per locale.

---

## 4. How to Run the Application & Tests

### 1. Run Complete Automated Test Suite (50 Tests)
```bash
npx vitest run
```
*Executes all 50 unit & integration tests across clinical pathways, agent architecture, rust equivalence, access matching invariants, and multilingual safety.*

### 2. Launch Local Interactive Web Application
```bash
npm run dev
```
*Launches Vite dev server at `http://localhost:5174/` (or port 5173).*

### 3. Production Build Validation
```bash
npm run build
```
*Compiles TypeScript and creates optimized production bundle in `dist/`.*

---

## 5. Classroom Demonstration Scenarios (16 Demo Cases)

Select any of the **16 pre-configured academic demonstration cases** in the Demo Runner:
1. **DEMO A1 — Nail Through Running Shoe**: Plantar puncture through footwear 2h ago -> `SAME_DAY_CLINICAL_ASSESSMENT`.
2. **DEMO A2 — Unknown Tetanus History**: Puncture with unknown series -> Prompt assessment & TIg check.
3. **DEMO A3 — Nail Emergency**: Deep puncture with cold/pale foot -> Early emergency stop (`GO_TO_ED_NOW`).
4. **DEMO A4 — Rust Rule Equivalence Test**: Runs identical case with `rusty=true` vs `rusty=false` to prove zero decision weight.
5. **DEMO B1 — Thunderclap Headache**: Sudden onset in <1 min -> Early emergency stop (`HEADACHE-E01` -> `GO_TO_ED_NOW`).
6. **DEMO B2 — Lower-Risk Headache**: Usual migraine pattern -> `HOME_MONITOR_WITH_SAFETY_NET`.
7. **DEMO C1 — Fever with Confusion**: Fever + confusion -> `GO_TO_ED_NOW`.
8. **REMOTE DEMO 1 — Nail Puncture in Rural Northern BC**: Hazelton (>60m travel, limited transport, FNHA requested) -> `SAME_DAY_CLINICAL_ASSESSMENT` unchanged, in-person wound exam required, FNHA Doctor of Day as additional support.
9. **REMOTE DEMO 2 — Lower-Risk Fever in Northern Health**: Smithers region -> Virtual primary care appropriate, Northern Health Virtual Clinic & FNHA Virtual Doctor presented.
10. **REMOTE DEMO 3 — Emergency Headache >90 Mins From ED**: Thunderclap in remote BC -> `GO_TO_ED_NOW` immediate, virtual care NOT shown as replacement.
11. **LANGUAGE DEMO 1 — French Static UI**: Fever emergency in French -> identical canonical answers, same rule ID, same disposition, UI in French.
12. **LANGUAGE DEMO 2 — Other Language 8-1-1 Pathway**: Punjabi/Mandarin -> 8-1-1 translation pathway notice & call button, emergency actions visible.

---

## 6. Staff Dashboard Access & Equity Analytics

The **"Access & Equity Analytics"** section demonstrates that clinical appropriateness and healthcare accessibility are distinct concepts:
- **Synthetic Visualization Comparison**:
  - *Same-Day Clinical Assessment Recommended*
  - Urban demo patients able to follow: **92%**
  - Remote demo patients able to follow: **61%**
  - Clearly labelled: `SYNTHETIC DEMONSTRATION DATA — not real patient outcomes.`

---

## 7. Known Limitations & Future Requirements

- **Not Clinically Validated**: Prototype for demonstration purposes only.
- **Service Data Freshness**: Service hours and vaccine stock are prototype metadata and must be verified by phone.
- **No Automatic Identity Inference**: First Nations service options require explicit patient opt-in; identity is never inferred from reserve or postal code geography.
- **Privacy Minimization**: Geolocation is used solely for immediate access derivation; raw coordinates and exact addresses are never persisted.
- **Language Scope**: English and French static UI dictionaries are included; additional languages link to HealthLink BC 8-1-1 translation support (>130 languages). First Nations language support requires Nation-led partnership and clinical validation before production deployment.
