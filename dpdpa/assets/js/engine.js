/* SAFE DPDPA Compliance Studio — audit engine
 * Environment questionnaire, applicability, ISO 19011-style grading, scoring, maturity,
 * opinion, certificate rules and workflow stages. Shared by the SAFE console and the client portal.
 */
(function (root) {
  const S = (root.SAFE = root.SAFE || {});

  // ---------------------------------------------------------------- helpers
  S.esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  S.today = () => new Date().toISOString().slice(0, 10);
  S.fmtDate = (iso) => {
    if (!iso) return '';
    const d = new Date(String(iso).length === 10 ? iso + 'T00:00:00' : iso);
    if (isNaN(d)) return String(iso);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  };
  S.addMonths = (iso, n) => { const d = new Date(iso + 'T00:00:00Z'); d.setUTCMonth(d.getUTCMonth() + n); return d.toISOString().slice(0, 10); };
  S.addDays = (iso, n) => { const d = new Date(iso + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
  S.daysBetween = (a, b) => Math.round((new Date(b + 'T00:00:00Z') - new Date(a + 'T00:00:00Z')) / 86400000);
  S.uid = (p) => (p || 'x') + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  S.inr = (n) => '₹' + Math.round(n || 0).toLocaleString('en-IN');

  // ---------------------------------------------------------------- environment questionnaire (Stage 1)
  const opt = (arr) => arr.map((v) => (Array.isArray(v) ? { v: v[0], l: v[1] } : { v, l: v }));
  S.INDUSTRIES = ['Banking / NBFC / payments (RBI-regulated)', 'Securities / broking / asset management (SEBI-regulated)', 'Insurance / insurance broking (IRDAI-regulated)', 'Healthcare / hospitals / diagnostics', 'Pharma / life sciences', 'Education / EdTech', 'E-commerce / marketplace', 'Online gaming', 'Social media / content platform', 'IT / software / SaaS', 'IT-enabled services / BPO / call centre', 'Telecom / internet services', 'Manufacturing', 'Retail / consumer goods', 'Real estate / construction', 'Travel / hospitality', 'Logistics / mobility', 'Media / advertising / marketing', 'HR / staffing / recruitment', 'Professional services (legal, accounting, consulting)', 'Wellness / fitness / beauty', 'Energy / utilities', 'Agriculture / agri-tech', 'Space / defence / R&D', 'Non-profit / trust / society', 'Government contractor / PSU', 'Other'];

  S.ENV_SECTIONS = [
    { id: 'org', title: 'About the organisation', fields: [
      { k: 'legalName', l: 'Legal name of the entity', t: 'text', req: true },
      { k: 'cin', l: 'CIN / LLPIN / registration number', t: 'text' },
      { k: 'address', l: 'Registered office address', t: 'textarea' },
      { k: 'website', l: 'Website / app names', t: 'text' },
      { k: 'industry', l: 'Industry', t: 'select', o: opt(S.INDUSTRIES), req: true },
      { k: 'businessDesc', l: 'Describe what the business does and who its customers are', t: 'textarea', req: true, help: 'Two or three sentences. SAFE AI uses this to tailor every question and draft.' },
      { k: 'employees', l: 'Number of employees and contractors', t: 'select', o: opt(['1–50', '51–200', '201–500', '501–2,000', 'Over 2,000']), req: true },
      { k: 'principals', l: 'Approximate number of individuals whose personal data you hold (customers, users, patients, staff)', t: 'select', o: opt(['Under 10,000', '10,000 – 1 lakh', '1 lakh – 10 lakh', '10 lakh – 1 crore', '1 crore – 2 crore', 'Over 2 crore']), req: true },
      { k: 'locations', l: 'Offices and operating locations (states / countries)', t: 'text' },
      { k: 'groupEntities', l: 'Group companies that share personal data with you', t: 'text' }
    ] },
    { id: 'role', title: 'Your role under the DPDPA', fields: [
      { k: 'ownPurposes', l: 'Do you decide why and how personal data is processed (for your own customers, users or staff)?', t: 'bool', req: true, help: 'If yes, you are a Data Fiduciary.' },
      { k: 'processorForOthers', l: 'Do you also process personal data on behalf of other businesses (as a service provider)?', t: 'bool', req: true, help: 'If yes, you are also a Data Processor for those clients.' },
      { k: 'sdfNotified', l: 'Has the Central Government notified you as a Significant Data Fiduciary?', t: 'select', o: opt([['no', 'No'], ['yes', 'Yes'], ['unsure', 'Not sure']]), req: true },
      { k: 'thirdSchedule', l: 'Are you any of these large platforms in India?', t: 'select', o: opt([['none', 'None of these'], ['ecom', 'E-commerce entity with 2 crore or more registered users'], ['gaming', 'Online gaming intermediary with 50 lakh or more users'], ['social', 'Social media intermediary with 2 crore or more users']]), req: true }
    ] },
    { id: 'data', title: 'Personal data you handle', fields: [
      { k: 'principalTypes', l: 'Whose personal data do you handle?', t: 'multi', o: opt(['Customers / users', 'Employees', 'Job applicants', 'Contractors / consultants', 'Vendors\' staff', 'Patients', 'Students', 'Visitors (CCTV, registers)', 'Website / app visitors', 'Leads / prospects']), req: true },
      { k: 'dataCategories', l: 'What kinds of personal data?', t: 'multi', o: opt(['Name and contact details', 'Government IDs (Aadhaar, PAN, passport)', 'Financial / bank / card details', 'Health or medical information', 'Biometrics (fingerprint, face)', 'Precise location', 'Photos / video / CCTV', 'Online identifiers, cookies, device IDs', 'Employment and payroll records', 'Education records', 'Insurance policy / claim data', 'Credit / KYC information', 'Call recordings']), req: true },
      { k: 'children', l: 'Do you process personal data of anyone under 18?', t: 'bool', req: true },
      { k: 'pwd', l: 'Do you process personal data of persons with disability who act through a lawful guardian?', t: 'bool' },
      { k: 'channels', l: 'How do you collect personal data?', t: 'multi', o: opt(['Website forms', 'Mobile app', 'Paper forms', 'Call centre / phone', 'Email / WhatsApp', 'Partners / referrals', 'Purchased or third-party lists', 'Walk-in / branch / clinic', 'HR onboarding']) },
      { k: 'aiUse', l: 'Do you use AI, automated scoring or profiling on personal data?', t: 'bool' },
      { k: 'marketing', l: 'Do you send marketing to individuals (email, SMS, WhatsApp, ads)?', t: 'bool' }
    ] },
    { id: 'systems', title: 'Systems, vendors and transfers', fields: [
      { k: 'systems', l: 'Main systems holding personal data (name, purpose, cloud/on-premise, where hosted)', t: 'textarea', req: true, help: 'For example: Zoho CRM – sales leads – cloud – India; Keka – HR & payroll – cloud – India; AWS – app back-end – Mumbai.' },
      { k: 'usesProcessors', l: 'Do vendors process personal data for you (cloud, payroll, CRM, call centre, marketing, IT support)?', t: 'bool', req: true },
      { k: 'vendors', l: 'List the key vendors', t: 'textarea' },
      { k: 'sharesWithFiduciaries', l: 'Do you share personal data with other companies that use it for their own purposes (insurers, lenders, partners)?', t: 'bool' },
      { k: 'crossBorder', l: 'Is personal data stored in or accessed from outside India?', t: 'bool', req: true },
      { k: 'countries', l: 'Which countries?', t: 'text' },
      { k: 'consentManager', l: 'Do you use, or plan to use, a registered Consent Manager?', t: 'bool' }
    ] },
    { id: 'reg', title: 'Regulators and existing compliance', fields: [
      { k: 'regulators', l: 'Sector regulators that supervise you', t: 'multi', o: opt(['RBI', 'SEBI', 'IRDAI', 'PFRDA', 'TRAI / DoT', 'NHA / ABDM', 'CDSCO', 'None']) },
      { k: 'certifications', l: 'Certifications or reports you hold', t: 'multi', o: opt(['ISO/IEC 27001', 'ISO/IEC 27701', 'SOC 2', 'PCI DSS', 'None']) },
      { k: 'existingDocs', l: 'Which of these documents do you already have?', t: 'multi', o: opt([['privacy-notice', 'Privacy notice / privacy policy on website'], ['dp-policy', 'Internal data protection policy'], ['consent-notice', 'Consent forms / consent text'], ['rights-sop', 'Rights request and grievance procedure'], ['breach-sop', 'Data breach response procedure'], ['retention', 'Data retention schedule'], ['security-policy', 'Information security policy'], ['dpa', 'Data processing agreements with vendors'], ['employee-notice', 'Employee privacy notice'], ['cookie-notice', 'Cookie notice'], ['child-procedure', 'Parental consent procedure'], ['dpia', 'DPIA']]), help: 'SAFE AI drafts the ones you do not have.' },
      { k: 'contactPerson', l: 'Data protection contact person (name, designation, email)', t: 'text', req: true },
      { k: 'breaches12m', l: 'Any personal data breaches or cyber incidents in the last 12 months?', t: 'bool' },
      { k: 'breachDetail', l: 'If yes, describe briefly', t: 'textarea' }
    ] }
  ];
  S.ENV_FIELDS = S.ENV_SECTIONS.flatMap((s) => s.fields);

  S.envCompleteness = (env) => {
    env = env || {};
    const req = S.ENV_FIELDS.filter((f) => f.req);
    const done = req.filter((f) => {
      const v = env[f.k];
      return f.t === 'bool' ? v === true || v === false : f.t === 'multi' ? Array.isArray(v) && v.length : v != null && String(v).trim() !== '';
    });
    return { done: done.length, total: req.length, missing: req.filter((f) => !done.includes(f)).map((f) => f.l) };
  };

  // ---------------------------------------------------------------- applicability
  S.applicability = (env) => {
    env = env || {};
    const has = (k, v) => Array.isArray(env[k]) && env[k].includes(v);
    const ind = String(env.industry || '');
    const bigPrincipals = ['1 crore – 2 crore', 'Over 2 crore'].includes(env.principals);
    const sensitive = has('dataCategories', 'Health or medical information') || has('dataCategories', 'Biometrics (fingerprint, face)') || has('dataCategories', 'Financial / bank / card details') || has('dataCategories', 'Credit / KYC information');
    const f = {
      fiduciary: env.ownPurposes !== false,
      processor: env.processorForOthers === true,
      employees: has('principalTypes', 'Employees') || has('principalTypes', 'Job applicants'),
      children: env.children === true || has('principalTypes', 'Students'),
      pwd: env.pwd === true,
      processors: env.usesProcessors !== false,
      sharing: env.sharesWithFiduciaries === true,
      crossBorder: env.crossBorder === true,
      cms: env.consentManager === true,
      ai: env.aiUse === true,
      web: has('channels', 'Website forms') || has('channels', 'Mobile app') || has('principalTypes', 'Website / app visitors') || !!env.website,
      thirdSchedule: !!env.thirdSchedule && env.thirdSchedule !== 'none',
      sdf: env.sdfNotified === 'yes',
      sdfLikely: env.sdfNotified !== 'yes' && (env.sdfNotified === 'unsure' || bigPrincipals || (sensitive && ['10 lakh – 1 crore', '1 crore – 2 crore', 'Over 2 crore'].includes(env.principals))),
      it: true, // every body corporate is covered by the CERT-In Directions
      rbi: has('regulators', 'RBI') || /RBI/.test(ind),
      sebi: has('regulators', 'SEBI') || /SEBI/.test(ind),
      irdai: has('regulators', 'IRDAI') || /IRDAI/.test(ind),
      health: has('dataCategories', 'Health or medical information') || /Health|Pharma/.test(ind)
    };
    return f;
  };

  S.ROLE_LABEL = (f) => {
    const r = [];
    if (f.fiduciary) r.push(f.sdf ? 'Significant Data Fiduciary' : 'Data Fiduciary');
    if (f.processor) r.push('Data Processor (for clients)');
    return r.join(' and ') || 'Data Processor';
  };

  S.applicableControls = (audit) => {
    const f = S.applicability(audit.env);
    return S.CONTROLS.filter((c) => {
      if (!f.fiduciary && c.id !== 'PRO-05' && c.d !== 'SEC' && c.d !== 'SEC2' && c.d !== 'BRE') return false;
      return !c.when || f[c.when];
    });
  };

  S.missingDocs = (audit) => {
    const f = S.applicability(audit.env);
    const have = (audit.env && audit.env.existingDocs) || [];
    return S.DOC_TYPES.filter((d) => (!d.when || f[d.when]) && !have.includes(d.id));
  };

  // ---------------------------------------------------------------- grading (ISO 19011 aligned)
  S.GRADES = {
    major: { label: 'Major nonconformity', short: 'Must have', cls: 'red', rank: 3 },
    minor: { label: 'Minor nonconformity', short: 'Should have', cls: 'amber', rank: 2 },
    ofi: { label: 'Opportunity for improvement', short: 'Might have', cls: 'blue', rank: 1 },
    conformity: { label: 'Conformity', short: 'Compliant', cls: 'green', rank: 0 },
    na: { label: 'Not applicable', short: 'N/A', cls: '', rank: -1 }
  };
  S.STATUS_LABEL = { conformity: 'Met', partial: 'Partly met', notmet: 'Not met', na: 'Not applicable' };
  S.PRI_LABEL = { M: 'Must have', S: 'Should have', W: 'Might have' };

  /** The minimum grade the rules allow for a control in a given status. */
  S.floorGrade = (c, status) => {
    if (status === 'na') return 'na';
    if (status === 'conformity') return 'conformity';
    if (status === 'notmet') return c.pri === 'M' ? 'major' : c.pri === 'S' ? 'minor' : 'ofi';
    // partial
    if (c.crit) return 'major';
    if (c.pri === 'M') return 'minor';
    if (c.pri === 'S') return c.stat ? 'minor' : 'ofi';
    return 'ofi';
  };

  /** Combines the rule floor with SAFE AI's suggestion: the AI can escalate, never downgrade. */
  S.gradeFor = (c, status, aiGrade) => {
    const floor = S.floorGrade(c, status);
    if (!aiGrade || !S.GRADES[aiGrade] || floor === 'na' || floor === 'conformity') return floor;
    return S.GRADES[aiGrade].rank > S.GRADES[floor].rank ? aiGrade : floor;
  };

  /** Heuristic status from the client's answer and evidence (used before and alongside SAFE AI). */
  S.preStatus = (c, resp, evidence) => {
    if (!resp || !resp.answer) return null;
    if (resp.answer === 'na') return 'na';
    if (resp.answer === 'no' || resp.answer === 'unsure') return 'notmet';
    if (resp.answer === 'partly') return 'partial';
    const ev = (evidence || []).filter((e) => (e.controlIds || []).includes(c.id));
    if (!ev.length) return c.pri === 'W' ? 'conformity' : 'partial'; // "yes" without evidence
    if (ev.some((e) => e.review && e.review.verdict === 'accepted')) return 'conformity';
    if (ev.some((e) => e.review && e.review.verdict === 'rejected') && !ev.some((e) => e.review && e.review.verdict !== 'rejected')) return 'notmet';
    return 'partial';
  };

  S.findingFor = (audit, controlId) => (audit.findings || []).find((f) => f.controlId === controlId && !f.systemic);

  /** Systemic rule: three or more open minor findings in one domain are raised as one major. */
  S.systemicFindings = (audit) => {
    const out = [];
    S.DOMAINS.forEach((d) => {
      const minors = (audit.findings || []).filter((f) => !f.systemic && f.grade === 'minor' && f.state !== 'closed' && (S.controlById(f.controlId) || {}).d === d.id);
      if (minors.length >= 3) {
        out.push({ id: 'SYS-' + d.id, systemic: true, controlId: '', domain: d.id, grade: 'major', state: 'open',
          title: 'Systemic weakness — ' + d.name,
          observation: minors.length + ' minor nonconformities in this area point to a systemic gap rather than isolated lapses (' + minors.map((m) => m.controlId).join(', ') + ').',
          recommendation: 'Address the root cause across the area (ownership, procedure and monitoring) and close the underlying findings. This finding closes automatically when no more than two minor findings remain open in the area.',
          linked: minors.map((m) => m.id) });
      }
    });
    return out;
  };

  S.allFindings = (audit) => (audit.findings || []).concat(S.systemicFindings(audit));

  S.counts = (audit) => {
    const all = S.allFindings(audit);
    const open = (g) => all.filter((f) => f.grade === g && f.state !== 'closed').length;
    const total = (g) => all.filter((f) => f.grade === g).length;
    return { majorOpen: open('major'), minorOpen: open('minor'), ofiOpen: open('ofi'), major: total('major'), minor: total('minor'), ofi: total('ofi'), conformity: total('conformity'), needsReview: all.filter((f) => f.needsReview && !f.reviewedBy).length };
  };

  // ---------------------------------------------------------------- scoring and maturity
  const W = { M: 3, S: 2, W: 1 };
  S.effectiveStatus = (audit, c) => {
    const f = S.findingFor(audit, c.id);
    if (f) return f.state === 'closed' ? 'conformity' : f.status;
    return S.preStatus(c, (audit.responses || {})[c.id], audit.evidence);
  };
  S.scores = (audit) => {
    const ctrls = S.applicableControls(audit);
    const byDomain = {};
    let num = 0, den = 0, answered = 0;
    ctrls.forEach((c) => {
      const st = S.effectiveStatus(audit, c);
      if (st == null) return;
      answered++;
      if (st === 'na') return;
      const pts = st === 'conformity' ? 1 : st === 'partial' ? 0.5 : 0;
      const w = W[c.pri];
      num += pts * w; den += w;
      const b = (byDomain[c.d] = byDomain[c.d] || { num: 0, den: 0, n: 0 });
      b.num += pts * w; b.den += w; b.n++;
    });
    const domains = S.DOMAINS.filter((d) => byDomain[d.id]).map((d) => {
      const b = byDomain[d.id]; const pct = b.den ? Math.round((b.num / b.den) * 100) : 0;
      return { id: d.id, name: d.name, pct, maturity: S.maturity(pct), n: b.n };
    });
    return { overall: den ? Math.round((num / den) * 100) : 0, domains, answered, total: ctrls.length };
  };
  S.MATURITY = ['Initial', 'Developing', 'Defined', 'Managed', 'Optimised'];
  S.maturity = (pct) => (pct < 40 ? 1 : pct < 60 ? 2 : pct < 75 ? 3 : pct < 90 ? 4 : 5);

  // ---------------------------------------------------------------- penalty exposure
  S.exposure = (audit) => {
    const keys = {};
    S.allFindings(audit).filter((f) => f.grade === 'major' && f.state !== 'closed' && f.controlId).forEach((f) => {
      const c = S.controlById(f.controlId); if (c && c.pen && c.pen !== 'none') keys[c.pen] = true;
    });
    const list = Object.keys(keys).map((k) => S.PENALTIES[k]).sort((a, b) => b.max - a.max);
    return { brackets: list, top: list[0] ? list[0].max : 0 };
  };

  // ---------------------------------------------------------------- opinion and certificate
  S.OPINIONS = {
    compliant: { label: 'Compliant', cls: 'green' },
    observations: { label: 'Compliant with observations', cls: 'amber' },
    notyet: { label: 'Not yet compliant', cls: 'red' }
  };
  S.opinion = (audit) => {
    const k = S.counts(audit); const sc = S.scores(audit).overall;
    if (k.majorOpen > 0 || sc < 70) return 'notyet';
    if (k.minorOpen > 0 || sc < 85) return 'observations';
    return 'compliant';
  };
  S.isReadinessPeriod = (iso) => (iso || S.today()) < S.PHASES.p3.date;

  /** Everything that must be true before an advocate can sign the certificate. */
  S.certBlockers = (audit, signer) => {
    const out = [];
    const k = S.counts(audit); const sc = S.scores(audit);
    if (!audit.findings || !audit.findings.length) out.push('The SAFE AI audit has not been run.');
    if (k.majorOpen) out.push(k.majorOpen + ' Must-have (major) finding(s) are still open.');
    if (sc.overall < 70) out.push('Overall score is ' + sc.overall + '% (minimum 70%).');
    if (sc.answered < sc.total) out.push((sc.total - sc.answered) + ' applicable control(s) are unanswered.');
    if (k.needsReview) out.push(k.needsReview + ' low-confidence finding(s) still need advocate review.');
    if (!(audit.reports || []).some((r) => r.kind === 'interim')) out.push('The interim audit report has not been issued.');
    if (signer) {
      const drafted = (audit.docs || []).filter((d) => d.approvedBy && d.approvedBy === signer);
      if (drafted.length) out.push('Independence: ' + signer + ' approved ' + drafted.length + ' document(s) drafted for this client (SAFE Advisory). A different advocate must sign the certificate (SAFE Assurance).');
    }
    return out;
  };

  S.certDates = (issued) => {
    const validUntil = S.addDays(S.addMonths(issued, 12), -1);
    return {
      issued, validUntil,
      nextAuditDue: validUntil,
      renewalStarts: S.addDays(validUntil, -60),
      pulses: [3, 6, 9].map((m) => S.addMonths(issued, m))
    };
  };

  S.certStatus = (cert, today) => {
    today = today || S.today();
    if (!cert) return 'none';
    if (cert.status === 'revoked' || cert.status === 'suspended') return cert.status;
    if (today > cert.validUntil) return 'expired';
    if (S.daysBetween(today, cert.validUntil) <= 60) return 'expiring';
    return 'valid';
  };
  S.CERT_STATUS = { valid: ['Valid', 'green'], expiring: ['Valid — renewal due', 'amber'], expired: ['Expired', 'red'], suspended: ['Suspended', 'red'], revoked: ['Revoked', 'red'], none: ['Not issued', ''] };

  // ---------------------------------------------------------------- workflow
  S.STAGES = [
    { id: 'onboarding', label: 'Onboarding', who: 'SAFE' },
    { id: 'environment', label: 'Environment assessment', who: 'Client' },
    { id: 'assessment', label: 'DPDPA assessment and evidence', who: 'Client + SAFE AI' },
    { id: 'audit', label: 'SAFE AI audit', who: 'SAFE AI + SAFE' },
    { id: 'remediation', label: 'Remediation', who: 'Client + SAFE AI' },
    { id: 'signoff', label: 'Final review and sign-off', who: 'SAFE advocate' },
    { id: 'certified', label: 'Certified and under surveillance', who: 'SAFE AI' }
  ];
  S.stageIndex = (id) => S.STAGES.findIndex((s) => s.id === id);

  /** Progress inside the assessment stage. */
  S.assessmentProgress = (audit) => {
    const ctrls = S.applicableControls(audit);
    const r = audit.responses || {};
    const answered = ctrls.filter((c) => r[c.id] && r[c.id].answer).length;
    const needEv = ctrls.filter((c) => r[c.id] && (r[c.id].answer === 'yes' || r[c.id].answer === 'partly') && c.pri !== 'W');
    const withEv = needEv.filter((c) => (audit.evidence || []).some((e) => (e.controlIds || []).includes(c.id)));
    return { answered, total: ctrls.length, evidenceNeeded: needEv.length, evidenceGiven: withEv.length };
  };

  // ---------------------------------------------------------------- AI cost guide
  S.sizeTier = (env) => {
    env = env || {};
    const big = ['501–2,000', 'Over 2,000'].includes(env.employees) || ['10 lakh – 1 crore', '1 crore – 2 crore', 'Over 2 crore'].includes(env.principals) || env.sdfNotified === 'yes';
    const small = env.employees === '1–50' && ['Under 10,000', '10,000 – 1 lakh'].includes(env.principals);
    return big ? 'large' : small ? 'small' : 'mid';
  };
  S.TIERS = {
    small: { label: 'Small', costInr: 900, feeInr: 3000 },
    mid: { label: 'Mid-size', costInr: 2100, feeInr: 6000 },
    large: { label: 'Large / likely SDF', costInr: 5500, feeInr: 15000 }
  };

  // ---------------------------------------------------------------- audit reference
  S.auditRef = (n, year) => 'SAFE/DPDPA/' + (year || new Date().getFullYear()) + '/' + String(n).padStart(4, '0');
})(typeof window !== 'undefined' ? window : globalThis);
