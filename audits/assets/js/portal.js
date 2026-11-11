/* SAFE Legal Workplace Compliance Audits — client portal */
(function () {
  const S = window.SAFE;
  const { $, $$, esc } = S;
  const portalId = new URLSearchParams(location.search).get('c') || (S.DEMO ? 'demo-nimbus' : '');
  const st = { session: sessionStorage.getItem('dpdpa_ps_' + portalId) || '', who: localStorage.getItem('dpdpa_who') || '', view: null, page: 'home', domain: '', chat: [] };
  const ctrlPayload = (c) => ({ id: c.id, t: c.t, req: c.req, ref: c.ref, ev: c.ev, pri: c.pri });

  const api = (action, payload) => S.call(action, Object.assign({ session: st.session, who: st.who, auditId: st.auditId || (st.view && st.view.audit && st.view.audit.id) || '' }, payload || {})).catch((e) => {
    if (/^AUTH/.test(e.message)) { sessionStorage.removeItem('dpdpa_ps_' + portalId); st.session = ''; showLogin(e.message.replace(/^AUTH:\s*/, '')); }
    throw e;
  });
  const audit = () => st.view && st.view.audit;
  const ai = (task, extra) => api('portalAi', Object.assign({ task, auditId: audit().id }, extra || {})).then((r) => { if (r.view) st.view = r.view; return r.result; });
  const fetchFile = (fileId) => api('portalGetFile', { fileId });

  // ============================================================ login
  function showLogin(msg) {
    $('#logout').hidden = true; $('#fab').hidden = true; $('#who').textContent = '';
    $('#demoFlag').hidden = !S.DEMO;
    $('#main').innerHTML = '<div class="card login-card"><img src="assets/img/logo.png" alt=""><h1 class="serif" style="color:var(--maroon);margin-top:8px">Compliance Audit Portal</h1><p class="muted">SAFE Legal Solutions guides your organisation through its workplace compliance audits: data protection, labour, POSH and DEI, corporate and contract compliance.</p>' +
      (portalId ? '' : '<div class="banner">This link is incomplete. Please use the link SAFE Legal sent you.</div>') + (msg ? '<div class="banner">' + esc(msg) + '</div>' : '') +
      '<form id="pl" style="text-align:left"><label>Your name (recorded against your answers)</label><input id="pn" required value="' + esc(st.who) + '"><label>6-digit PIN from SAFE Legal</label><input id="pp" type="password" inputmode="numeric" maxlength="6" required><button class="primary" style="width:100%;justify-content:center;margin-top:14px">Open portal</button></form>' +
      (S.DEMO ? '<p class="small muted" style="margin-top:12px">Demo: PIN 123456.</p>' : '') + '</div>';
    $('#pl').onsubmit = async (e) => {
      e.preventDefault();
      st.who = $('#pn').value.trim(); localStorage.setItem('dpdpa_who', st.who);
      await S.busy(e.target.querySelector('button'), async () => {
        const r = await S.call('portalLogin', { portalId, pin: $('#pp').value.trim() });
        st.session = r.session; sessionStorage.setItem('dpdpa_ps_' + portalId, r.session); st.view = r.view; st.page = 'home'; render();
      }, 'Opening…');
    };
  }
  $('#logout').onclick = async () => { try { await api('portalLogout'); } catch (e) { /* ignore */ } sessionStorage.removeItem('dpdpa_ps_' + portalId); st.session = ''; showLogin(); };

  // ============================================================ shell
  function render() {
    $('#logout').hidden = false; $('#fab').hidden = !audit(); $('#demoFlag').hidden = !S.DEMO;
    $('#who').textContent = st.who + ' · ' + st.view.client.name;
    const a = audit();
    const pages = [['home', 'Overview'], ['environment', 'About your organisation'], ['assessment', 'Assessment'], ['documents', 'Documents']];
    if (a && a.findings && a.findings.length) pages.push(['findings', 'Findings']);
    if (st.view.certs.length) pages.push(['certificate', 'Certificate']);
    $('#main').innerHTML = '<div class="hero"><img src="assets/img/logo.png" alt="" style="height:64px"><div style="flex:1"><h1 class="serif">' + esc(st.view.client.legalName || st.view.client.name) + '</h1><div class="muted">' + (a ? esc(S.fw(a).name) + ' ' + esc(a.ref) + ' · ' + (a.type === 'renewal' ? 'annual re-audit' : 'initial audit') : 'No audit open yet') + '</div></div>' + (a ? S.gauge(S.scores(a).overall, 'Readiness score', 'updates as you answer') : '') + '</div>' +
      ((st.view.audits || []).length > 1 ? S.auditSwitcher(st.view.audits, a && a.id, false) : '') + (a ? S.stepper(a.stage) : '') + '<div class="tabs">' + pages.map(([id, l]) => '<button data-page="' + id + '" class="' + (st.page === id ? 'on' : '') + '">' + l + '</button>').join('') + '</div><div id="pg"></div>';
    $$('[data-page]').forEach((b) => b.onclick = () => { st.page = b.dataset.page; render(); window.scrollTo(0, 0); });
    $$('[data-audit]').forEach((b) => b.onclick = () => S.busy(b, async () => { st.auditId = b.dataset.audit; st.domain = ''; st.view = await api('portalLoad', { auditId: st.auditId }); st.page = 'home'; render(); }));
    if (!a && st.page !== 'certificate') { $('#pg').innerHTML = '<div class="empty">SAFE Legal will open your audit shortly.</div>'; return; }
    ({ home: pgHome, environment: pgEnv, assessment: pgAssessment, documents: pgDocs, findings: pgFindings, certificate: pgCert })[st.page]();
  }
  const go = (p) => { st.page = p; render(); window.scrollTo(0, 0); };

  // ------------------------------------------------------------ home
  function pgHome() {
    const a = audit();
    const comp = S.envCompleteness(a);
    const p = S.assessmentProgress(a);
    const open = (a.findings || []).filter((f) => ['major', 'minor', 'ofi'].includes(f.grade) && f.state !== 'closed');
    const cert = st.view.certs.slice(-1)[0];
    const pulse = pulseDue();
    let next;
    if (a.stage === 'onboarding' || a.stage === 'environment') next = ['Tell us about your organisation', comp.done + ' of ' + comp.total + ' required answers given. This decides which obligations under this audit apply to you.', 'environment', 'Start'];
    else if (a.stage === 'assessment') next = ['Answer the ' + S.fw(a).short + ' assessment', p.answered + ' of ' + p.total + ' questions answered. Upload evidence as you go; SAFE AI reads each file and tells you if it is enough.', 'assessment', 'Continue'];
    else if (a.stage === 'audit') next = ['SAFE is auditing your answers', 'SAFE AI and a SAFE advocate are reviewing your answers and evidence. You will receive the interim audit report by email.', '', ''];
    else if (a.stage === 'remediation') next = ['Fix the findings', open.length + ' finding(s) are open. Assign an owner and a date to each one, then upload proof. SAFE AI checks each fix.', 'findings', 'Open findings'];
    else if (a.stage === 'signoff') next = ['Final review', 'A SAFE advocate is completing the final review before issuing your certificate.', '', ''];
    else next = ['You are certified', cert ? 'Certificate ' + cert.no + ' is valid until ' + S.fmtDate(cert.validUntil) + '. Your next audit is due by ' + S.fmtDate(cert.nextAuditDue || cert.validUntil) + '.' : '', 'certificate', 'View certificate'];
    const memo = a.roleMemo;
    $('#pg').innerHTML = (pulse ? '<div class="next" style="background:var(--amber)"><div><h2>Quarterly pulse check due</h2><p>Two minutes: confirm nothing material has changed since certification.</p></div><button data-go="certificate">Complete it</button></div>' : '') +
      '<div class="next"><div><h2>' + esc(next[0]) + '</h2><p>' + esc(next[1]) + '</p></div>' + (next[2] ? '<button data-go="' + next[2] + '">' + esc(next[3]) + '</button>' : '') + '</div>' +
      '<div class="cols"><div class="stack">' + (memo ? '<div class="card"><div class="head"><h2>Where you stand: ' + esc(S.fw(a).short) + '</h2></div><div class="ai-box"><div class="lbl">SAFE AI</div><p style="margin:0 0 6px"><b>' + esc(memo.role) + '.</b> ' + esc(memo.summary) + '</p>' + (memo.priorityAreas ? '<p class="small"><b>Focus first on:</b> ' + esc(memo.priorityAreas.join(', ')) + '</p>' : '') + '</div></div>' : '') +
      '<div class="card"><div class="head"><h2>How this works</h2></div><ol class="small" style="margin:0;padding-left:18px;line-height:1.7"><li><b>About your organisation</b> — about 15 minutes. It tells SAFE AI which parts of the law apply to you.</li><li><b>Assessment</b> — guided questions on each obligation, with follow-up questions from SAFE AI. Upload policies, screenshots or records as evidence.</li><li><b>Documents</b> — if you do not have a required policy or notice, SAFE AI drafts it on your letterhead for SAFE\'s advocates to review.</li><li><b>Audit</b> — SAFE grades every control as <b>Must have</b>, <b>Should have</b> or <b>Might have</b> and issues an interim report.</li><li><b>Findings</b> — you fix the gaps; SAFE AI verifies each fix.</li><li><b>Certificate</b> — a SAFE advocate signs your certificate, valid for 12 months, with quarterly check-ins and a reminder 60 days before renewal.</li></ol></div></div>' +
      '<div class="stack">' + (S.scores(a).domains.length ? '<div class="card"><div class="head"><h2>Your score by area</h2></div>' + S.domainBars(S.scores(a)) + '</div>' : '') +
      ((a.reports || []).length ? '<div class="card"><div class="head"><h2>Reports</h2></div>' + a.reports.map((r) => '<div class="list-row"><span>' + (r.kind === 'final' ? 'Final' : 'Interim') + ' audit report · ' + S.fmtDate(r.at) + '</span>' + (r.htmlId ? '<button class="small" data-dl="' + r.htmlId + '" data-name="' + esc(a.ref.replace(/\//g, '-') + ' ' + r.kind + ' audit report.docx') + '">Download</button>' : '') + '</div>').join('') + '</div>' : '') +
      '<div class="card"><div class="head"><h2>SAFE AI</h2></div><p class="small">Ask SAFE AI anything about the law and your audit, at any time, using the button at the bottom right. SAFE\'s advocates confirm every conclusion in your audit report.</p><p class="small muted">SAFE AI usage on this audit: ' + S.inr(a.aiBudget.usedInr) + (a.aiBudget.budgetInr ? ' of ' + S.inr(a.aiBudget.budgetInr) + ' included' : '') + '.</p></div></div></div>';
    wireCommon();
  }
  function wireCommon() {
    $$('[data-go]').forEach((b) => b.onclick = () => go(b.dataset.go));
    $$('[data-dl]').forEach((b) => b.onclick = () => S.busy(b, async () => { const f = await fetchFile(b.dataset.dl); S.download(new Blob([S.b64ToBytes(f.data)], { type: f.mime }), b.dataset.name || f.name); }));
  }

  // ------------------------------------------------------------ environment
  function pgEnv() {
    const a = audit();
    const editable = ['onboarding', 'environment', 'assessment'].includes(a.stage);
    const comp = S.envCompleteness(a);
    $('#pg').innerHTML = '<div class="card" style="margin-bottom:12px"><div class="head"><h2>About your organisation</h2><span class="pill ' + (comp.done === comp.total ? 'green' : 'amber') + '">' + comp.done + '/' + comp.total + ' required</span></div><p class="small muted">Answer as accurately as you can. If you are not sure, give your best answer and add a note; SAFE will follow up. Your answers decide which obligations apply and what SAFE AI drafts for you.</p>' + (editable ? '' : '<p class="small"><b>Locked</b> while SAFE audits your answers.</p>') + '</div>' +
      '<div id="envForm">' + S.envForm(a, editable) + '</div>' + (editable ? '<div class="row" style="justify-content:flex-end"><button id="envSave">Save</button>' + (['onboarding', 'environment'].includes(a.stage) ? '<button class="primary" id="envSubmit">Save and continue to the assessment →</button>' : '') + '</div>' : '');
    if (!editable) return;
    $('#envSave').onclick = (e) => S.busy(e.target, async () => { await saveEnv(); S.toast('Saved.'); render(); });
    const sub = $('#envSubmit');
    if (sub) sub.onclick = (e) => S.busy(e.target, async () => {
      await saveEnv();
      const c = S.envCompleteness(audit());
      if (c.missing.length) { S.modal('A few answers are missing', '<p>Please answer these before continuing:</p><ul>' + c.missing.map((m) => '<li>' + esc(m) + '</li>').join('') + '</ul>'); return; }
      st.view = await api('portalSubmit', { what: 'environment' });
      S.toast('Thank you. SAFE AI is assessing which obligations apply…');
      try { await ai('roleMemo'); } catch (err) { console.warn(err); }
      go('home');
    }, 'Saving…');
  }
  async function saveEnv() { st.view = await api('portalSave', { patch: { env: S.readEnvForm($('#envForm'), audit()) } }); }

  // ------------------------------------------------------------ assessment
  function pgAssessment() {
    const a = audit();
    if (['onboarding', 'environment'].includes(a.stage)) { $('#pg').innerHTML = '<div class="empty">Please complete <a href="#" data-go="environment">About your organisation</a> first.</div>'; wireCommon(); return; }
    const editable = ['assessment', 'remediation'].includes(a.stage) && a.stage === 'assessment';
    const ctrls = S.applicableControls(a);
    const doms = S.fw(a).domains.filter((d) => ctrls.some((c) => c.d === d.id));
    if (!st.domain || !doms.some((d) => d.id === st.domain)) st.domain = doms[0].id;
    const p = S.assessmentProgress(a);
    const dom = S.domainById(st.domain, a.framework);
    const di = doms.findIndex((d) => d.id === st.domain);
    $('#pg').innerHTML = '<div class="card" style="margin-bottom:12px"><div class="head"><h2>' + esc(S.fw(a).short) + ' assessment</h2><span class="small">' + p.answered + '/' + p.total + ' answered · evidence on ' + p.evidenceGiven + '/' + p.evidenceNeeded + '</span></div><div class="progress"><div style="width:' + (p.total ? (p.answered / p.total) * 100 : 0) + '%"></div></div>' +
      '<p class="small muted">Each question is labelled <b style="color:var(--red)">Must have</b> (required by law), <b style="color:var(--amber)">Should have</b> (expected practice) or <b style="color:var(--blue)">Might have</b> (good practice). Answers save automatically. Answering "Yes" needs evidence: upload a policy, screenshot, contract or record and SAFE AI will check it.</p>' +
      (editable ? '<div class="row"><button id="fuBtn">✦ SAFE AI: ask me follow-up questions for this area</button>' + (p.answered === p.total ? '<button class="primary" id="subA">Submit the assessment to SAFE</button>' : '') + '</div>' : '<p class="small"><b>Locked</b> while SAFE audits your answers.</p>') + '</div>' +
      '<div class="domain-list">' + S.domainNav(a, ctrls, st.domain) + '<div id="ctrls"><h2 class="serif" style="color:var(--maroon);margin-bottom:10px">' + esc(dom.name) + '</h2>' + ctrls.filter((c) => c.d === st.domain).map((c) => S.controlCard(c, a, { editable, askable: true })).join('') +
      '<div class="row" style="justify-content:space-between">' + (di > 0 ? '<button data-dom="' + doms[di - 1].id + '">← ' + esc(doms[di - 1].name) + '</button>' : '<span></span>') + (di < doms.length - 1 ? '<button class="primary" data-dom="' + doms[di + 1].id + '">' + esc(doms[di + 1].name) + ' →</button>' : '') + '</div></div></div>';
    $$('[data-domain],[data-dom]').forEach((b) => b.onclick = async () => { await saveResponses(); st.domain = b.dataset.domain || b.dataset.dom; render(); window.scrollTo(0, 0); });
    wireControls($('#ctrls'));
    const fu = $('#fuBtn');
    if (fu) fu.onclick = () => S.busy(fu, async () => {
      await saveResponses();
      const cs = ctrls.filter((c) => c.d === st.domain);
      const qs = await ai('followups', { domainName: dom.name, controls: cs.map(ctrlPayload) });
      const patch = {};
      (Array.isArray(qs) ? qs : []).forEach((q) => { const c = cs.find((x) => x.id === q.controlId); if (!c) return; const cur = patch[c.id] || audit().responses[c.id] || {}; const fus = (cur.followups || []).slice(); if (fus.length < 4) fus.push({ id: S.uid('q'), q: q.q, a: '', at: new Date().toISOString() }); patch[c.id] = { answer: cur.answer, note: cur.note, followups: fus }; });
      if (Object.keys(patch).length) st.view = await api('portalSave', { patch: { responses: patch } });
      S.toast(Object.keys(patch).length ? 'SAFE AI added follow-up questions below. Please answer them.' : 'SAFE AI has no further questions for this area.');
      render();
    }, 'SAFE AI thinking…');
    const sa = $('#subA');
    if (sa) sa.onclick = async () => {
      await saveResponses();
      const pp = S.assessmentProgress(audit());
      const missingEv = pp.evidenceNeeded - pp.evidenceGiven;
      const docs = S.missingDocs(audit()).filter((d) => !(audit().docs || []).some((x) => x.type === d.id));
      if (!(await S.confirmBox('Submit the assessment', '<p>Once submitted, your answers are locked while SAFE audits them.</p>' + (missingEv ? '<p><b>' + missingEv + '</b> answer(s) of Yes or Partly have no evidence yet. These will be graded as not fully demonstrated.</p>' : '') + (docs.length ? '<p>You also have <b>' + docs.length + '</b> required document(s) missing. You can ask SAFE AI to draft them on the Documents tab first.</p>' : ''), 'Submit to SAFE'))) return;
      await S.busy(sa, async () => { st.view = await api('portalSubmit', { what: 'assessment' }); S.toast('Submitted. SAFE will email you the interim audit report.'); go('home'); });
    };
  }
  let saveTimer = null;
  function wireControls(rootEl) {
    S.wireSeg(rootEl);
    const schedule = () => { clearTimeout(saveTimer); saveTimer = setTimeout(() => saveResponses().catch(S.fail), 800); };
    rootEl.addEventListener('changed', schedule);
    $$('textarea', rootEl).forEach((t) => t.addEventListener('input', schedule));
    $$('[data-upload]', rootEl).forEach((inp) => inp.onchange = () => upload([inp.dataset.upload], inp.files).then(render));
    $$('[data-askai]', rootEl).forEach((b) => b.onclick = () => openChat('About ' + b.dataset.askai + ': ', b.dataset.askai));
  }
  async function saveResponses() {
    const box = $('#ctrls'); if (!box || !audit()) return;
    const patch = S.readControlEdits(box, audit());
    if (!Object.keys(patch).length) return;
    st.view = await api('portalSave', { patch: { responses: patch } });
    const nav = $('.domain-nav');
    if (nav) { nav.outerHTML = S.domainNav(audit(), S.applicableControls(audit()), st.domain); $$('[data-domain]').forEach((b) => b.onclick = async () => { await saveResponses(); st.domain = b.dataset.domain; render(); }); }
  }
  async function upload(controlIds, files, note) {
    const ids = [];
    for (const f of Array.from(files || [])) {
      if (f.size > 20 * 1024 * 1024) { S.toast(f.name + ' is over 20 MB. Please upload a smaller file.'); continue; }
      S.toast('Uploading ' + f.name + '…');
      try {
        const up = await S.readUpload(f);
        const r = await api('portalUpload', Object.assign({ controlIds, note: note || '' }, up));
        st.view = r.view; ids.push(r.evidenceId);
        S.toast('SAFE AI is reading ' + f.name + '…');
        const res = await ai('reviewEvidence', { evidenceId: r.evidenceId, controls: controlIds.map(S.controlById).filter(Boolean).map(ctrlPayload) });
        S.toast('SAFE AI: ' + res.verdict + ' — ' + (res.summary || ''), 7000);
      } catch (e) { S.fail(e); }
    }
    return ids;
  }

  // ------------------------------------------------------------ documents
  function pgDocs() {
    const a = audit();

    const have = (a.env && a.env.existingDocs) || [];
    const editable = a.stage === 'assessment' || a.stage === 'remediation';
    const types = S.docTypesFor(a);
    $('#pg').innerHTML = '<div class="card" style="margin-bottom:12px"><div class="head"><h2>Policies and documents expected for ' + esc(S.fw(a).short) + '</h2></div><p class="small muted">If you already have a document, upload it as evidence in the Assessment. If you do not, ask SAFE AI to draft it. Each draft is written for your business from your answers. SAFE\'s advocates review it before it is released to you on your letterhead.</p></div>' +
      types.map((t) => {
        const d = (a.docs || []).find((x) => x.type === t.id);
        const status = d ? (d.status === 'draft' ? '<span class="pill amber">Drafted — awaiting SAFE review</span>' : '<span class="pill green">' + (d.status === 'issued' ? 'Issued to you' : 'Approved by SAFE') + '</span>') : have.includes(t.id) ? '<span class="pill blue">You have your own</span>' : '<span class="pill red">Missing</span>';
        return '<div class="card" style="margin-bottom:10px"><div class="head"><div><h3>' + esc(t.title) + '</h3><div class="small muted">' + esc(t.audience) + '</div></div>' + status + '</div><div class="row">' +
          (d && d.status !== 'draft' ? '<button class="primary" data-word="' + d.id + '">Download Word on your letterhead</button><button data-print="' + d.id + '">Print / PDF</button>' : '') +
          (d && d.status === 'draft' ? '<button data-preview="' + d.id + '">Preview draft</button>' : '') +
          (!d && editable ? '<button ' + (have.includes(t.id) ? '' : 'class="primary" ') + 'data-draft="' + t.id + '">✦ Ask SAFE AI to draft it</button>' : '') + '</div></div>';
      }).join('');
    $$('[data-draft]').forEach((b) => b.onclick = async () => {
      const t = S.fw(audit()).docTypes.find((x) => x.id === b.dataset.draft);
      const ins = await S.ask('Draft ' + t.title, 'Anything SAFE AI should know? (optional — leave blank and press Draft)', { multiline: true, ok: 'Draft' });
      if (ins === null) return;
      await S.busy(b, async () => { await ai('draftDoc', { doc: t, controls: t.controls.map(S.controlById).filter(Boolean).map(ctrlPayload), instructions: ins }); S.toast('Drafted. SAFE\'s advocates have been asked to review it.'); render(); }, 'SAFE AI drafting…');
    });
    const docOf = (id) => audit().docs.find((x) => x.id === id);
    $$('[data-preview]').forEach((b) => b.onclick = () => { const d = docOf(b.dataset.preview); S.modal(d.title, '<div class="docview">' + S.blocksToHtml(S.composeClientDoc(st.view.client, audit(), d)) + '</div>', null, true); });
    $$('[data-word]').forEach((b) => b.onclick = () => S.busy(b, async () => {
      const d = docOf(b.dataset.word);
      const lh = await S.clientLetterhead(st.view.client, fetchFile).catch(() => null);
      const blob = await S.buildDocx(S.composeClientDoc(st.view.client, audit(), d), { letterhead: lh, companyName: st.view.client.legalName || st.view.client.name, accent: '333333', headFill: 'EDEDED', title: d.title });
      S.download(blob, (st.view.client.name + ' - ' + d.title).replace(/[\\/:*?"<>|]/g, '-') + '.docx');
    }, 'Building…'));
    $$('[data-print]').forEach((b) => b.onclick = async () => {
      const d = docOf(b.dataset.print); const lh = st.view.client.letterhead;
      let head = ''; if (lh && lh.kind === 'image') { try { const f = await fetchFile(lh.fileId); head = 'data:' + f.mime + ';base64,' + f.data; } catch (e) { /* none */ } }
      S.openPrintable(d.title, S.blocksToHtml(S.composeClientDoc(st.view.client, audit(), d)), { head });
    });
  }

  // ------------------------------------------------------------ findings
  function pgFindings() {
    const a = audit();
    const order = ['major', 'minor', 'ofi'];
    const list = (a.findings || []).filter((f) => order.includes(f.grade)).sort((x, y) => (x.state === 'closed') - (y.state === 'closed') || order.indexOf(x.grade) - order.indexOf(y.grade));
    const sys = S.systemicFindings(a);
    const k = S.counts(a);
    const editable = a.stage === 'remediation';
    $('#pg').innerHTML = '<div class="kpis">' + '<div class="kpi red"><div class="v">' + k.majorOpen + '</div><div class="l">Must have — open</div></div><div class="kpi amber"><div class="v">' + k.minorOpen + '</div><div class="l">Should have — open</div></div><div class="kpi"><div class="v">' + k.ofiOpen + '</div><div class="l">Might have — open</div></div><div class="kpi green"><div class="v">' + list.filter((f) => f.state === 'closed').length + '</div><div class="l">Closed</div></div></div>' +
      '<div class="card" style="margin-bottom:12px"><p class="small" style="margin:0"><b>Must have</b> findings must be fixed before SAFE can issue your certificate. <b>Should have</b> findings need an owner and a plan. <b>Might have</b> findings are suggestions. For each one, record who owns it and by when. Then describe the fix and upload proof; SAFE AI checks it and closes the finding when it is satisfied.</p></div>' +
      sys.map((f) => '<div class="find major"><div class="top"><div class="t">' + esc(f.title) + '</div>' + S.gradePill('major') + '</div><div class="body">' + esc(f.observation) + '<br><i>' + esc(f.recommendation) + '</i></div></div>').join('') +
      list.map((f) => {
        const c = S.controlById(f.controlId) || {};
        const ver = (f.verification || []).slice(-1)[0];
        return '<div class="find ' + f.grade + '" data-fid="' + f.id + '"><div class="top"><div><div class="t">' + esc(f.controlId) + ' — ' + esc(f.title || c.t) + '</div><div class="small muted">' + esc(c.ref || '') + '</div></div><div class="row">' + S.gradePill(f.grade) + S.statePill(f.state) + '</div></div>' +
          '<div class="body"><div><b>What we found</b><br>' + esc(f.observation) + '</div>' + (f.recommendation ? '<div><b>What to do</b><br>' + esc(f.recommendation) + '</div>' : '') +
          (ver ? '<div class="ai-box"><div class="lbl">SAFE AI check</div>' + esc(ver.verdict === 'closed' ? 'Fix accepted.' : 'Not yet sufficient.') + ' ' + esc(ver.reason || '') + (ver.remaining ? '<br><b>Still needed:</b> ' + esc(ver.remaining) : '') + '</div>' : '') +
          (f.state !== 'closed' && editable ? '<div class="grid2"><div><label>Owner in your team</label><input data-owner value="' + esc(f.owner || '') + '"></div><div><label>Target date</label><input type="date" data-due value="' + esc(f.dueDate || '') + '"></div></div><label>What you did to fix it</label><textarea data-fix rows="2"></textarea><div class="row" style="margin-top:6px"><label class="btn small" style="margin:0">Attach proof<input type="file" data-proof hidden></label><span class="small muted" data-proofname></span><button class="primary small" data-submitfix>Submit fix for SAFE AI check</button><button class="small" data-saveplan>Save owner and date</button></div>' : '') +
          '</div></div>';
      }).join('') + (editable && k.majorOpen === 0 ? '<div class="next"><div><h2>All Must-have findings are closed</h2><p>Tell SAFE you are ready for final review and sign-off.</p></div><button id="ready">Request final review</button></div>' : '');
    $$('[data-fid]').forEach((card) => {
      const id = card.dataset.fid; const f = a.findings.find((x) => x.id === id);
      const proof = $('[data-proof]', card); let file = null;
      if (proof) proof.onchange = () => { file = proof.files[0]; $('[data-proofname]', card).textContent = file ? file.name : ''; };
      const sp = $('[data-saveplan]', card);
      if (sp) sp.onclick = () => S.busy(sp, async () => { st.view = await api('portalFinding', { findingId: id, owner: $('[data-owner]', card).value, dueDate: $('[data-due]', card).value }); S.toast('Saved.'); render(); });
      const sf = $('[data-submitfix]', card);
      if (sf) sf.onclick = () => S.busy(sf, async () => {
        const note = $('[data-fix]', card).value.trim();
        if (!note && !file) { S.toast('Describe the fix or attach proof.'); return; }
        let evId = '';
        if (file) { const ids = await upload([f.controlId], [file], 'Proof for finding ' + f.controlId); evId = ids[0] || ''; }
        st.view = await api('portalFinding', { findingId: id, owner: $('[data-owner]', card).value, dueDate: $('[data-due]', card).value, note, evidenceId: evId });
        const r = await ai('verifyRemediation', { findingId: id, control: ctrlPayload(S.controlById(f.controlId)) });
        S.toast(r.verdict === 'closed' ? 'SAFE AI accepted the fix.' : 'SAFE AI: ' + (r.reason || 'more is needed.'), 7000);
        render();
      }, 'SAFE AI checking…');
    });
    const rd = $('#ready');
    if (rd) rd.onclick = () => S.busy(rd, async () => { st.view = await api('portalSubmit', { what: 'remediation' }); S.toast('SAFE has been told you are ready for final review.'); render(); });
  }

  // ------------------------------------------------------------ certificate and pulse
  const PULSE = {
    dpdpa: [['breach', 'A personal data breach or cyber incident'], ['systems', 'A new system or app that holds personal data'], ['data', 'A new category of personal data (for example health, children, biometrics)'], ['vendors', 'New vendors, or personal data moved outside India'], ['merger', 'A merger, acquisition or major restructuring']],
    labour: [['breach', 'A serious workplace accident, labour inspection order, strike or labour dispute'], ['systems', 'A new establishment, factory or state of operation'], ['data', 'Headcount crossing 20, 50, 100 or 300'], ['vendors', 'New contractors or contract labour'], ['merger', 'A merger, acquisition, retrenchment or closure']],
    poshdei: [['breach', 'A POSH complaint not resolved within 90 days, or a discrimination claim or notice'], ['systems', 'A change in Internal Committee members or the external member'], ['data', 'A new office or branch'], ['vendors', 'A change in grievance or complaint officers'], ['merger', 'A merger, acquisition or major restructuring']],
    corporate: [['breach', 'A regulatory notice, penalty, raid or prosecution'], ['systems', 'A new licence, business line or location'], ['data', 'Foreign investment received or made'], ['vendors', 'A material new litigation'], ['merger', 'A merger, acquisition or change in control']],
    contract: [['breach', 'A material contract dispute, claim or termination'], ['systems', 'A change in contract templates or the signing process'], ['data', 'A new category of contract (for example foreign, consumer, financing)'], ['vendors', 'A new critical vendor'], ['merger', 'A merger, acquisition or change in control']]
  };
  function pulseDue() {
    for (const cert of st.view.certs.filter((x) => x.status === 'valid')) {
      const due = (cert.pulseDue || []).filter((d) => d <= S.today()).slice(-1)[0];
      if (!due) continue;
      const answered = (cert.pulses || []).some((p) => String(p.at).slice(0, 10) >= due);
      if (!answered) return { cert, due };
    }
    return null;
  }
  function pgCert() {
    const certs = st.view.certs.slice().reverse();
    const a = audit();
    const pulse = pulseDue();
    $('#pg').innerHTML = (pulse ? '<div class="card" style="margin-bottom:12px;border-top:3px solid var(--amber)"><div class="head"><h2>Quarterly pulse check — ' + esc(pulse.cert.title || S.fw(pulse.cert.framework).short) + '</h2><span class="pill amber">Due ' + S.fmtDate(pulse.due) + '</span></div><p class="small">Since your certificate was issued, has any of the following happened?</p>' +
      (PULSE[pulse.cert.framework || 'dpdpa'] || PULSE.dpdpa).map(([k, l]) => '<div class="list-row"><span>' + l + '</span><div class="radios"><label><input type="radio" name="pq_' + k + '" value="no" checked> No</label><label><input type="radio" name="pq_' + k + '" value="yes"> Yes</label></div></div>').join('') +
      '<label>Details of any "Yes"</label><textarea id="pqd" rows="2"></textarea><p class="small muted">Answering yes to the first question suspends the certificate until SAFE re-assesses. Other changes may need a short re-assessment.</p><button class="primary" id="pqs">Submit pulse check</button></div>' : '') +
      (certs.length ? certs.map((x) => '<div class="card" style="margin-bottom:12px"><div class="head"><div><h2>' + esc(x.title || x.no) + '</h2><div class="small muted">' + esc(x.no) + ' · ' + esc(x.opinion) + ' · score ' + x.score + '%</div></div>' + S.certPill(x) + '</div><div class="grid3 small"><div><b>Issued</b><br>' + S.fmtDate(x.issued) + '</div><div><b>Valid until</b><br>' + S.fmtDate(x.validUntil) + '</div><div><b>Next audit due by</b><br>' + S.fmtDate(x.nextAuditDue || x.validUntil) + '</div></div>' +
        '<div class="row" style="margin-top:10px"><button class="primary" data-cert="' + esc(x.no) + '">View / print certificate</button><button data-copy="' + esc(x.no) + '">Copy verification link</button></div><p class="small muted" style="margin-top:8px">Share the verification link with customers, partners or regulators; it shows the live status of your certificate.</p></div>').join('') : '<div class="empty">No certificate yet.</div>') +
      (a && (a.reports || []).length ? '<div class="card"><div class="head"><h2>Audit reports</h2></div>' + a.reports.map((r) => '<div class="list-row"><span>' + (r.kind === 'final' ? 'Final' : 'Interim') + ' report · ' + S.fmtDate(r.at) + '</span>' + (r.htmlId ? '<button class="small" data-dl="' + r.htmlId + '" data-name="' + esc(a.ref.replace(/\//g, '-') + ' ' + r.kind + ' audit report.docx') + '">Download</button>' : '') + '</div>').join('') + '</div>' : '');
    wireCommon();
    $$('[data-cert]').forEach((b) => b.onclick = () => { const x = st.view.certs.find((y) => y.no === b.dataset.cert); S.openCertificate(x, { logo: S.absUrl('assets/img/logo.png'), verifyUrl: S.STUDIO_URL + 'verify.html?no=' + encodeURIComponent(x.no) }); });
    $$('[data-copy]').forEach((b) => b.onclick = () => { navigator.clipboard.writeText(S.STUDIO_URL + 'verify.html?no=' + encodeURIComponent(b.dataset.copy)); S.toast('Link copied.'); });
    const pq = $('#pqs');
    if (pq) pq.onclick = () => S.busy(pq, async () => {
      const answers = {}; ['breach', 'systems', 'data', 'vendors', 'merger'].forEach((k) => { answers[k] = ($('input[name="pq_' + k + '"]:checked') || {}).value || 'no'; });
      answers.detail = $('#pqd').value.trim();
      if (Object.values(answers).includes('yes') && !answers.detail) { S.toast('Please give details of any "Yes".'); return; }
      st.view = await api('portalPulse', { answers, certNo: pulse.cert.no });
      S.toast('Thank you. SAFE has received your pulse check.'); render();
    });
  }

  // ============================================================ SAFE AI chat
  function openChat(prefix, controlId) {
    let box = $('.chat');
    if (!box) {
      box = document.createElement('div'); box.className = 'chat';
      box.innerHTML = '<header><b>✦ SAFE AI</b><button class="small" data-x>✕</button></header><div class="msgs"><div class="m a">Hello' + (st.who ? ' ' + esc(st.who.split(' ')[0]) : '') + '. I am SAFE AI, SAFE Legal\'s compliance assistant. Ask me anything about the law or your audits.</div></div><form><textarea placeholder="Type your question"></textarea><button class="primary">Ask</button></form>';
      document.body.appendChild(box);
      $('[data-x]', box).onclick = () => box.remove();
      $('form', box).onsubmit = async (e) => {
        e.preventDefault();
        const ta = $('textarea', box); const q = ta.value.trim(); if (!q) return; ta.value = '';
        const msgs = $('.msgs', box);
        msgs.insertAdjacentHTML('beforeend', '<div class="m u">' + esc(q) + '</div><div class="m a" id="pending"><span class="spin"></span></div>');
        msgs.scrollTop = msgs.scrollHeight;
        try { const r = await ai('ask', { question: q, controlId: box.dataset.ctrl || '' }); $('#pending').outerHTML = '<div class="m a">' + esc(r.answer) + '</div>'; } catch (err) { $('#pending').outerHTML = '<div class="m a">' + esc(err.message) + '</div>'; }
        msgs.scrollTop = msgs.scrollHeight;
      };
    }
    box.dataset.ctrl = controlId || '';
    if (prefix) $('textarea', box).value = prefix;
    $('textarea', box).focus();
  }
  $('#fab').onclick = () => { const b = $('.chat'); if (b) b.remove(); else openChat(''); };

  // ============================================================ start
  (async () => {
    if (!st.session) return showLogin();
    try { st.view = await api('portalLoad'); render(); } catch (e) { showLogin(); }
  })();
})();
