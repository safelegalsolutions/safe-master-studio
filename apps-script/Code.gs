/**
 * SAFE Marketing Studio — Google Apps Script backend
 * --------------------------------------------------
 * Data store : the Google Sheet this script is bound to (one tab per table).
 * Email      : Gmail API (advanced service) from the deploying account,
 *              optionally "From" a verified send-as alias (e.g. operations@safelegal.org).
 * Front end  : GitHub Pages (marketing/index.html) calls doPost with JSON.
 *
 * Run setup() once from the editor, then deploy as a Web app (see README.md).
 */

// ---------------------------------------------------------------- schema
var SCHEMA = {
  Contacts:    ['id','company','name','title','email','phone','website','segment','tags','stage','owner','source','status','lastContacted','lastReply','nextFollowUp','createdAt','updatedAt'],
  Campaigns:   ['id','name','segment','status','steps','useAI','requireApproval','createdBy','createdAt','updatedAt'],
  Enrollments: ['id','campaignId','contactId','step','status','nextSendAt','threadId','lastMessageId','lastSentAt','enrolledAt'],
  Queue:       ['id','enrollmentId','campaignId','contactId','step','to','subject','body','status','createdAt','approvedBy','sentAt','threadId','gmailId','error'],
  Activity:    ['id','contactId','type','summary','detail','by','at'],
  Tasks:       ['id','contactId','title','due','owner','done','createdAt','doneAt'],
  Users:       ['name','email','pin','role','active'],
  Settings:    ['key','value']
};

var STAGES = ['New','Contacted','Replied','Meeting','Proposal','Won','Lost','On hold'];

var DEFAULT_SETTINGS = {
  FROM_NAME: 'SAFE Legal Solutions',
  FROM_ADDRESS: '',            // blank = the Gmail account itself; set to a verified send-as alias later
  REPLY_TO: '',
  DAILY_LIMIT: '80',           // stay under Gmail consumer limits (~100 recipients/day)
  SEND_START_HOUR: '10',       // IST
  SEND_END_HOUR: '18',
  SEND_DAYS: '1,2,3,4,5,6',    // 0=Sun ... 6=Sat
  SIGNATURE_HTML: 'Adv. Sandeep Kumar N<br>Founder and Managing Partner<br>SAFE Legal Solutions<br>info@safelegal.org | +91-9886181839 | <a href="https://safelegal.in">safelegal.in</a>',
  UNSUBSCRIBE_TEXT: 'If you would prefer not to hear from us, <a href="{{unsubscribe_link}}">click here</a> and we will not write again.',
  CLAUDE_MODEL: 'claude-sonnet-5-5',
  FIRM_BRIEF: 'SAFE Legal Solutions is a Bengaluru-based law firm that works as a virtual legal department for growing companies: contracts, corporate, compliance (PMLA, DPDP, CERT-In), cross-border structuring and disputes.'
};

// ---------------------------------------------------------------- entry points
function doPost(e) {
  var out;
  try {
    var req = JSON.parse(e.postData.contents || '{}');
    var action = req.action;
    if (action === 'login') {
      out = login_(req.email, req.pin);
    } else {
      var user = verifyToken_(req.token);
      if (!user) throw new Error('AUTH: Please sign in again.');
      var fn = API[action];
      if (!fn) throw new Error('Unknown action: ' + action);
      out = fn(req, user);
    }
    return json_({ ok: true, data: out });
  } catch (err) {
    return json_({ ok: false, error: String(err.message || err) });
  }
}

function doGet(e) {
  var p = (e && e.parameter) || {};
  if (p.u) return unsubscribePage_(p.u);
  return HtmlService.createHtmlOutput('<p style="font-family:Arial">SAFE Marketing Studio API is running.</p>');
}

// ---------------------------------------------------------------- setup
function setup() {
  var ss = SpreadsheetApp.getActive();
  Object.keys(SCHEMA).forEach(function (name) {
    var sh = ss.getSheetByName(name) || ss.insertSheet(name);
    var hdr = SCHEMA[name];
    var existing = sh.getLastColumn() ? sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0] : [];
    if (existing.join('') === '') {
      sh.getRange(1, 1, 1, hdr.length).setValues([hdr]).setFontWeight('bold').setBackground('#800000').setFontColor('#ffffff');
      sh.setFrozenRows(1);
    }
  });
  var settings = getSettings_();
  Object.keys(DEFAULT_SETTINGS).forEach(function (k) {
    if (settings[k] === undefined) append_('Settings', { key: k, value: DEFAULT_SETTINGS[k] });
  });
  var props = PropertiesService.getScriptProperties();
  if (!props.getProperty('AUTH_SECRET')) props.setProperty('AUTH_SECRET', Utilities.getUuid() + Utilities.getUuid());
  if (rows_('Users').length === 0) {
    append_('Users', { name: 'Admin', email: Session.getEffectiveUser().getEmail(), pin: '1234', role: 'admin', active: 'yes' });
  }
  installTriggers();
  var d = ss.getSheetByName('Sheet1'); if (d && d.getLastRow() === 0 && ss.getSheets().length > 1) ss.deleteSheet(d);
  Logger.log('Setup complete. Change the Admin PIN in the Users tab, then deploy as a Web app.');
}

