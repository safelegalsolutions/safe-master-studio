# SAFE Master Studio

One home page for SAFE Legal's internal tools:

- **SAFE Policy Studio** — client policies and agreements (existing app, linked)
- **SAFE Invoice Studio** — retainer and case invoices (existing app, linked)
- **SAFE Marketing Studio** — prospects, email campaigns, automatic follow-ups, reply tracking, comments, tasks and dashboards (new)

The front end runs on **GitHub Pages**. Marketing Studio's data and email sending run on **Google Apps Script** under `safelegalsolutions@gmail.com`, with a **Google Sheet** as the database — the same set-up as Invoice Studio.

```
safe-master-studio/
├── index.html              Master Studio home (three studio buttons)
├── assets/
│   ├── config.js           ← paste your links and the Apps Script URL here
│   └── style.css           shared SAFE maroon styling
├── marketing/
│   ├── index.html          Marketing Studio
│   ├── app.js              screens and workflow
│   ├── marketing.css
│   └── mock.js             demo data (used only until the Apps Script URL is set)
└── apps-script/
    ├── Code.gs             backend: sheet database, Gmail sending, reply tracking, AI drafting
    └── appsscript.json     manifest (time zone, Gmail API, permissions)
```

Until you add the Apps Script URL, Marketing Studio opens in **demo mode** with sample data, so you can click through everything safely.

---

## Set-up (about 20 minutes)

### 1. Create the database and backend
1. Signed in as **safelegalsolutions@gmail.com**, create a Google Sheet named **SAFE Marketing Studio Data**.
2. In the sheet: **Extensions → Apps Script**.
3. Replace the contents of `Code.gs` with `apps-script/Code.gs` from this repo.
4. **Project Settings (gear) → tick "Show appsscript.json manifest file"**, open `appsscript.json` in the editor and replace it with `apps-script/appsscript.json`. This switches on the Gmail API and sets the time zone to IST.
5. Choose the function **setup** in the toolbar and click **Run**. Approve the permissions Google asks for. This creates the tabs (Contacts, Campaigns, Enrollments, Queue, Activity, Tasks, Users, Settings) and the timers that send emails every 15 minutes and check replies every 30 minutes.

### 2. Add the team
Open the **Users** tab of the sheet. Setup adds one admin row with PIN `1234` — **change it**. Add a row per team member: `name`, `email`, `pin`, `role` (`admin` or `member`), `active` (`yes`/`no`). Only admins see Settings.

### 3. Publish the backend
In Apps Script: **Deploy → New deployment → Select type: Web app**
- Execute as: **Me (safelegalsolutions@gmail.com)**
- Who has access: **Anyone** (needed so the GitHub page and the unsubscribe link can reach it; every studio action still needs a signed-in team member)

Copy the **Web app URL**. After any later change to `Code.gs`, use **Deploy → Manage deployments → Edit → New version** so the same URL keeps working.

### 4. Connect the front end
Edit `assets/config.js`:
- `MARKETING_API_URL`: the Web app URL from step 3
- `STUDIOS.invoice`: the Invoice Studio GitHub Pages link
- `STUDIOS.policy` is already set to `https://safelegalsolutions.github.io/safe-policy-studio/`

### 5. Put it on GitHub Pages
1. Create a repository **safe-master-studio** under the `safelegalsolutions` GitHub account and upload all files (keep the folder structure).
2. **Settings → Pages → Deploy from a branch → `main` / root**.
3. The studio will be at `https://safelegalsolutions.github.io/safe-master-studio/`.

### 6. First-time settings (Marketing Studio → Settings)
- Paste the **Claude API key** (stored in Apps Script's Script Properties, never shown again).
- Check the **signature**, **daily limit**, sending hours and days.
- Click **Send me a test email**.

### 7. Switching to a safelegal.org address (after Yukthi replies)
1. In Gmail (safelegalsolutions@gmail.com): **Settings → Accounts and Import → Send mail as → Add another email address** → `operations@safelegal.org`, using the SMTP server, port and encryption Yukthi confirms. Verify it with the code Gmail sends.
2. In Marketing Studio → Settings, set **From address** to `operations@safelegal.org` (and **Reply-to** if you want replies to go there). Replies sent to the alias are only tracked if they land in this Gmail inbox, so set Reply-to to safelegalsolutions@gmail.com or forward the alias's mail into it.

---

## How the workflow runs

1. **Contacts** — add one by one or **Import CSV** (columns: company, name, title, email, phone, website, segment, tags, source). Duplicates by email are skipped.
2. **Campaigns** — write Email 1 and any number of follow-ups, each sent *N days after the previous email if there is no reply*. Merge fields: `{{first_name}}`, `{{name}}`, `{{company}}`, `{{title}}`, `{{segment}}`. "Improve with AI" redrafts a step with Claude; "Personalise each email with Claude AI" rewrites every email for its recipient.
3. **Add contacts** to a campaign, then **Activate** it.
4. Every 15 minutes the backend queues each contact's next email when it falls due.
5. **Approvals** — review, edit, approve or reject queued emails (turn approval off per campaign for fully automatic sending).
6. Approved emails go out from Gmail within the sending hours and the daily limit, with the signature and an unsubscribe line. Follow-ups go **in the same email thread**.
7. Every 30 minutes the backend checks each thread:
   - **Reply** → follow-ups stop, the contact moves to *Replied*, the reply is logged with a rough label (interested / not interested / out of office / unsubscribe), and a "Respond to reply" task is created.
   - **Bounce** → contact marked bounced, sequence stops.
   - **Unsubscribe link** → contact marked unsubscribed and never emailed again.
8. **Pipeline** — drag companies through New → Contacted → Replied → Meeting → Proposal → Won / Lost / On hold.
9. **Comments and activity** — every contact has a team comment box and a full timeline (emails, replies, stage changes, tasks, comments).
10. **Dashboard** — contacts, emails sent, reply rate, meetings, approvals waiting, follow-ups due, weekly sent-vs-replies chart, stage funnel and per-campaign results.

Use **Run sending & reply check now** on the dashboard to trigger the timers immediately.

## Limits and good practice
- **Gmail sending limits:** a free Gmail account can send to roughly 100 recipients a day from scripts; Google Workspace allows far more. The default daily limit is 80.
- Open tracking (pixels) is not used — it is unreliable and intrusive. The studio tracks replies, bounces and unsubscribes.
- Keep outreach informational and within Bar Council of India rules on solicitation; honour every unsubscribe; contact data is personal data under the DPDP Act, so collect only business contact details and keep the sheet private.
- PINs sit in the Users tab of a private sheet; keep the sheet shared only with admins.
