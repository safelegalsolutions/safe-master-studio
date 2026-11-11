/* SAFE DPDPA Compliance Studio — shared interface pieces (console and portal). */
(function (root) {
  const S = (root.SAFE = root.SAFE || {});
  const esc = S.esc;
  S.$ = (s, r) => (r || document).querySelector(s);
  S.$$ = (s, r) => Array.from((r || document).querySelectorAll(s));

  S.toast = (msg, ms) => { const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg; document.body.appendChild(t); setTimeout(() => t.remove(), ms || 3600); };
  S.fail = (e) => { console.error(e); S.toast(e && e.message ? e.message : String(e), 6000); };
  S.modal = (title, html, onMount, wide) => {
    const bg = document.createElement('div'); bg.className = 'modal-bg';
    bg.innerHTML = '<div class="modal"' + (wide ? ' style="width:min(1000px,100%)"' : '') + '><header><h2>' + esc(title) + '</h2><button data-close aria-label="Close">✕</button></header><div class="mbody">' + html + '</div></div>';
    bg.addEventListener('click', (e) => { if (e.target === bg || e.target.hasAttribute('data-close')) bg.remove(); });
    document.body.appendChild(bg);
    if (onMount) onMount(bg);
    return bg;
  };
  S.ask = (title, label, opts) => new Promise((res) => {
    opts = opts || {};
    const m = S.modal(title, (opts.html || '') + '<label>' + esc(label) + '</label>' + (opts.multiline ? '<textarea id="askv"></textarea>' : '<input id="askv">') + '<div class="row" style="justify-content:flex-end;margin-top:12px"><button data-close>Cancel</button><button class="primary" id="askok">' + esc(opts.ok || 'OK') + '</button></div>', (el) => {
      S.$('#askok', el).onclick = () => { const v = S.$('#askv', el).value.trim(); el.remove(); res(v); };
      S.$('#askv', el).focus();
    });
    m.addEventListener('click', (e) => { if (e.target === m || e.target.hasAttribute('data-close')) res(null); });
  });
  S.confirmBox = (title, html, ok) => new Promise((res) => {
    const m = S.modal(title, html + '<div class="row" style="justify-content:flex-end;margin-top:14px"><button data-close>Cancel</button><button class="primary" id="cok">' + esc(ok || 'Confirm') + '</button></div>', (el) => {
      S.$('#cok', el).onclick = () => { el.remove(); res(true); };
    });
    m.addEventListener('click', (e) => { if (e.target === m || e.target.hasAttribute('data-close')) res(false); });
  });
  /** Runs an async action with a spinner on the button. */
  S.busy = async (btn, fn, label) => {
    const old = btn ? btn.innerHTML : '';
    if (btn) { btn.disabled = true; btn.innerHTML = '<span class="spin"></span> ' + esc(label || 'Working…'); }
    try { return await fn(); } catch (e) { S.fail(e); return undefined; } finally { if (btn) { btn.disabled = false; btn.innerHTML = old; } }
  };

  // ---------------------------------------------------------------- pills
  S.gradePill = (g) => { const x = S.GRADES[g] || { short: g, cls: '' }; return '<span class="pill ' + x.cls + '" title="' + esc(x.label || '') + '">' + esc(x.short) + '</span>'; };
  S.priPill = (p) => '<span class="pill ' + ({ M: 'red', S: 'amber', W: 'blue' })[p] + '">' + esc(S.PRI_LABEL[p]) + '</span>';
  S.verdictPill = (v) => '<span class="pill ' + ({ accepted: 'green', partial: 'amber', rejected: 'red' })[v] + '">SAFE AI: ' + esc(v) + '</span>';
  S.statePill = (s) => '<span class="pill ' + ({ open: 'red', submitted: 'amber', closed: 'green' })[s] + '">' + esc({ open: 'Open', submitted: 'Fix submitted', closed: 'Closed' }[s] || s) + '</span>';
  S.certPill = (cert) => { const s = S.CERT_STATUS[S.certStatus(cert)] || ['—', '']; return '<span class="pill ' + s[1] + '">' + esc(s[0]) + '</span>'; };
  S.stagePill = (id) => { const s = S.STAGES.find((x) => x.id === id); return '<span class="pill maroon">' + esc(s ? s.label : id) + '</span>'; };

  // ---------------------------------------------------------------- stepper
  S.stepper = (stage) => {
    const i = S.stageIndex(stage);
    return '<div class="stepper">' + S.STAGES.map((s, k) => '<div class="step ' + (k < i ? 'done' : k === i ? 'cur' : '') + '"><span class="n">' + (k < i ? '✓' : k + 1) + '</span><span class="t">' + esc(s.label) + '</span><span class="w">' + esc(s.who) + '</span></div>').join('') + '</div>';
  };

  // ---------------------------------------------------------------- gauge and bars
  S.colorFor = (pct) => (pct >= 85 ? 'var(--green)' : pct >= 70 ? 'var(--amber)' : 'var(--red)');
  S.gauge = (pct, label, sub) => {
    const r = 46, c = 2 * Math.PI * r, off = c * (1 - (pct || 0) / 100);
    return '<div class="gauge"><svg viewBox="0 0 110 110"><circle cx="55" cy="55" r="' + r + '" fill="none" stroke="#eee" stroke-width="10"/><circle cx="55" cy="55" r="' + r + '" fill="none" stroke="' + S.colorFor(pct) + '" stroke-width="10" stroke-linecap="round" stroke-dasharray="' + c.toFixed(1) + '" stroke-dashoffset="' + off.toFixed(1) + '" transform="rotate(-90 55 55)"/><text x="55" y="61" text-anchor="middle" font-size="22" font-weight="700" fill="currentColor" font-family="Source Serif 4, Georgia, serif">' + (pct || 0) + '%</text></svg><div><div class="big">' + esc(label || '') + '</div><div class="muted">' + (sub || '') + '</div></div></div>';
  };
  S.domainBars = (sc) => '<div class="bars">' + sc.domains.map((d) => '<div class="bar"><span>' + esc(d.name) + '</span><div class="track"><div class="fill" style="width:' + d.pct + '%;background:' + S.colorFor(d.pct) + '"></div></div><span class="pct">' + d.pct + '%</span></div>').join('') + '</div>';

  // ---------------------------------------------------------------- environment form
  S.envForm = (env, editable) => {
    env = env || {};
    const dis = editable ? '' : ' disabled';
    return S.ENV_SECTIONS.map((sec) => '<div class="card form-sec"><h3>' + esc(sec.title) + '</h3>' + sec.fields.map((f) => {
      const v = env[f.k];
      const lab = '<label class="' + (f.req ? 'req' : '') + '">' + esc(f.l) + '</label>';
      let input = '';
      if (f.t === 'text') input = '<input data-k="' + f.k + '" value="' + esc(v || '') + '"' + dis + '>';
      else if (f.t === 'textarea') input = '<textarea data-k="' + f.k + '"' + dis + '>' + esc(v || '') + '</textarea>';
      else if (f.t === 'select') input = '<select data-k="' + f.k + '"' + dis + '><option value="">Choose…</option>' + f.o.map((o) => '<option value="' + esc(o.v) + '"' + (v === o.v ? ' selected' : '') + '>' + esc(o.l) + '</option>').join('') + '</select>';
      else if (f.t === 'bool') input = '<div class="radios" data-k="' + f.k + '" data-t="bool"><label><input type="radio" name="' + f.k + '" value="yes"' + (v === true ? ' checked' : '') + dis + '> Yes</label><label><input type="radio" name="' + f.k + '" value="no"' + (v === false ? ' checked' : '') + dis + '> No</label></div>';
      else if (f.t === 'multi') input = '<div class="checks" data-k="' + f.k + '" data-t="multi">' + f.o.map((o) => '<label><input type="checkbox" value="' + esc(o.v) + '"' + ((v || []).includes(o.v) ? ' checked' : '') + dis + '> ' + esc(o.l) + '</label>').join('') + '</div>';
      return '<div class="field">' + lab + input + (f.help ? '<div class="help">' + esc(f.help) + '</div>' : '') + '</div>';
    }).join('') + '</div>').join('');
  };
  S.readEnvForm = (rootEl) => {
    const env = {};
    S.ENV_FIELDS.forEach((f) => {
      const el = S.$('[data-k="' + f.k + '"]', rootEl); if (!el) return;
      if (f.t === 'bool') { const c = S.$('input:checked', el); if (c) env[f.k] = c.value === 'yes'; }
      else if (f.t === 'multi') env[f.k] = S.$$('input:checked', el).map((x) => x.value);
      else env[f.k] = el.value.trim();
    });
    return env;
  };

  // ---------------------------------------------------------------- control card
  S.ANSWERS = [['yes', 'Yes'], ['partly', 'Partly'], ['no', 'No'], ['unsure', 'Not sure'], ['na', 'Not applicable']];
  S.controlCard = (c, audit, opts) => {
    opts = opts || {};
    const r = (audit.responses || {})[c.id] || {};
    const evs = (audit.evidence || []).filter((e) => !e.deleted && (e.controlIds || []).includes(c.id));
    const ed = opts.editable;
    const ph = S.PHASES[c.ph];
    const f = opts.showFinding ? S.findingFor(audit, c.id) : null;
    return '<div class="ctrl ' + c.pri + '" data-ctrl="' + c.id + '">' +
      '<div class="meta"><b>' + c.id + '</b> ' + S.priPill(c.pri) + ' <span>' + esc(c.ref) + '</span>' + (ph ? ' · <span>' + esc(ph.label) + '</span>' : '') + (r.carried ? ' · <span class="pill">carried forward</span>' : '') + (f ? ' · ' + S.gradePill(f.grade) : '') + '</div>' +
      '<div class="q">' + esc(c.q) + '</div>' +
      '<div class="seg" data-answer="' + c.id + '">' + S.ANSWERS.map(([v, l]) => '<button data-v="' + v + '" class="' + (r.answer === v ? 'on' : '') + '"' + (ed ? '' : ' disabled') + '>' + l + '</button>').join('') + '</div>' +
      '<label>Explain briefly (what you do, who owns it, any gaps)</label><textarea data-note="' + c.id + '" rows="2"' + (ed ? '' : ' disabled') + '>' + esc(r.note || '') + '</textarea>' +
      (r.followups || []).map((q, i) => '<div class="fu"><div class="fq">' + esc(q.q) + '</div><textarea data-fu="' + c.id + '" data-i="' + i + '" rows="2" placeholder="Your answer"' + (ed ? '' : ' disabled') + '>' + esc(q.a || '') + '</textarea></div>').join('') +
      '<div class="ev-list">' + evs.map((e) => '<div class="ev"><div style="flex:1"><div class="nm">📎 ' + esc(e.name) + '</div>' + (e.review ? '<div class="rv">' + S.verdictPill(e.review.verdict) + ' ' + esc(e.review.summary || '') + (e.review.perControl && e.review.perControl[c.id] && e.review.perControl[c.id].gaps ? '<br><b>Gap:</b> ' + esc(e.review.perControl[c.id].gaps) : '') + '</div>' : '<div class="rv muted">Not yet reviewed by SAFE AI</div>') + '</div>' +
        (opts.reviewable ? '<button class="small" data-review="' + e.id + '">' + (e.review ? 'Re-check' : 'SAFE AI review') + '</button>' : '') + (opts.deletable ? '<button class="small danger" data-delev="' + e.id + '" title="Remove">✕</button>' : '') + '</div>').join('') + '</div>' +
      '<div class="row" style="margin-top:8px">' + (ed ? '<label class="btn small" style="margin:0;font-size:12px;color:var(--ink)">Upload evidence<input type="file" data-upload="' + c.id + '" hidden multiple></label>' : '') + (opts.askable ? '<button class="small" data-askai="' + c.id + '">Ask SAFE AI</button>' : '') + '</div>' +
      '<details><summary>What the law requires and what evidence to give</summary><div class="req-text"><b>Requirement:</b> ' + esc(c.req) + '<br><b>Evidence that satisfies it:</b> ' + esc(c.ev) + (c.iso ? '<br><b>ISO/IEC 27701 reference:</b> ' + esc(c.iso) : '') + (c.pen && c.pen !== 'none' ? '<br><b>Penalty exposure:</b> ' + esc(S.PENALTIES[c.pen].label) : '') + '</div></details>' +
      '</div>';
  };

  S.domainNav = (audit, ctrls, current) => {
    const r = audit.responses || {};
    return '<div class="domain-nav">' + S.DOMAINS.filter((d) => ctrls.some((c) => c.d === d.id)).map((d) => {
      const cs = ctrls.filter((c) => c.d === d.id); const done = cs.filter((c) => r[c.id] && r[c.id].answer).length;
      return '<button data-domain="' + d.id + '" class="' + (d.id === current ? 'on' : '') + '"><span>' + esc(d.name) + '</span><span class="prog">' + done + '/' + cs.length + (done === cs.length ? ' ✓' : '') + '</span></button>';
    }).join('') + '</div>';
  };

  /** Collects answers, notes and follow-up answers typed into control cards. */
  S.readControlEdits = (rootEl, audit) => {
    const patch = {};
    S.$$('[data-ctrl]', rootEl).forEach((card) => {
      const id = card.getAttribute('data-ctrl');
      const cur = (audit.responses || {})[id] || {};
      const on = S.$('.seg button.on', card);
      const note = S.$('[data-note]', card).value;
      const fus = (cur.followups || []).map((q, i) => { const t = S.$('[data-fu][data-i="' + i + '"]', card); return Object.assign({}, q, { a: t ? t.value : q.a }); });
      const ans = on ? on.getAttribute('data-v') : cur.answer;
      if (ans !== cur.answer || note !== (cur.note || '') || JSON.stringify(fus) !== JSON.stringify(cur.followups || [])) patch[id] = { answer: ans, note, followups: fus };
    });
    return patch;
  };
  S.wireSeg = (rootEl) => {
    S.$$('.seg button', rootEl).forEach((b) => b.addEventListener('click', () => {
      if (b.disabled) return;
      S.$$('button', b.parentElement).forEach((x) => x.classList.remove('on')); b.classList.add('on');
      b.closest('[data-ctrl]').dispatchEvent(new CustomEvent('changed', { bubbles: true }));
    }));
  };

  // ---------------------------------------------------------------- facts for SAFE AI summaries
  S.reportFacts = (audit) => {
    const sc = S.scores(audit); const k = S.counts(audit);
    const sorted = sc.domains.slice().sort((a, b) => a.pct - b.pct);
    return { organisation: audit.env && audit.env.legalName, score: sc.overall, opinion: S.OPINIONS[S.opinion(audit)].label, controlsAssessed: sc.answered, applicableControls: sc.total,
      major: k.major, minor: k.minor, ofi: k.ofi, majorOpen: k.majorOpen, minorOpen: k.minorOpen, ofiOpen: k.ofiOpen,
      weakestAreas: sorted.slice(0, 3).map((d) => d.name + ' (' + d.pct + '%)'), strongestAreas: sorted.slice(-3).reverse().map((d) => d.name + ' (' + d.pct + '%)'),
      topFindings: S.allFindings(audit).filter((f) => f.grade === 'major').slice(0, 8).map((f) => (f.controlId || 'Systemic') + ': ' + (f.title || '') + ' — ' + (f.observation || '')),
      exposure: S.exposure(audit).brackets.map((b) => b.label), readinessPeriod: S.isReadinessPeriod() };
  };
})(typeof window !== 'undefined' ? window : globalThis);