function installTriggers() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (['runScheduler', 'checkReplies'].indexOf(t.getHandlerFunction()) >= 0) ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('runScheduler').timeBased().everyMinutes(15).create();
  ScriptApp.newTrigger('checkReplies').timeBased().everyMinutes(30).create();
}

// ---------------------------------------------------------------- sheet helpers
function sheet_(name) { return SpreadsheetApp.getActive().getSheetByName(name); }

function rows_(name) {
  var sh = sheet_(name); if (!sh) return [];
  var last = sh.getLastRow(); if (last < 2) return [];
  var hdr = SCHEMA[name];
  var vals = sh.getRange(2, 1, last - 1, hdr.length).getValues();
  return vals.map(function (r, i) {
    var o = { _row: i + 2 };
    hdr.forEach(function (h, j) { var v = r[j]; o[h] = (v instanceof Date) ? v.toISOString() : (v === null ? '' : v); });
    return o;
  });
}

function append_(name, obj) {
  var hdr = SCHEMA[name];
  if (hdr[0] === 'id' && !obj.id) obj.id = newId_(name);
  sheet_(name).appendRow(hdr.map(function (h) { return obj[h] === undefined ? '' : obj[h]; }));
  return obj;
}

function appendMany_(name, objs) {
  if (!objs || !objs.length) return;
  var hdr = SCHEMA[name], sh = sheet_(name);
  var vals = objs.map(function (o) { return hdr.map(function (h) { return o[h] === undefined ? '' : o[h]; }); });
  sh.getRange(sh.getLastRow() + 1, 1, vals.length, hdr.length).setValues(vals);
}

function update_(name, id, patch) {
  var hdr = SCHEMA[name];
  var r = rows_(name).filter(function (x) { return String(x.id) === String(id); })[0];
  if (!r) throw new Error(name + ' record not found: ' + id);
  Object.keys(patch).forEach(function (k) { if (hdr.indexOf(k) >= 0) r[k] = patch[k]; });
  sheet_(name).getRange(r._row, 1, 1, hdr.length).setValues([hdr.map(function (h) { return r[h] === undefined ? '' : r[h]; })]);
  return r;
}

function newId_(name) { return name.charAt(0) + Utilities.getUuid().split('-')[0]; }
function now_() { return new Date().toISOString(); }
function json_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
function withLock_(fn) { var l = LockService.getScriptLock(); l.waitLock(30000); try { return fn(); } finally { l.releaseLock(); } }

function getSettings_() {
  var o = {}; rows_('Settings').forEach(function (r) { o[r.key] = String(r.value); }); return o;
}
function setting_(k) { var s = getSettings_(); return s[k] !== undefined ? s[k] : DEFAULT_SETTINGS[k]; }

function log_(contactId, type, summary, detail, by) {
  append_('Activity', { contactId: contactId, type: type, summary: summary, detail: detail || '', by: by || 'system', at: now_() });
}

// ---------------------------------------------------------------- auth
function hmac_(s) {
  var secret = PropertiesService.getScriptProperties().getProperty('AUTH_SECRET');
  return Utilities.base64EncodeWebSafe(Utilities.computeHmacSha256Signature(s, secret));
}
function login_(email, pin) {
  var u = rows_('Users').filter(function (x) {
    return String(x.email).toLowerCase() === String(email || '').toLowerCase().trim() && String(x.pin) === String(pin) && String(x.active).toLowerCase() !== 'no';
  })[0];
  if (!u) throw new Error('Email or PIN is incorrect.');
  var payload = u.email + '|' + (Date.now() + 12 * 3600 * 1000);
  return { token: Utilities.base64EncodeWebSafe(payload) + '.' + hmac_(payload), user: { name: u.name, email: u.email, role: u.role } };
}
function verifyToken_(t) {
  if (!t || t.indexOf('.') < 0) return null;
  var parts = t.split('.');
  var payload = Utilities.newBlob(Utilities.base64DecodeWebSafe(parts[0])).getDataAsString();
  if (hmac_(payload) !== parts[1]) return null;
  var bits = payload.split('|'); if (Number(bits[1]) < Date.now()) return null;
  var u = rows_('Users').filter(function (x) { return String(x.email).toLowerCase() === bits[0].toLowerCase(); })[0];
  return u ? { name: u.name, email: u.email, role: u.role } : null;
}
function requireAdmin_(user) { if (user.role !== 'admin') throw new Error('Only an admin can do this.'); }

