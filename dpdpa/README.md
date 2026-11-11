# SAFE DPDPA Compliance Studio

An AI-driven DPDPA assessment, audit and certification studio for SAFE Legal Solutions, inside SAFE Master Studio.

- **SAFE console** (`dpdpa/index.html`) — for the SAFE team. Covers clients, audits, SAFE AI audit runs, findings, document drafting, reports, advocate sign-off, certificates, settings and team.
- **Client portal** (`dpdpa/portal.html?c=<link id>`) — each client signs in with a link and a 6-digit PIN. Clients describe their organisation, answer the guided assessment, upload evidence, ask SAFE AI, fix findings, complete quarterly pulse checks and download their certificate.
- **Public verification page** (`dpdpa/verify.html?no=<certificate no.>`) — anyone can check whether a certificate is valid, suspended, revoked or expired. The QR code on the certificate points here.

Everything that users see is branded **SAFE AI**. The backend removes any vendor or model name from AI output.

---

## How an engagement runs

| Stage | Who | What happens |
|---|---|---|
| 1. Onboarding | SAFE | Add the client and contacts, upload their letterhead, create the portal link and PIN, and email the invitation. |
| 2. Environment assessment | Client | Covers the organisation, role, data categories, children's data, systems, vendors, transfers, regulators and existing documents. SAFE AI writes the **applicability memo**: role, SDF risk, Third Schedule, sector overlays and priority areas. |
| 3. DPDPA assessment | Client + SAFE AI | Only the controls that apply are asked (84 in the library, typically 55–70 per client). Each is mapped to the Act section or Rule, an ISO/IEC 27701 theme and a penalty bracket. SAFE AI asks adaptive follow-up questions per area and reads every evidence file (PDF, image, Word, text) against the requirement. |
| — Documents | SAFE AI + SAFE | Missing documents are drafted for the client's business and put on the client's letterhead. Examples: privacy notice, data protection policy, consent text, rights & grievance SOP, breach SOP, retention schedule, security policy, vendor DPA, employee notice, children's procedure, cookie notice, DPIA. An advocate approves each one, then it is issued and linked as evidence. |
| 4. SAFE AI audit | SAFE AI + SAFE | SAFE AI grades every control area by area. The engine's fixed rules then apply (below). Low-confidence findings go to an advocate review queue. |
| 5. Remediation | Client + SAFE AI | The **interim report** is issued on SAFE letterhead. The client assigns owners and dates, describes each fix and uploads proof. SAFE AI verifies it and closes it. Uncertain cases go to an advocate, who can accept or return the fix. |
| 6. Sign-off | SAFE advocate | The checklist must be clear: no open Must-have finding, score ≥ 70%, every control answered, every review done, interim report issued, and the **independence rule** met. The advocate then signs with one click. |
| 7. Certified | SAFE AI | The certificate is valid for 12 months and carries a QR verification code. Quarterly pulse checks follow; a reported breach suspends the certificate automatically. Renewal reminders start **60 days before expiry** and repeat weekly. The renewal audit carries last year's answers forward. |

### Grading (ISO 19011 aligned)

| Label | Audit grade | Rule |
|---|---|---|
| Must have | Major nonconformity | Statutory requirement not met, a critical requirement only partly met, or **3+ minor findings in one area** (systemic). Blocks certification. |
| Should have | Minor nonconformity | Isolated or partial lapse. Needs an owner and a target date. |
| Might have | Opportunity for improvement | Requirement met or good practice only. No corrective action is mandatory. |

SAFE AI can raise a grade but never lower it below the rule floor. A legal non-compliance is never recorded below Should have. An advocate can override a grade, but must record a reason, and the override is printed in the report.

**Score:** controls are weighted Must 3, Should 2, Might 1. A met control scores 100%, a partly met one 50%, and an unmet one 0%. Maturity levels run from 1 to 5 per area.

**Opinion:**
- *Not yet compliant* — any open Must-have finding, or score < 70%.
- *Compliant with observations* — open Should-have findings, or score < 85%.
- *Compliant* — otherwise.

### Reports and certificate
- **Audit report** — produced in Word (on SAFE letterhead, headings without collapse arrows) and as a print/PDF copy. It contains:
  - engagement details and executive summary
  - applicability, methodology and grading
  - data landscape and results by area
  - every finding with criteria, observation, evidence, risk, recommendation, owner and status
  - corrective action plan and documents prepared
  - opinion and basis of reliance
  - annexures: evidence index, control-by-control results and glossary
