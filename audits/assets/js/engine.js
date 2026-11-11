/* SAFE Legal Workplace Compliance Audits — audit engine (shared by every audit type)
 * Questionnaire completeness, applicability, ISO 19011-style grading, scoring, maturity,
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

  S.inrShort = (n) => n >= 1e7 ? '₹' + (n / 1e7).toLocaleString('en-IN', { maximumFractionDigits: 1 }) + ' cr' : n >= 1e5 ? '₹' + (n / 1e5).toLocaleString('en-IN', { maximumFractionDigits: 1 }) + ' lakh' : S.inr(n);

  // ---------------------------------------------------------------- questionnaire and applicability (per audit type)
  const filled = (f, v) => (f.t === 'bool' ? v === true || v === false : f.t === 'multi' ? Array.isArray(v) && v.length : v != null && String(v).trim() !== '');
  S.envCompleteness = (audit) => {
    const env = audit.env || {};
    const req = S.envFields(audit).filter((f) => f.req);
    const done = req.filter((f) => filled(f, env[f.k]));
    return { done: done.length, total: req.length, missing: req.filter((f) => !done.includes(f)).map((f) => f.l) };
  };
  S.applicability = (audit) => S.fw(audit).flags((audit && audit.env) || {});
  S.roleLabel = (audit) => S.fw(audit).roleLabel(S.applicability(audit));
  S.applicableControls = (audit) => {
    const fw = S.fw(audit); const f = S.applicability(audit);
    return fw.controls.filter((c) => (!fw.filterControl || fw.filterControl(c, f)) && (!c.when || f[c.when]));
  };
  S.missingDocs = (audit) => {
    const fw = S.fw(audit); const f = S.applicability(audit);
    const have = (audit.env && audit.env.existingDocs) || [];
    return fw.docTypes.filter((d) => (!d.when || f[d.when]) && !have.includes(d.id));
  };
  S.docTypesFor = (audit) => { const fw = S.fw(audit); const f = S.applicability(audit); return fw.docTypes.filter((d) => !d.when || f[d.when]); };

  // ---------------------------------------------------------------- grading (ISO 19011 aligned)
  S.GRADES = {
    major: { label: 'Major nonconformity', short: 'Must have', cls: 'red', rank: 3 },
    minor: { label: 'Minor nonconformity', short: 'Should have', cls: 'amber', rank: 2 },
    ofi: { label: 'Opportunity for improvement', short: 'Might have', cls: 'blue', rank: 1 },
    conformity: { label: 'Conformity', short: 'Compliant', cls: 'green', rank: 0 },
    na: { label: 'Not applicable', short: 'N/A', cls: '', rank: -1 }
  };
  S.STATUS_LABEL = { conformity: 'Met', partial: 'Partly met', notmet: 'Not met', na: 'Not applicable' };

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
    S.fw(audit).domains.forEach((d) => {
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
    const domains = S.fw(audit).domains.filter((d) => byDomain[d.id]).map((d) => {
      const b = byDomain[d.id]; const pct = b.den ? Math.round((b.num / b.den) * 100) : 0;
      return { id: d.id, name: d.name, pct, maturity: S.maturity(pct), n: b.n };
    });
    return { overall: den ? Math.round((num / den) * 100) : 0, domains, answered, total: ctrls.length };
  };
  S.MATURITY = ['Initial', 'Developing', 'Defined', 'Managed', 'Optimised'];
  S.maturity = (pct) => (pct < 40 ? 1 : pct < 60 ? 2 : pct < 75 ? 3 : pct < 90 ? 4 : 5);

  // ---------------------------------------------------------------- penalty exposure
  S.exposure = (audit) => {
    const fw = S.fw(audit); const keys = {};
    S.allFindings(audit).filter((f) => f.grade === 'major' && f.state !== 'closed' && f.controlId).forEach((f) => {
      const c = S.controlById(f.controlId); if (c && c.pen && c.pen !== 'none' && fw.penalties[c.pen]) keys[c.pen] = true;
    });
    const list = Object.keys(keys).map((k) => fw.penalties[k]).sort((a, b) => b.max - a.max);
    return { brackets: list, top: list[0] ? list[0].max : 0, amounts: !!fw.exposureAmounts, count: list.length };
  };
  S.exposureText = (audit) => { const e = S.exposure(audit); if (!e.count) return '—'; return e.amounts && e.top ? '₹' + e.top + ' cr' : e.count + ' penalty area' + (e.count > 1 ? 's' : ''); };

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
  S.isReadinessPeriod = (audit, iso) => { const d = S.fw(audit).readinessDate; return !!d && (iso || S.today()) < d; };

  /** Everything that must be true before an advocate can sign the certificate. */
  S.certBlockers = (audit, signer) => {
    const out = [];
    const k = S.counts(audit); const sc = S.scores(audit);
    if (!audit.findings || !audit.findings.length) out.push('The SAFE AI audit has not been run.');
    if (k.majorOpen) out.push(k.majorOpen + ' Must-have (major) finding(s) are still open.');
    if (sc.overall < 70) out.push('Overall score is ' + sc.overall + '% (minimum 70%).');
    if (sc.answered < sc.total) out.push((sc.total - sc.answered) + ' applicable control(s) are unanswered.');
    if (k.needsReview) out.push(k.needsReview + ' low-confidence finding(s) still need advocate review (Audit and findings tab, filter "Needs advocate review").');
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
    { id: 'assessment', label: 'Assessment and evidence', who: 'Client + SAFE AI' },
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
    const hc = S.headcount(env);
    const big = hc >= 1000 || ['10 lakh – 1 crore', '1 crore – 2 crore', 'Over 2 crore'].includes(env.principals) || env.sdfNotified === 'yes' || ['₹250–1,000 crore', 'Over ₹1,000 crore'].includes(env.turnover);
    const small = hc > 0 && hc < 50 && !['10 lakh – 1 crore', '1 crore – 2 crore', 'Over 2 crore', '1 lakh – 10 lakh'].includes(env.principals);
    return big ? 'large' : small ? 'small' : 'mid';
  };
  S.TIERS = {
    small: { label: 'Small', costInr: 900, feeInr: 3000 },
    mid: { label: 'Mid-size', costInr: 2100, feeInr: 6000 },
    large: { label: 'Large / likely SDF', costInr: 5500, feeInr: 15000 }
  };

  // ---------------------------------------------------------------- audit reference
  S.auditRef = (n, code, year) => 'SAFE/' + (code || 'DPDPA') + '/' + (year || new Date().getFullYear()) + '/' + String(n).padStart(4, '0');
})(typeof window !== 'undefined' ? window : globalThis);