// ---------------------------------------------------------------- API
var API = {
  me: function (req, user) { return { user: user, stages: STAGES, settings: publicSettings_() }; },

  dashboard: function () { return dashboard_(); },

  listContacts: function () { return rows_('Contacts'); },

  getContact: function (req) {
    var c = rows_('Contacts').filter(function (x) { return x.id === req.id; })[0];
    if (!c) throw new Error('Contact not found');
    var camps = {}; rows_('Campaigns').forEach(function (k) { camps[k.id] = k.name; });
    return {
      contact: c,
      activity: rows_('Activity').filter(function (a) { return a.contactId === req.id; }).reverse(),
      tasks: rows_('Tasks').filter(function (t) { return t.contactId === req.id; }),
      enrollments: rows_('Enrollments').filter(function (e) { return e.contactId === req.id; }).map(function (e) { e.campaignName = camps[e.campaignId] || ''; return e; })
    };
  },

  saveContact: function (req, user) {
    return withLock_(function () {
      var c = req.contact || {};
      if (!c.email && !c.company) throw new Error('A contact needs at least a company or an email.');
      if (c.id) {
        var before = rows_('Contacts').filter(function (x) { return x.id === c.id; })[0];
        c.updatedAt = now_();
        var r = update_('Contacts', c.id, c);
        if (before && before.stage !== c.stage && c.stage) log_(c.id, 'stage', 'Stage: ' + before.stage + ' → ' + c.stage, '', user.name);
        return r;
      }
      if (c.email && findByEmail_(c.email)) throw new Error('A contact with this email already exists.');
      c.stage = c.stage || 'New'; c.status = c.status || 'active'; c.owner = c.owner || user.name;
      c.createdAt = now_(); c.updatedAt = c.createdAt;
      var n = append_('Contacts', c);
      log_(n.id, 'created', 'Contact added', '', user.name);
      return n;
    });
  },

  importContacts: function (req, user) {
    return withLock_(function () {
      var added = 0, skipped = 0;
      var existing = {}; rows_('Contacts').forEach(function (c) { if (c.email) existing[String(c.email).toLowerCase()] = 1; });
      (req.rows || []).forEach(function (r) {
        var em = String(r.email || '').toLowerCase().trim();
        if ((!em && !r.company) || (em && existing[em])) { skipped++; return; }
        var c = append_('Contacts', {
          company: r.company || '', name: r.name || '', title: r.title || '', email: em, phone: r.phone || '',
          website: r.website || '', segment: r.segment || req.segment || '', tags: r.tags || '', stage: 'New',
          owner: r.owner || user.name, source: r.source || req.source || 'Import', status: 'active',
          createdAt: now_(), updatedAt: now_()
        });
        if (em) existing[em] = 1; added++;
        log_(c.id, 'created', 'Imported', req.source || '', user.name);
      });
      return { added: added, skipped: skipped };
    });
  },

  addComment: function (req, user) {
    if (!req.text) throw new Error('Comment is empty.');
    log_(req.contactId, 'comment', req.text, '', user.name);
    return true;
  },

  setStage: function (req, user) {
    return API.saveContact({ contact: { id: req.id, stage: req.stage } }, user);
  },

  listCampaigns: function () {
    var en = rows_('Enrollments'), q = rows_('Queue');
    return rows_('Campaigns').map(function (c) {
      var e = en.filter(function (x) { return x.campaignId === c.id; });
      c.steps = safeJson_(c.steps, []);
      c.stats = {
        enrolled: e.length,
        active: e.filter(function (x) { return x.status === 'active'; }).length,
        replied: e.filter(function (x) { return x.status === 'replied'; }).length,
        sent: q.filter(function (x) { return x.campaignId === c.id && x.status === 'sent'; }).length,
        pending: q.filter(function (x) { return x.campaignId === c.id && x.status === 'pending_approval'; }).length
      };
      return c;
    });
  },

  saveCampaign: function (req, user) {
    return withLock_(function () {
      var c = req.campaign || {};
      if (!c.name) throw new Error('Campaign needs a name.');
      var steps = c.steps || [];
      if (!steps.length) throw new Error('Add at least one email step.');
      var rec = { name: c.name, segment: c.segment || '', steps: JSON.stringify(steps), useAI: c.useAI ? 'yes' : 'no',
                  requireApproval: c.requireApproval === false ? 'no' : 'yes', updatedAt: now_() };
      if (c.id) return update_('Campaigns', c.id, rec);
      rec.status = 'draft'; rec.createdBy = user.name; rec.createdAt = now_();
      return append_('Campaigns', rec);
    });
  },

  setCampaignStatus: function (req) {
    if (['draft', 'active', 'paused', 'done'].indexOf(req.status) < 0) throw new Error('Bad status');
    return update_('Campaigns', req.id, { status: req.status, updatedAt: now_() });
  },

  // One-step campaign from an Excel upload: add/match contacts, create the campaign,
  // enrol everyone, queue any personal first emails, and optionally activate ("push").
  importCampaign: function (req, user) {
    return withLock_(function () {
      var c = req.campaign || {};
      var steps = (c.steps || []).filter(function (s) { return s && String(s.subject || '').trim() && String(s.body || '').trim(); });
      if (!c.name) throw new Error('The Campaign sheet needs a campaign name.');
      if (!steps.length) throw new Error('The Emails sheet needs at least one email with a subject and body.');
      var rows = req.rows || [];
      if (!rows.length) throw new Error('The Contacts sheet has no contacts.');

      var t = now_();
      var camp = append_('Campaigns', { name: c.name, segment: c.segment || '', steps: JSON.stringify(steps), useAI: c.useAI ? 'yes' : 'no',
        requireApproval: c.requireApproval === false ? 'no' : 'yes', status: 'draft', createdBy: user.name, createdAt: t, updatedAt: t });

      var byEmail = {}; rows_('Contacts').forEach(function (x) { if (x.email) byEmail[String(x.email).toLowerCase()] = x; });
      var newContacts = [], enrols = [], queue = [], acts = [];
      var added = 0, matched = 0, skipped = 0, personal = 0, notEmailable = 0, seen = {};
      rows.forEach(function (r) {
        var em = String(r.email || '').toLowerCase().trim();
        if (!em || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em) || seen[em]) { skipped++; return; }
        seen[em] = 1;
        var ct = byEmail[em];
        if (ct) { matched++; }
        else {
          ct = { id: newId_('Contacts'), company: r.company || '', name: r.name || '', title: r.title || '', email: em, phone: r.phone || '',
                 website: r.website || '', segment: r.segment || c.segment || '', tags: r.tags || '', stage: 'New', owner: user.name,
                 source: 'Excel: ' + c.name, status: 'active', createdAt: t, updatedAt: t };
          newContacts.push(ct); byEmail[em] = ct; added++;
        }
        if (ct.status && ct.status !== 'active') { notEmailable++; return; }
        var en = { id: newId_('Enrollments'), campaignId: camp.id, contactId: ct.id, step: 0, status: 'active', nextSendAt: t, enrolledAt: t };
        enrols.push(en);
        acts.push({ id: newId_('Activity'), contactId: ct.id, type: 'enrolled', summary: 'Added to campaign: ' + c.name + ' (Excel upload)', detail: '', by: user.name, at: t });
        if (String(r.customSubject || '').trim() && String(r.customBody || '').trim()) {
          queue.push({ id: newId_('Queue'), enrollmentId: en.id, campaignId: camp.id, contactId: ct.id, step: 0, to: em,
            subject: merge_(r.customSubject, ct), body: merge_(r.customBody, ct),
            status: c.requireApproval === false ? 'approved' : 'pending_approval', createdAt: t, approvedBy: c.requireApproval === false ? 'auto' : '' });
          personal++;
        }
      });
      appendMany_('Contacts', newContacts);
      appendMany_('Enrollments', enrols);
      appendMany_('Queue', queue);
      appendMany_('Activity', acts);
      if (req.activate && enrols.length) update_('Campaigns', camp.id, { status: 'active', updatedAt: now_() });
      return { campaignId: camp.id, added: added, matched: matched, skipped: skipped, enrolled: enrols.length,
               personal: personal, notEmailable: notEmailable, activated: !!(req.activate && enrols.length) };
    });
  },

  enroll: function (req, user) {
    return withLock_(function () {
      var camp = rows_('Campaigns').filter(function (c) { return c.id === req.campaignId; })[0];
      if (!camp) throw new Error('Campaign not found');
      var existing = {}; rows_('Enrollments').forEach(function (e) { if (e.campaignId === camp.id) existing[e.contactId] = 1; });
      var contacts = {}; rows_('Contacts').forEach(function (c) { contacts[c.id] = c; });
      var added = 0, skipped = 0;
      (req.contactIds || []).forEach(function (id) {
        var c = contacts[id];
        if (!c || existing[id] || !c.email || c.status !== 'active') { skipped++; return; }
        append_('Enrollments', { campaignId: camp.id, contactId: id, step: 0, status: 'active', nextSendAt: now_(), enrolledAt: now_() });
        log_(id, 'enrolled', 'Added to campaign: ' + camp.name, '', user.name);
        added++;
      });
      return { added: added, skipped: skipped };
    });
  },

  stopEnrollment: function (req, user) {
    var e = update_('Enrollments', req.id, { status: 'stopped' });
    log_(e.contactId, 'enrolled', 'Removed from campaign', '', user.name);
    return e;
  },

  listQueue: function (req) {
    var contacts = {}; rows_('Contacts').forEach(function (c) { contacts[c.id] = c; });
    var camps = {}; rows_('Campaigns').forEach(function (c) { camps[c.id] = c.name; });
    return rows_('Queue').filter(function (q) { return !req.status || q.status === req.status; }).reverse().slice(0, 500).map(function (q) {
      var c = contacts[q.contactId] || {}; q.company = c.company || ''; q.contactName = c.name || ''; q.campaignName = camps[q.campaignId] || ''; return q;
    });
  },

  editQueued: function (req) {
    var q = rows_('Queue').filter(function (x) { return x.id === req.id; })[0];
    if (!q || q.status !== 'pending_approval') throw new Error('Only emails awaiting approval can be edited.');
    return update_('Queue', req.id, { subject: req.subject, body: req.body });
  },

  approve: function (req, user) {
    return withLock_(function () {
      (req.ids || []).forEach(function (id) { update_('Queue', id, { status: 'approved', approvedBy: user.name }); });
      return { approved: (req.ids || []).length };
    });
  },

  reject: function (req, user) {
    return withLock_(function () {
      (req.ids || []).forEach(function (id) {
        var q = update_('Queue', id, { status: 'rejected', approvedBy: user.name });
        update_('Enrollments', q.enrollmentId, { status: 'stopped' });
        log_(q.contactId, 'email', 'Email rejected in approval — sequence stopped', q.subject, user.name);
      });
      return { rejected: (req.ids || []).length };
    });
  },

  runNow: function () { runScheduler(); checkReplies(); return dashboard_().kpis; },

  listReplies: function () {
    var contacts = {}; rows_('Contacts').forEach(function (c) { contacts[c.id] = c; });
    return rows_('Activity').filter(function (a) { return a.type === 'reply' || a.type === 'bounce' || a.type === 'unsubscribe'; }).reverse().slice(0, 300).map(function (a) {
      var c = contacts[a.contactId] || {}; a.company = c.company || ''; a.contactName = c.name || ''; a.stage = c.stage || ''; return a;
    });
  },

  listTasks: function () {
    var contacts = {}; rows_('Contacts').forEach(function (c) { contacts[c.id] = c; });
    return rows_('Tasks').map(function (t) { var c = contacts[t.contactId] || {}; t.company = c.company || ''; return t; });
  },

  saveTask: function (req, user) {
    var t = req.task || {};
    if (!t.title) throw new Error('Task needs a title.');
    if (t.id) return update_('Tasks', t.id, t);
    t.owner = t.owner || user.name; t.done = 'no'; t.createdAt = now_();
    var n = append_('Tasks', t);
    if (t.contactId) log_(t.contactId, 'task', 'Task: ' + t.title, t.due ? 'Due ' + t.due : '', user.name);
    return n;
  },

  completeTask: function (req, user) {
    var t = update_('Tasks', req.id, { done: 'yes', doneAt: now_() });
    if (t.contactId) log_(t.contactId, 'task', 'Task done: ' + t.title, '', user.name);
    return t;
  },

  getSettings: function (req, user) { requireAdmin_(user); return { settings: getSettings_(), users: rows_('Users').map(function (u) { return { name: u.name, email: u.email, role: u.role, active: u.active }; }), hasClaudeKey: !!PropertiesService.getScriptProperties().getProperty('CLAUDE_API_KEY'), account: Session.getEffectiveUser().getEmail() }; },

  saveSettings: function (req, user) {
    requireAdmin_(user);
    var cur = rows_('Settings');
    Object.keys(req.settings || {}).forEach(function (k) {
      var r = cur.filter(function (x) { return x.key === k; })[0];
      if (r) sheet_('Settings').getRange(r._row, 2).setValue(req.settings[k]);
      else append_('Settings', { key: k, value: req.settings[k] });
    });
    if (req.claudeKey) PropertiesService.getScriptProperties().setProperty('CLAUDE_API_KEY', req.claudeKey);
    return true;
  },

  aiDraft: function (req) {
    var c = rows_('Contacts').filter(function (x) { return x.id === req.contactId; })[0] || {};
    return claudeDraft_(c, req.purpose || 'First introductory email', req.subject || '', req.body || '');
  },

  testEmail: function (req, user) {
    var res = sendMime_({ to: user.email, subject: '[Test] ' + (req.subject || 'SAFE Marketing Studio'), html: wrapBody_(req.body || 'This is a test email from SAFE Marketing Studio.', null) });
    return { sentTo: user.email, threadId: res.threadId };
  }
};