- **Certificate** — A4 landscape, showing the certificate number, scope, role, opinion, score, issue date, validity date, next audit date, the advocate's name and enrolment number, and the QR verification code. Before 13 May 2027 it is titled *Certificate of DPDPA Compliance Assessment* and states that it covers the obligations coming into force on that date.

---

## Set-up (about 20 minutes)

### 1. Backend (Google Apps Script)
1. Sign in as **safelegalsolutions@gmail.com** and go to <https://script.google.com>. Choose **New project** and name it **SAFE DPDPA Compliance Studio**.
2. Replace `Code.gs` with `dpdpa/apps-script/Code.gs` from this repo.
3. Open **Project Settings (gear)** and tick **Show "appsscript.json"**. Then replace that file's contents with `dpdpa/apps-script/appsscript.json`.
4. Select **setup** in the toolbar, click **Run** and approve the permissions (Drive, Gmail, external requests).
   - This creates the Drive folder **SAFE DPDPA Compliance Studio**, the first admin, and the daily 9 a.m. job that sends renewals, expiry notices and pulse checks.
   - **The log shows the first admin's PIN. Note it down.**
5. Go to **Deploy → New deployment → Web app**, with **Execute as: Me** and **Who has access: Anyone**. Copy the Web app URL.
   - After any later change to `Code.gs`, use **Deploy → Manage deployments → Edit → New version**, so the URL stays the same.

### 2. Connect the front end
In `assets/config.js` (Master Studio root), paste the Web app URL into `DPDPA_API_URL`. Check that `STUDIOS.dpdpaPublic` is the GitHub Pages address of the `dpdpa/` folder.

Until `DPDPA_API_URL` is set, the studio runs in **demo mode**: sample client Nimbus HealthTech, simulated SAFE AI, and data kept only in your browser.
- Console sign-in: `admin@safelegal.org` / `123456`, or `advocate@safelegal.org` / `123456` for the signing advocate.
- Portal: `portal.html?c=demo-nimbus`, PIN `123456`.

### 3. First sign-in and settings
1. Open `…/safe-master-studio/dpdpa/` and sign in with the admin email and PIN from the log. You will be asked to choose your own PIN.
2. In **Settings**, paste the **SAFE AI key**. This is the API key from SAFE's account at console.anthropic.com, which is the same account used by Policy Studio. Then click **Test SAFE AI**.
3. Check the email addresses. Reports and reminders are sent **from operations@safelegal.org** (a verified Gmail "Send mail as" alias), **to the client contacts**, with **info@safelegal.org** and **operations@safelegal.org** copied. Use **Send me a test email** to confirm.
4. Set the studio web address and the SAFE AI budgets per tier.
5. In **Team**, add the advocates with their **Bar enrolment numbers**, which are printed on certificates.

### 4. Publish
Commit the `dpdpa/` folder and the updated `index.html` and `assets/config.js` to `safelegalsolutions/safe-master-studio`. GitHub Pages serves the studio at `https://safelegalsolutions.github.io/safe-master-studio/dpdpa/`.

---

## Security and data protection
- Client data (answers, evidence, reports) is stored in SAFE's Google Drive. SAFE acts as the client's **Data Processor** for the audit, so cover this in the engagement letter.
- PINs are stored only as salted SHA-256 hashes. Sessions expire after 6–8 hours, and five failed attempts lock sign-in for 15 minutes.
- The SAFE AI key is held only in Script Properties and never reaches a browser.
- A client can only read its own audit and files. Findings become visible to the client only after the interim report is issued.
- Every action is written to the audit trail, and a daily backup of the database is kept in `_backups`.
- **Independence:** an advocate who approved documents drafted for a client cannot sign that client's certificate (Settings → Independence rule).

## Files
```
dpdpa/
├── index.html            SAFE console
├── portal.html           client portal
├── verify.html           public certificate verification
├── assets/
│   ├── dpdpa.css         studio styles (on top of ../assets/style.css)
│   ├── img/              SAFE logo, favicon, SAFE letterhead and footer
│   └── js/
│       ├── controls.js   84-control library (Act, Rules, ISO 27701, penalties, evidence, questions) and document types
│       ├── engine.js     environment questionnaire, applicability, grading, scoring, opinion, certificate rules, workflow
│       ├── report.js     audit report, client documents, certificate, print and Word output
│       ├── docxgen.js    Word generator (shared with Policy Studio)
│       ├── api.js        backend connection and file reading
│       ├── mock.js       demo backend and simulated SAFE AI
│       ├── ui.js         shared interface components
│       ├── console.js    SAFE console
│       └── portal.js     client portal
└── apps-script/
    ├── Code.gs           backend: storage, auth, portal, SAFE AI, metering, certificates, reminders, email
    └── appsscript.json   manifest
```
