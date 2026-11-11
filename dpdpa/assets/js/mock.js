/* SAFE DPDPA Compliance Studio — in-browser demo backend.
 * Used only while DPDPA_API_URL is empty in ../assets/config.js. Mirrors the Apps Script API,
 * stores data in this browser (localStorage) and simulates SAFE AI with rule-based answers.
 */
(function (root) {
  const S = (root.SAFE = root.SAFE || {});
  const KEY = 'safe-dpdpa-demo-v1';
  const now = () => new Date().toISOString();
  const tok = () => Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
  let mem = null;
  const sess = () => { const db = load(); db._sessions = db._sessions || {}; return db._sessions; };

  function seed() {
    const cid = 'cdemo1';
    const env = {
      legalName: 'Nimbus HealthTech Private Limited', cin: 'U72900KA2019PTC000000', address: 'Koramangala, Bengaluru 560034', website: 'nimbushealth.example',
      industry: 'Healthcare / hospitals / diagnostics', businessDesc: 'Runs a doctor-booking and teleconsultation app with partner diagnostic labs in Karnataka. Customers book appointments, share symptoms and receive e-prescriptions and lab reports.',
      employees: '51–200', principals: '1 lakh – 10 lakh', locations: 'Bengaluru, Mysuru', groupEntities: '',
      ownPurposes: true, processorForOthers: false, sdfNotified: 'no', thirdSchedule: 'none',
      principalTypes: ['Customers / users', 'Employees', 'Job applicants', 'Patients', 'Website / app visitors'],
      dataCategories: ['Name and contact details', 'Health or medical information', 'Financial / bank / card details', 'Online identifiers, cookies, device IDs', 'Employment and payroll records'],
      children: true, pwd: false, channels: ['Website forms', 'Mobile app', 'Call centre / phone', 'HR onboarding'], aiUse: true, marketing: true,
      systems: 'Nimbus app back-end – bookings and consultations – AWS Mumbai\nZoho CRM – customer support – cloud – India\nKeka – HR and payroll – cloud – India\nLab partner portal – reports exchange – cloud – India',
      usesProcessors: true, vendors: 'AWS, Zoho, Keka, Razorpay, Exotel (call centre), MoEngage (marketing)', sharesWithFiduciaries: true, crossBorder: true, countries: 'Singapore (MoEngage), USA (email service)', consentManager: false,
      regulators: ['NHA / ABDM'], certifications: ['ISO/IEC 27001'], existingDocs: ['privacy-notice', 'security-policy'], contactPerson: 'Priya Rao, Head – Compliance, privacy@nimbushealth.example', breaches12m: false
    };
    const resp = {};
    const ans = { 'GOV-01': 'partly', 'GOV-02': 'no', 'GOV-04': 'yes', 'MAP-01': 'partly', 'LAW-01': 'partly', 'NOT-01': 'yes', 'NOT-03': 'partly', 'CON-01': 'partly', 'CON-03': 'no', 'RIG-01': 'yes', 'RIG-04': 'partly', 'CHD-01': 'no', 'SEC-01': 'yes', 'SEC-02': 'yes', 'SEC-03': 'yes', 'BRE-01': 'no' };
    Object.keys(ans).forEach((k) => { resp[k] = { answer: ans[k], note: '', updatedAt: now(), by: 'Priya Rao (Nimbus HealthTech)' }; });
    resp['SEC-01'].note = 'ISO 27001 certified since 2023; certificate and Statement of Applicability attached.';
    resp['CHD-01'].note = 'Parents book appointments for children, but we do not verify that the person is the parent.';
    const audit = { id: 'ademo1', clientId: cid, ref: 'SAFE/DPDPA/2026/0001', type: 'initial', createdAt: now(), createdBy: 'admin@safelegal.org', stage: 'assessment', env, envSubmittedAt: now(), responses: resp,
      evidence: [{ id: 'edemo1', name: 'ISO27001-certificate-and-SoA.pdf', mime: 'application/pdf', size: 248000, controlIds: ['SEC-01'], text: 'ISO/IEC 27001:2022 certificate. Statement of Applicability covering access control, cryptography, logging and monitoring, backup, supplier relationships and incident management.', uploadedAt: now(), by: 'Priya Rao (Nimbus HealthTech)' }],
      findings: [], docs: [], reports: [], log: [{ at: now(), by: 'admin@safelegal.org', action: 'Audit opened' }], usage: { usd: 0, inr: 0, calls: 0, byTask: {} }, team: { lead: 'admin@safelegal.org' } };
    return {
      users: [
        { email: 'admin@safelegal.org', name: 'SAFE Admin', role: 'admin', active: true, pin: '123456', enrolment: 'KAR/0000/2005' },
        { email: 'advocate@safelegal.org', name: 'Assurance Advocate', role: 'advocate', active: true, pin: '123456', enrolment: 'KAR/0001/2015' }
      ],
      clients: [{ id: cid, name: 'Nimbus HealthTech', legalName: env.legalName, industry: env.industry, website: env.website, contacts: [{ name: 'Priya Rao', email: 'privacy@nimbushealth.example', role: 'Head – Compliance' }], portal: { id: 'demo-nimbus', enabled: true, pin: '123456' }, activeAuditId: audit.id, stage: 'assessment', createdAt: now(), certs: [], tier: 'mid' }],
      audits: { [audit.id]: audit }, certs: [], counters: { audit: 1, cert: 0 }, auditIndex: [{ id: audit.id, clientId: cid, ref: audit.ref, type: 'initial', createdAt: audit.createdAt }],
      settings: { safeTo: 'info@safelegal.org', safeCc: 'operations@safelegal.org', fromAddress: 'operations@safelegal.org', senderName: 'SAFE Legal Solutions', studioUrl: '', reminderDaysBefore: 60, reminderIntervalDays: 7, pulseGraceDays: 30, usdInr: 100, prices: { 'claude-sonnet-5-5': { in: 2, out: 10 }, 'claude-opus-5-5': { in: 4, out: 20 } }, budgets: { small: 3000, mid: 6000, large: 15000 }, budgetAlertPct: 80, requireIndependence: true, engineStandard: 'claude-sonnet-5-5', engineAudit: 'claude-opus-5-5', aiConnected: true, aiKeyHint: 'demo' },
      files: {}, mails: []
    };
  }
  // Always re-read, so several open tabs (console, portal) share one demo database.
  const load = () => { if (mem && mem._t === Date.now()) return mem; try { mem = JSON.parse(localStorage.getItem(KEY)); } catch (e) { mem = null; } if (!mem) { mem = seed(); save(); } mem._t = Date.now(); return mem; };
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(mem)); } catch (e) { console.warn('Demo storage full; older files are not kept.', e); mem.files = {}; try { localStorage.setItem(KEY, JSON.stringify(mem)); } catch (e2) { /* ignore */ } } };
  S.resetDemo = () => { localStorage.removeItem(KEY); mem = null; load(); };

  const client = (db, id) => { const c = db.clients.find((x) => x.id === id); if (!c) throw new Error('Client not found.'); return c; };
  const audit = (db, id) => { const a = db.audits[id]; if (!a) throw new Error('Audit not found.'); return a; };
  const log = (a, by, action) => { a.log = (a.log || []).concat([{ at: now(), by, action }]).slice(-500); };
  const mail = (db, to, subject) => { db.mails.unshift({ at: now(), to, subject }); db.mails = db.mails.slice(0, 50); };
  const pubUser = (u) => ({ email: u.email, name: u.name, role: u.role, active: u.active, enrolment: u.enrolment || '' });
  const pubCert = (x) => Object.assign({}, x, { status: x.status === 'valid' && S.today() > x.validUntil ? 'expired' : x.status });

  function applyPatch(a, patch, by, staff) {
    if (patch.env) a.env = Object.assign(a.env || {}, patch.env);
    if (patch.responses) {
      a.responses = a.responses || {};
      Object.keys(patch.responses).forEach((id) => {
        const r = patch.responses[id] || {}; const cur = a.responses[id] || {};
        ['answer', 'note', 'owner'].forEach((f) => { if (r[f] !== undefined) cur[f] = r[f]; });
        if (r.followups) cur.followups = r.followups;
        cur.updatedAt = now(); cur.by = by; a.responses[id] = cur;
      });
    }
    if (!staff) return;
    ['findings', 'docs', 'team', 'roleMemo', 'notes', 'scope', 'auditRunAt'].forEach((f) => { if (patch[f] !== undefined) a[f] = patch[f]; });
    [['findingUpdates', 'findings'], ['docUpdates', 'docs'], ['evidenceUpdates', 'evidence']].forEach(([u, arr]) => {
      const upd = patch[u]; if (!upd) return; a[arr] = a[arr] || [];
      Object.keys(upd).forEach((id) => { const row = a[arr].find((x) => x.id === id); if (row) Object.assign(row, upd[id]); else if (upd[id] && upd[id].id === id) a[arr].push(upd[id]); });
    });
    if (patch.stage && patch.stage !== a.stage) { log(a, by, 'Stage moved from ' + a.stage + ' to ' + patch.stage); a.stage = patch.stage; }
  }
  function addEvidence(db, a, req, by) {
    const ev = { id: 'e' + tok().slice(0, 10), fileId: 'f' + tok().slice(0, 10), name: req.name, mime: req.mime, size: req.size || Math.round((req.data || '').length * 0.75), controlIds: req.controlIds || [], text: (req.text || '').slice(0, 20000), uploadedAt: now(), by, note: req.note || '', source: req.source || 'upload' };
    if ((req.data || '').length < 400000) db.files[ev.fileId] = { name: ev.name, mime: ev.mime, data: req.data };
    a.evidence = (a.evidence || []).concat([ev]);
    log(a, by, 'Evidence uploaded: ' + ev.name);
    return ev;
  }
  function portalView(db, c) {
    const a = c.activeAuditId ? db.audits[c.activeAuditId] : null;
    const view = { client: { id: c.id, name: c.name, legalName: c.legalName, industry: c.industry, contacts: c.contacts || [], letterhead: c.letterhead || null }, certs: db.certs.filter((x) => x.clientId === c.id).map(pubCert), audit: null };
    if (a) {
      const budget = c.budgetInr || db.settings.budgets[c.tier || S.sizeTier(a.env)] || 0;
      view.audit = { id: a.id, ref: a.ref, type: a.type, stage: a.stage, createdAt: a.createdAt, env: a.env, responses: a.responses, roleMemo: a.roleMemo || null,
        evidence: (a.evidence || []).filter((e) => !e.deleted), findings: (a.reports || []).some((r) => r.kind === 'interim') ? a.findings : [],
        docs: (a.docs || []).filter((d) => d.status === 'approved' || d.status === 'issued' || d.requestedByClient), reports: a.reports || [],
        aiBudget: { usedInr: Math.round(a.usage.inr || 0), budgetInr: budget, blocked: budget > 0 && a.usage.inr >= budget } };
    }
    return view;
  }

  // ------------------------------------------------------------ simulated SAFE AI
  function meter(a, task, inTok, outTok, audit) {
    const p = audit ? { in: 4, out: 20 } : { in: 2, out: 10 };
    const usd = (inTok * p.in + outTok * p.out) / 1e6;
    a.usage.usd += usd; a.usage.inr = a.usage.usd * 100; a.usage.calls++; a.usage.byTask[task] = (a.usage.byTask[task] || 0) + usd;
  }
  const lc = (s) => String(s || '').toLowerCase();
  function simFollowups(a, req) {
    const out = [];
    (req.controls || []).forEach((c) => {
      const r = (a.responses || {})[c.id] || {};
      if (out.length >= 8 || !r.answer || r.answer === 'na' || (r.followups || []).length >= 2) return;
      if (r.answer === 'yes') out.push({ controlId: c.id, q: 'How does this work in practice for "' + c.t.toLowerCase() + '"? Who is responsible, and how often is it checked?', why: 'Tests whether the control operates, not just exists', evidence: c.ev });
      else if (r.answer === 'partly') out.push({ controlId: c.id, q: 'Which parts of "' + c.t.toLowerCase() + '" are in place today, and which parts are missing?', why: 'Pins down the exact gap', evidence: c.ev });
      else out.push({ controlId: c.id, q: 'Is there a plan to put "' + c.t.toLowerCase() + '" in place? Give the owner and the target date.', why: 'Confirms the remediation plan', evidence: 'Plan or management approval' });
    });
    return out;
  }
  function simReview(a, ev, ctrls) {
    const text = lc(ev.name + ' ' + (ev.text || '') + ' ' + (ev.note || ''));
    const per = {}; let best = 'rejected';
    ctrls.forEach((c) => {
      const words = lc(c.t + ' ' + c.ev).split(/[^a-z0-9]+/).filter((w) => w.length > 4);
      const hits = words.filter((w) => text.includes(w)).length;
      const v = hits >= 3 ? 'accepted' : hits >= 1 ? 'partial' : 'rejected';
      per[c.id] = { verdict: v, meets: v === 'rejected' ? '' : 'The document addresses ' + c.t.toLowerCase() + '.', gaps: v === 'accepted' ? '' : 'Evidence that the control operates in practice (records, logs or screenshots) is not shown.' };
      if (v === 'accepted' || (v === 'partial' && best === 'rejected')) best = v;
    });
    return { verdict: best, summary: 'SAFE AI read "' + ev.name + '". ' + (best === 'accepted' ? 'It supports the requirement(s) it was submitted for.' : best === 'partial' ? 'It covers the requirement in part.' : 'It does not show the requirement being met.'), perControl: per, gaps: Object.values(per).map((p) => p.gaps).filter(Boolean).slice(0, 3), confidence: best === 'accepted' ? 0.86 : 0.64, pointers: [], at: now(), by: 'SAFE AI' };
  }
  function simGrade(a, ctrls) {
    return ctrls.map((c) => {
      const r = (a.responses || {})[c.id];
      const st = S.preStatus(c, r, (a.evidence || []).filter((e) => !e.deleted)) || 'notmet';
      const evs = (a.evidence || []).filter((e) => !e.deleted && (e.controlIds || []).includes(c.id));
      const obs = st === 'conformity' ? 'The requirement is met. ' + (evs.length ? 'Evidence reviewed: ' + evs.map((e) => e.name).join(', ') + '.' : '')
        : st === 'partial' ? (r && r.answer === 'yes' ? 'The organisation states that this is in place, but ' + (evs.length ? 'the evidence submitted does not fully demonstrate it.' : 'no evidence was submitted to demonstrate it.') : 'The requirement is only partly met. ' + (r && r.note ? 'Client explanation: ' + r.note : ''))
        : st === 'na' ? 'Not applicable on the facts given.' : (r && r.answer === 'unsure' ? 'The organisation could not confirm that this is in place.' : 'The requirement is not met.') + (r && r.note ? ' ' + r.note : '');
      return { controlId: c.id, status: st, grade: S.floorGrade(c, st), observation: obs, risk: c.pen && c.pen !== 'none' ? S.PENALTIES[c.pen].label + '.' : 'Weakens the organisation\'s ability to demonstrate compliance.', recommendation: st === 'conformity' || st === 'na' ? '' : 'Put in place: ' + c.req.replace(/\.$/, '') + '. Keep as evidence: ' + c.ev, confidence: evs.some((e) => e.review) ? 0.9 : r && r.answer === 'yes' ? 0.62 : 0.82 };
    });
  }
  function simDraft(a, c, req) {
    const env = a.env || {}; const name = env.legalName || c.name;
    const lines = ['## Purpose and scope', '1.1 This document sets out how ' + name + ' (the "Company") meets its obligations under the Digital Personal Data Protection Act, 2023 and the Digital Personal Data Protection Rules, 2025 for ' + lc(req.doc.audience) + '.',
      '1.2 It applies to all personal data the Company processes in digital form, or collects offline and later digitises, in the course of: ' + (env.businessDesc || 'its business') + '.',
      '## Definitions', '2.1 Terms such as Data Principal, Data Fiduciary, Data Processor, personal data breach and Board have the meanings given in the Act.'];
    (req.controls || []).forEach((x) => { lines.push('## ' + x.t); lines.push('3.1 ' + x.req.replace(/^The organisation /, 'The Company ').replace(/^A /, 'The Company maintains a ')); lines.push('3.2 Responsibility: ??name and designation of the owner??. Records kept: ' + x.ev); });
    lines.push('## Contact', '9.1 Questions about this document may be sent to ' + (env.contactPerson || '??contact person and email??') + '.');
    lines.push('## Review', '10.1 This document is reviewed at least once a year and whenever the law or the Company\'s processing changes.');
    return lines.join('\n');
  }

  S.MOCK = (action, req) => {
    const db = load();
    let a, c, out;
    // ------------------------------------------------ public
    if (action === 'verify') {
      const x = db.certs.find((y) => y.no === req.no);
      return x ? { ok: true, cert: pubCert(x) } : { ok: false, error: 'No certificate with this number was issued by SAFE Legal Solutions.' };
    }
    // ------------------------------------------------ portal
    if (/^portal/.test(action)) {
      if (action === 'portalLogin') {
        c = db.clients.find((x) => x.portal && x.portal.id === req.portalId && x.portal.enabled);
        if (!c || c.portal.pin !== String(req.pin)) throw new Error('The link or PIN is not correct. (Demo: link c=demo-nimbus, PIN 123456)');
        const t = tok(); sess()[t] = c.id; save(); return { session: t, view: portalView(db, c) };
      }
      const cid = sess()[req.session]; if (!cid) throw new Error('AUTH: Your session has ended. Please sign in again.');
      c = client(db, cid); a = c.activeAuditId ? db.audits[c.activeAuditId] : null;
      const who = (req.who || 'Client user') + ' (' + c.name + ')';
      const editable = a && ['onboarding', 'environment', 'assessment', 'remediation'].includes(a.stage);
      switch (action) {
        case 'portalLogout': delete sess()[req.session]; save(); return true;
        case 'portalLoad': return portalView(db, c);
        case 'portalSave':
          if (!editable) throw new Error('Your answers are locked while SAFE completes the audit.');
          if (a.stage === 'onboarding') a.stage = 'environment';
          applyPatch(a, { env: ['environment', 'assessment', 'onboarding'].includes(a.stage) ? (req.patch || {}).env : undefined, responses: (req.patch || {}).responses }, who, false);
          c.stage = a.stage; save(); return portalView(db, c);
        case 'portalUpload': {
          if (!editable) throw new Error('Uploads are closed while SAFE completes the audit.');
          const ev = addEvidence(db, a, req, who); save(); return { evidenceId: ev.id, view: portalView(db, c) };
        }
        case 'portalSubmit':
          if (req.what === 'environment' && ['onboarding', 'environment'].includes(a.stage)) a.stage = 'assessment';
          else if (req.what === 'assessment' && a.stage === 'assessment') a.stage = 'audit';
          else if (req.what === 'remediation' && a.stage === 'remediation') { a.remediationSubmittedAt = now(); a.stage = 'signoff'; }
          else throw new Error('This step cannot be submitted now.');
          log(a, who, 'Client submitted: ' + req.what); mail(db, db.settings.safeTo, 'Client submitted ' + req.what); c.stage = a.stage; save(); return portalView(db, c);
        case 'portalFinding': {
          const f = (a.findings || []).find((x) => x.id === req.findingId); if (!f) throw new Error('Finding not found.');
          if (req.owner !== undefined) f.owner = req.owner; if (req.dueDate !== undefined) f.dueDate = req.dueDate;
          if (req.note || req.evidenceId) { f.remediation = (f.remediation || []).concat([{ at: now(), by: who, note: req.note || '', evidenceId: req.evidenceId || '' }]); if (f.state === 'open') f.state = 'submitted'; }
          save(); return portalView(db, c);
        }
        case 'portalPulse': {
          const x = db.certs.filter((y) => y.clientId === c.id && y.status !== 'revoked').slice(-1)[0]; if (!x) throw new Error('No certificate is in force.');
          x.pulses = (x.pulses || []).concat([{ at: now(), by: who, answers: req.answers }]);
          if (req.answers && req.answers.breach === 'yes' && x.status === 'valid') { x.status = 'suspended'; x.history.push({ at: now(), by: 'SAFE AI', action: 'suspend', reason: 'Breach reported in pulse check' }); }
          save(); return portalView(db, c);
        }
        case 'portalGetFile': { const f = db.files[req.fileId]; if (!f) throw new Error('In the demo, files larger than about 300 KB are not kept in the browser.'); return f; }
        case 'portalAi': return MOCK_AI(db, a, c, req, who, true);
        default: throw new Error('Unknown action.');
      }
    }
    // ------------------------------------------------ staff
    if (action === 'login') {
      const u = db.users.find((x) => x.email.toLowerCase() === String(req.email).toLowerCase() && x.active);
      if (!u || u.pin !== String(req.pin)) throw new Error('Email or PIN is not correct. (Demo: admin@safelegal.org / 123456)');
      const t = tok(); sess()[t] = u.email; save(); return { token: t, user: pubUser(u) };
    }
    const email = sess()[req.token]; if (!email) throw new Error('AUTH: Please sign in again.');
    const me = db.users.find((u) => u.email === email);
    switch (action) {
      case 'logout': delete sess()[req.token]; save(); return true;
      case 'changePin': me.pin = String(req.pin); save(); return true;
      case 'bootstrap': {
        const audits = {}; db.clients.forEach((x) => { if (x.activeAuditId && db.audits[x.activeAuditId]) audits[x.activeAuditId] = db.audits[x.activeAuditId]; });
        return { me: pubUser(me), clients: db.clients.map((x) => Object.assign({}, x, { portal: x.portal ? { id: x.portal.id, enabled: x.portal.enabled, hasPin: !!x.portal.pin } : null })), certs: db.certs.map(pubCert), auditIndex: db.auditIndex, users: db.users.map(pubUser), settings: db.settings, audits, mailErrors: [], demoMails: db.mails };
      }
      case 'saveClient': {
        const i = req.client || {}; c = i.id ? db.clients.find((x) => x.id === i.id) : null;
        if (!c) { c = { id: 'c' + tok().slice(0, 8), createdAt: now(), certs: [] }; db.clients.push(c); }
        ['name', 'legalName', 'industry', 'website', 'address', 'cin', 'tier', 'notes', 'contacts', 'budgetInr'].forEach((k) => { if (i[k] !== undefined) c[k] = i[k]; });
        save(); return c;
      }
      case 'setPortal': {
        c = client(db, req.clientId); c.portal = c.portal || { id: 'p' + tok().slice(0, 12) };
        c.portal.enabled = !!req.enabled; if (req.pin) c.portal.pin = String(req.pin); if (req.resetLink) c.portal.id = 'p' + tok().slice(0, 12);
        if (req.emailClient) mail(db, (c.contacts || []).map((x) => x.email).join(','), 'Portal invitation');
        save(); return { id: c.portal.id, enabled: c.portal.enabled, hasPin: !!c.portal.pin };
      }
      case 'uploadClientFile': {
        c = client(db, req.clientId); const fid = 'f' + tok().slice(0, 10);
        db.files[fid] = { name: req.name, mime: req.mime, data: req.data };
        c.letterhead = { kind: /wordprocessingml/.test(req.mime) ? 'docx' : 'image', fileId: fid, name: req.name, mime: req.mime, width: req.width, height: req.height, uploadedAt: now() };
        save(); return c.letterhead;
      }
      case 'getFile': { const f = db.files[req.fileId]; if (!f) throw new Error('In the demo, files larger than about 300 KB are not kept in the browser.'); return f; }
      case 'newAudit': {
        c = client(db, req.clientId); db.counters.audit++;
        const prev = req.carryForward && c.activeAuditId ? db.audits[c.activeAuditId] : null;
        a = { id: 'a' + tok().slice(0, 10), clientId: c.id, ref: S.auditRef(db.counters.audit), type: prev ? 'renewal' : 'initial', previousAuditId: prev ? prev.id : '', createdAt: now(), createdBy: me.email, stage: 'onboarding',
          env: prev ? JSON.parse(JSON.stringify(prev.env)) : { legalName: c.legalName || c.name, industry: c.industry || '', website: c.website || '' },
          responses: prev ? Object.fromEntries(Object.entries(prev.responses || {}).map(([k, v]) => [k, { answer: v.answer, note: v.note, carried: true }])) : {},
          evidence: [], findings: [], docs: prev ? (prev.docs || []).filter((d) => d.status === 'issued') : [], reports: [], log: [], usage: { usd: 0, inr: 0, calls: 0, byTask: {} }, team: { lead: me.email } };
        log(a, me.email, prev ? 'Renewal audit opened' : 'Audit opened');
        db.audits[a.id] = a; c.activeAuditId = a.id; c.stage = 'onboarding'; db.auditIndex.push({ id: a.id, clientId: c.id, ref: a.ref, type: a.type, createdAt: a.createdAt });
        save(); return a;
      }
      case 'getAudit': return audit(db, req.auditId);
      case 'saveAudit': a = audit(db, req.auditId); applyPatch(a, req.patch || {}, me.email, true); if (req.logNote) log(a, me.email, req.logNote); client(db, a.clientId).stage = a.stage; save(); return a;
      case 'uploadEvidence': { a = audit(db, req.auditId); const ev = addEvidence(db, a, req, me.email + ' (SAFE)'); save(); return { audit: a, evidenceId: ev.id }; }
      case 'deleteEvidence': a = audit(db, req.auditId); a.evidence.forEach((e) => { if (e.id === req.evidenceId) { e.deleted = true; e.controlIds = []; } }); save(); return a;
      case 'ai': a = audit(db, req.auditId); return MOCK_AI(db, a, client(db, a.clientId), req, me.email, false);
      case 'issueReport': {
        a = audit(db, req.auditId);
        const rep = { id: 'r' + tok().slice(0, 8), kind: req.kind, at: now(), by: me.email, opinion: req.opinion, score: req.score, counts: req.counts, summary: req.summary };
        if (req.docx && req.docx.length < 900000) { rep.htmlId = 'f' + tok().slice(0, 10); db.files[rep.htmlId] = { name: a.ref.replace(/\//g, '-') + ' ' + req.kind + ' report.docx', mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', data: req.docx }; }
        a.reports = (a.reports || []).concat([rep]);
        if (req.kind === 'interim' && a.stage === 'audit') a.stage = 'remediation';
        log(a, me.email, req.kind + ' report issued'); mail(db, 'client', req.kind + ' report issued');
        client(db, a.clientId).stage = a.stage; save(); return a;
      }
      case 'signOff': {
        if (me.role === 'member') throw new Error('Only an advocate or admin can sign the certificate.');
        a = audit(db, req.auditId); c = client(db, a.clientId);
        const blockers = S.certBlockers(a, db.settings.requireIndependence ? me.email : null);
        if (blockers.length) throw new Error(blockers[0]);
        db.counters.cert++;
        const d = S.certDates(S.today());
        const cert = { no: 'SAFE-DPDPA-' + d.issued.slice(0, 4) + '-' + String(db.counters.cert).padStart(5, '0'), clientId: c.id, auditId: a.id, auditRef: a.ref, clientName: a.env.legalName || c.name, scope: req.scope, role: req.role, opinion: req.opinion, score: req.score,
          issued: d.issued, validUntil: d.validUntil, nextAuditDue: d.nextAuditDue, signedBy: me.name, signerEmail: me.email, signerEnrolment: me.enrolment, status: 'valid', readiness: S.isReadinessPeriod(d.issued), history: [{ at: now(), by: me.email, action: 'issued' }], reminders: [], pulses: [], pulseDue: d.pulses };
        db.certs.push(cert); c.certs = (c.certs || []).concat([cert.no]);
        a.signoff = { by: me.email, at: now(), certNo: cert.no }; a.stage = 'certified'; c.stage = 'certified';
        log(a, me.email, 'Certificate ' + cert.no + ' issued'); mail(db, 'client', 'Certificate issued'); save();
        return { cert, audit: a };
      }
      case 'certAction': {
        const x = db.certs.find((y) => y.no === req.certNo); if (!x) throw new Error('Certificate not found.'); if (!req.reason) throw new Error('Give a reason.');
        x.status = { suspend: 'suspended', reinstate: 'valid', revoke: 'revoked' }[req.op]; x.history.push({ at: now(), by: me.email, action: req.op, reason: req.reason }); save(); return pubCert(x);
      }
      case 'saveSettings': { const s = Object.assign({}, req.settings || {}); delete s.aiKey; Object.assign(db.settings, s); if (req.settings && req.settings.aiKey) db.settings.aiKeyHint = '••••' + String(req.settings.aiKey).slice(-4); save(); return db.settings; }
      case 'testAi': return { reply: 'SAFE AI is connected. (demo)' };
      case 'saveUser': {
        const u = req.user || {}; let ex = db.users.find((x) => x.email === u.email);
        if (!ex) { ex = { email: u.email }; db.users.push(ex); }
        Object.assign(ex, { name: u.name, role: u.role, active: u.active !== false, enrolment: u.enrolment || '' }); if (u.pin) ex.pin = String(u.pin);
        save(); return db.users.map(pubUser);
      }
      case 'runReminders': {
        const done = [];
        db.certs.forEach((x) => { const days = S.daysBetween(S.today(), x.validUntil); if (days >= 0 && days <= 60) done.push(x.no + ': renewal reminder (' + days + ' days left)'); (x.pulseDue || []).forEach((p, i) => { if (S.today() >= p) done.push(x.no + ': pulse ' + (i + 1) + ' due'); }); });
        return done.length ? done : ['Nothing due today.'];
      }
      case 'sendTestEmail': mail(db, me.email, 'Test email'); save(); return true;
      default: throw new Error('Unknown action: ' + action);
    }
  };

  function MOCK_AI(db, a, c, req, by, portal) {
    if (!a) throw new Error('No audit is open yet.');
    let out;
    switch (req.task) {
      case 'roleMemo': {
        const f = S.applicability(a.env);
        out = { role: S.ROLE_LABEL(f), summary: (a.env.legalName || c.name) + ' decides why and how it processes personal data of its ' + (a.env.principalTypes || []).join(', ').toLowerCase() + ', so it is a ' + S.ROLE_LABEL(f) + ' under section 2(i) of the Act. ' + (f.health ? 'It handles health information, which raises the impact of any breach and calls for stronger safeguards. ' : '') + (f.children ? 'It processes data of children, so the verifiable parental consent and no-tracking rules in section 9 and Rule 10 apply. ' : '') + (f.crossBorder ? 'Personal data is stored or accessed abroad (' + (a.env.countries || '') + '); transfers must be checked against any restriction notified under section 16. ' : '') + 'Most obligations apply from 13 May 2027.',
          sdfAssessment: f.sdf ? 'Notified as a Significant Data Fiduciary.' : f.sdfLikely ? 'Designation as an SDF is possible given the volume and sensitivity of data; SAFE recommends preparing SDF controls.' : 'Designation as an SDF is unlikely on current facts.',
          thirdSchedule: f.thirdSchedule ? 'Third Schedule time limits apply.' : 'Third Schedule time limits do not apply.',
          keyRisks: ['Consent flows that do not meet section 6', f.children ? 'Children\'s data processed without verified parental consent' : 'Incomplete record of processing', 'No tested 72-hour breach intimation procedure', 'Vendor contracts without DPDPA clauses', 'Retention without a documented schedule'],
          priorityAreas: ['Notice and consent', 'Breach management', 'Processor contracts', 'Retention and erasure', 'Rights and grievance'], sectorOverlays: ['CERT-In Directions 2022'].concat(f.irdai ? ['IRDAI'] : [], f.rbi ? ['RBI'] : [], f.health ? ['ABDM (where integrated)'] : []), at: now() };
        a.roleMemo = out; meter(a, 'roleMemo', 2500, 700); break;
      }
      case 'followups': out = simFollowups(a, req); meter(a, 'followups', 4000, 600); break;
      case 'reviewEvidence': {
        const ev = (a.evidence || []).find((e) => e.id === req.evidenceId); if (!ev) throw new Error('Evidence not found.');
        out = simReview(a, ev, req.controls || []); ev.review = out; meter(a, 'reviewEvidence', 12000, 800); break;
      }
      case 'gradeDomain': out = simGrade(a, req.controls || []); meter(a, 'gradeDomain', 15000, 3000, true); break;
      case 'draftDoc': {
        const text = simDraft(a, c, req); a.docs = a.docs || [];
        let d = a.docs.find((x) => x.type === req.doc.id);
        if (!d) { d = { id: 'd' + tok().slice(0, 8), type: req.doc.id, title: req.doc.title, history: [] }; a.docs.push(d); }
        Object.assign(d, { content: text, status: 'draft', draftedAt: now(), draftedBy: 'SAFE AI', requestedBy: by, requestedByClient: portal, approvedBy: '', approvedAt: '' });
        d.history.push({ at: now(), by, action: 'Drafted by SAFE AI' });
        out = { text, docId: d.id }; meter(a, 'draftDoc', 6000, 5000); break;
      }
      case 'reportSummary': {
        const f = req.facts || {};
        out = { executiveSummary: (a.env.legalName || c.name) + ' scored ' + f.score + '% across ' + f.controlsAssessed + ' applicable DPDPA controls. The audit raised ' + f.major + ' Must-have, ' + f.minor + ' Should-have and ' + f.ofi + ' Might-have findings.\nThe areas needing most attention are ' + (f.weakestAreas || []).join(', ') + '. ' + (f.majorOpen ? 'Certification can follow once the open Must-have findings are fixed and verified.' : 'All Must-have requirements are met.'),
          strengths: (f.strongestAreas || []).map((x) => 'Good practice in ' + x), keyRisks: (f.topFindings || []).slice(0, 5), opinionText: '', nextSteps: ['Assign an owner and a target date to every open finding within 7 days', 'Close all Must-have findings within 30 days', 'Adopt the documents prepared during the engagement after board approval', 'Run a breach tabletop exercise before the next pulse check'] };
        meter(a, 'reportSummary', 8000, 1500, true); break;
      }
      case 'verifyRemediation': {
        const fd = (a.findings || []).find((x) => x.id === req.findingId); if (!fd) throw new Error('Finding not found.');
        const last = (fd.remediation || []).slice(-1)[0] || {};
        const ok = (last.note || '').length > 25 || !!last.evidenceId;
        out = { verdict: ok ? 'closed' : 'insufficient', reason: ok ? 'The proof submitted addresses the recommendation.' : 'Please describe what was done and upload proof.', remaining: ok ? '' : 'Proof of the corrective action', confidence: ok ? (last.evidenceId ? 0.88 : 0.7) : 0.8, at: now() };
        fd.verification = (fd.verification || []).concat([out]);
        if (out.verdict === 'closed' && out.confidence >= 0.75) { fd.state = 'closed'; fd.closedAt = now(); fd.closedBy = 'SAFE AI (verified)'; }
        else if (out.verdict === 'closed') { fd.state = 'submitted'; fd.needsReview = true; fd.reviewedBy = ''; }
        else fd.state = 'open';
        meter(a, 'verifyRemediation', 5000, 300); break;
      }
      case 'ask': out = { answer: 'In short: ' + (req.controlId && S.controlById(req.controlId) ? S.controlById(req.controlId).req : 'the DPDPA requires a lawful purpose, a clear notice, valid consent or a legitimate use, reasonable security safeguards, breach intimation, and erasure when the purpose is served.') + '\n\nThis is the SAFE AI demo. In live use SAFE AI answers your exact question with reference to the Act and the Rules.\n\nSAFE Legal\'s advocates will confirm this in your audit.' }; meter(a, 'ask', 2000, 400); break;
      default: throw new Error('Unknown SAFE AI task.');
    }
    log(a, by, 'SAFE AI: ' + req.task); save();
    return { result: out, audit: portal ? null : a, view: portal ? portalView(db, c) : null };
  }
})(typeof window !== 'undefined' ? window : globalThis);