function publicSettings_() {
  var s = getSettings_();
  return { DAILY_LIMIT: s.DAILY_LIMIT, FROM_NAME: s.FROM_NAME, FROM_ADDRESS: s.FROM_ADDRESS || Session.getEffectiveUser().getEmail() };
}
function safeJson_(s, d) { try { return typeof s === 'string' ? JSON.parse(s) : (s || d); } catch (e) { return d; } }
function findByEmail_(em) { em = String(em).toLowerCase(); return rows_('Contacts').filter(function (c) { return String(c.email).toLowerCase() === em; })[0]; }

// ---------------------------------------------------------------- scheduler: queue + send
function runScheduler() {
  withLock_(function () {
    queueDueSteps_();
    sendApproved_();
  });
}

function queueDueSteps_() {
  var camps = {}; rows_('Campaigns').forEach(function (c) { camps[c.id] = c; });
  var contacts = {}; rows_('Contacts').forEach(function (c) { contacts[c.id] = c; });
  var queued = {}; rows_('Queue').forEach(function (q) { if (q.status === 'pending_approval' || q.status === 'approved') queued[q.enrollmentId] = 1; });
  var now = new Date();
  rows_('Enrollments').forEach(function (e) {
    if (e.status !== 'active' || queued[e.id]) return;
    var camp = camps[e.campaignId]; if (!camp || camp.status !== 'active') return;
    if (e.nextSendAt && new Date(e.nextSendAt) > now) return;
    var c = contacts[e.contactId]; if (!c || c.status !== 'active' || !c.email) { update_('Enrollments', e.id, { status: 'stopped' }); return; }
    var steps = safeJson_(camp.steps, []);
    var step = steps[Number(e.step)];
    if (!step) { update_('Enrollments', e.id, { status: 'completed' }); return; }
    var subject = merge_(step.subject, c), body = merge_(step.body, c);
    if (camp.useAI === 'yes' && PropertiesService.getScriptProperties().getProperty('CLAUDE_API_KEY')) {
      try {
        var d = claudeDraft_(c, Number(e.step) === 0 ? 'First introductory email' : 'Follow-up number ' + e.step + ' (no reply yet)', subject, body);
        subject = d.subject || subject; body = d.body || body;
      } catch (err) { /* fall back to template */ }
    }
    if (Number(e.step) > 0 && e.threadId) subject = subject.indexOf('Re:') === 0 ? subject : 'Re: ' + merge_(steps[0].subject, c);
    append_('Queue', {
      enrollmentId: e.id, campaignId: camp.id, contactId: c.id, step: e.step, to: c.email, subject: subject, body: body,
      status: camp.requireApproval === 'no' ? 'approved' : 'pending_approval', createdAt: now_()
    });
  });
}

