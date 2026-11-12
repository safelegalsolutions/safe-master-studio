# SAFE Legal Workplace Compliance Audits

One studio in SAFE Master Studio for six law-firm compliance audits:

| Audit | Covers | Controls |
|---|---|---|
| **DPDPA Compliance** | Digital Personal Data Protection Act, 2023 and DPDP Rules, 2025 | 84 |
| **Labour Codes Compliance** | Code on Wages, IR Code, Social Security Code, OSH Code (in force 21 Nov 2025) and state labour laws | 56 |
| **POSH and DEI Compliance** | POSH Act, 2013; RPwD Act; Transgender Persons Act; equal pay; maternity; HIV and Mental Healthcare Acts; Board diversity | 40 |
| **Corporate Legal Compliance** | Applicable-law register, licences, Companies Act (legal), FEMA, anti-bribery, competition, consumer, PMLA, environment, IP | 41 |
| **Contract Compliance** | Authority, stamping, registration, e-signatures, key terms, restrictive covenants, DPAs, MSME and regulatory clauses | 34 |
| **AI Governance and Compliance** | DPDPA and AI, IT Rules 2026 on synthetic content (deepfake labelling, takedowns), CERT-In, consumer and dark-pattern rules, copyright, AI in HR, RBI FREE-AI, SEBI AI/ML responsibility, ICMR, MeitY India AI Governance Guidelines 2025, ISO/IEC 42001 | 55 |

A client can have several audits open at once. The organisation profile is answered once and copied into each new audit.

The pages are:
- **`audits/index.html`**: the SAFE console.
- **`audits/portal.html`**: the client portal (link + PIN). Clients switch between their audits there.
- **`audits/verify.html`**: the public certificate check.

The old `dpdpa/` links redirect to the new pages, so links already sent to clients still work.

## Signed reports

- Every interim and final audit report ends with **"For SAFE Legal Solutions"**, the Founder and Managing Partner's signature image, name and designation, and the date.
- An admin uploads the signature in **Settings → Signed audit reports**. It is stored privately in SAFE's Google Drive (not in this public repository) and only signed-in advocates and admins can fetch it.
- By default only **admins** can issue signed reports. Settings can extend this to advocates.
- Certificates are still signed by the advocate who does the final sign-off. An advocate who approved documents drafted for that client cannot sign them (independence rule).

## Updating from the DPDPA-only version

1. **GitHub.** Upload the `audits` folder, the `dpdpa` folder (now only redirect pages) and `index.html` to the repository. **Do not upload `assets/config.js`.** Your live copy holds the backend URL and keeps working unchanged.
2. **Apps Script.** In the existing project, replace `Code.gs` with `audits/apps-script/Code.gs`. Then go to **Deploy → Manage deployments → Edit (pencil) → Version: New version → Deploy**. The web app URL stays the same. Your Drive folder, team and settings are kept.
3. **Settings.** Sign in as admin and upload the signature image under **Signed audit reports**. Then change **Studio web address** to `https://safelegalsolutions.github.io/safe-master-studio/audits/`.

## Workflow (same for every audit)

Onboarding → environment assessment (client) → assessment and evidence (client + SAFE AI) → SAFE AI audit → interim report → remediation → advocate sign-off → certificate (12 months, quarterly pulse checks, renewal reminders from 60 days before expiry).

Grading follows ISO 19011:

| Grade | Audit term |
|---|---|
| Must have | Major nonconformity |
| Should have | Minor nonconformity |
| Might have | Opportunity for improvement |

A legal non-compliance is never graded below Should have. Three Should-haves in one area become a systemic Must-have.

Certificate numbers show the audit type, for example `SAFE-LABOUR-2026-00012`, `SAFE-POSHDEI-…`, `SAFE-CORP-…`, `SAFE-CONTRACT-…`, `SAFE-AI-…` and `SAFE-DPDPA-…`.

## First-time set-up (new installation)

1. Create an Apps Script project, paste `apps-script/Code.gs` and `appsscript.json`, and run `setup()`. The log shows the first admin's PIN.
2. Deploy it as a web app (Execute as: Me; Who has access: Anyone).
3. Put the web app URL in `assets/config.js` (`DPDPA_API_URL` or `AUDITS_API_URL`).
4. Sign in. Then:
   - Add the SAFE AI key.
   - Check the email settings and upload the report signature.
   - Add advocates with their enrolment numbers.

Until a URL is set, the studio runs in **demo mode**. Data stays in the browser and SAFE AI is simulated.
- Console sign-in: `admin@safelegal.org` / `123456` or `advocate@safelegal.org` / `123456`.
- Portal: `portal.html?c=demo-nimbus`, PIN `123456`.

## Files

```
audits/
├── index.html, portal.html, verify.html
├── assets/audits.css, assets/img/ (logo, SAFE letterhead and footer)
├── assets/js/
│   ├── frameworks.js      audit-type registry and shared organisation profile
│   ├── fw-dpdpa.js        DPDPA controls, documents, questionnaire, report wording
│   ├── fw-labour.js       Labour Codes
│   ├── fw-poshdei.js      POSH and DEI
│   ├── fw-corporate.js    Corporate legal compliance
│   ├── fw-contract.js     Contract compliance
│   ├── fw-ai.js           AI governance and compliance
│   ├── engine.js          applicability, grading, scoring, opinion, certificate rules, workflow
│   ├── report.js          audit report (with signature block), client documents, certificate
│   ├── docxgen.js         Word generator (no heading collapse arrows)
│   ├── api.js, mock.js    backend connection and demo backend
│   └── ui.js, console.js, portal.js
└── apps-script/Code.gs, appsscript.json
```
