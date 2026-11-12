/* SAFE Legal Workplace Compliance Audits — SAFE team console */
(function () {
  const S = window.SAFE;
  const { $, $$, esc } = S;
  const st = { token: sessionStorage.getItem('dpdpa_tok') || '', me: null, boot: null, view: 'dashboard', clientId: '', tab: 'overview', audit: null, domain: '', filter: { grade: 'open', domain: '', q: '' } };

  const api = (action, payload) => S.call(action, Object.assign({ token: st.token }, payload || {})).catch((e) => {
    if (/^AUTH/.test(e.message)) { sessionStorage.removeItem('dpdpa_tok'); st.token = ''; showLogin(); }
    throw e;
  });
  const ctrlPayload = (c) => ({ id: c.id, t: c.t, req: c.req, ref: c.ref, ev: c.ev, pri: c.pri });
  const client = () => st.boot.clients.find((c) => c.id === st.clientId);
  const fetchFile = (fileId) => api('getFile', { fileId });
  const isAdvocate = () => st.me && st.me.role !== 'member';
  const clientAudits = (cid) => Object.values((st.boot && st.boot.audits) || {}).filter((x) => x.clientId === cid).sort((x, y) => S.FW_ORDER.indexOf(x.framework || 'dpdpa') - S.FW_ORDER.indexOf(y.framework || 'dpdpa'));
  const canIssueReports = () => st.me && st.me.role !== 'member' && (st.boot.settings.reportIssuers === 'advocate' || st.me.role === 'admin');
  let sigCache = null;
  async function reportSigner() {
    const s0 = st.boot.settings;
    if (sigCache === null) {
      try { const g = await api('getSignature'); sigCache = g && g.data ? g : false; } catch (e) { sigCache = false; }
    }
    const out = { name: s0.signatoryName || 'Adv. Sandeep Kumar N', title: s0.signatoryTitle || 'Founder and Managing Partner', enrolment: s0.signatoryEnrolment || '' };
    if (sigCache) out.image = { data: S.b64ToBytes(sigCache.data), src: 'data:' + sigCache.mime + ';base64,' + sigCache.data, mime: sigCache.mime, width: sigCache.width || 900, height: sigCache.height || 312 };
    return out;
  }

  // ============================================================ auth
  function showLogin() {
    $('#login').hidden = false; $('#app').hidden = true; $('#logout').hidden = true; $('#who').textContent = '';
    $('#demoHint').hidden = !S.DEMO;
  }
  $('#loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button');
    await S.busy(btn, async () => {
      const r = await S.call('login', { email: $('#lemail').value.trim(), pin: $('#lpin').value.trim() });
      st.token = r.token; sessionStorage.setItem('dpdpa_tok', r.token);
      await boot();
    }, 'Signing in…');
  });
  $('#logout').onclick = async () => { try { await api('logout'); } catch (e) { /* ignore */ } sessionStorage.removeItem('dpdpa_tok'); st.token = ''; showLogin(); };

  async function boot() {
    st.boot = await api('bootstrap');
    st.me = st.boot.me;
    $('#login').hidden = true; $('#app').hidden = false; $('#logout').hidden = false;
    $('#who').textContent = st.me.name + ' · ' + st.me.role;
    $('#demoFlag').hidden = !S.DEMO;
    if (st.me.mustChange && !S.DEMO) changePin(true);
    render();
  }
  async function refresh() { st.boot = await api('bootstrap'); render(); }

  async function changePin(forced) {
    const pin = await S.ask(forced ? 'Choose your own PIN' : 'Change PIN', 'New 6-digit PIN', { html: forced ? '<p>For security, replace the temporary PIN you were given.</p>' : '' });
    if (!pin) return;
    try { await api('changePin', { pin }); S.toast('PIN changed.'); } catch (e) { S.fail(e); }
  }

  // ============================================================ shell
  function render() {
    renderSide();
    const v = st.view;
    if (v === 'dashboard') return viewDashboard();
    if (v === 'client') return viewClient();
    if (v === 'certs') return viewCerts();
    if (v === 'settings') return viewSettings();
    if (v === 'team') return viewTeam();
  }
  function renderSide() {
    const b = st.boot;
    const nav = (id, label) => '<button data-nav="' + id + '" class="' + (st.view === id ? 'on' : '') + '">' + label + '</button>';
    $('#side').innerHTML = nav('dashboard', 'Dashboard') + nav('certs', 'Certificates') + (st.me.role === 'admin' ? nav('team', 'Team') + nav('settings', 'Settings') : '') +
      '<div class="sep"></div><div class="cap">Clients</div><button data-act="new-client" style="color:var(--maroon);font-weight:600">+ New client</button>' +
      b.clients.slice().sort((x, y) => String(x.name).localeCompare(y.name)).map((c) => { const au = clientAudits(c.id); return '<button class="client-link ' + (st.view === 'client' && st.clientId === c.id ? 'on' : '') + '" data-client="' + c.id + '">' + esc(c.name) + '<small>' + esc(au.length ? au.map((x) => S.fw(x.framework).short).join(' · ') : 'No audit') + '</small></button>'; }).join('') +
      '<div class="sep"></div><button data-nav="pin">Change my PIN</button>' + (S.DEMO ? '<button data-act="reset-demo">Reset demo data</button>' : '');
  }
  document.addEventListener('click', async (e) => {
    const t = e.target.closest('[data-nav],[data-client],[data-act],[data-tab],[data-audit]');
    if (!t || !st.boot) return;
    if (t.dataset.nav) { if (t.dataset.nav === 'pin') return changePin(false); st.view = t.dataset.nav; render(); return; }
    if (t.dataset.client) { await openClient(t.dataset.client, null, t.dataset.auditid || null); return; }
    if (t.dataset.audit) { await openClient(st.clientId, st.tab, t.dataset.audit); return; }
    if (t.dataset.tab) { st.tab = t.dataset.tab; viewClient(); return; }
    const act = ACTIONS[t.dataset.act];
    if (act) { e.preventDefault(); try { await act(t, e); } catch (err) { S.fail(err); } }
  });

  async function openClient(id, tab, auditId) {
    const same = st.clientId === id;
    st.view = 'client'; st.clientId = id; st.tab = tab || (same ? st.tab : 'overview'); st.domain = '';
    const au = clientAudits(id);
    const pick = (auditId && au.find((x) => x.id === auditId)) || (same && st.audit && au.find((x) => x.id === st.audit.id)) || au[0];
    st.audit = pick ? await api('getAudit', { auditId: pick.id }) : null;
    render();
  }

  // ============================================================ dashboard
  function viewDashboard() {
    const b = st.boot;
    const audits = Object.values(b.audits || {});
    const certs = b.certs || [];
    const stat = (s) => certs.filter((x) => S.certStatus(x) === s).length;
    const majorsOpen = audits.reduce((n, a) => n + S.counts(a).majorOpen, 0);
    const review = audits.reduce((n, a) => n + (a.findings || []).filter((f) => f.needsReview && !f.reviewedBy).length, 0);
    const spend = audits.reduce((n, a) => n + ((a.usage && a.usage.inr) || 0), 0);
    const nameOf = (cid) => (b.clients.find((c) => c.id === cid) || {}).name || '';
    const byStage = S.STAGES.map((s) => ({ s, list: audits.filter((a) => a.stage === s.id) }));
    const renew = certs.filter((x) => ['expiring', 'expired', 'suspended'].includes(S.certStatus(x)));
    const waiting = audits.filter((a) => a.stage === 'audit' || a.stage === 'signoff');
    $('#main').innerHTML = '<div class="page-head"><div><h1 class="serif">Dashboard</h1><div class="sub">DPDPA, Labour Codes, POSH & DEI, Corporate Legal, Contract and AI Governance audits across all clients</div></div><button class="primary" data-act="new-client">+ New client</button></div>' +
      (S.DEMO ? '<div class="banner">Demo mode: SAFE AI answers are simulated and data is kept only in this browser. Add the backend URL in <span class="mono">assets/config.js</span> to go live.</div>' : '') +
      (!S.DEMO && !b.settings.aiConnected ? '<div class="banner">SAFE AI is not connected. An admin must add the SAFE AI key in Settings.</div>' : '') +
      '<div class="kpis">' +
      kpi(b.clients.length, 'Clients') + kpi(audits.filter((a) => a.stage !== 'certified').length, 'Audits in progress') + kpi(majorsOpen, 'Open Must-have findings', majorsOpen ? 'red' : 'green') + kpi(review, 'Findings awaiting advocate review', review ? 'amber' : '') +
      kpi(stat('valid') + stat('expiring'), 'Certificates in force', 'green') + kpi(stat('expiring'), 'Renewals due (60 days)', stat('expiring') ? 'amber' : '') + kpi(stat('suspended'), 'Suspended', stat('suspended') ? 'red' : '') + kpi(S.inr(spend), 'SAFE AI cost (active audits)', 'maroon') +
      '</div><div class="cols"><div class="card"><div class="head"><h2>Pipeline</h2></div>' +
      byStage.map(({ s, list }) => '<div class="list-row"><div><b>' + esc(s.label) + '</b> <span class="muted small">' + esc(s.who) + '</span><div class="small">' + (list.map((a) => '<a href="#" data-client="' + a.clientId + '" data-auditid="' + a.id + '">' + esc(nameOf(a.clientId)) + ' (' + esc(S.fw(a.framework).short) + ')</a>').join(', ') || '<span class="muted">—</span>') + '</div></div><span class="pill">' + list.length + '</span></div>').join('') +
      '</div><div class="stack"><div class="card"><div class="head"><h2>Needs SAFE action</h2></div>' +
      (waiting.length ? waiting.map((a) => '<div class="list-row"><span><a href="#" data-client="' + a.clientId + '" data-auditid="' + a.id + '">' + esc(nameOf(a.clientId)) + '</a> ' + S.fwPill(a.framework) + '</span>' + S.stagePill(a.stage) + '</div>').join('') : '<div class="muted">Nothing waiting.</div>') +
      '</div><div class="card"><div class="head"><h2>Renewals and certificate alerts</h2></div>' +
      (renew.length ? renew.map((x) => '<div class="list-row"><span><b>' + esc(x.clientName) + '</b> ' + S.fwPill(x.framework) + '<br><span class="small muted">' + esc(x.no) + ' · valid until ' + S.fmtDate(x.validUntil) + '</span></span>' + S.certPill(x) + '</div>').join('') : '<div class="muted">No renewals due in the next 60 days.</div>') +
      '</div>' + (S.DEMO && b.demoMails && b.demoMails.length ? '<div class="card"><div class="head"><h2>Emails (demo log)</h2></div><div class="log">' + b.demoMails.slice(0, 8).map((m) => '<div>' + S.fmtDate(m.at) + ' — ' + esc(m.subject) + ' → ' + esc(m.to) + '</div>').join('') + '</div></div>' : '') + '</div></div>';
  }
  const kpi = (v, l, cls) => '<div class="kpi ' + (cls || '') + '"><div class="v">' + v + '</div><div class="l">' + esc(l) + '</div></div>';

  // ============================================================ client workspace
  function viewClient() {
    const c = client(); if (!c) { st.view = 'dashboard'; return render(); }
    const a = st.audit;
    const nReview = a ? (a.findings || []).filter((f) => f.needsReview && !f.reviewedBy).length : 0;
    const tabs = [['overview', 'Overview'], ['environment', 'Environment'], ['assessment', 'Assessment'], ['documents', 'Documents'], ['audit', 'Audit and findings', nReview], ['reports', 'Reports and certificate'], ['activity', 'Activity']];
    $('#main').innerHTML = '<div class="page-head"><div><h1 class="serif">' + esc(c.name) + '</h1><div class="sub">' + esc(c.legalName || '') + (a ? ' · ' + esc(S.fw(a).name) + ' ' + esc(a.ref) + ' (' + (a.type === 'renewal' ? 'annual re-audit' : 'initial') + ')' : '') + '</div></div><div class="row"><button data-act="edit-client">Client details</button></div></div>' +
      S.auditSwitcher(clientAudits(c.id), a && a.id, true) +
      (a ? S.stepper(a.stage) + '<div class="tabs">' + tabs.map(([id, l, n]) => '<button data-tab="' + id + '" class="' + (st.tab === id ? 'on' : '') + '">' + l + (n ? '<span class="count">' + n + '</span>' : '') + '</button>').join('') + '</div><div id="tabBody"></div>' : '<div class="empty">No audit is open for this client. Click <b>+ Add audit</b> to choose DPDPA, Labour Codes, POSH & DEI, Corporate Legal, Contract or AI Governance.</div>');
    if (!a) return;
    ({ overview: tabOverview, environment: tabEnvironment, assessment: tabAssessment, documents: tabDocuments, audit: tabAudit, reports: tabReports, activity: tabActivity })[st.tab]();
  }

  // ------------------------------------------------------------ overview
  function tabOverview() {
    const c = client(), a = st.audit;
    const sc = S.scores(a), k = S.counts(a), ex = S.exposure(a), flags = S.applicability(a);
    const portal = c.portal || {};
    const link = portal.id ? S.STUDIO_URL + 'portal.html?c=' + encodeURIComponent(portal.id) : '';
    const tier = c.tier || S.sizeTier(a.env);
    const budget = c.budgetInr || (st.boot.settings.budgets || {})[tier] || 0;
    const used = (a.usage && a.usage.inr) || 0;
    const memo = a.roleMemo;
    const idx = S.stageIndex(a.stage);
    const prev = S.STAGES[idx - 1], next = S.STAGES[idx + 1];
    $('#tabBody').innerHTML = '<div class="cols"><div class="stack">' +
      '<div class="card"><div class="head"><h2>Compliance position</h2>' + S.stagePill(a.stage) + '</div>' + S.gauge(sc.overall, S.OPINIONS[S.opinion(a)].label, sc.answered + ' of ' + sc.total + ' applicable controls answered · ' + esc(S.fw(a).roleCaption.toLowerCase()) + ': ' + esc(S.roleLabel(a))) +
      '<div class="kpis" style="margin-top:12px">' + kpi(k.majorOpen, 'Must have (open)', k.majorOpen ? 'red' : 'green') + kpi(k.minorOpen, 'Should have (open)', k.minorOpen ? 'amber' : '') + kpi(k.ofiOpen, 'Might have (open)') + kpi(S.exposureText(a), ex.amounts ? 'Highest open penalty exposure' : 'Open penalty exposure', ex.count ? 'red' : '') + '</div>' +
      (sc.domains.length ? S.domainBars(sc) : '<div class="muted">Scores appear as the client answers the assessment.</div>') + '</div>' +
      '<div class="card"><div class="head"><h2>Applicability memo</h2><button data-act="ai-role">' + (memo ? 'Refresh with SAFE AI' : 'Prepare with SAFE AI') + '</button></div>' +
      (memo ? '<div class="ai-box"><div class="lbl">SAFE AI</div><p style="margin:0 0 6px"><b>' + esc(memo.role) + '.</b> ' + esc(memo.summary) + '</p>' + (memo.sdfAssessment ? '<p class="small"><b>SDF:</b> ' + esc(memo.sdfAssessment) + (memo.thirdSchedule ? '<br><b>Third Schedule:</b> ' + esc(memo.thirdSchedule) : '') + '</p>' : '') + (memo.keyApplicability && memo.keyApplicability.length ? '<b class="small">What applies</b><ul class="small">' + memo.keyApplicability.map((x) => '<li>' + esc(x) + '</li>').join('') + '</ul>' : '') +
        (memo.keyRisks ? '<b class="small">Key risks</b><ul class="small">' + memo.keyRisks.map((x) => '<li>' + esc(x) + '</li>').join('') + '</ul>' : '') + (memo.sectorOverlays ? '<p class="small"><b>Sector rules:</b> ' + esc(memo.sectorOverlays.join(', ')) + '</p>' : '') + '</div>' : '<div class="muted">Once the environment assessment is filled in, SAFE AI writes a short memo on what applies to the client and the priority areas.</div>') + '</div>' +
      '</div><div class="stack">' +
      '<div class="card"><div class="head"><h2>Workflow</h2></div><p class="small muted">Stages move automatically as the client submits and as reports and the certificate are issued. You can also move a stage by hand; every move is logged.</p><div class="row">' +
      (prev ? '<button data-act="stage" data-to="' + prev.id + '">← Back to ' + esc(prev.label) + '</button>' : '') + (next && next.id !== 'certified' ? '<button class="primary" data-act="stage" data-to="' + next.id + '">Move to ' + esc(next.label) + ' →</button>' : '') + '</div>' +
      (a.stage === 'certified' ? '<button style="margin-top:10px" class="primary" data-act="renewal">Open renewal audit (carry answers forward)</button>' : '') + '</div>' +
      '<div class="card"><div class="head"><h2>Client portal</h2>' + (portal.enabled ? '<span class="pill green">On</span>' : '<span class="pill">Off</span>') + '</div>' +
      (link ? '<label>Portal link</label><div class="row"><input readonly value="' + esc(link) + '" id="plink"><button data-act="copy-link">Copy</button></div>' : '<p class="muted small">No portal link yet.</p>') +
      '<p class="small muted">' + (portal.hasPin ? 'A PIN is set' + (portal.pinSetAt ? ' (' + S.fmtDate(portal.pinSetAt) + ')' : '') + '. Share it with the client separately from the link.' : 'No PIN set yet.') + '</p>' +
      '<div class="row"><button data-act="portal-pin">' + (portal.hasPin ? 'Set a new PIN' : 'Create link and PIN') + '</button>' + (portal.id ? '<button data-act="portal-toggle">' + (portal.enabled ? 'Switch off' : 'Switch on') + '</button><button data-act="portal-invite">Email invitation</button>' : '') + '</div></div>' +
      '<div class="card"><div class="head"><h2>SAFE AI usage</h2><span class="pill">' + esc((S.TIERS[tier] || {}).label || tier) + '</span></div><div class="progress"><div style="width:' + Math.min(100, budget ? (used / budget) * 100 : 0) + '%"></div></div><p class="small">' + S.inr(used) + ' used of ' + (budget ? S.inr(budget) : 'no') + ' budget · ' + ((a.usage && a.usage.calls) || 0) + ' SAFE AI tasks. Portal AI stops at the budget; raise it in Client details.</p></div>' +
      '<div class="card"><div class="head"><h2>Letterhead</h2><label class="btn small" style="margin:0">Upload<input type="file" accept=".docx,.png,.jpg,.jpeg" data-act-file="letterhead" hidden></label></div>' +
      (c.letterhead ? '<p class="small">' + esc(c.letterhead.name) + ' (' + (c.letterhead.kind === 'docx' ? 'Word letterhead — header, footer and margins are kept' : 'image letterhead — placed across the top of each page') + ')</p>' : '<p class="small muted">Documents SAFE AI drafts for the client are written on this letterhead. Upload a .docx letterhead or an image.</p>') + '</div>' +
      '</div></div>';
    const lh = $('[data-act-file="letterhead"]');
    if (lh) lh.onchange = async () => {
      const f = lh.files[0]; if (!f) return;
      try { const up = await S.readUpload(f); await api('uploadClientFile', Object.assign({ clientId: c.id, kind: 'letterhead' }, up)); S.toast('Letterhead saved.'); await refreshKeep(); } catch (e) { S.fail(e); }
    };
  }
  async function refreshKeep() { const tab = st.tab; const aid = st.audit && st.audit.id; st.boot = await api('bootstrap'); await openClient(st.clientId, tab, aid); }

  // ------------------------------------------------------------ environment
  function tabEnvironment() {
    const a = st.audit;
    const comp = S.envCompleteness(a);
    $('#tabBody').innerHTML = '<div class="card" style="margin-bottom:12px"><div class="head"><h2>Environment assessment — ' + esc(S.fw(a).short) + '</h2><span class="pill ' + (comp.done === comp.total ? 'green' : 'amber') + '">' + comp.done + '/' + comp.total + ' required answers</span></div><p class="small muted">The client fills this in through the portal. SAFE can correct or complete it here. These answers decide which controls apply and what SAFE AI drafts.</p>' +
      (comp.missing.length ? '<p class="small"><b>Still missing:</b> ' + esc(comp.missing.slice(0, 6).join('; ')) + (comp.missing.length > 6 ? '…' : '') + '</p>' : '') +
      '<div class="row"><button class="primary" data-act="save-env">Save</button><button data-act="ai-role">Prepare applicability memo with SAFE AI</button></div></div><div id="envForm">' + S.envForm(a, true) + '</div>';
  }

  // ------------------------------------------------------------ assessment
  function tabAssessment() {
    const a = st.audit;
    const ctrls = S.applicableControls(a);
    const doms = S.fw(a).domains.filter((d) => ctrls.some((c) => c.d === d.id));
    if (!st.domain || !doms.some((d) => d.id === st.domain)) st.domain = doms[0] ? doms[0].id : '';
    const p = S.assessmentProgress(a);
    const unreviewed = (a.evidence || []).filter((e) => !e.deleted && !e.review).length;
    const dom = S.domainById(st.domain, a.framework);
    $('#tabBody').innerHTML = '<div class="card" style="margin-bottom:12px"><div class="head"><h2>' + esc(S.fw(a).short) + ' assessment</h2><span class="small">' + p.answered + '/' + p.total + ' answered · evidence on ' + p.evidenceGiven + '/' + p.evidenceNeeded + ' controls that need it</span></div><div class="progress"><div style="width:' + (p.total ? (p.answered / p.total) * 100 : 0) + '%"></div></div>' +
      '<div class="row"><button data-act="ai-followups">SAFE AI: ask follow-up questions for this area</button>' + (unreviewed ? '<button data-act="ai-review-all">SAFE AI: review ' + unreviewed + ' unreviewed evidence file(s)</button>' : '') + '<span class="muted small">Changes save automatically.</span></div></div>' +
      '<div class="domain-list">' + S.domainNav(a, ctrls, st.domain) + '<div id="ctrls"><h2 class="serif" style="color:var(--maroon);margin-bottom:10px">' + esc(dom ? dom.name : '') + '</h2>' +
      ctrls.filter((c) => c.d === st.domain).map((c) => S.controlCard(c, a, { editable: true, reviewable: true, deletable: true, askable: true, showFinding: true })).join('') + '</div></div>';
    wireControls($('#ctrls'));
    $$('[data-domain]').forEach((b) => b.onclick = () => { st.domain = b.dataset.domain; tabAssessment(); window.scrollTo(0, 0); });
  }
  let saveTimer = null;
  function wireControls(rootEl) {
    S.wireSeg(rootEl);
    const schedule = () => { clearTimeout(saveTimer); saveTimer = setTimeout(saveResponses, 700); };
    rootEl.addEventListener('changed', schedule);
    $$('textarea', rootEl).forEach((t) => t.addEventListener('input', schedule));
    $$('[data-upload]', rootEl).forEach((inp) => inp.onchange = () => uploadEvidence(inp.dataset.upload, inp.files));
    $$('[data-review]', rootEl).forEach((b) => b.onclick = () => S.busy(b, () => reviewEvidence(b.dataset.review).then(tabAssessment), 'SAFE AI reading…'));
    $$('[data-delev]', rootEl).forEach((b) => b.onclick = async () => { if (!(await S.confirmBox('Remove evidence', '<p>Remove this file from the audit? It stays in the Drive folder.</p>', 'Remove'))) return; st.audit = await api('deleteEvidence', { auditId: st.audit.id, evidenceId: b.dataset.delev }); tabAssessment(); });
    $$('[data-askai]', rootEl).forEach((b) => b.onclick = () => askAi(b.dataset.askai));
  }
  async function saveResponses() {
    const patch = S.readControlEdits($('#ctrls') || document, st.audit);
    if (!Object.keys(patch).length) return;
    try { st.audit = await api('saveAudit', { auditId: st.audit.id, patch: { responses: patch } }); updateNavProgress(); } catch (e) { S.fail(e); }
  }
  function updateNavProgress() {
    const nav = $('.domain-nav'); if (!nav) return;
    const ctrls = S.applicableControls(st.audit);
    nav.outerHTML = S.domainNav(st.audit, ctrls, st.domain);
    $$('[data-domain]').forEach((b) => b.onclick = () => { st.domain = b.dataset.domain; tabAssessment(); window.scrollTo(0, 0); });
  }
  async function uploadEvidence(controlId, files) {
    for (const f of Array.from(files || [])) {
      if (f.size > 20 * 1024 * 1024) { S.toast(f.name + ' is over 20 MB.'); continue; }
      S.toast('Uploading ' + f.name + '…');
      try {
        const up = await S.readUpload(f);
        const r = await api('uploadEvidence', Object.assign({ auditId: st.audit.id, controlIds: [controlId] }, up));
        st.audit = r.audit;
        S.toast('SAFE AI is reviewing ' + f.name + '…');
        await reviewEvidence(r.evidenceId);
      } catch (e) { S.fail(e); }
    }
    tabAssessment();
  }
  async function reviewEvidence(evId) {
    const ev = st.audit.evidence.find((e) => e.id === evId);
    const ctrls = (ev.controlIds || []).map(S.controlById).filter(Boolean).map(ctrlPayload);
    const r = await api('ai', { auditId: st.audit.id, task: 'reviewEvidence', evidenceId: evId, controls: ctrls });
    st.audit = r.audit;
    return r.result;
  }
  async function askAi(controlId) {
    const q = await S.ask('Ask SAFE AI', 'Your question about ' + controlId, { multiline: true, ok: 'Ask' });
    if (!q) return;
    const m = S.modal('SAFE AI', '<div class="muted"><span class="spin"></span> SAFE AI is thinking…</div>');
    try { const r = await api('ai', { auditId: st.audit.id, task: 'ask', question: q, controlId }); st.audit = r.audit || st.audit; $('.mbody', m).innerHTML = '<div class="ai-box"><div class="lbl">SAFE AI</div><div style="white-space:pre-wrap">' + esc(r.result.answer) + '</div></div>'; } catch (e) { m.remove(); S.fail(e); }
  }

  // ------------------------------------------------------------ documents
  function tabDocuments() {
    const c = client(), a = st.audit;
    const missing = S.missingDocs(a);
    const docs = a.docs || [];
    const all = S.docTypesFor(a);
    $('#tabBody').innerHTML = '<div class="card" style="margin-bottom:12px"><div class="head"><h2>Policies and notices</h2></div><p class="small muted">SAFE AI drafts the documents the client does not have, using the environment answers. A SAFE advocate reviews and approves each draft. It is then issued to the client on their letterhead and linked to the controls it satisfies. Under the independence rule, the advocate who approves drafts cannot sign this client\'s certificate.</p></div>' +
      all.map((t) => {
        const d = docs.find((x) => x.type === t.id);
        const has = !missing.includes(t);
        return '<div class="card" style="margin-bottom:10px"><div class="head"><div><h3>' + esc(t.title) + '</h3><div class="small muted">' + esc(t.audience) + ' · satisfies ' + t.controls.join(', ') + '</div></div><div class="row">' +
          (d ? '<span class="pill ' + ({ draft: 'amber', approved: 'blue', issued: 'green' })[d.status] + '">' + esc(d.status) + '</span>' : has ? '<span class="pill green">Client has its own</span>' : '<span class="pill red">Missing</span>') + '</div></div>' +
          (d ? '<p class="small">Drafted ' + S.fmtDate(d.draftedAt) + ' by SAFE AI' + (d.requestedByClient ? ' (requested by the client)' : '') + (d.approvedBy ? ' · approved by ' + esc(d.approvedBy) + ' on ' + S.fmtDate(d.approvedAt) : '') + '</p>' : '') +
          '<div class="row">' + (!d ? '<button ' + (has ? '' : 'class="primary" ') + 'data-act="draft-doc" data-type="' + t.id + '">Draft with SAFE AI</button>' : '<button data-act="view-doc" data-doc="' + d.id + '">Open</button><button data-act="draft-doc" data-type="' + t.id + '">Redraft</button>' +
            (d.status === 'draft' && isAdvocate() ? '<button class="primary" data-act="approve-doc" data-doc="' + d.id + '">Approve</button>' : '') + (d.status === 'approved' ? '<button class="primary" data-act="issue-doc" data-doc="' + d.id + '">Issue to client</button>' : '') +
            '<button data-act="doc-word" data-doc="' + d.id + '">Word on letterhead</button><button data-act="doc-print" data-doc="' + d.id + '">Print / PDF</button>') + '</div></div>';
      }).join('') + (c.letterhead ? '' : '<p class="small muted">Tip: upload the client\'s letterhead on the Overview tab first.</p>');
  }
  async function draftDoc(type, btn) {
    const t = S.fw(st.audit).docTypes.find((x) => x.id === type);
    const instructions = await S.ask('Draft ' + t.title, 'Anything SAFE AI should take into account? (optional — leave blank and press Draft)', { multiline: true, ok: 'Draft' });
    if (instructions === null) return;
    await S.busy(btn, async () => {
      const r = await api('ai', { auditId: st.audit.id, task: 'draftDoc', doc: t, controls: t.controls.map(S.controlById).filter(Boolean).map(ctrlPayload), instructions: instructions || '' });
      st.audit = r.audit;
      tabDocuments();
      openDoc(r.result.docId);
    }, 'SAFE AI drafting…');
  }
  function openDoc(docId) {
    const d = st.audit.docs.find((x) => x.id === docId); if (!d) return;
    const html = S.blocksToHtml(S.composeClientDoc(client(), st.audit, d));
    S.modal(d.title, '<div class="row" style="margin-bottom:10px"><button data-mode="view" class="primary">Preview</button><button data-mode="edit">Edit text</button><span class="muted small">Text in yellow is for the client to complete.</span></div><div id="docArea"><div class="docview">' + html + '</div></div>', (m) => {
      $$('[data-mode]', m).forEach((b) => b.onclick = () => {
        $$('[data-mode]', m).forEach((x) => x.classList.remove('primary')); b.classList.add('primary');
        if (b.dataset.mode === 'edit') {
          $('#docArea', m).innerHTML = '<textarea class="doc-edit" id="docText">' + esc(d.content) + '</textarea><div class="row" style="margin-top:8px"><button class="primary" id="docSave">Save changes</button><span class="small muted">Saving a change on an approved document returns it to draft for re-approval.</span></div>';
          $('#docSave', m).onclick = async () => {
            const content = $('#docText', m).value;
            st.audit = await api('saveAudit', { auditId: st.audit.id, patch: { docUpdates: { [d.id]: { content, status: 'draft', approvedBy: '', approvedAt: '', history: (d.history || []).concat([{ at: new Date().toISOString(), by: st.me.email, action: 'Edited' }]) } } }, logNote: 'Edited document: ' + d.title });
            m.remove(); tabDocuments(); S.toast('Saved.');
          };
        } else $('#docArea', m).innerHTML = '<div class="docview">' + S.blocksToHtml(S.composeClientDoc(client(), st.audit, st.audit.docs.find((x) => x.id === docId))) + '</div>';
      });
    }, true);
  }
  async function docBlob(d) {
    const c = client();
    const lh = await S.clientLetterhead(c, fetchFile).catch(() => null);
    return S.buildDocx(S.composeClientDoc(c, st.audit, d), { letterhead: lh, companyName: st.audit.env.legalName || c.name, accent: '333333', headFill: 'EDEDED', title: d.title });
  }

  // ------------------------------------------------------------ audit and findings
  function tabAudit() {
    const a = st.audit;
    const has = (a.findings || []).length > 0;
    const k = S.counts(a);
    const all = S.allFindings(a);
    const F = st.filter;
    const list = all.filter((f) => {
      if (f.grade === 'na' || (f.grade === 'conformity' && F.grade !== 'all' && F.grade !== 'conformity')) return false;
      if (F.grade === 'open' && f.state === 'closed') return false;
      if (['major', 'minor', 'ofi', 'conformity'].includes(F.grade) && f.grade !== F.grade) return false;
      if (F.grade === 'review' && !(f.needsReview && !f.reviewedBy)) return false;
      if (F.domain && (f.domain || (S.controlById(f.controlId) || {}).d) !== F.domain) return false;
      if (F.q && !JSON.stringify(f).toLowerCase().includes(F.q.toLowerCase())) return false;
      return true;
    }).sort((x, y) => S.GRADES[y.grade].rank - S.GRADES[x.grade].rank);
    $('#tabBody').innerHTML = '<div class="card" style="margin-bottom:12px"><div class="head"><h2>SAFE AI audit</h2>' + (has ? '<span class="small muted">Last run ' + S.fmtDate(a.auditRunAt) + '</span>' : '') + '</div>' +
      '<p class="small muted">SAFE AI grades every applicable control against the client\'s answers, follow-ups and evidence, area by area, using the audit engine. The SAFE rules then apply on top of its grades: a legal non-compliance is never graded below Should have, and three Should-have findings in one area become a systemic Must-have. Findings that SAFE AI is unsure about go to an advocate for review.</p>' +
      '<div class="row"><button class="primary" data-act="run-audit">' + (has ? 'Re-run SAFE AI audit' : 'Run SAFE AI audit') + '</button><span id="auditProg" class="small"></span></div></div>' +
      (has ? '<div class="kpis">' + kpi(k.majorOpen + '/' + k.major, 'Must have open / raised', k.majorOpen ? 'red' : 'green') + kpi(k.minorOpen + '/' + k.minor, 'Should have open / raised', k.minorOpen ? 'amber' : '') + kpi(k.ofiOpen + '/' + k.ofi, 'Might have open / raised') + kpi(k.needsReview, 'Awaiting advocate review', k.needsReview ? 'amber' : '') + kpi(S.scores(a).overall + '%', 'Score') + '</div>' +
        '<div class="filter-row"><select id="fGrade">' + [['open', 'Open findings'], ['review', 'Needs advocate review'], ['major', 'Must have'], ['minor', 'Should have'], ['ofi', 'Might have'], ['conformity', 'Conformities'], ['all', 'Everything']].map(([v, l]) => '<option value="' + v + '"' + (F.grade === v ? ' selected' : '') + '>' + l + '</option>').join('') + '</select>' +
        '<select id="fDomain"><option value="">All areas</option>' + S.fw(a).domains.map((d) => '<option value="' + d.id + '"' + (F.domain === d.id ? ' selected' : '') + '>' + esc(d.name) + '</option>').join('') + '</select><input id="fQ" placeholder="Search" value="' + esc(F.q) + '"><span class="small muted">' + list.length + ' shown</span></div>' +
        (list.length ? list.map(findingCard).join('') : '<div class="empty">No findings match.</div>') : '<div class="empty">Run the SAFE AI audit once the client has submitted the assessment.</div>');
    const fg = $('#fGrade'); if (fg) { fg.onchange = () => { F.grade = fg.value; tabAudit(); }; $('#fDomain').onchange = (e) => { F.domain = e.target.value; tabAudit(); }; $('#fQ').onchange = (e) => { F.q = e.target.value; tabAudit(); }; }
  }
  function findingCard(f) {
    const c = S.controlById(f.controlId) || {};
    const last = (f.remediation || []).slice(-1)[0];
    const ver = (f.verification || []).slice(-1)[0];
    return '<div class="find ' + f.grade + '"><div class="top"><div><div class="t">' + (f.controlId ? esc(f.controlId) + ' — ' : '') + esc(f.title || c.t) + '</div><div class="small muted">' + esc(c.ref || 'Systemic finding') + (f.confidence != null ? ' · SAFE AI confidence ' + Math.round(f.confidence * 100) + '%' : '') + (f.override ? ' · auditor override' : '') + '</div></div>' +
      '<div class="row">' + S.gradePill(f.grade) + S.statePill(f.state) + (f.needsReview && !f.reviewedBy ? '<span class="pill amber">Needs review</span>' : f.reviewedBy ? '<span class="pill">Reviewed by ' + esc(f.reviewedBy) + '</span>' : '') + '</div></div>' +
      '<div class="body"><div><b>Observation</b><br>' + esc(f.observation || '') + '</div>' + (f.risk ? '<div><b>Risk</b><br>' + esc(f.risk) + '</div>' : '') + (f.recommendation ? '<div><b>Recommendation</b><br>' + esc(f.recommendation) + '</div>' : '') +
      ((f.owner || f.dueDate) ? '<div><b>Owner / target</b><br>' + esc(f.owner || '—') + (f.dueDate ? ' · ' + S.fmtDate(f.dueDate) : '') + '</div>' : '') +
      (last ? '<div><b>Latest fix from client</b><br>' + esc(last.note || '') + (last.evidenceId ? ' (proof attached)' : '') + ' — ' + S.fmtDate(last.at) + '</div>' : '') +
      (ver ? '<div class="ai-box"><div class="lbl">SAFE AI verification</div>' + esc(ver.verdict) + ' — ' + esc(ver.reason || '') + '</div>' : '') + '</div>' +
      (f.systemic ? '' : '<div class="row" style="margin-top:8px"><button class="small" data-act="edit-finding" data-f="' + f.id + '">Edit</button>' + (f.needsReview && !f.reviewedBy && isAdvocate() ? (f.state === 'submitted' ? '<button class="small primary" data-act="accept-fix" data-f="' + f.id + '">Accept fix and close</button><button class="small" data-act="return-fix" data-f="' + f.id + '">Return to client</button>' : '<button class="small primary" data-act="review-finding" data-f="' + f.id + '">Confirm grading</button>') : '') +
        (last && f.state !== 'closed' ? '<button class="small" data-act="verify-finding" data-f="' + f.id + '">SAFE AI: verify fix</button>' : '') + (f.state !== 'closed' && isAdvocate() ? '<button class="small" data-act="close-finding" data-f="' + f.id + '">Close</button>' : f.state === 'closed' ? '<button class="small" data-act="reopen-finding" data-f="' + f.id + '">Reopen</button>' : '') + '</div>') + '</div>';
  }
  async function runAudit(btn) {
    const a = st.audit;
    const ctrls = S.applicableControls(a);
    const unanswered = ctrls.filter((c) => !(a.responses[c.id] || {}).answer).length;
    if (unanswered && !(await S.confirmBox('Run the audit?', '<p>' + unanswered + ' applicable control(s) have no answer. SAFE AI will grade them as not met. Continue?</p>', 'Run audit'))) return;
    const doms = S.fw(a).domains.filter((d) => ctrls.some((c) => c.d === d.id));
    const prog = $('#auditProg');
    await S.busy(btn, async () => {
      // review any evidence not yet read, so grades rest on reviewed evidence
      const unrev = a.evidence.filter((e) => !e.deleted && !e.review);
      for (let i = 0; i < unrev.length; i++) { prog.textContent = 'Reading evidence ' + (i + 1) + ' of ' + unrev.length + '…'; try { await reviewEvidence(unrev[i].id); } catch (e) { console.warn(e); } }
      const existing = {}; (st.audit.findings || []).forEach((f) => { existing[f.controlId] = f; });
      const next = [];
      for (let i = 0; i < doms.length; i++) {
        const d = doms[i];
        prog.textContent = 'SAFE AI grading ' + d.name + ' (' + (i + 1) + ' of ' + doms.length + ')…';
        const cs = ctrls.filter((c) => c.d === d.id);
        const r = await api('ai', { auditId: st.audit.id, task: 'gradeDomain', domainName: d.name, controls: cs.map(ctrlPayload) });
        st.audit = r.audit;
        const res = Array.isArray(r.result) ? r.result : [];
        cs.forEach((c) => {
          const g = res.find((x) => x.controlId === c.id) || { status: S.preStatus(c, st.audit.responses[c.id], st.audit.evidence) || 'notmet', observation: 'Graded from the client\'s answer; SAFE AI returned no entry.', confidence: 0.5 };
          const status = ['conformity', 'partial', 'notmet', 'na'].includes(g.status) ? g.status : 'notmet';
          const grade = S.gradeFor(c, status, g.grade);
          const old = existing[c.id] || {};
          const conf = Number(g.confidence);
          const keepClosed = old.state === 'closed' && grade === old.grade;
          next.push(Object.assign({}, old, { id: old.id || 'f-' + c.id, controlId: c.id, domain: c.d, title: c.t, status, aiGrade: g.grade || '', grade, observation: g.observation || '', risk: g.risk || '', recommendation: g.recommendation || '', confidence: isNaN(conf) ? 0.6 : conf,
            needsReview: (isNaN(conf) || conf < 0.7) && ['major', 'minor', 'ofi'].includes(grade), reviewedBy: (isNaN(conf) || conf < 0.7) ? (old.reviewedBy || '') : '', state: ['conformity', 'na'].includes(grade) ? 'closed' : keepClosed ? 'closed' : (old.state && old.state !== 'closed' ? old.state : 'open'), gradedAt: new Date().toISOString(), override: '' }));
        });
      }
      prog.textContent = 'Saving…';
      st.audit = await api('saveAudit', { auditId: st.audit.id, patch: { findings: next, auditRunAt: new Date().toISOString(), stage: S.stageIndex(st.audit.stage) < S.stageIndex('audit') ? 'audit' : st.audit.stage }, logNote: 'SAFE AI audit run across ' + doms.length + ' areas (' + next.length + ' controls)' });
      st.audit.auditRunAt = new Date().toISOString();
      prog.textContent = '';
      S.toast('SAFE AI audit complete.');
      st.filter.grade = 'open';
      await refreshBootQuiet();
      viewClient();
    }, 'Auditing…');
  }
  async function refreshBootQuiet() { try { st.boot = await api('bootstrap'); renderSide(); } catch (e) { /* ignore */ } }
  function findingById(id) { return st.audit.findings.find((f) => f.id === id); }
  async function saveFinding(id, upd, note) { st.audit = await api('saveAudit', { auditId: st.audit.id, patch: { findingUpdates: { [id]: upd } }, logNote: note }); tabAudit(); }
  function editFinding(id) {
    const f = findingById(id); const c = S.controlById(f.controlId);
    const floor = S.floorGrade(c, f.status);
    S.modal('Edit finding ' + f.controlId, '<div class="grid2"><div><label>Status</label><select id="eS">' + Object.entries(S.STATUS_LABEL).map(([v, l]) => '<option value="' + v + '"' + (f.status === v ? ' selected' : '') + '>' + l + '</option>').join('') + '</select></div><div><label>Grade</label><select id="eG">' + ['major', 'minor', 'ofi', 'conformity', 'na'].map((g) => '<option value="' + g + '"' + (f.grade === g ? ' selected' : '') + '>' + S.GRADES[g].short + ' — ' + S.GRADES[g].label + '</option>').join('') + '</select></div></div>' +
      '<p class="small muted" id="eFloor">The rules give at least: <b>' + S.GRADES[floor].label + '</b> for this status.</p><label>Observation</label><textarea id="eO">' + esc(f.observation) + '</textarea><label>Risk</label><textarea id="eR" rows="2">' + esc(f.risk || '') + '</textarea><label>Recommendation</label><textarea id="eRec">' + esc(f.recommendation || '') + '</textarea>' +
      '<div class="grid2"><div><label>Owner (client side)</label><input id="eOw" value="' + esc(f.owner || '') + '"></div><div><label>Target date</label><input id="eD" type="date" value="' + esc(f.dueDate || '') + '"></div></div><label>Reason for any change below the rule grade (required if you lower it)</label><input id="eWhy" value="' + esc(f.override || '') + '">' +
      '<div class="row" style="justify-content:flex-end;margin-top:12px"><button data-close>Cancel</button><button class="primary" id="eSave">Save</button></div>', (m) => {
      const upd = () => { $('#eFloor', m).innerHTML = 'The rules give at least: <b>' + S.GRADES[S.floorGrade(c, $('#eS', m).value)].label + '</b> for this status.'; };
      $('#eS', m).onchange = upd;
      $('#eSave', m).onclick = async () => {
        const status = $('#eS', m).value, grade = $('#eG', m).value, why = $('#eWhy', m).value.trim();
        const fl = S.floorGrade(c, status);
        const below = S.GRADES[grade].rank < S.GRADES[fl].rank;
        if (below && !why) { S.toast('Give a reason for grading below the rule floor.'); return; }
        if (below && !isAdvocate()) { S.toast('Only an advocate can grade below the rule floor.'); return; }
        m.remove();
        await saveFinding(id, { status, grade, observation: $('#eO', m).value, risk: $('#eR', m).value, recommendation: $('#eRec', m).value, owner: $('#eOw', m).value, dueDate: $('#eD', m).value, override: below ? why + ' — ' + st.me.name : '', state: ['conformity', 'na'].includes(grade) ? 'closed' : (f.state === 'closed' ? 'open' : f.state), reviewedBy: f.needsReview ? st.me.name : f.reviewedBy || '' }, 'Finding ' + f.controlId + ' edited' + (below ? ' (override: ' + why + ')' : ''));
      };
    });
  }

  // ------------------------------------------------------------ reports and certificate
  function tabReports() {
    const a = st.audit, c = client();
    const reps = a.reports || [];
    const certs = (st.boot.certs || []).filter((x) => x.clientId === c.id);
    const blockers = S.certBlockers(a, st.boot.settings.requireIndependence ? st.me.email : null);
    const cert = a.signoff ? certs.find((x) => x.no === a.signoff.certNo) : null;
    const fw = S.fw(a);
    $('#tabBody').innerHTML = '<div class="cols even"><div class="stack">' +
      '<div class="card"><div class="head"><h2>Audit report on SAFE letterhead</h2></div><p class="small muted">Interim and final reports carry the signature of ' + esc(st.boot.settings.signatoryName || 'the Founder and Managing Partner') + ', ' + esc(st.boot.settings.signatoryTitle || '') + (st.boot.settings.hasSignature ? '' : ' <b style="color:var(--red)">(signature image not uploaded yet — Settings)</b>') + '. The report covers the engagement, an executive summary, applicability, methodology, the organisation\'s profile, scores by area, every finding with criteria, evidence and recommendation, the corrective action plan, documents prepared, the audit opinion, and annexures.</p>' +
      '<div class="row"><button data-act="report-preview" data-kind="interim">Preview interim report</button><button class="primary" data-act="report-issue" data-kind="interim"' + ((a.findings || []).length && canIssueReports() ? '' : ' disabled') + '>Issue interim report to client</button></div>' +
      '<div class="row" style="margin-top:8px"><button data-act="report-preview" data-kind="final">Preview final report</button><button data-act="report-issue" data-kind="final"' + (a.signoff && canIssueReports() ? '' : ' disabled title="Sign the certificate first"') + '>Issue final report</button></div>' +
      (canIssueReports() ? '' : '<p class="small muted">Only ' + (st.boot.settings.reportIssuers === 'advocate' ? 'an advocate or admin' : 'an admin') + ' can issue signed reports.</p>') + '<div style="margin-top:10px">' + (reps.length ? reps.map((r) => '<div class="list-row"><span><b>' + (r.kind === 'final' ? 'Final' : 'Interim') + ' report</b> · ' + S.fmtDate(r.at) + '<br><span class="small muted">Score ' + r.score + '% · ' + esc(r.opinion || '') + '</span></span>' + (r.htmlId ? '<button class="small" data-act="dl-file" data-file="' + r.htmlId + '" data-name="' + esc(a.ref.replace(/\//g, '-') + ' ' + r.kind + ' report.docx') + '">Word</button>' : '') + '</div>').join('') : '<p class="muted small">No report issued yet.</p>') + '</div></div>' +
      '</div><div class="stack"><div class="card"><div class="head"><h2>Advocate sign-off and certificate</h2></div>' +
      (cert ? '<p class="ok-line">Certificate ' + esc(cert.no) + ' issued ' + S.fmtDate(cert.issued) + ', valid until ' + S.fmtDate(cert.validUntil) + '.</p>' + S.certPill(cert) + '<div class="row" style="margin-top:10px"><button class="primary" data-act="cert-view" data-no="' + esc(cert.no) + '">View / print certificate</button><button data-act="cert-copy" data-no="' + esc(cert.no) + '">Copy verification link</button></div>' :
        (blockers.length ? '<p class="small"><b>Before the certificate can be signed:</b></p><ul class="blockers small">' + blockers.map((b) => '<li>' + esc(b) + '</li>').join('') + '</ul>' : '<p class="ok-line">All checks passed. Ready for sign-off.</p>') +
        '<label>Scope stated on the certificate</label><textarea id="certScope" rows="3">' + esc(a.scope || fw.scopeDefault(a.env || {}, a.env.legalName || c.name) + ', as described in audit report ' + a.ref + '.') + '</textarea>' +
        '<label>' + esc(fw.roleCaption) + ' stated on the certificate</label><input id="certRole" value="' + esc(S.roleLabel(a)) + '">' +
        '<p class="small muted">Certificate title: <b>' + esc(fw.certTitle(S.isReadinessPeriod(a))) + '</b>. Wording: "' + esc(S.OPINIONS[S.opinion(a)].label) + '" with a score of ' + S.scores(a).overall + '%. Valid for 12 months, with quarterly pulse checks and renewal reminders from 60 days before expiry.</p>' +
        '<button class="primary" data-act="sign"' + (blockers.length || !isAdvocate() ? ' disabled' : '') + '>Sign and issue certificate</button>' + (!isAdvocate() ? '<p class="small muted">Only an advocate or admin can sign.</p>' : '')) +
      '</div>' + (certs.length ? '<div class="card"><div class="head"><h2>Certificate history</h2></div>' + certs.map((x) => '<div class="list-row"><span>' + esc(x.no) + '<br><span class="small muted">' + S.fmtDate(x.issued) + ' – ' + S.fmtDate(x.validUntil) + '</span></span>' + S.certPill(x) + '</div>').join('') + '</div>' : '') + '</div></div>';
  }
  async function getSummary(kind, btn) {
    const a = st.audit;
    const r = await api('ai', { auditId: a.id, task: 'reportSummary', kind, facts: S.reportFacts(a) });
    st.audit = r.audit;
    return r.result;
  }
  function signerFor(kind) {
    if (kind !== 'final' || !st.audit.signoff) return null;
    const u = (st.boot.users || []).find((x) => x.email === st.audit.signoff.by);
    return u ? { name: u.name, email: u.email, enrolment: u.enrolment } : null;
  }
  async function reportBlocks(kind, btn) {
    const summary = await getSummary(kind, btn);
    const lu = (st.boot.users || []).find((x) => x.email === (st.audit.team || {}).lead);
    return { summary, blocks: S.composeReport({ client: client(), audit: st.audit, kind, summary, signer: signerFor(kind), reportSigner: await reportSigner(), leadName: lu ? lu.name + (lu.enrolment ? ', Advocate' : '') : '' }) };
  }
  async function reportDocx(blocks, kind) {
    return S.buildDocx(blocks, { letterhead: await S.safeLetterhead(), companyName: 'SAFE Legal Solutions', accent: '821526', headFill: 'F3E5E7', font: 'Calibri', size: 10.5, title: S.fw(st.audit).name + ' report — ' + kind });
  }

  // ------------------------------------------------------------ activity
  function tabActivity() {
    const a = st.audit;
    const u = a.usage || {};
    $('#tabBody').innerHTML = '<div class="cols"><div class="card"><div class="head"><h2>Audit trail</h2><span class="small muted">' + (a.log || []).length + ' entries</span></div><div class="log" style="max-height:60vh">' + (a.log || []).slice().reverse().map((l) => '<div><b>' + S.fmtDate(l.at) + ' ' + new Date(l.at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) + '</b> · ' + esc(l.by) + ' — ' + esc(l.action) + '</div>').join('') + '</div></div>' +
      '<div class="card"><div class="head"><h2>SAFE AI cost by task</h2></div>' + Object.entries(u.byTask || {}).map(([k, v]) => '<div class="list-row"><span>' + esc(k) + '</span><b>' + S.inr(v * (st.boot.settings.usdInr || 100)) + '</b></div>').join('') + '<div class="list-row"><span><b>Total</b> (' + (u.calls || 0) + ' tasks)</span><b>' + S.inr(u.inr || 0) + '</b></div></div></div>';
  }

  // ============================================================ certificates
  function viewCerts() {
    const certs = (st.boot.certs || []).slice().sort((x, y) => String(y.issued).localeCompare(x.issued));
    $('#main').innerHTML = '<div class="page-head"><div><h1 class="serif">Certificates</h1><div class="sub">Registry of SAFE compliance certificates across all audit types. Anyone can check a certificate on the public verification page.</div></div><div class="row"><button data-act="reminders" data-dry="1">Preview today\'s reminders</button>' + (st.me.role === 'admin' ? '<button data-act="reminders">Run reminders now</button>' : '') + '</div></div>' +
      (certs.length ? '<div class="table-wrap"><table><tr><th>Certificate</th><th>Audit</th><th>Client</th><th>Opinion</th><th>Issued</th><th>Valid until</th><th>Renewal reminders</th><th>Status</th><th></th></tr>' + certs.map((x) => '<tr><td class="mono">' + esc(x.no) + '</td><td>' + S.fwPill(x.framework) + '</td><td>' + esc(x.clientName) + '</td><td>' + esc(x.opinion) + ' (' + x.score + '%)</td><td>' + S.fmtDate(x.issued) + '</td><td>' + S.fmtDate(x.validUntil) + '</td><td class="small">from ' + S.fmtDate(S.addDays(x.validUntil, -60)) + '</td><td>' + S.certPill(x) + '</td><td class="row"><button class="small" data-act="cert-view" data-no="' + esc(x.no) + '">View</button>' +
        (isAdvocate() ? (x.status === 'suspended' ? '<button class="small" data-act="cert-op" data-op="reinstate" data-no="' + esc(x.no) + '">Reinstate</button>' : x.status === 'valid' ? '<button class="small" data-act="cert-op" data-op="suspend" data-no="' + esc(x.no) + '">Suspend</button>' : '') + (x.status !== 'revoked' ? '<button class="small danger" data-act="cert-op" data-op="revoke" data-no="' + esc(x.no) + '">Revoke</button>' : '') : '') + '</td></tr>').join('') + '</table></div>' : '<div class="empty">No certificates issued yet.</div>');
  }

  // ============================================================ settings and team
  function viewSettings() {
    const s = st.boot.settings;
    const pr = s.prices || {};
    $('#main').innerHTML = '<div class="page-head"><div><h1 class="serif">Settings</h1></div></div><div class="cols even"><div class="stack">' +
      '<div class="card"><div class="head"><h2>SAFE AI</h2>' + (s.aiConnected ? '<span class="pill green">Connected ' + esc(s.aiKeyHint || '') + '</span>' : '<span class="pill red">Not connected</span>') + '</div><label>SAFE AI key (stored on the server, never shown again)</label><input id="sKey" type="password" placeholder="' + (s.aiConnected ? 'Leave blank to keep the current key' : 'Paste the key') + '"><div class="row" style="margin-top:8px"><button data-act="test-ai">Test SAFE AI</button></div>' +
      '<details style="margin-top:10px"><summary class="small">Advanced: SAFE AI cost rates</summary><p class="small muted">US$ per million tokens (input / output), used to cost each client\'s SAFE AI usage.</p>' + [['Standard engine', s.engineStandard], ['Audit engine', s.engineAudit]].map(([l, m]) => '<div class="grid3"><input value="' + l + '" disabled><input data-pin="' + esc(m) + '" value="' + ((pr[m] || {}).in || '') + '"><input data-pout="' + esc(m) + '" value="' + ((pr[m] || {}).out || '') + '"></div>').join('') + '</details></div>' +
      '<div class="card"><div class="head"><h2>SAFE AI budgets per audit (₹)</h2></div><p class="small muted">Portal AI stops when an audit reaches its budget; SAFE is alerted at the percentage below. A client-specific budget on the client record overrides these.</p><div class="grid3"><div><label>Small</label><input id="bS" value="' + (s.budgets || {}).small + '"></div><div><label>Mid-size</label><input id="bM" value="' + (s.budgets || {}).mid + '"></div><div><label>Large / likely SDF</label><input id="bL" value="' + (s.budgets || {}).large + '"></div></div><div class="grid2"><div><label>Alert at (%)</label><input id="bA" value="' + s.budgetAlertPct + '"></div><div><label>₹ per US$ for costing</label><input id="sFx" value="' + s.usdInr + '"></div></div></div>' +
      '</div><div class="stack"><div class="card"><div class="head"><h2>Email</h2></div><div class="grid2"><div><label>SAFE inbox (to)</label><input id="sTo" value="' + esc(s.safeTo) + '"></div><div><label>Copy (cc)</label><input id="sCc" value="' + esc(s.safeCc) + '"></div><div><label>From address (verified Gmail alias)</label><input id="sFrom" value="' + esc(s.fromAddress) + '"></div><div><label>Sender name</label><input id="sName" value="' + esc(s.senderName) + '"></div></div><label>Studio web address (for links in emails)</label><input id="sUrl" value="' + esc(s.studioUrl || '') + '" placeholder="https://safelegalsolutions.github.io/safe-master-studio/audits/"><div class="row" style="margin-top:8px"><button data-act="test-mail">Send me a test email</button></div>' +
      ((st.boot.mailErrors || []).length ? '<p class="small" style="color:var(--red)">Recent email failures: ' + st.boot.mailErrors.slice(-3).map((m) => esc(m.to + ': ' + m.error)).join('<br>') + '</p>' : '') + '</div>' +
      '<div class="card"><div class="head"><h2>Certificates and renewals</h2></div><div class="grid3"><div><label>Remind from (days before expiry)</label><input id="rB" value="' + s.reminderDaysBefore + '"></div><div><label>Repeat every (days)</label><input id="rI" value="' + s.reminderIntervalDays + '"></div><div><label>Pulse overdue after (days)</label><input id="rP" value="' + s.pulseGraceDays + '"></div></div><label style="display:flex;gap:8px;align-items:center;margin-top:12px"><input type="checkbox" id="sInd" style="width:auto"' + (s.requireIndependence ? ' checked' : '') + '> Independence rule: an advocate who approved documents drafted for a client cannot sign that client\'s certificate</label></div>' +
      '<div class="card"><div class="head"><h2>Signed audit reports</h2>' + (s.hasSignature ? '<span class="pill green">Signature on file</span>' : '<span class="pill red">No signature uploaded</span>') + '</div><p class="small muted">Interim and final audit reports carry this signature block. The image is stored privately in SAFE\'s Google Drive (not on GitHub) and is fetched only by signed-in advocates and admins when a report is built.</p>' +
      '<div class="grid2"><div><label>Signatory name</label><input id="sgN" value="' + esc(s.signatoryName || '') + '"></div><div><label>Designation</label><input id="sgT" value="' + esc(s.signatoryTitle || '') + '"></div><div><label>Enrolment no. (optional)</label><input id="sgE" value="' + esc(s.signatoryEnrolment || '') + '"></div><div><label>Who may issue signed reports</label><select id="sgW"><option value="admin"' + (s.reportIssuers !== 'advocate' ? ' selected' : '') + '>Admins only</option><option value="advocate"' + (s.reportIssuers === 'advocate' ? ' selected' : '') + '>Advocates and admins</option></select></div></div>' +
      '<div class="row" style="margin-top:10px"><label class="btn" style="margin:0">Upload signature image (PNG, transparent background)<input type="file" id="sgF" accept="image/png,image/jpeg" hidden></label><span id="sgPrev"></span></div></div>' +
      '<button class="primary" data-act="save-settings">Save settings</button></div></div>';
    const sgF = $('#sgF');
    if (sgF) sgF.onchange = async () => { const f = sgF.files[0]; if (!f) return; try { const up = await S.readUpload(f); await api('uploadSignature', up); sigCache = null; st.boot = await api('bootstrap'); viewSettings(); S.toast('Signature saved.'); } catch (e) { S.fail(e); } };
    if (s.hasSignature && st.me.role !== 'member') reportSigner().then((r) => { const el = $('#sgPrev'); if (el && r.image) el.innerHTML = '<img src="' + r.image.src + '" style="height:46px;vertical-align:middle;border:1px solid var(--line);border-radius:6px;padding:2px;background:#fff">'; });
  }
  function viewTeam() {
    $('#main').innerHTML = '<div class="page-head"><div><h1 class="serif">Team</h1><div class="sub">Admins manage settings and the team. Advocates review findings and sign certificates (enrolment number is printed on the certificate). Members prepare audits.</div></div><button class="primary" data-act="edit-user">+ Add member</button></div><div class="table-wrap"><table><tr><th>Name</th><th>Email</th><th>Role</th><th>Enrolment no.</th><th>Active</th><th></th></tr>' +
      st.boot.users.map((u) => '<tr><td>' + esc(u.name) + '</td><td>' + esc(u.email) + '</td><td>' + esc(u.role) + '</td><td>' + esc(u.enrolment || '') + '</td><td>' + (u.active ? 'Yes' : 'No') + '</td><td><button class="small" data-act="edit-user" data-email="' + esc(u.email) + '">Edit</button></td></tr>').join('') + '</table></div>';
  }

  // ============================================================ actions
  const ACTIONS = {
    'reset-demo': async () => { if (await S.confirmBox('Reset demo', '<p>Restore the sample data? Everything you entered in the demo will be lost.</p>', 'Reset')) { S.resetDemo(); location.reload(); } },
    'new-client': () => clientModal(null),
    'edit-client': () => clientModal(client()),
    'new-audit': () => {
      const open = clientAudits(st.clientId).map((x) => x.framework || 'dpdpa');
      S.modal('Add an audit for ' + client().name, '<p class="small muted">Shared organisation answers are copied from the client\'s other audits.</p><div class="fw-grid">' + S.FW_ORDER.map((k) => { const f = S.fw(k); const has = open.includes(k); return '<button class="fw-card" data-fw="' + k + '"' + (has ? ' disabled' : '') + '><b>' + esc(f.name) + '</b><span>' + esc(has ? 'Already open' : f.tagline) + '</span></button>'; }).join('') + '</div>', (m) => {
        $$('[data-fw]', m).forEach((btn) => btn.onclick = async () => { if (btn.disabled) return; m.remove(); try { const a = await api('newAudit', { clientId: st.clientId, framework: btn.dataset.fw }); st.boot = await api('bootstrap'); await openClient(st.clientId, 'overview', a.id); S.toast(S.fw(a).name + ' opened.'); } catch (e) { S.fail(e); } });
      }, true);
    },
    'renewal': async (b) => { if (!(await S.confirmBox('Open renewal audit', '<p>This opens the annual re-audit. Last year\'s environment and answers are carried forward, so the client only updates what has changed and refreshes the evidence. Issued documents are carried forward too.</p>', 'Open renewal'))) return; await S.busy(b, async () => { const na = await api('newAudit', { clientId: st.clientId, framework: st.audit.framework || 'dpdpa', carryForward: true }); st.boot = await api('bootstrap'); await openClient(st.clientId, 'overview', na.id); }); },
    'stage': async (b) => { const to = b.dataset.to; const note = await S.ask('Move stage', 'Reason (recorded in the audit trail)', { ok: 'Move' }); if (!note) return; st.audit = await api('saveAudit', { auditId: st.audit.id, patch: { stage: to }, logNote: note }); await refreshBootQuiet(); viewClient(); },
    'copy-link': () => { navigator.clipboard.writeText($('#plink').value); S.toast('Link copied.'); },
    'portal-pin': async (b) => {
      const pin = String(Math.floor(100000 + Math.random() * 900000));
      await S.busy(b, async () => {
        await api('setPortal', { clientId: st.clientId, enabled: true, pin });
        await refreshKeep();
        const c = client();
        S.modal('Client portal PIN', '<p>New PIN for ' + esc(c.name) + ':</p><p style="font-size:28px;font-weight:700;letter-spacing:6px" class="mono">' + pin + '</p><p class="small muted">It is shown only now. Share it by phone or WhatsApp, separately from the link.</p><label>Portal link</label><input readonly value="' + esc(S.STUDIO_URL + 'portal.html?c=' + encodeURIComponent(c.portal.id)) + '">');
      });
    },
    'portal-toggle': async () => { const c = client(); await api('setPortal', { clientId: c.id, enabled: !(c.portal && c.portal.enabled) }); await refreshKeep(); },
    'portal-invite': async (b) => { if (!(await S.confirmBox('Email invitation', '<p>Send the portal link to the client contacts? The PIN is not included; share it separately.</p>', 'Send'))) return; await S.busy(b, async () => { const pin = String(Math.floor(100000 + Math.random() * 900000)); await api('setPortal', { clientId: st.clientId, enabled: true, pin, emailClient: true }); S.modal('Invitation sent', '<p>The link was emailed. The new PIN is:</p><p style="font-size:28px;font-weight:700;letter-spacing:6px" class="mono">' + pin + '</p><p class="small muted">Share it separately.</p>'); await refreshKeep(); }); },
    'ai-role': async (b) => { await S.busy(b, async () => { if ($('#envForm')) await saveEnv(true); const r = await api('ai', { auditId: st.audit.id, task: 'roleMemo' }); st.audit = r.audit; st.tab = 'overview'; viewClient(); }, 'SAFE AI analysing…'); },
    'save-env': async (b) => { await S.busy(b, () => saveEnv(false)); },
    'ai-followups': async (b) => {
      await S.busy(b, async () => {
        await saveResponses();
        const d = S.domainById(st.domain, st.audit.framework);
        const cs = S.applicableControls(st.audit).filter((c) => c.d === st.domain);
        const r = await api('ai', { auditId: st.audit.id, task: 'followups', domainName: d.name, controls: cs.map(ctrlPayload) });
        st.audit = r.audit;
        const qs = Array.isArray(r.result) ? r.result : [];
        const patch = {};
        qs.forEach((q) => { if (!cs.find((c) => c.id === q.controlId)) return; const cur = (patch[q.controlId] || st.audit.responses[q.controlId] || {}); const fus = (cur.followups || []).slice(); if (fus.length < 4) fus.push({ id: S.uid('q'), q: q.q, a: '', at: new Date().toISOString() }); patch[q.controlId] = { answer: cur.answer, note: cur.note, followups: fus }; });
        if (Object.keys(patch).length) st.audit = await api('saveAudit', { auditId: st.audit.id, patch: { responses: patch }, logNote: 'SAFE AI added ' + qs.length + ' follow-up question(s) in ' + d.name });
        S.toast(qs.length ? 'SAFE AI added ' + qs.length + ' follow-up question(s).' : 'SAFE AI has no follow-up questions for this area.');
        tabAssessment();
      }, 'SAFE AI thinking…');
    },
    'ai-review-all': async (b) => { await S.busy(b, async () => { const list = st.audit.evidence.filter((e) => !e.deleted && !e.review); for (const e of list) await reviewEvidence(e.id); tabAssessment(); }, 'SAFE AI reading…'); },
    'draft-doc': (b) => draftDoc(b.dataset.type, b),
    'view-doc': (b) => openDoc(b.dataset.doc),
    'approve-doc': async (b) => {
      const d = st.audit.docs.find((x) => x.id === b.dataset.doc);
      const blanks = (d.content.match(/\?\?[^?]+\?\?/g) || []).length;
      if (!(await S.confirmBox('Approve ' + d.title, '<p>You are approving this draft as SAFE Advisory.' + (blanks ? ' It still has <b>' + blanks + '</b> item(s) for the client to complete (shown in yellow).' : '') + '</p><p class="small muted">Under the independence rule, you will not be able to sign this client\'s certificate.</p>', 'Approve'))) return;
      st.audit = await api('saveAudit', { auditId: st.audit.id, patch: { docUpdates: { [d.id]: { status: 'approved', approvedBy: st.me.email, approvedAt: new Date().toISOString(), history: (d.history || []).concat([{ at: new Date().toISOString(), by: st.me.email, action: 'Approved' }]) } } }, logNote: 'Approved document: ' + d.title });
      tabDocuments();
    },
    'issue-doc': async (b) => {
      const d = st.audit.docs.find((x) => x.id === b.dataset.doc);
      const t = S.fw(st.audit).docTypes.find((x) => x.id === d.type);
      await S.busy(b, async () => {
        const issued = Object.assign({}, d, { status: 'issued', version: d.version || '1.0' });
        const blob = await docBlob(issued);
        const data = S.bytesToB64(new Uint8Array(await blob.arrayBuffer()));
        const r = await api('uploadEvidence', { auditId: st.audit.id, controlIds: t.controls, name: d.title + ' (issued by SAFE).docx', mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', data, text: d.content, source: 'safe-draft', note: 'Drafted by SAFE AI and approved by ' + d.approvedBy + '. The client must adopt it and put it into practice.' });
        const env = Object.assign({}, r.audit.env); env.existingDocs = Array.from(new Set((env.existingDocs || []).concat([d.type])));
        st.audit = await api('saveAudit', { auditId: st.audit.id, patch: { env, docUpdates: { [d.id]: { status: 'issued', issuedAt: new Date().toISOString(), version: issued.version, evidenceId: r.evidenceId, history: (d.history || []).concat([{ at: new Date().toISOString(), by: st.me.email, action: 'Issued to client' }]) } } }, logNote: 'Issued document to client: ' + d.title });
        S.toast('Issued. The client can download it in the portal; it is linked as evidence for ' + t.controls.join(', ') + '.');
        tabDocuments();
      }, 'Issuing…');
    },
    'doc-word': async (b) => { const d = st.audit.docs.find((x) => x.id === b.dataset.doc); await S.busy(b, async () => S.download(await docBlob(d), (client().name + ' - ' + d.title).replace(/[\\/:*?"<>|]/g, '-') + '.docx'), 'Building…'); },
    'doc-print': async (b) => {
      const d = st.audit.docs.find((x) => x.id === b.dataset.doc); const c = client();
      let head = '';
      if (c.letterhead && c.letterhead.kind === 'image') { try { const f = await fetchFile(c.letterhead.fileId); head = 'data:' + f.mime + ';base64,' + f.data; } catch (e) { /* print without */ } }
      S.openPrintable(d.title, S.blocksToHtml(S.composeClientDoc(c, st.audit, d)), { head });
    },
    'run-audit': (b) => runAudit(b),
    'edit-finding': (b) => editFinding(b.dataset.f),
    'review-finding': async (b) => { const f = findingById(b.dataset.f); await saveFinding(f.id, { reviewedBy: st.me.name, reviewedAt: new Date().toISOString() }, 'Advocate reviewed finding ' + f.controlId); },
    'accept-fix': async (b) => { const f = findingById(b.dataset.f); await saveFinding(f.id, { state: 'closed', closedAt: new Date().toISOString(), closedBy: 'Advocate review — ' + st.me.name, reviewedBy: st.me.name, reviewedAt: new Date().toISOString() }, 'Advocate accepted the fix for ' + f.controlId); },
    'return-fix': async (b) => { const f = findingById(b.dataset.f); const why = await S.ask('Return to client', 'What is still needed? (the client sees this)', { multiline: true, ok: 'Return' }); if (!why) return; await saveFinding(f.id, { state: 'open', needsReview: false, reviewedBy: st.me.name, verification: (f.verification || []).concat([{ verdict: 'insufficient', reason: why, remaining: why, at: new Date().toISOString(), by: st.me.name }]) }, 'Returned fix for ' + f.controlId + ': ' + why); },
    'close-finding': async (b) => { const f = findingById(b.dataset.f); const note = await S.ask('Close finding ' + f.controlId, 'Basis for closing (recorded)', { multiline: true, ok: 'Close finding' }); if (!note) return; await saveFinding(f.id, { state: 'closed', closedAt: new Date().toISOString(), closedBy: st.me.name + ' — ' + note }, 'Closed finding ' + f.controlId + ': ' + note); },
    'reopen-finding': async (b) => { const f = findingById(b.dataset.f); await saveFinding(f.id, { state: 'open', closedAt: '', closedBy: '' }, 'Reopened finding ' + f.controlId); },
    'verify-finding': async (b) => {
      const f = findingById(b.dataset.f); const c = S.controlById(f.controlId);
      await S.busy(b, async () => { const r = await api('ai', { auditId: st.audit.id, task: 'verifyRemediation', findingId: f.id, control: ctrlPayload(c) }); st.audit = r.audit; S.toast('SAFE AI: ' + r.result.verdict + ' — ' + r.result.reason, 6000); tabAudit(); }, 'SAFE AI checking…');
    },
    'report-preview': async (b) => {
      await S.busy(b, async () => {
        const kind = b.dataset.kind; const { blocks } = await reportBlocks(kind, b);
        S.openPrintable(S.fw(st.audit).name + ' (' + kind + ') — ' + client().name, S.blocksToHtml(blocks), { head: S.absUrl('assets/img/letterhead.png'), foot: S.absUrl('assets/img/footer.png'), noPrint: true });
        const blob = await reportDocx(blocks, kind);
        S.download(blob, (st.audit.ref.replace(/\//g, '-') + ' ' + kind + ' audit report (preview).docx'));
      }, 'SAFE AI writing summary…');
    },
    'report-issue': async (b) => {
      const kind = b.dataset.kind;
      if (!(await S.confirmBox('Issue ' + kind + ' report', '<p>SAFE AI will write the executive summary. The report will then be saved to the client\'s Drive folder and emailed to the client contacts.' + (kind === 'interim' ? ' The client will see the findings in the portal and the audit moves to Remediation.' : '') + '</p>', 'Issue report'))) return;
      await S.busy(b, async () => {
        const { blocks, summary } = await reportBlocks(kind, b);
        const blob = await reportDocx(blocks, kind);
        const docx = S.bytesToB64(new Uint8Array(await blob.arrayBuffer()));
        st.audit = await api('issueReport', { auditId: st.audit.id, kind, docx, summary, opinion: S.OPINIONS[S.opinion(st.audit)].label, score: S.scores(st.audit).overall, counts: S.counts(st.audit) });
        S.toast((kind === 'final' ? 'Final' : 'Interim') + ' report issued.');
        await refreshBootQuiet(); viewClient();
      }, 'Preparing report…');
    },
    'dl-file': async (b) => { await S.busy(b, async () => { const f = await fetchFile(b.dataset.file); S.download(new Blob([S.b64ToBytes(f.data)], { type: f.mime }), b.dataset.name || f.name); }); },
    'sign': async (b) => {
      const a = st.audit; const sc = S.scores(a).overall; const op = S.OPINIONS[S.opinion(a)].label;
      if (!(await S.confirmBox('Sign and issue certificate', '<p>You are signing as <b>' + esc(st.me.name) + '</b>' + (st.me.enrolment ? ' (Enrolment No. ' + esc(st.me.enrolment) + ')' : '') + ' for SAFE Legal Solutions.</p><p>Opinion: <b>' + esc(op) + '</b> · Score: <b>' + sc + '%</b> · Valid for 12 months.</p><p class="small muted">Your sign-off is recorded in the audit trail. The client is emailed the certificate number and the verification link.</p>', 'Sign and issue'))) return;
      await S.busy(b, async () => {
        const r = await api('signOff', { auditId: a.id, certTitle: S.fw(a).certTitle(S.isReadinessPeriod(a)), scope: $('#certScope').value.trim(), role: $('#certRole').value.trim(), opinion: op, score: sc });
        st.audit = r.audit; await refreshBootQuiet(); viewClient();
        S.toast('Certificate ' + r.cert.no + ' issued.');
      }, 'Signing…');
    },
    'cert-view': (b) => { const x = st.boot.certs.find((y) => y.no === b.dataset.no); S.openCertificate(x, { logo: S.absUrl('assets/img/logo.png'), verifyUrl: S.STUDIO_URL + 'verify.html?no=' + encodeURIComponent(x.no) }); },
    'cert-copy': (b) => { navigator.clipboard.writeText(S.STUDIO_URL + 'verify.html?no=' + encodeURIComponent(b.dataset.no)); S.toast('Verification link copied.'); },
    'cert-op': async (b) => { const label = { suspend: 'Suspend', reinstate: 'Reinstate', revoke: 'Revoke' }[b.dataset.op]; const reason = await S.ask(label + ' certificate ' + b.dataset.no, 'Reason (the client is told this)', { multiline: true, ok: label }); if (!reason) return; await api('certAction', { certNo: b.dataset.no, op: b.dataset.op, reason }); await refresh(); },
    'reminders': async (b) => { await S.busy(b, async () => { const r = await api('runReminders', { dryRun: !!b.dataset.dry }); S.modal(b.dataset.dry ? 'Due today (preview)' : 'Reminders sent', '<ul>' + (r.length ? r : ['Nothing due today.']).map((x) => '<li>' + esc(x) + '</li>').join('') + '</ul>'); if (!b.dataset.dry) await refresh(); }); },
    'test-ai': async (b) => { await S.busy(b, async () => { const k = $('#sKey').value.trim(); if (k) await api('saveSettings', { settings: { aiKey: k } }); const r = await api('testAi'); S.toast(r.reply); }, 'Testing…'); },
    'test-mail': async (b) => { await S.busy(b, async () => { await api('sendTestEmail'); S.toast('Test email sent to ' + st.me.email + '.'); }); },
    'save-settings': async (b) => {
      const prices = {}; $$('[data-pin]').forEach((i) => { prices[i.dataset.pin] = { in: Number(i.value), out: Number($('[data-pout="' + i.dataset.pin + '"]').value) }; });
      const s = { safeTo: $('#sTo').value, safeCc: $('#sCc').value, fromAddress: $('#sFrom').value, senderName: $('#sName').value, studioUrl: $('#sUrl').value, reminderDaysBefore: $('#rB').value, reminderIntervalDays: $('#rI').value, pulseGraceDays: $('#rP').value,
        usdInr: $('#sFx').value, budgetAlertPct: $('#bA').value, budgets: { small: Number($('#bS').value), mid: Number($('#bM').value), large: Number($('#bL').value) }, requireIndependence: $('#sInd').checked, prices: Object.assign({}, st.boot.settings.prices, prices), signatoryName: $('#sgN').value.trim(), signatoryTitle: $('#sgT').value.trim(), signatoryEnrolment: $('#sgE').value.trim(), reportIssuers: $('#sgW').value };
      const k = $('#sKey').value.trim(); if (k) s.aiKey = k;
      await S.busy(b, async () => { await api('saveSettings', { settings: s }); await refresh(); S.toast('Settings saved.'); });
    },
    'edit-user': (b) => {
      const u = b.dataset.email ? st.boot.users.find((x) => x.email === b.dataset.email) : { role: 'member', active: true };
      S.modal(u.email ? 'Edit ' + u.name : 'Add team member', '<div class="grid2"><div><label>Name</label><input id="uN" value="' + esc(u.name || '') + '"></div><div><label>Email</label><input id="uE" value="' + esc(u.email || '') + '"' + (u.email ? ' disabled' : '') + '></div><div><label>Role</label><select id="uR">' + ['admin', 'advocate', 'member'].map((r) => '<option' + (u.role === r ? ' selected' : '') + '>' + r + '</option>').join('') + '</select></div><div><label>Bar enrolment no. (advocates)</label><input id="uEn" value="' + esc(u.enrolment || '') + '"></div><div><label>' + (u.email ? 'New temporary PIN (optional)' : 'Temporary 6-digit PIN') + '</label><input id="uP" inputmode="numeric" maxlength="6"></div><div><label>Active</label><select id="uA"><option value="1"' + (u.active ? ' selected' : '') + '>Yes</option><option value="0"' + (!u.active ? ' selected' : '') + '>No</option></select></div></div><div class="row" style="justify-content:flex-end;margin-top:12px"><button data-close>Cancel</button><button class="primary" id="uSave">Save</button></div>', (m) => {
        $('#uSave', m).onclick = async () => { try { await api('saveUser', { user: { email: $('#uE', m).value.trim(), name: $('#uN', m).value.trim(), role: $('#uR', m).value, enrolment: $('#uEn', m).value.trim(), pin: $('#uP', m).value.trim(), active: $('#uA', m).value === '1' } }); m.remove(); await refresh(); } catch (e) { S.fail(e); } };
      });
    }
  };

  async function saveEnv(quiet) {
    const env = S.readEnvForm($('#envForm'), st.audit);
    st.audit = await api('saveAudit', { auditId: st.audit.id, patch: { env }, logNote: quiet ? '' : 'SAFE updated the environment assessment' });
    if (!quiet) { S.toast('Saved.'); tabEnvironment(); }
  }

  function clientModal(c) {
    c = c || { contacts: [{}] };
    const contacts = (c.contacts && c.contacts.length ? c.contacts : [{}]).concat([{}]).slice(0, 4);
    S.modal(c.id ? 'Client details' : 'New client', '<div class="grid2"><div><label class="req">Short name</label><input id="cN" value="' + esc(c.name || '') + '"></div><div><label>Legal name</label><input id="cL" value="' + esc(c.legalName || '') + '"></div><div><label>Industry</label><select id="cI"><option value="">Choose…</option>' + S.INDUSTRIES.map((i) => '<option' + (c.industry === i ? ' selected' : '') + '>' + esc(i) + '</option>').join('') + '</select></div><div><label>Website</label><input id="cW" value="' + esc(c.website || '') + '"></div>' +
      '<div><label>Size tier (sets the SAFE AI budget)</label><select id="cT"><option value="">Automatic from the assessment</option>' + Object.entries(S.TIERS).map(([k, t]) => '<option value="' + k + '"' + (c.tier === k ? ' selected' : '') + '>' + t.label + ' (suggested fee line ' + S.inr(t.feeInr) + ')</option>').join('') + '</select></div><div><label>Client-specific SAFE AI budget ₹ (optional)</label><input id="cB" value="' + esc(c.budgetInr || '') + '"></div></div>' +
      (c.id ? '' : '<h3 style="margin-top:14px">Audits to open</h3><div class="checks">' + S.FW_ORDER.map((k) => '<label><input type="checkbox" data-newfw="' + k + '"' + (k === 'dpdpa' ? ' checked' : '') + '> ' + esc(S.fw(k).name) + '</label>').join('') + '</div>') + '<h3 style="margin-top:14px">Client contacts (receive portal emails, reports and reminders)</h3>' + contacts.map((x, i) => '<div class="grid3" data-contact="' + i + '"><input placeholder="Name" value="' + esc(x.name || '') + '"><input placeholder="Email" value="' + esc(x.email || '') + '"><input placeholder="Role" value="' + esc(x.role || '') + '"></div>').join('') +
      '<div class="row" style="justify-content:flex-end;margin-top:12px"><button data-close>Cancel</button><button class="primary" id="cSave">' + (c.id ? 'Save' : 'Create client and open audits') + '</button></div>', (m) => {
      $('#cSave', m).onclick = async () => {
        const name = $('#cN', m).value.trim(); if (!name) { S.toast('Enter a name.'); return; }
        const payload = { id: c.id, name, legalName: $('#cL', m).value.trim(), industry: $('#cI', m).value, website: $('#cW', m).value.trim(), tier: $('#cT', m).value, budgetInr: Number($('#cB', m).value) || 0,
          contacts: $$('[data-contact]', m).map((r) => { const i = $$('input', r); return { name: i[0].value.trim(), email: i[1].value.trim(), role: i[2].value.trim() }; }).filter((x) => x.email) };
        try {
          const saved = await api('saveClient', { client: payload });
          m.remove();
          let firstAudit = null;
          if (!c.id) { const fws = $$('[data-newfw]:checked', m).map((x) => x.dataset.newfw); for (const k of fws) { const na = await api('newAudit', { clientId: saved.id, framework: k }); firstAudit = firstAudit || na.id; } }
          st.boot = await api('bootstrap');
          await openClient(saved.id, 'overview', firstAudit);
        } catch (e) { S.fail(e); }
      };
    }, true);
  }

  // ============================================================ start
  if (st.token) boot().catch(() => showLogin()); else showLogin();
})();