function sentToday_() {
  var start = new Date(); start.setHours(0, 0, 0, 0);
  return rows_('Queue').filter(function (q) { return q.status === 'sent' && q.sentAt && new Date(q.sentAt) >= start; }).length;
}

function inSendWindow_() {
  var d = new Date();
  var days = String(setting_('SEND_DAYS')).split(',').map(Number);
  var h = Number(Utilities.formatDate(d, 'Asia/Kolkata', 'H'));
  var dow = Number(Utilities.formatDate(d, 'Asia/Kolkata', 'u')) % 7; // u: 1=Mon..7=Sun
  return days.indexOf(dow) >= 0 && h >= Number(setting_('SEND_START_HOUR')) && h < Number(setting_('SEND_END_HOUR'));
}

function sendApproved_() {
  if (!inSendWindow_()) return;
  var room = Number(setting_('DAILY_LIMIT')) - sentToday_();
  if (room <= 0) return;
  var enrolls = {}; rows_('Enrollments').forEach(function (e) { enrolls[e.id] = e; });
  var camps = {}; rows_('Campaigns').forEach(function (c) { camps[c.id] = c; });
  var contacts = {}; rows_('Contacts').forEach(function (c) { contacts[c.id] = c; });
  // Only campaigns that have been pushed (active) send; approved emails of draft or paused campaigns wait.
  var batch = rows_('Queue').filter(function (q) { return q.status === 'approved' && camps[q.campaignId] && camps[q.campaignId].status === 'active'; }).slice(0, Math.min(room, 25));
  batch.forEach(function (q) {
    var e = enrolls[q.enrollmentId], c = contacts[q.contactId];
    if (!e || e.status !== 'active' || !c || c.status !== 'active') { update_('Queue', q.id, { status: 'rejected', error: 'Contact replied, unsubscribed or was removed before sending' }); return; }
    try {
      var res = sendMime_({ to: q.to, subject: q.subject, html: wrapBody_(q.body, c), threadId: e.threadId, inReplyTo: e.lastMessageId });
      var steps = safeJson_((camps[q.campaignId] || {}).steps, []);
      var nextIdx = Number(q.step) + 1, next = steps[nextIdx];
      var nextAt = next ? new Date(Date.now() + Number(next.dayOffset || 3) * 86400000).toISOString() : '';
      update_('Queue', q.id, { status: 'sent', sentAt: now_(), threadId: res.threadId, gmailId: res.id });
      update_('Enrollments', e.id, { step: nextIdx, status: next ? 'active' : 'completed', nextSendAt: nextAt, threadId: res.threadId, lastMessageId: res.messageId, lastSentAt: now_() });
      var patch = { lastContacted: now_(), nextFollowUp: nextAt, updatedAt: now_() };
      if (c.stage === 'New') patch.stage = 'Contacted';
      update_('Contacts', c.id, patch);
      log_(c.id, 'email', (Number(q.step) === 0 ? 'Email sent: ' : 'Follow-up sent: ') + q.subject, stripHtml_(q.body).slice(0, 400), q.approvedBy || 'auto');
    } catch (err) {
      update_('Queue', q.id, { status: 'failed', error: String(err.message || err) });
    }
  });
}

