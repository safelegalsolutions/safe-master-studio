/* SAFE Marketing Studio — front end */
(function () {
  var CFG = window.SAFE_CONFIG || {};
  var API_URL = CFG.MARKETING_API_URL || '';
  var DEMO = !API_URL;
  var S = { token: null, user: null, stages: [], charts: [] };
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  // ------------------------------------------------------------ helpers
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function fmtDate(s, withTime) {
    if (!s) return '';
    var d = new Date(s); if (isNaN(d)) return esc(s);
    var o = { day: '2-digit', month: 'short', year: 'numeric' };
    if (withTime) { o.hour = '2-digit'; o.minute = '2-digit'; }
    return d.toLocaleString('en-IN', o);
  }
  function ago(s) {
    if (!s) return '';
    var m = Math.round((Date.now() - new Date(s)) / 60000);
    if (m < 1) return 'just now'; if (m < 60) return m + ' min ago';
    var h = Math.round(m / 60); if (h < 24) return h + ' h ago';
    var d = Math.round(h / 24); return d < 30 ? d + ' d ago' : fmtDate(s);
  }
  function pct(x) { return Math.round((x || 0) * 100) + '%'; }
  function toast(msg) { var t = document.createElement('div'); t.className = 'toast'; t.textContent = msg; document.body.appendChild(t); setTimeout(function () { t.remove(); }, 3200); }
  function stagePill(s) { var m = { New: '', Contacted: 'blue', Replied: 'green', Meeting: 'green', Proposal: 'amber', Won: 'maroon', Lost: 'red', 'On hold': '' }; return '<span class="pill ' + (m[s] || '') + '">' + esc(s || 'New') + '</span>'; }
  function statusPill(s) { var m = { active: 'green', replied: 'green', completed: 'blue', stopped: '', bounced: 'red', unsubscribed: 'red', pending_approval: 'amber', approved: 'blue', sent: 'green', failed: 'red', rejected: '', draft: '', paused: 'amber', done: 'blue' }; return '<span class="pill ' + (m[s] || '') + '">' + esc(String(s || '').replace('_', ' ')) + '</span>'; }

  function api(action, payload) {
    if (DEMO) {
      return new Promise(function (res, rej) { setTimeout(function () { try { res(window.SAFE_MOCK(action, payload)); } catch (e) { rej(e); } }, 120); });
    }
    var body = Object.assign({ action: action, token: S.token }, payload || {});
    return fetch(API_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(body) })
      .then(function (r) { return r.json(); })
      .then(function (j) {
        if (!j.ok) {
          if (/^AUTH/.test(j.error)) { logout(); }
          throw new Error(j.error);
        }
        return j.data;
      });
  }
  function fail(e) { toast(e.message || String(e)); console.error(e); }

  // ------------------------------------------------------------ modal
  function modal(title, html, onMount) {
    var root = $('#modalRoot');
    var bg = document.createElement('div'); bg.className = 'modal-bg';
    bg.innerHTML = '<div class="modal"><header><h2>' + esc(title) + '</h2><button data-close>✕</button></header><div class="mbody">' + html + '</div></div>';
    bg.addEventListener('click', function (e) { if (e.target === bg || e.target.hasAttribute('data-close')) bg.remove(); });
    root.appendChild(bg);
    if (onMount) onMount(bg);
    return bg;
  }

  // ------------------------------------------------------------ auth
  function showLogin() { $('#login').hidden = false; $('#app').hidden = true; $('#logout').hidden = true; $('#who').textContent = ''; }
  function logout() { try { sessionStorage.removeItem('safe-mkt-token'); } catch (e) {} S.token = null; showLogin(); }
  function start() {
    api('me').then(function (d) {
      S.user = d.user; S.stages = d.stages; S.settings = d.settings;
      $('#login').hidden = true; $('#app').hidden = false; $('#logout').hidden = false;
      $('#who').textContent = S.user.name + (DEMO ? ' · demo mode' : '');
      $('#navSettings').hidden = S.user.role !== 'admin';
      route();
      refreshCounts();
    }).catch(function () { showLogin(); });
  }
  $('#loginBtn').addEventListener('click', function () {
    $('#loginErr').textContent = '';
    api('login', { email: $('#loginEmail').value, pin: $('#loginPin').value }).then(function (d) {
      S.token = d.token; try { sessionStorage.setItem('safe-mkt-token', d.token); } catch (e) {}
      start();
    }).catch(function (e) { $('#loginErr').textContent = e.message; });
  });
  $('#loginPin').addEventListener('keydown', function (e) { if (e.key === 'Enter') $('#loginBtn').click(); });
  $('#logout').addEventListener('click', logout);

  function refreshCounts() {
    api('dashboard').then(function (d) {
      $('#cntApprovals').textContent = d.kpis.pendingApproval || '';
      $('#cntTasks').textContent = d.kpis.tasksDue || '';
    }).catch(function () {});
  }

  // ------------------------------------------------------------ routing
  var VIEWS = {};
  function route() {
    var v = (location.hash || '#dashboard').slice(1);
    if (!VIEWS[v]) v = 'dashboard';
    $('#modalRoot').innerHTML = '';
    $$('#nav a').forEach(function (a) { a.classList.toggle('active', a.getAttribute('data-v') === v); });
    S.charts.forEach(function (c) { c.destroy(); }); S.charts = [];
    $('#view').innerHTML = '<div class="empty">Loading…</div>';
    VIEWS[v]().catch(fail);
  }
  window.addEventListener('hashchange', route);

  function head(title, actions) {
    return (DEMO ? '<div class="banner">Demo mode — sample data only. Add the Apps Script web app URL in assets/config.js to go live.</div>' : '') +
      '<div class="view-head"><h1>' + esc(title) + '</h1>' + (actions || '') + '</div>';
  }

  // ------------------------------------------------------------ dashboard
  VIEWS.dashboard = function () {
    return api('dashboard').then(function (d) {
      var k = d.kpis;
      var kpi = function (v, l, s) { return '<div class="kpi"><div class="v">' + v + '</div><div class="l">' + l + '</div>' + (s ? '<div class="s">' + s + '</div>' : '') + '</div>'; };
      var max = Math.max.apply(null, S.stages.map(function (s) { return d.byStage[s] || 0; }).concat([1]));
      var funnel = ['New', 'Contacted', 'Replied', 'Meeting', 'Proposal', 'Won'].map(function (s) {
        var n = d.byStage[s] || 0;
        return '<div class="bar"><span class="n">' + s + '</span><div class="fill" style="width:' + Math.max(6, n / max * 100) + '%">' + n + '</div></div>';
      }).join('');
      $('#view').innerHTML = head('Dashboard', '<button id="runNow">Run sending &amp; reply check now</button>') +
        '<div class="kpis">' +
        kpi(k.contacts, 'Contacts', k.contacted + ' contacted') +
        kpi(k.emailsSent, 'Emails sent', k.sentToday + ' of ' + k.dailyLimit + ' today') +
        kpi(k.replies, 'Contacts replied', pct(k.replyRate) + ' reply rate') +
        kpi(k.meetings, 'In meeting stage', k.won + ' won') +
        kpi('<a href="#approvals">' + k.pendingApproval + '</a>', 'Awaiting approval', k.failed ? k.failed + ' failed sends' : '') +
        kpi('<a href="#tasks">' + k.tasksDue + '</a>', 'Follow-ups due', k.bounced + ' bounced · ' + k.unsubscribed + ' unsubscribed') +
        '</div>' +
        '<div class="charts"><div class="card"><h3>Emails sent and replies, last 12 weeks</h3><div class="chart-box"><canvas id="chWeekly"></canvas></div></div>' +
        '<div class="card"><h3>Pipeline by stage</h3><div class="funnel">' + funnel + '</div><p class="small muted" style="margin-top:10px">Lost: ' + (d.byStage.Lost || 0) + ' · On hold: ' + (d.byStage['On hold'] || 0) + '</p></div></div>' +
        '<div class="charts"><div class="card"><h3>Campaign performance</h3><div class="table-wrap" style="max-height:300px"><table><tr><th>Campaign</th><th>Status</th><th>Enrolled</th><th>Contacted</th><th>Sent</th><th>Replied</th><th>Reply rate</th></tr>' +
        (d.campaigns.map(function (c) { return '<tr><td>' + esc(c.name) + '</td><td>' + statusPill(c.status) + '</td><td>' + c.enrolled + '</td><td>' + c.contacted + '</td><td>' + c.sent + '</td><td>' + c.replied + '</td><td>' + (c.contacted ? pct(c.replied / c.contacted) : '—') + '</td></tr>'; }).join('') || '<tr><td colspan="7" class="muted">No campaigns yet</td></tr>') +
        '</table></div></div>' +
        '<div class="card"><h3>Recent activity</h3><div class="timeline">' + d.recent.map(tlItem).join('') + '</div></div></div>';
      var ctx = $('#chWeekly');
      if (window.Chart && ctx) {
        S.charts.push(new Chart(ctx, { type: 'bar', data: { labels: d.weekly.labels, datasets: [
          { label: 'Emails sent', data: d.weekly.sent, backgroundColor: '#800000', borderRadius: 4 },
          { label: 'Replies', data: d.weekly.replies, backgroundColor: '#2e7d32', borderRadius: 4 }] },
          options: { maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } }, scales: { y: { beginAtZero: true, ticks: { precision: 0 } }, x: { grid: { display: false } } } } }));
      }
      $('#runNow').onclick = function () { this.disabled = true; api('runNow').then(function () { toast('Done'); route(); refreshCounts(); }).catch(fail); };
      $$('.tl[data-c]').forEach(function (el) { el.style.cursor = 'pointer'; el.onclick = function () { openContact(el.getAttribute('data-c')); }; });
    });
  };

  function tlItem(a) {
    return '<div class="tl ' + esc(a.type) + '" data-c="' + esc(a.contactId) + '"><div><b>' + esc(a.summary) + '</b>' + (a.company ? ' · ' + esc(a.company) : '') + '</div>' +
      '<div class="meta">' + esc(a.by) + ' · ' + ago(a.at) + '</div>' + (a.detail ? '<div class="detail">' + esc(a.detail) + '</div>' : '') + '</div>';
  }

  // ------------------------------------------------------------ contacts
  VIEWS.contacts = function () {
    return api('listContacts').then(function (list) {
      S.contacts = list;
      var segs = uniq(list.map(function (c) { return c.segment; }));
      $('#view').innerHTML = head('Contacts', '<button id="imp">Import CSV</button><button class="primary" id="add">Add contact</button>') +
        '<div class="toolbar"><input id="q" placeholder="Search company, name, email"><select id="fs"><option value="">All stages</option>' + S.stages.map(function (s) { return '<option>' + s + '</option>'; }).join('') + '</select>' +
        '<select id="fg"><option value="">All segments</option>' + segs.map(function (s) { return '<option>' + esc(s) + '</option>'; }).join('') + '</select>' +
        '<select id="fst"><option value="">Any status</option><option>active</option><option>unsubscribed</option><option>bounced</option></select><span class="muted small" id="cnt"></span></div>' +
        '<div class="table-wrap"><table><thead><tr><th>Company</th><th>Contact</th><th>Email</th><th>Segment</th><th>Stage</th><th>Owner</th><th>Last contacted</th><th>Next follow-up</th><th>Status</th></tr></thead><tbody id="tb"></tbody></table></div>';
      function draw() {
        var q = $('#q').value.toLowerCase(), fs = $('#fs').value, fg = $('#fg').value, fst = $('#fst').value;
        var rows = list.filter(function (c) {
          return (!q || [c.company, c.name, c.email].join(' ').toLowerCase().indexOf(q) >= 0) && (!fs || c.stage === fs) && (!fg || c.segment === fg) && (!fst || c.status === fst);
        });
        $('#cnt').textContent = rows.length + ' of ' + list.length;
        $('#tb').innerHTML = rows.map(function (c) {
          return '<tr class="clickable" data-id="' + esc(c.id) + '"><td><b>' + esc(c.company) + '</b></td><td>' + esc(c.name) + '<div class="small muted">' + esc(c.title) + '</div></td><td>' + esc(c.email) + '</td><td>' + esc(c.segment) + '</td><td>' + stagePill(c.stage) + '</td><td>' + esc(c.owner) + '</td><td>' + fmtDate(c.lastContacted) + '</td><td>' + fmtDate(c.nextFollowUp) + '</td><td>' + statusPill(c.status) + '</td></tr>';
        }).join('') || '<tr><td colspan="9" class="empty">No contacts match.</td></tr>';
        $$('#tb tr[data-id]').forEach(function (tr) { tr.onclick = function () { openContact(tr.getAttribute('data-id')); }; });
      }
      ['#q', '#fs', '#fg', '#fst'].forEach(function (s) { $(s).oninput = draw; });
      draw();
      $('#add').onclick = function () { editContact({}); };
      $('#imp').onclick = importModal;
    });
  };

  function uniq(a) { return a.filter(function (x, i) { return x && a.indexOf(x) === i; }).sort(); }

  function editContact(c) {
    var f = function (k, l, t) { return '<div><label>' + l + '</label><input name="' + k + '" type="' + (t || 'text') + '" value="' + esc(c[k]) + '"></div>'; };
    var m = modal(c.id ? 'Edit contact' : 'Add contact', '<form id="cf"><div class="grid2">' + f('company', 'Company') + f('name', 'Contact name') + f('title', 'Title') + f('email', 'Email', 'email') + f('phone', 'Phone') + f('website', 'Website') + f('segment', 'Segment') + f('tags', 'Tags') +
      '<div><label>Stage</label><select name="stage">' + S.stages.map(function (s) { return '<option' + (s === (c.stage || 'New') ? ' selected' : '') + '>' + s + '</option>'; }).join('') + '</select></div>' + f('owner', 'Owner') +
      '<div><label>Status</label><select name="status">' + ['active', 'unsubscribed', 'bounced'].map(function (s) { return '<option' + (s === (c.status || 'active') ? ' selected' : '') + '>' + s + '</option>'; }).join('') + '</select></div>' + f('source', 'Source') +
      '</div><div class="row" style="margin-top:14px"><button class="primary" type="submit">Save</button></div></form>');
    $('#cf', m).onsubmit = function (e) {
      e.preventDefault();
      var o = { id: c.id }; $$('[name]', this).forEach(function (i) { o[i.name] = i.value.trim(); });
      api('saveContact', { contact: o }).then(function () { m.remove(); toast('Saved'); route(); }).catch(fail);
    };
  }

  function openContact(id) {
    api('getContact', { id: id }).then(function (d) {
      var c = d.contact;
      var html = '<div class="row" style="margin-bottom:6px">' + stagePill(c.stage) + statusPill(c.status) + '<span class="muted small">Owner: ' + esc(c.owner) + '</span></div>' +
        '<div class="grid2"><div><div><b>' + esc(c.name) + '</b> ' + esc(c.title ? '· ' + c.title : '') + '</div><div>' + esc(c.email) + (c.phone ? ' · ' + esc(c.phone) : '') + '</div>' +
        (c.website ? '<div><a target="_blank" rel="noopener" href="' + esc(/^http/.test(c.website) ? c.website : 'https://' + c.website) + '">' + esc(c.website) + '</a></div>' : '') +
        '<div class="small muted">Segment: ' + esc(c.segment) + (c.tags ? ' · Tags: ' + esc(c.tags) : '') + '</div>' +
        '<div class="small muted">Last contacted ' + (fmtDate(c.lastContacted) || '—') + ' · Last reply ' + (fmtDate(c.lastReply) || '—') + ' · Next follow-up ' + (fmtDate(c.nextFollowUp) || '—') + '</div></div>' +
        '<div><label>Move stage</label><select id="stg">' + S.stages.map(function (s) { return '<option' + (s === c.stage ? ' selected' : '') + '>' + s + '</option>'; }).join('') + '</select>' +
        '<div class="row" style="margin-top:8px"><button id="edit">Edit details</button><button id="addTask">Add follow-up task</button></div></div></div>' +
        '<h3 style="margin-top:16px">Campaigns</h3>' + (d.enrollments.length ? '<table><tr><th>Campaign</th><th>Status</th><th>Next step</th><th>Next send</th><th></th></tr>' + d.enrollments.map(function (e) {
          return '<tr><td>' + esc(e.campaignName) + '</td><td>' + statusPill(e.status) + '</td><td>' + (Number(e.step) + 1) + '</td><td>' + (e.status === 'active' ? fmtDate(e.nextSendAt, true) : '—') + '</td><td>' + (e.status === 'active' ? '<button class="danger small" data-stop="' + esc(e.id) + '">Stop</button>' : '') + '</td></tr>';
        }).join('') + '</table>' : '<p class="muted small">Not in any campaign.</p>') +
        '<h3 style="margin-top:16px">Open tasks</h3>' + (d.tasks.filter(function (t) { return t.done !== 'yes'; }).map(function (t) { return '<div class="row small"><input type="checkbox" style="width:auto" data-done="' + esc(t.id) + '"> ' + esc(t.title) + ' <span class="muted">due ' + fmtDate(t.due) + '</span></div>'; }).join('') || '<p class="muted small">None.</p>') +
        '<h3 style="margin-top:16px">Comments and activity</h3><div class="row"><input id="cmt" placeholder="Add a comment for the team"><button class="primary" id="cmtBtn">Comment</button></div>' +
        '<div class="timeline" style="margin-top:10px">' + (d.activity.map(tlItem).join('') || '<p class="muted small">No activity yet.</p>') + '</div>';
      var m = modal(c.company || c.name, html);
      $('#stg', m).onchange = function () { api('setStage', { id: c.id, stage: this.value }).then(function () { toast('Stage updated'); m.remove(); openContact(id); if (/contacts|pipeline|dashboard/.test(location.hash) || !location.hash) route(); }).catch(fail); };
      $('#edit', m).onclick = function () { m.remove(); editContact(c); };
      $('#addTask', m).onclick = function () { m.remove(); taskModal({ contactId: c.id }); };
      $('#cmtBtn', m).onclick = function () { var t = $('#cmt', m).value.trim(); if (!t) return; api('addComment', { contactId: c.id, text: t }).then(function () { m.remove(); openContact(id); }).catch(fail); };
      $$('[data-stop]', m).forEach(function (b) { b.onclick = function () { api('stopEnrollment', { id: b.getAttribute('data-stop') }).then(function () { m.remove(); openContact(id); }).catch(fail); }; });
      $$('[data-done]', m).forEach(function (b) { b.onchange = function () { api('completeTask', { id: b.getAttribute('data-done') }).then(function () { toast('Task done'); refreshCounts(); }).catch(fail); }; });
    }).catch(fail);
  }

  function parseCSV(text) {
    var rows = [], row = [], cur = '', q = false;
    for (var i = 0; i < text.length; i++) {
      var ch = text[i];
      if (q) { if (ch === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += ch; }
      else if (ch === '"') q = true;
      else if (ch === ',') { row.push(cur); cur = ''; }
      else if (ch === '\n' || ch === '\r') { if (ch === '\r' && text[i + 1] === '\n') i++; row.push(cur); rows.push(row); row = []; cur = ''; }
      else cur += ch;
    }
    if (cur || row.length) { row.push(cur); rows.push(row); }
    return rows.filter(function (r) { return r.join('').trim(); });
  }
  var FIELD_ALIASES = { company: ['company', 'organisation', 'organization', 'firm'], name: ['name', 'contact', 'contact name', 'key decision-maker', 'full name'], title: ['title', 'designation', 'role'], email: ['email', 'email address', 'official email'], phone: ['phone', 'mobile', 'phone number'], website: ['website', 'url', 'site'], segment: ['segment', 'industry', 'sector'], tags: ['tags', 'hq', 'city', 'priority'], source: ['source'] };

  function importModal() {
    var m = modal('Import contacts from CSV', '<p class="small muted">Columns recognised: company, name, title, email, phone, website, segment, tags, source. Contacts with an email already in the studio are skipped.</p>' +
      '<label>Choose a CSV file</label><input type="file" id="file" accept=".csv,text/csv"><label>…or paste CSV</label><textarea id="csv" placeholder="company,name,title,email,segment"></textarea>' +
      '<div class="grid2"><div><label>Segment for all rows (optional)</label><input id="seg"></div><div><label>Source</label><input id="src" value="CSV import"></div></div>' +
      '<div id="prev" class="small muted" style="margin-top:8px"></div><div class="row" style="margin-top:12px"><button class="primary" id="go" disabled>Import</button></div>');
    var parsed = [];
    function prep(text) {
      var rows = parseCSV(text); if (rows.length < 2) { $('#prev', m).textContent = 'Need a header row and at least one data row.'; return; }
      var hdr = rows[0].map(function (h) { return h.trim().toLowerCase(); });
      var map = {}; Object.keys(FIELD_ALIASES).forEach(function (f) { var i = hdr.findIndex(function (h) { return FIELD_ALIASES[f].indexOf(h) >= 0; }); if (i >= 0) map[f] = i; });
      parsed = rows.slice(1).map(function (r) { var o = {}; Object.keys(map).forEach(function (f) { o[f] = (r[map[f]] || '').trim(); }); return o; });
      $('#prev', m).textContent = parsed.length + ' rows ready. Mapped columns: ' + (Object.keys(map).join(', ') || 'none');
      $('#go', m).disabled = !parsed.length || map.company === undefined && map.email === undefined;
    }
    $('#csv', m).oninput = function () { prep(this.value); };
    $('#file', m).onchange = function () { var r = new FileReader(); r.onload = function () { $('#csv', m).value = r.result; prep(r.result); }; r.readAsText(this.files[0]); };
    $('#go', m).onclick = function () {
      this.disabled = true;
      api('importContacts', { rows: parsed, segment: $('#seg', m).value, source: $('#src', m).value }).then(function (r) { m.remove(); toast(r.added + ' added, ' + r.skipped + ' skipped'); route(); }).catch(fail);
    };
  }

  // ------------------------------------------------------------ pipeline
  VIEWS.pipeline = function () {
    return api('listContacts').then(function (list) {
      $('#view').innerHTML = head('Pipeline', '<span class="muted small">Drag a card to change its stage</span>') + '<div class="board">' + S.stages.map(function (s) {
        var items = list.filter(function (c) { return (c.stage || 'New') === s; });
        return '<div class="col" data-stage="' + esc(s) + '"><h3>' + esc(s) + '<span>' + items.length + '</span></h3>' + items.map(function (c) {
          return '<div class="deal" draggable="true" data-id="' + esc(c.id) + '"><b>' + esc(c.company) + '</b><div class="small">' + esc(c.name) + '</div><div class="small">' + esc(c.owner) + (c.lastReply ? ' · replied ' + ago(c.lastReply) : '') + '</div></div>';
        }).join('') + '</div>';
      }).join('') + '</div>';
      var dragId = null;
      $$('.deal').forEach(function (d) {
        d.ondragstart = function () { dragId = d.getAttribute('data-id'); };
        d.onclick = function () { openContact(d.getAttribute('data-id')); };
      });
      $$('.col').forEach(function (col) {
        col.ondragover = function (e) { e.preventDefault(); col.classList.add('drop'); };
        col.ondragleave = function () { col.classList.remove('drop'); };
        col.ondrop = function (e) { e.preventDefault(); col.classList.remove('drop'); if (!dragId) return; api('setStage', { id: dragId, stage: col.getAttribute('data-stage') }).then(function () { route(); }).catch(fail); };
      });
    });
  };

  // ------------------------------------------------------------ campaigns
  VIEWS.campaigns = function () {
    return api('listCampaigns').then(function (list) {
      $('#view').innerHTML = head('Campaigns', '<button class="primary" id="new">New campaign</button>') +
        (list.length ? '<div class="table-wrap"><table><tr><th>Campaign</th><th>Status</th><th>Steps</th><th>Enrolled</th><th>Active</th><th>Sent</th><th>Replied</th><th>Awaiting approval</th><th></th></tr>' + list.map(function (c) {
          return '<tr><td><b>' + esc(c.name) + '</b><div class="small muted">' + esc(c.segment || 'All segments') + ' · ' + (c.requireApproval === 'no' ? 'auto-send' : 'approval required') + (c.useAI === 'yes' ? ' · AI-personalised' : '') + '</div></td><td>' + statusPill(c.status) + '</td><td>' + c.steps.length + '</td><td>' + c.stats.enrolled + '</td><td>' + c.stats.active + '</td><td>' + c.stats.sent + '</td><td>' + c.stats.replied + '</td><td>' + c.stats.pending + '</td>' +
            '<td class="row" style="flex-wrap:nowrap"><button data-edit="' + c.id + '">Edit</button><button data-enroll="' + c.id + '">Add contacts</button>' +
            (c.status === 'active' ? '<button data-st="paused" data-id="' + c.id + '">Pause</button>' : '<button class="primary" data-st="active" data-id="' + c.id + '">Activate</button>') + '</td></tr>';
        }).join('') + '</table></div>' : '<div class="card empty">No campaigns yet. Create one to start a sequence of emails and follow-ups.</div>') +
        '<p class="small muted" style="margin-top:12px">How it works: an active campaign queues each enrolled contact\'s next email when it falls due. Emails wait in <a href="#approvals">Approvals</a> (unless auto-send is on), go out within the sending window and daily limit, and follow-ups stop automatically when the contact replies, bounces or unsubscribes.</p>';
      $('#new').onclick = function () { campaignEditor({ steps: [{ dayOffset: 0, subject: '', body: '' }], requireApproval: 'yes' }); };
      $$('[data-edit]').forEach(function (b) { b.onclick = function () { campaignEditor(list.filter(function (c) { return c.id === b.getAttribute('data-edit'); })[0]); }; });
      $$('[data-enroll]').forEach(function (b) { b.onclick = function () { enrollModal(list.filter(function (c) { return c.id === b.getAttribute('data-enroll'); })[0]); }; });
      $$('[data-st]').forEach(function (b) { b.onclick = function () { api('setCampaignStatus', { id: b.getAttribute('data-id'), status: b.getAttribute('data-st') }).then(function () { toast('Campaign ' + b.getAttribute('data-st')); route(); }).catch(fail); }; });
    });
  };

  function campaignEditor(c) {
    var steps = (c.steps || []).map(function (s) { return Object.assign({}, s); });
    var m = modal(c.id ? 'Edit campaign' : 'New campaign',
      '<div class="grid2"><div><label>Campaign name</label><input id="cn" value="' + esc(c.name) + '"></div><div><label>Target segment (for adding contacts)</label><input id="cs" value="' + esc(c.segment) + '"></div></div>' +
      '<div class="row" style="margin-top:10px"><label class="row" style="margin:0;color:var(--ink)"><input type="checkbox" id="ca" style="width:auto"' + (c.requireApproval !== 'no' ? ' checked' : '') + '> Require approval before each email is sent</label>' +
      '<label class="row" style="margin:0;color:var(--ink)"><input type="checkbox" id="cai" style="width:auto"' + (c.useAI === 'yes' ? ' checked' : '') + '> Personalise each email with Claude AI</label></div>' +
      '<p class="small muted">Merge fields: {{first_name}}, {{name}}, {{company}}, {{title}}, {{segment}}. Your signature and an unsubscribe line are added automatically. Follow-ups are sent in the same email thread.</p>' +
      '<div id="steps"></div><div class="row"><button id="addStep">+ Add follow-up</button><span class="spacer" style="flex:1"></span><button class="primary" id="save">Save campaign</button></div>');
    function draw() {
      $('#steps', m).innerHTML = steps.map(function (s, i) {
        return '<div class="step" data-i="' + i + '"><header><b>' + (i === 0 ? 'Email 1' : 'Follow-up ' + i) + '</b>' +
          (i === 0 ? '<span class="small muted">sent as soon as approved</span>' : '<span class="small">send</span><input type="number" min="1" style="width:70px" data-k="dayOffset" value="' + esc(s.dayOffset || 3) + '"><span class="small">days after the previous email, if no reply</span>') +
          '<span style="flex:1"></span><button class="small" data-ai="' + i + '">Improve with AI</button>' + (i ? '<button class="danger small" data-del="' + i + '">Remove</button>' : '') + '</header>' +
          '<label>Subject</label><input data-k="subject" value="' + esc(s.subject) + '"><label>Body</label><textarea data-k="body" rows="6">' + esc(s.body) + '</textarea></div>';
      }).join('');
      $$('.step', m).forEach(function (el) {
        var i = Number(el.getAttribute('data-i'));
        $$('[data-k]', el).forEach(function (inp) { inp.oninput = function () { steps[i][inp.getAttribute('data-k')] = inp.getAttribute('data-k') === 'dayOffset' ? Number(inp.value) : inp.value; }; });
      });
      $$('[data-del]', m).forEach(function (b) { b.onclick = function () { steps.splice(Number(b.getAttribute('data-del')), 1); draw(); }; });
      $$('[data-ai]', m).forEach(function (b) {
        b.onclick = function () {
          var i = Number(b.getAttribute('data-ai')); b.disabled = true; b.textContent = 'Drafting…';
          api('aiDraft', { purpose: i === 0 ? 'First introductory email (template for many recipients — keep merge fields like {{first_name}} and {{company}})' : 'Follow-up ' + i + ' (template — keep merge fields)', subject: steps[i].subject, body: steps[i].body })
            .then(function (d) { steps[i].subject = d.subject; steps[i].body = d.body; draw(); }).catch(function (e) { fail(e); draw(); });
        };
      });
    }
    draw();
    $('#addStep', m).onclick = function () { steps.push({ dayOffset: 4, subject: 'Re: ' + (steps[0].subject || ''), body: '' }); draw(); };
    $('#save', m).onclick = function () {
      var camp = { id: c.id, name: $('#cn', m).value.trim(), segment: $('#cs', m).value.trim(), requireApproval: $('#ca', m).checked, useAI: $('#cai', m).checked, steps: steps };
      if (steps.some(function (s) { return !s.subject.trim() || !s.body.trim(); })) return toast('Every step needs a subject and a body.');
      api('saveCampaign', { campaign: camp }).then(function () { m.remove(); toast('Campaign saved'); route(); }).catch(fail);
    };
  }

  function enrollModal(c) {
    api('listContacts').then(function (list) {
      var avail = list.filter(function (x) { return x.status === 'active' && x.email; });
      var m = modal('Add contacts to "' + c.name + '"',
        '<div class="toolbar"><input id="eq" placeholder="Search"><select id="es"><option value="">All segments</option>' + uniq(avail.map(function (x) { return x.segment; })).map(function (s) { return '<option' + (s === c.segment ? ' selected' : '') + '>' + esc(s) + '</option>'; }).join('') + '</select>' +
        '<select id="estg"><option value="">All stages</option>' + S.stages.map(function (s) { return '<option>' + s + '</option>'; }).join('') + '</select><label class="row" style="margin:0"><input type="checkbox" id="eall" style="width:auto"> select all shown</label></div>' +
        '<div class="table-wrap" style="max-height:340px"><table id="et"></table></div><div class="row" style="margin-top:12px"><button class="primary" id="ego">Add selected</button><span class="small muted" id="esel"></span></div>');
      var sel = {};
      function draw() {
        var q = $('#eq', m).value.toLowerCase(), s = $('#es', m).value, st = $('#estg', m).value;
        var rows = avail.filter(function (x) { return (!q || [x.company, x.name, x.email].join(' ').toLowerCase().indexOf(q) >= 0) && (!s || x.segment === s) && (!st || x.stage === st); });
        $('#et', m).innerHTML = '<tr><th></th><th>Company</th><th>Contact</th><th>Stage</th></tr>' + rows.map(function (x) { return '<tr><td><input type="checkbox" style="width:auto" data-id="' + esc(x.id) + '"' + (sel[x.id] ? ' checked' : '') + '></td><td>' + esc(x.company) + '</td><td>' + esc(x.name) + ' <span class="muted small">' + esc(x.email) + '</span></td><td>' + stagePill(x.stage) + '</td></tr>'; }).join('');
        $$('#et input', m).forEach(function (b) { b.onchange = function () { sel[b.getAttribute('data-id')] = b.checked; count(); }; });
        $('#eall', m).onchange = function () { var on = this.checked; rows.forEach(function (x) { sel[x.id] = on; }); draw(); count(); };
      }
      function count() { $('#esel', m).textContent = Object.keys(sel).filter(function (k) { return sel[k]; }).length + ' selected'; }
      ['#eq', '#es', '#estg'].forEach(function (s) { $(s, m).oninput = draw; });
      draw(); count();
      $('#ego', m).onclick = function () {
        var ids = Object.keys(sel).filter(function (k) { return sel[k]; }); if (!ids.length) return toast('Select at least one contact.');
        api('enroll', { campaignId: c.id, contactIds: ids }).then(function (r) { m.remove(); toast(r.added + ' added' + (r.skipped ? ', ' + r.skipped + ' already in campaign or not emailable' : '') + (c.status !== 'active' ? ' — activate the campaign to start' : '')); route(); }).catch(fail);
      };
    }).catch(fail);
  }

  // ------------------------------------------------------------ approvals
  VIEWS.approvals = function () {
    return api('listQueue', { status: 'pending_approval' }).then(function (list) {
      $('#view').innerHTML = head('Approvals', '<button id="run">Send approved emails now</button>') +
        (list.length ? '<div class="toolbar"><label class="row" style="margin:0"><input type="checkbox" id="all" style="width:auto"> Select all</label><button class="primary" id="ap">Approve selected</button><button class="danger" id="rj">Reject selected</button><span class="small muted">Approved emails go out within the sending window (' + esc(S.settings && S.settings.DAILY_LIMIT) + ' a day max).</span></div>' +
        '<div class="table-wrap"><table><tr><th></th><th>To</th><th>Campaign</th><th>Step</th><th>Subject</th><th>Queued</th><th></th></tr>' + list.map(function (q) {
          return '<tr><td><input type="checkbox" style="width:auto" data-id="' + esc(q.id) + '"></td><td><b>' + esc(q.company) + '</b><div class="small muted">' + esc(q.contactName) + ' · ' + esc(q.to) + '</div></td><td>' + esc(q.campaignName) + '</td><td>' + (Number(q.step) === 0 ? 'Email 1' : 'Follow-up ' + q.step) + '</td><td>' + esc(q.subject) + '</td><td>' + ago(q.createdAt) + '</td><td><button data-view="' + esc(q.id) + '">Review / edit</button></td></tr>';
        }).join('') + '</table></div>' : '<div class="card empty">Nothing waiting for approval.</div>');
      $('#run').onclick = function () { this.disabled = true; api('runNow').then(function () { toast('Scheduler ran'); route(); refreshCounts(); }).catch(fail); };
      if (!list.length) return;
      var ids = function () { return $$('[data-id]:checked').map(function (b) { return b.getAttribute('data-id'); }); };
      $('#all').onchange = function () { var on = this.checked; $$('[data-id]').forEach(function (b) { b.checked = on; }); };
      $('#ap').onclick = function () { var i = ids(); if (!i.length) return toast('Select emails first.'); api('approve', { ids: i }).then(function (r) { toast(r.approved + ' approved'); route(); refreshCounts(); }).catch(fail); };
      $('#rj').onclick = function () { var i = ids(); if (!i.length) return toast('Select emails first.'); if (!confirm('Reject ' + i.length + ' email(s)? Their sequences will stop.')) return; api('reject', { ids: i }).then(function () { route(); refreshCounts(); }).catch(fail); };
      $$('[data-view]').forEach(function (b) {
        b.onclick = function () {
          var q = list.filter(function (x) { return x.id === b.getAttribute('data-view'); })[0];
          var m = modal('Review email to ' + (q.company || q.to), '<div class="small muted">To: ' + esc(q.to) + ' · ' + esc(q.campaignName) + '</div><label>Subject</label><input id="qs" value="' + esc(q.subject) + '"><label>Body</label><textarea id="qb" rows="12">' + esc(q.body) + '</textarea>' +
            '<p class="small muted">Signature and unsubscribe line are added when sent.</p><div class="row"><button id="qsave">Save changes</button><button class="primary" id="qap">Save and approve</button><button class="danger" id="qrj">Reject</button></div>');
          var saveQ = function () { return api('editQueued', { id: q.id, subject: $('#qs', m).value, body: $('#qb', m).value }); };
          $('#qsave', m).onclick = function () { saveQ().then(function () { toast('Saved'); m.remove(); route(); }).catch(fail); };
          $('#qap', m).onclick = function () { saveQ().then(function () { return api('approve', { ids: [q.id] }); }).then(function () { toast('Approved'); m.remove(); route(); refreshCounts(); }).catch(fail); };
          $('#qrj', m).onclick = function () { api('reject', { ids: [q.id] }).then(function () { m.remove(); route(); refreshCounts(); }).catch(fail); };
        };
      });
    });
  };

  // ------------------------------------------------------------ replies
  VIEWS.replies = function () {
    return Promise.all([api('listReplies'), api('listQueue', { status: 'failed' })]).then(function (r) {
      var list = r[0], failed = r[1];
      $('#view').innerHTML = head('Replies', '') +
        '<p class="small muted">Replies are picked up from the Gmail inbox every 30 minutes. A reply stops that contact\'s follow-ups, moves them to "Replied" and creates a task to respond. Answer the reply from Gmail itself.</p>' +
        (list.length ? '<div class="table-wrap"><table><tr><th>When</th><th>Company</th><th>Type</th><th>Message</th><th>Stage</th></tr>' + list.map(function (a) {
          var t = a.type === 'reply' ? '<span class="pill green">' + esc(a.summary.replace('Reply received ', '')) + '</span>' : statusPill(a.type === 'bounce' ? 'bounced' : 'unsubscribed');
          return '<tr class="clickable" data-c="' + esc(a.contactId) + '"><td>' + fmtDate(a.at, true) + '</td><td><b>' + esc(a.company) + '</b><div class="small muted">' + esc(a.contactName) + '</div></td><td>' + t + '</td><td class="small">' + esc(a.detail) + '</td><td>' + stagePill(a.stage) + '</td></tr>';
        }).join('') + '</table></div>' : '<div class="card empty">No replies yet.</div>') +
        (failed.length ? '<h2 style="margin-top:20px">Failed sends</h2><div class="table-wrap"><table><tr><th>To</th><th>Subject</th><th>Error</th></tr>' + failed.map(function (q) { return '<tr><td>' + esc(q.to) + '</td><td>' + esc(q.subject) + '</td><td class="small">' + esc(q.error) + '</td></tr>'; }).join('') + '</table></div>' : '');
      $$('[data-c]').forEach(function (tr) { tr.onclick = function () { openContact(tr.getAttribute('data-c')); }; });
    });
  };

  // ------------------------------------------------------------ tasks
  VIEWS.tasks = function () {
    return api('listTasks').then(function (list) {
      var today = new Date().toISOString().slice(0, 10);
      var open = list.filter(function (t) { return t.done !== 'yes'; }).sort(function (a, b) { return String(a.due || '9') < String(b.due || '9') ? -1 : 1; });
      $('#view').innerHTML = head('Follow-up tasks', '<button class="primary" id="nt">New task</button>') +
        (open.length ? '<div class="table-wrap"><table><tr><th></th><th>Task</th><th>Company</th><th>Owner</th><th>Due</th></tr>' + open.map(function (t) {
          var due = String(t.due || '').slice(0, 10);
          return '<tr><td><input type="checkbox" style="width:auto" data-done="' + esc(t.id) + '"></td><td>' + esc(t.title) + '</td><td>' + (t.contactId ? '<a href="javascript:void 0" data-c="' + esc(t.contactId) + '">' + esc(t.company) + '</a>' : '') + '</td><td>' + esc(t.owner) + '</td><td>' + (due && due < today ? '<span class="pill red">' + fmtDate(due) + '</span>' : due === today ? '<span class="pill amber">Today</span>' : fmtDate(due)) + '</td></tr>';
        }).join('') + '</table></div>' : '<div class="card empty">No open tasks.</div>') +
        '<p class="small muted" style="margin-top:10px">' + (list.length - open.length) + ' completed tasks hidden.</p>';
      $('#nt').onclick = function () { taskModal({}); };
      $$('[data-done]').forEach(function (b) { b.onchange = function () { api('completeTask', { id: b.getAttribute('data-done') }).then(function () { toast('Done'); route(); refreshCounts(); }).catch(fail); }; });
      $$('[data-c]').forEach(function (a) { a.onclick = function () { openContact(a.getAttribute('data-c')); }; });
    });
  };

  function taskModal(t) {
    var go = function (contacts) {
      var m = modal('New follow-up task', '<label>Task</label><input id="tt" placeholder="e.g. Call to discuss health-check scope">' +
        '<div class="grid2"><div><label>Due date</label><input type="date" id="td" value="' + new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10) + '"></div><div><label>Owner</label><input id="to" value="' + esc(S.user.name) + '"></div></div>' +
        (t.contactId ? '' : '<label>Company (optional)</label><select id="tc"><option value="">—</option>' + contacts.map(function (c) { return '<option value="' + esc(c.id) + '">' + esc(c.company) + ' — ' + esc(c.name) + '</option>'; }).join('') + '</select>') +
        '<div class="row" style="margin-top:12px"><button class="primary" id="ts">Save task</button></div>');
      $('#ts', m).onclick = function () {
        var task = { title: $('#tt', m).value.trim(), due: $('#td', m).value, owner: $('#to', m).value, contactId: t.contactId || ($('#tc', m) ? $('#tc', m).value : '') };
        if (!task.title) return toast('Enter a task.');
        api('saveTask', { task: task }).then(function () { m.remove(); toast('Task added'); refreshCounts(); if (location.hash === '#tasks') route(); }).catch(fail);
      };
    };
    if (t.contactId) go([]); else api('listContacts').then(go).catch(fail);
  }

  // ------------------------------------------------------------ settings
  VIEWS.settings = function () {
    return api('getSettings').then(function (d) {
      var s = d.settings;
      var f = function (k, l, hint) { return '<div><label>' + l + '</label><input data-s="' + k + '" value="' + esc(s[k]) + '">' + (hint ? '<div class="small muted">' + hint + '</div>' : '') + '</div>'; };
      $('#view').innerHTML = head('Settings', '') +
        '<div class="card"><h3>Sending</h3><p class="small muted">Emails are sent through the Gmail account <b>' + esc(d.account) + '</b>. Leave "From address" blank to send as that account; once Yukthi allows it, add operations@safelegal.org as a verified "Send mail as" address in Gmail and enter it here.</p>' +
        '<div class="grid2">' + f('FROM_NAME', 'From name') + f('FROM_ADDRESS', 'From address (verified send-as alias)') + f('REPLY_TO', 'Reply-to address (optional)') + f('DAILY_LIMIT', 'Daily sending limit', 'Free Gmail allows about 100 recipients a day from scripts; Google Workspace allows more.') +
        f('SEND_START_HOUR', 'Send from hour (IST, 0–23)') + f('SEND_END_HOUR', 'Send until hour (IST)') + f('SEND_DAYS', 'Send on days', '0 = Sunday … 6 = Saturday, comma separated') + f('CLAUDE_MODEL', 'Claude model') + '</div>' +
        '<label>Email signature (HTML)</label><textarea data-s="SIGNATURE_HTML">' + esc(s.SIGNATURE_HTML) + '</textarea>' +
        '<label>Unsubscribe line (keep {{unsubscribe_link}})</label><textarea data-s="UNSUBSCRIBE_TEXT" rows="2">' + esc(s.UNSUBSCRIBE_TEXT) + '</textarea>' +
        '<label>Firm brief for AI drafting</label><textarea data-s="FIRM_BRIEF" rows="3">' + esc(s.FIRM_BRIEF) + '</textarea>' +
        '<label>Claude API key ' + (d.hasClaudeKey ? '<span class="pill green">saved</span>' : '<span class="pill amber">not set</span>') + '</label><input id="ck" type="password" placeholder="Paste a new key to replace (stored in Script Properties, never shown)">' +
        '<div class="row" style="margin-top:14px"><button class="primary" id="ss">Save settings</button><button id="te">Send me a test email</button></div></div>' +
        '<div class="card" style="margin-top:14px"><h3>Team</h3><p class="small muted">Add or remove people, and change PINs, in the <b>Users</b> tab of the Google Sheet.</p><table><tr><th>Name</th><th>Email</th><th>Role</th><th>Active</th></tr>' +
        d.users.map(function (u) { return '<tr><td>' + esc(u.name) + '</td><td>' + esc(u.email) + '</td><td>' + esc(u.role) + '</td><td>' + esc(u.active) + '</td></tr>'; }).join('') + '</table></div>' +
        (DEMO ? '<div class="row" style="margin-top:14px"><button id="reset">Reset demo data</button></div>' : '');
      $('#ss').onclick = function () {
        var o = {}; $$('[data-s]').forEach(function (i) { o[i.getAttribute('data-s')] = i.value; });
        api('saveSettings', { settings: o, claudeKey: $('#ck').value.trim() }).then(function () { toast('Settings saved'); route(); }).catch(fail);
      };
      $('#te').onclick = function () { api('testEmail', { subject: 'Test', body: 'This is a test email from SAFE Marketing Studio.' }).then(function (r) { toast('Test email sent to ' + r.sentTo); }).catch(fail); };
      if ($('#reset')) $('#reset').onclick = function () { window.SAFE_MOCK_RESET(); toast('Demo data reset'); route(); };
    });
  };

  // ------------------------------------------------------------ boot
  try { S.token = sessionStorage.getItem('safe-mkt-token'); } catch (e) {}
  if (DEMO) { S.token = 'demo'; start(); }
  else if (S.token) start();
  else showLogin();
})();
