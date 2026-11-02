// Demo-mode backend: used only when MARKETING_API_URL is empty in assets/config.js.
// Mirrors the Apps Script actions with sample data held in the browser.
(function () {
  var STAGES = ['New','Contacted','Replied','Meeting','Proposal','Won','Lost','On hold'];
  var KEY = 'safe-mkt-demo-v1';
  function iso(daysAgo, h) { var d = new Date(Date.now() - daysAgo * 86400000); if (h !== undefined) d.setHours(h, 0, 0, 0); return d.toISOString(); }
  function id(p) { return p + Math.random().toString(16).slice(2, 10); }

  function seed() {
    var cos = [
      ['Aurora Digital Exchange','Priya Raman','Head of Legal','VDA exchange','Bengaluru'],
      ['Kestrel Custody Pvt Ltd','Arjun Mehta','CEO','Custody','Mumbai'],
      ['Northwind Web3 Labs','Sana Qureshi','Co-founder','Web3 startup','Bengaluru'],
      ['Bluefin Derivatives','Rohan Iyer','Compliance Officer','Derivatives','Mumbai'],
      ['Saffron Pay Technologies','Meera Nair','CFO','Fintech','Chennai'],
      ['Trellis Tokenisation','Vikram Shah','Founder','Tokenisation','Pune'],
      ['Granite Analytics','Neha Kapoor','General Counsel','SaaS','Hyderabad'],
      ['Monsoon Ledger','Aditya Rao','CTO','VDA exchange','Bengaluru'],
      ['Cobalt Health Systems','Farah Siddiqui','Director','Healthtech','Delhi'],
      ['Riverstone Logistics','Karan Malhotra','CEO','Logistics','Gurugram'],
      ['Lotus Wallets','Divya Menon','Head of Risk','Wallet provider','Kochi'],
      ['Peak Orbit Aerospace','Suresh Babu','MD','Space','Bengaluru']
    ];
    var stages = ['Contacted','Replied','New','Meeting','Contacted','Proposal','Contacted','New','Won','Lost','Replied','New'];
    var contacts = cos.map(function (c, i) {
      return { id: 'C' + (100 + i), company: c[0], name: c[1], title: c[2], email: c[1].split(' ')[0].toLowerCase() + '@' + c[0].split(' ')[0].toLowerCase() + '.example', phone: '', website: c[0].split(' ')[0].toLowerCase() + '.example',
        segment: c[3], tags: c[4], stage: stages[i], owner: i % 2 ? 'Deepika' : 'Sandeep', source: 'Demo', status: 'active',
        lastContacted: stages[i] === 'New' ? '' : iso(3 + i), lastReply: ['Replied','Meeting','Proposal','Won'].indexOf(stages[i]) >= 0 ? iso(1 + i % 3) : '', nextFollowUp: stages[i] === 'Contacted' ? iso(-2) : '', createdAt: iso(40 - i), updatedAt: iso(i) };
    });
    var steps = [
      { dayOffset: 0, subject: 'After the Binance incident — a quick check for {{company}}', body: 'Dear {{first_name}},\n\nThe recent Binance incident has many Indian VDA platforms reviewing their custody, vendor and user agreements. We have put together a short Contract & Compliance Health Check for exchanges and Web3 businesses.\n\nWould a 20-minute call next week be useful?' },
      { dayOffset: 4, subject: 'Re: After the Binance incident', body: 'Dear {{first_name}},\n\nFollowing up on my note — happy to share our one-page checklist on breach liability and CERT-In/PMLA reporting, no obligation.' },
      { dayOffset: 7, subject: 'Re: After the Binance incident', body: 'Dear {{first_name}},\n\nI will not keep writing — if this becomes relevant for {{company}}, just reply and we will set up a time.' }
    ];
    var campaigns = [
      { id: 'K1', name: 'VDA Health Check — Nov 2026', segment: 'VDA exchange', status: 'active', steps: steps, useAI: 'yes', requireApproval: 'yes', createdBy: 'Sandeep', createdAt: iso(14) },
      { id: 'K2', name: 'Startup retainer intro', segment: 'Web3 startup', status: 'paused', steps: [steps[0]], useAI: 'no', requireApproval: 'yes', createdBy: 'Deepika', createdAt: iso(30) }
    ];
    var enrollments = [], queue = [], activity = [], tasks = [];
    contacts.forEach(function (c, i) {
      if (c.stage === 'New') return;
      var camp = i % 3 === 0 ? 'K2' : 'K1';
      var st = ['Replied','Meeting','Proposal','Won'].indexOf(c.stage) >= 0 ? 'replied' : (c.stage === 'Lost' ? 'completed' : 'active');
      var e = { id: 'E' + i, campaignId: camp, contactId: c.id, step: 1, status: st, nextSendAt: iso(-1), threadId: 't' + i, lastSentAt: c.lastContacted, enrolledAt: iso(20) };
      enrollments.push(e);
      for (var w = 0; w < 1 + (i % 3); w++) {
        var sentAt = iso(2 + i * 4 + w * 7, 11);
        queue.push({ id: id('Q'), enrollmentId: e.id, campaignId: camp, contactId: c.id, step: w, to: c.email, subject: w ? 'Re: After the Binance incident' : steps[0].subject.replace('{{company}}', c.company), body: steps[w % 3].body.replace(/{{first_name}}/g, c.name.split(' ')[0]).replace(/{{company}}/g, c.company), status: 'sent', createdAt: sentAt, approvedBy: 'Sandeep', sentAt: sentAt, threadId: e.threadId });
        activity.push({ id: id('A'), contactId: c.id, type: 'email', summary: (w ? 'Follow-up sent: ' : 'Email sent: ') + 'After the Binance incident', detail: '', by: 'Sandeep', at: sentAt });
      }
      if (st === 'replied') {
        activity.push({ id: id('A'), contactId: c.id, type: 'reply', summary: 'Reply received (interested)', detail: 'Thanks for reaching out — yes, let us find a time on Thursday to discuss the health check.', by: 'system', at: iso(1 + i % 3, 15) });
        tasks.push({ id: id('T'), contactId: c.id, title: 'Respond to reply from ' + c.name, due: iso(i % 2 ? 0 : -2).slice(0, 10), owner: c.owner, done: 'no', createdAt: iso(1) });
      }
    });
    activity.push({ id: id('A'), contactId: 'C103', type: 'comment', summary: 'Spoke to Rohan — wants our PMLA audit scope before the board meeting.', detail: '', by: 'Deepika', at: iso(0, 10) });
    activity.push({ id: id('A'), contactId: 'C109', type: 'bounce', summary: 'Email bounced', detail: 'Address not found', by: 'system', at: iso(5) });
    contacts.slice(7, 11).forEach(function (c, i) {
      var e = enrollments.filter(function (x) { return x.contactId === c.id; })[0];
      if (!e) { e = { id: 'E9' + i, campaignId: 'K1', contactId: c.id, step: 0, status: 'active', nextSendAt: iso(0), enrolledAt: iso(0) }; enrollments.push(e); }
      queue.push({ id: id('Q'), enrollmentId: e.id, campaignId: 'K1', contactId: c.id, step: e.step, to: c.email, subject: 'After the Binance incident — a quick check for ' + c.company, body: steps[0].body.replace(/{{first_name}}/g, c.name.split(' ')[0]).replace(/{{company}}/g, c.company), status: 'pending_approval', createdAt: iso(0) });
    });
    tasks.push({ id: id('T'), contactId: 'C105', title: 'Send health-check proposal', due: iso(-3).slice(0, 10), owner: 'Sandeep', done: 'no', createdAt: iso(2) });
    return { contacts: contacts, campaigns: campaigns, enrollments: enrollments, queue: queue, activity: activity, tasks: tasks,
      settings: { FROM_NAME: 'SAFE Legal Solutions', FROM_ADDRESS: '', REPLY_TO: '', DAILY_LIMIT: '80', SEND_START_HOUR: '10', SEND_END_HOUR: '18', SEND_DAYS: '1,2,3,4,5,6', SIGNATURE_HTML: 'Adv. Sandeep Kumar N<br>SAFE Legal Solutions', UNSUBSCRIBE_TEXT: 'If you would prefer not to hear from us, <a href="{{unsubscribe_link}}">click here</a>.', CLAUDE_MODEL: 'claude-sonnet-5-5', FIRM_BRIEF: 'SAFE Legal Solutions is a Bengaluru-based law firm.' },
      users: [{ name: 'Sandeep', email: 'demo@safelegal.org', role: 'admin', active: 'yes' }, { name: 'Deepika', email: 'deepika@safelegal.org', role: 'member', active: 'yes' }] };
  }

  var db;
  try { db = JSON.parse(localStorage.getItem(KEY)); } catch (e) { db = null; }
  if (!db) db = seed();
  function save() { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) {} }
  function log(cid, type, summary, detail, by) { db.activity.push({ id: id('A'), contactId: cid, type: type, summary: summary, detail: detail || '', by: by || 'system', at: new Date().toISOString() }); }
  function byId(list, i) { return list.filter(function (x) { return x.id === i; })[0]; }
  var user = { name: 'Sandeep (demo)', email: 'demo@safelegal.org', role: 'admin' };

  function dashboard() {
    var sent = db.queue.filter(function (q) { return q.status === 'sent'; });
    var replies = db.activity.filter(function (a) { return a.type === 'reply'; });
    var rc = {}, cc = {}; replies.forEach(function (r) { rc[r.contactId] = 1; }); sent.forEach(function (q) { cc[q.contactId] = 1; });
    var byStage = {}; STAGES.forEach(function (s) { byStage[s] = 0; }); db.contacts.forEach(function (c) { byStage[c.stage] = (byStage[c.stage] || 0) + 1; });
    var labels = [], ws = [], wr = [], mon = new Date(); mon.setHours(0, 0, 0, 0); mon.setDate(mon.getDate() - ((mon.getDay() + 6) % 7));
    for (var i = 11; i >= 0; i--) {
      var a = new Date(mon.getTime() - i * 7 * 86400000), b = new Date(a.getTime() + 7 * 86400000);
      labels.push(a.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }));
      ws.push(sent.filter(function (q) { var d = new Date(q.sentAt); return d >= a && d < b; }).length);
      wr.push(replies.filter(function (r) { var d = new Date(r.at); return d >= a && d < b; }).length);
    }
    var today = new Date().toISOString().slice(0, 10), start = new Date(); start.setHours(0, 0, 0, 0);
    return {
      kpis: { contacts: db.contacts.length, contacted: Object.keys(cc).length, emailsSent: sent.length, sentToday: sent.filter(function (q) { return new Date(q.sentAt) >= start; }).length, dailyLimit: Number(db.settings.DAILY_LIMIT),
        replies: Object.keys(rc).length, replyRate: Object.keys(cc).length ? Object.keys(rc).length / Object.keys(cc).length : 0, meetings: byStage.Meeting, won: byStage.Won,
        pendingApproval: db.queue.filter(function (q) { return q.status === 'pending_approval'; }).length, failed: db.queue.filter(function (q) { return q.status === 'failed'; }).length,
        tasksDue: db.tasks.filter(function (t) { return t.done !== 'yes' && t.due && t.due <= today; }).length,
        unsubscribed: db.contacts.filter(function (c) { return c.status === 'unsubscribed'; }).length, bounced: db.contacts.filter(function (c) { return c.status === 'bounced'; }).length },
      byStage: byStage, weekly: { labels: labels, sent: ws, replies: wr },
      campaigns: db.campaigns.map(function (c) { var e = db.enrollments.filter(function (x) { return x.campaignId === c.id; }); var s = sent.filter(function (q) { return q.campaignId === c.id; }); var u = {}; s.forEach(function (q) { u[q.contactId] = 1; }); return { id: c.id, name: c.name, status: c.status, enrolled: e.length, contacted: Object.keys(u).length, sent: s.length, replied: e.filter(function (x) { return x.status === 'replied'; }).length }; }),
      recent: db.activity.slice().sort(function (a, b) { return a.at < b.at ? 1 : -1; }).slice(0, 25).map(function (a) { var c = byId(db.contacts, a.contactId) || {}; return Object.assign({ company: c.company || '' }, a); })
    };
  }

  var A = {
    login: function () { return { token: 'demo', user: user }; },
    me: function () { return { user: user, stages: STAGES, settings: { DAILY_LIMIT: db.settings.DAILY_LIMIT, FROM_NAME: db.settings.FROM_NAME, FROM_ADDRESS: 'safelegalsolutions@gmail.com' } }; },
    dashboard: dashboard,
    listContacts: function () { return db.contacts; },
    getContact: function (r) { return { contact: byId(db.contacts, r.id), activity: db.activity.filter(function (a) { return a.contactId === r.id; }).sort(function (a, b) { return a.at < b.at ? 1 : -1; }), tasks: db.tasks.filter(function (t) { return t.contactId === r.id; }), enrollments: db.enrollments.filter(function (e) { return e.contactId === r.id; }).map(function (e) { return Object.assign({ campaignName: (byId(db.campaigns, e.campaignId) || {}).name }, e); }) }; },
    saveContact: function (r) { var c = r.contact; if (c.id) { var o = byId(db.contacts, c.id); if (c.stage && o.stage !== c.stage) log(c.id, 'stage', 'Stage: ' + o.stage + ' → ' + c.stage, '', user.name); Object.assign(o, c, { updatedAt: new Date().toISOString() }); return o; } c.id = id('C'); c.stage = c.stage || 'New'; c.status = 'active'; c.owner = c.owner || 'Sandeep'; c.createdAt = new Date().toISOString(); db.contacts.push(c); log(c.id, 'created', 'Contact added', '', user.name); return c; },
    importContacts: function (r) { var added = 0, skipped = 0, ex = {}; db.contacts.forEach(function (c) { ex[(c.email || '').toLowerCase()] = 1; }); (r.rows || []).forEach(function (x) { var em = (x.email || '').toLowerCase(); if ((!em && !x.company) || (em && ex[em])) { skipped++; return; } var c = Object.assign({ id: id('C'), stage: 'New', status: 'active', owner: 'Sandeep', source: r.source || 'Import', createdAt: new Date().toISOString() }, x, { email: em }); db.contacts.push(c); ex[em] = 1; added++; }); return { added: added, skipped: skipped }; },
    addComment: function (r) { log(r.contactId, 'comment', r.text, '', user.name); return true; },
    setStage: function (r) { return A.saveContact({ contact: { id: r.id, stage: r.stage } }); },
    listCampaigns: function () { return db.campaigns.map(function (c) { var e = db.enrollments.filter(function (x) { return x.campaignId === c.id; }); return Object.assign({}, c, { stats: { enrolled: e.length, active: e.filter(function (x) { return x.status === 'active'; }).length, replied: e.filter(function (x) { return x.status === 'replied'; }).length, sent: db.queue.filter(function (q) { return q.campaignId === c.id && q.status === 'sent'; }).length, pending: db.queue.filter(function (q) { return q.campaignId === c.id && q.status === 'pending_approval'; }).length } }); }); },
    saveCampaign: function (r) { var c = r.campaign; var rec = { name: c.name, segment: c.segment, steps: c.steps, useAI: c.useAI ? 'yes' : 'no', requireApproval: c.requireApproval === false ? 'no' : 'yes' }; if (c.id) return Object.assign(byId(db.campaigns, c.id), rec); rec.id = id('K'); rec.status = 'draft'; rec.createdBy = user.name; rec.createdAt = new Date().toISOString(); db.campaigns.push(rec); return rec; },
    setCampaignStatus: function (r) { var c = byId(db.campaigns, r.id); c.status = r.status; return c; },
    enroll: function (r) { var added = 0, skipped = 0; (r.contactIds || []).forEach(function (cid) { if (db.enrollments.some(function (e) { return e.campaignId === r.campaignId && e.contactId === cid; })) { skipped++; return; } db.enrollments.push({ id: id('E'), campaignId: r.campaignId, contactId: cid, step: 0, status: 'active', nextSendAt: new Date().toISOString(), enrolledAt: new Date().toISOString() }); log(cid, 'enrolled', 'Added to campaign: ' + byId(db.campaigns, r.campaignId).name, '', user.name); added++; }); return { added: added, skipped: skipped }; },
    stopEnrollment: function (r) { var e = byId(db.enrollments, r.id); e.status = 'stopped'; return e; },
    listQueue: function (r) { return db.queue.filter(function (q) { return !r.status || q.status === r.status; }).slice().reverse().map(function (q) { var c = byId(db.contacts, q.contactId) || {}; return Object.assign({ company: c.company, contactName: c.name, campaignName: (byId(db.campaigns, q.campaignId) || {}).name }, q); }); },
    editQueued: function (r) { var q = byId(db.queue, r.id); q.subject = r.subject; q.body = r.body; return q; },
    approve: function (r) { (r.ids || []).forEach(function (i) { var q = byId(db.queue, i); q.status = 'approved'; q.approvedBy = user.name; }); return { approved: r.ids.length }; },
    reject: function (r) { (r.ids || []).forEach(function (i) { var q = byId(db.queue, i); q.status = 'rejected'; }); return { rejected: r.ids.length }; },
    runNow: function () { db.queue.filter(function (q) { return q.status === 'approved'; }).forEach(function (q) { q.status = 'sent'; q.sentAt = new Date().toISOString(); var c = byId(db.contacts, q.contactId); if (c.stage === 'New') c.stage = 'Contacted'; c.lastContacted = q.sentAt; log(q.contactId, 'email', 'Email sent: ' + q.subject, '', 'demo'); }); return dashboard().kpis; },
    listReplies: function () { return db.activity.filter(function (a) { return ['reply', 'bounce', 'unsubscribe'].indexOf(a.type) >= 0; }).sort(function (a, b) { return a.at < b.at ? 1 : -1; }).map(function (a) { var c = byId(db.contacts, a.contactId) || {}; return Object.assign({ company: c.company, contactName: c.name, stage: c.stage }, a); }); },
    listTasks: function () { return db.tasks.map(function (t) { return Object.assign({ company: (byId(db.contacts, t.contactId) || {}).company || '' }, t); }); },
    saveTask: function (r) { var t = r.task; if (t.id) return Object.assign(byId(db.tasks, t.id), t); t.id = id('T'); t.done = 'no'; t.owner = t.owner || 'Sandeep'; t.createdAt = new Date().toISOString(); db.tasks.push(t); if (t.contactId) log(t.contactId, 'task', 'Task: ' + t.title, '', user.name); return t; },
    completeTask: function (r) { var t = byId(db.tasks, r.id); t.done = 'yes'; return t; },
    getSettings: function () { return { settings: db.settings, users: db.users, hasClaudeKey: false, account: 'safelegalsolutions@gmail.com' }; },
    saveSettings: function (r) { Object.assign(db.settings, r.settings || {}); return true; },
    aiDraft: function (r) { var c = byId(db.contacts, r.contactId) || {}; return { subject: (r.subject || 'Introduction').replace('{{company}}', c.company || ''), body: '(Demo mode — AI drafting runs once the Claude API key is added in Settings.)\n\n' + (r.body || '').replace(/{{first_name}}/g, (c.name || '').split(' ')[0]).replace(/{{company}}/g, c.company || '') }; },
    testEmail: function () { return { sentTo: 'demo@safelegal.org' }; }
  };

  window.SAFE_MOCK = function (action, payload) {
    var fn = A[action]; if (!fn) throw new Error('Unknown action ' + action);
    var out = fn(payload || {}); save();
    return JSON.parse(JSON.stringify(out));
  };
  window.SAFE_MOCK_RESET = function () { try { localStorage.removeItem(KEY); } catch (e) {} db = seed(); };
})();