// ---------------------------------------------------------------- reply, bounce tracking
function checkReplies() {
  withLock_(function () {
    var me = [Session.getEffectiveUser().getEmail().toLowerCase()];
    var alias = String(setting_('FROM_ADDRESS') || '').toLowerCase(); if (alias) me.push(alias);
    var contacts = {}; rows_('Contacts').forEach(function (c) { contacts[c.id] = c; });
    rows_('Enrollments').forEach(function (e) {
      if (!e.threadId || (e.status !== 'active' && e.status !== 'completed')) return;
      var thread;
      try { thread = Gmail.Users.Threads.get('me', e.threadId, { format: 'metadata', metadataHeaders: ['From', 'Date', 'Subject'] }); }
      catch (err) { return; }
      var since = e.lastSentAt ? new Date(e.lastSentAt).getTime() - 60000 : 0;
      (thread.messages || []).forEach(function (m) {
        if (Number(m.internalDate) <= since) return;
        var from = header_(m, 'From').toLowerCase();
        if (me.some(function (x) { return from.indexOf(x) >= 0; })) return;
        var c = contacts[e.contactId] || {};
        if (/mailer-daemon|postmaster/.test(from)) {
          update_('Enrollments', e.id, { status: 'bounced' });
          update_('Contacts', e.contactId, { status: 'bounced', updatedAt: now_() });
          log_(e.contactId, 'bounce', 'Email bounced', m.snippet || '', 'system');
        } else {
          var kind = classifyReply_(m.snippet || '');
          update_('Enrollments', e.id, { status: 'replied' });
          var patch = { lastReply: now_(), nextFollowUp: '', updatedAt: now_() };
          if (['New', 'Contacted'].indexOf(c.stage) >= 0) patch.stage = 'Replied';
          if (kind === 'unsubscribe') patch.status = 'unsubscribed';
          update_('Contacts', e.contactId, patch);
          log_(e.contactId, 'reply', 'Reply received (' + kind + ')', m.snippet || '', 'system');
          stopOtherEnrollments_(e.contactId, e.id);
          append_('Tasks', { contactId: e.contactId, title: 'Respond to reply from ' + (c.name || c.company || c.email), due: Utilities.formatDate(new Date(), 'Asia/Kolkata', 'yyyy-MM-dd'), owner: c.owner || '', done: 'no', createdAt: now_() });
        }
        e.status = 'replied';
        since = Number(m.internalDate);
      });
    });
  });
}

function stopOtherEnrollments_(contactId, exceptId) {
  rows_('Enrollments').forEach(function (e) {
    if (e.contactId === contactId && e.id !== exceptId && e.status === 'active') update_('Enrollments', e.id, { status: 'stopped' });
  });
}

function header_(m, name) {
  var h = ((m.payload || {}).headers || []).filter(function (x) { return x.name.toLowerCase() === name.toLowerCase(); })[0];
  return h ? h.value : '';
}

function classifyReply_(text) {
  var t = text.toLowerCase();
  if (/unsubscribe|remove me|do not contact|don't contact|stop emailing|not interested/.test(t)) return /not interested/.test(t) ? 'not interested' : 'unsubscribe';
  if (/out of office|on leave|away from|auto.?reply|vacation/.test(t)) return 'out of office';
  if (/call|meet|schedule|interested|discuss|let'?s talk|available|proposal|quote/.test(t)) return 'interested';
  return 'other';
}

// ---------------------------------------------------------------- unsubscribe
function unsubToken_(contactId) { return contactId + '.' + hmac_('u:' + contactId).slice(0, 16); }

function unsubscribePage_(tok) {
  var bits = String(tok).split('.');
  var ok = bits.length === 2 && hmac_('u:' + bits[0]).slice(0, 16) === bits[1];
  if (ok) {
    withLock_(function () {
      try {
        update_('Contacts', bits[0], { status: 'unsubscribed', updatedAt: now_() });
        rows_('Enrollments').forEach(function (e) { if (e.contactId === bits[0] && e.status === 'active') update_('Enrollments', e.id, { status: 'unsubscribed' }); });
        log_(bits[0], 'unsubscribe', 'Unsubscribed via email link', '', 'contact');
      } catch (e) { ok = false; }
    });
  }
  var msg = ok ? 'You have been unsubscribed. SAFE Legal Solutions will not email you again.' : 'This link is not valid. Please reply to our email and we will remove you.';
  return HtmlService.createHtmlOutput('<div style="font-family:Arial;max-width:520px;margin:60px auto;padding:24px;border:1px solid #eee;border-radius:10px"><h2 style="color:#800000">SAFE Legal Solutions</h2><p>' + msg + '</p></div>');
}

// ---------------------------------------------------------------- email building + sending
function merge_(tpl, c) {
  c = c || {};
  var first = String(c.name || '').trim().split(/\s+/)[0] || 'there';
  return String(tpl || '')
    .replace(/{{\s*first_name\s*}}/g, first)
    .replace(/{{\s*name\s*}}/g, c.name || '')
    .replace(/{{\s*company\s*}}/g, c.company || '')
    .replace(/{{\s*title\s*}}/g, c.title || '')
    .replace(/{{\s*segment\s*}}/g, c.segment || '');
}

function wrapBody_(body, c) {
  var html = /<[a-z][\s\S]*>/i.test(body) ? body : String(body).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/\n/g, '<br>');
  var sig = setting_('SIGNATURE_HTML');
  var unsub = c && c.id ? String(setting_('UNSUBSCRIBE_TEXT')).replace('{{unsubscribe_link}}', ScriptApp.getService().getUrl() + '?u=' + unsubToken_(c.id)) : '';
  return '<div style="font-family:Arial,sans-serif;font-size:14px;color:#222;line-height:1.5">' + html +
    '<br><br>' + sig + (unsub ? '<p style="font-size:11px;color:#888;margin-top:18px">' + unsub + '</p>' : '') + '</div>';
}

function encodeHeader_(s) { return /^[\x00-\x7F]*$/.test(s) ? s : '=?UTF-8?B?' + Utilities.base64Encode(Utilities.newBlob(s).getBytes()) + '?='; }

function sendMime_(o) {
  var fromAddr = setting_('FROM_ADDRESS') || Session.getEffectiveUser().getEmail();
  var lines = [
    'From: ' + encodeHeader_(setting_('FROM_NAME')) + ' <' + fromAddr + '>',
    'To: ' + o.to,
    'Subject: ' + encodeHeader_(o.subject),
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=UTF-8',
    'Content-Transfer-Encoding: base64'
  ];
  if (setting_('REPLY_TO')) lines.push('Reply-To: ' + setting_('REPLY_TO'));
  if (o.inReplyTo) { lines.push('In-Reply-To: ' + o.inReplyTo); lines.push('References: ' + o.inReplyTo); }
  var mime = lines.join('\r\n') + '\r\n\r\n' + Utilities.base64Encode(Utilities.newBlob(o.html).getBytes());
  var resource = { raw: Utilities.base64EncodeWebSafe(Utilities.newBlob(mime).getBytes()) };
  if (o.threadId) resource.threadId = o.threadId;
  var res = Gmail.Users.Messages.send(resource, 'me');
  var meta = Gmail.Users.Messages.get('me', res.id, { format: 'metadata', metadataHeaders: ['Message-ID', 'Message-Id'] });
  return { id: res.id, threadId: res.threadId, messageId: header_(meta, 'Message-ID') || header_(meta, 'Message-Id') };
}

function stripHtml_(s) { return String(s || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(); }

// ---------------------------------------------------------------- Claude drafting
function claudeDraft_(c, purpose, subject, body) {
  var key = PropertiesService.getScriptProperties().getProperty('CLAUDE_API_KEY');
  if (!key) throw new Error('Add the Claude API key in Settings to use AI drafting.');
  var prompt = 'You draft short, professional business emails for a law firm.\n\nFirm: ' + setting_('FIRM_BRIEF') +
    '\n\nRecipient: ' + JSON.stringify({ name: c.name, title: c.title, company: c.company, segment: c.segment, website: c.website }) +
    '\nPurpose: ' + purpose + '\n\nStarting template (keep its intent, improve and personalise it):\nSubject: ' + subject + '\n' + body +
    '\n\nRules: under 150 words; plain, courteous Indian business English; an introduction offering useful information, not a hard sales pitch; ' +
    'no claims of past results or guarantees; no fabricated facts about the recipient; one clear, low-pressure next step; do not add a signature.' +
    '\nReturn only JSON: {"subject": "...", "body": "..."} with the body as plain text using \\n for line breaks.';
  var resp = UrlFetchApp.fetch('https://api.anthropic.com/v1/messages', {
    method: 'post', contentType: 'application/json', muteHttpExceptions: true,
    headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01' },
    payload: JSON.stringify({ model: setting_('CLAUDE_MODEL'), max_tokens: 800, messages: [{ role: 'user', content: prompt }] })
  });
  var data = JSON.parse(resp.getContentText());
  if (resp.getResponseCode() !== 200) throw new Error('Claude API: ' + ((data.error || {}).message || resp.getResponseCode()));
  var text = (data.content || []).map(function (b) { return b.text || ''; }).join('');
  var m = text.match(/\{[\s\S]*\}/);
  var out = m ? JSON.parse(m[0]) : { subject: subject, body: text };
  return { subject: out.subject || subject, body: out.body || body };
}

// ---------------------------------------------------------------- dashboard
function dashboard_() {
  var contacts = rows_('Contacts'), queue = rows_('Queue'), act = rows_('Activity'), tasks = rows_('Tasks'), en = rows_('Enrollments');
  var sent = queue.filter(function (q) { return q.status === 'sent'; });
  var replies = act.filter(function (a) { return a.type === 'reply'; });
  var repliedContacts = {}; replies.forEach(function (r) { repliedContacts[r.contactId] = 1; });
  var contacted = {}; sent.forEach(function (q) { contacted[q.contactId] = 1; });
  var byStage = {}; STAGES.forEach(function (s) { byStage[s] = 0; });
  contacts.forEach(function (c) { byStage[c.stage || 'New'] = (byStage[c.stage || 'New'] || 0) + 1; });

  // weekly series, last 12 weeks (week starting Monday)
  var weeks = [], wkSent = [], wkReplies = [];
  var monday = new Date(); monday.setHours(0, 0, 0, 0); monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  for (var i = 11; i >= 0; i--) {
    var a = new Date(monday.getTime() - i * 7 * 86400000), b = new Date(a.getTime() + 7 * 86400000);
    weeks.push(Utilities.formatDate(a, 'Asia/Kolkata', 'dd MMM'));
    wkSent.push(sent.filter(function (q) { var d = new Date(q.sentAt); return d >= a && d < b; }).length);
    wkReplies.push(replies.filter(function (r) { var d = new Date(r.at); return d >= a && d < b; }).length);
  }
  var camps = rows_('Campaigns').map(function (c) {
    var e = en.filter(function (x) { return x.campaignId === c.id; });
    var s = sent.filter(function (q) { return q.campaignId === c.id; });
    var cs = {}; s.forEach(function (q) { cs[q.contactId] = 1; });
    var r = e.filter(function (x) { return x.status === 'replied'; }).length;
    return { id: c.id, name: c.name, status: c.status, enrolled: e.length, contacted: Object.keys(cs).length, sent: s.length, replied: r };
  });
  var today = Utilities.formatDate(new Date(), 'Asia/Kolkata', 'yyyy-MM-dd');
  return {
    kpis: {
      contacts: contacts.length,
      contacted: Object.keys(contacted).length,
      emailsSent: sent.length,
      sentToday: sentToday_(),
      dailyLimit: Number(setting_('DAILY_LIMIT')),
      replies: Object.keys(repliedContacts).length,
      replyRate: Object.keys(contacted).length ? Object.keys(repliedContacts).length / Object.keys(contacted).length : 0,
      meetings: byStage['Meeting'] || 0,
      won: byStage['Won'] || 0,
      pendingApproval: queue.filter(function (q) { return q.status === 'pending_approval'; }).length,
      failed: queue.filter(function (q) { return q.status === 'failed'; }).length,
      tasksDue: tasks.filter(function (t) { return t.done !== 'yes' && t.due && String(t.due).slice(0, 10) <= today; }).length,
      unsubscribed: contacts.filter(function (c) { return c.status === 'unsubscribed'; }).length,
      bounced: contacts.filter(function (c) { return c.status === 'bounced'; }).length
    },
    byStage: byStage,
    weekly: { labels: weeks, sent: wkSent, replies: wkReplies },
    campaigns: camps,
    recent: act.slice(-25).reverse().map(function (a) {
      var c = contacts.filter(function (x) { return x.id === a.contactId; })[0] || {};
      a.company = c.company || ''; return a;
    })
  };
}
