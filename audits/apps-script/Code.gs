/**
 * SAFE Legal Workplace Compliance Audits — Google Apps Script backend
 * (DPDPA, Labour Codes, POSH & DEI, Corporate Legal and Contract compliance audits)
 * ----------------------------------------------------------
 * Data store : JSON files in a Google Drive folder (created by setup(); an existing folder is kept)
 *              (db.json for clients, users, certificates and settings; one file per audit).
 * Files      : evidence, letterheads and issued reports in per-client Drive folders.
 * SAFE AI    : called server-side only; the key lives in Script Properties and is never sent to a browser.
 * Email      : GmailApp from the deploying account, "From" operations@safelegal.org when that alias is verified.
 * Front end  : GitHub Pages (dpdpa/index.html for SAFE, dpdpa/portal.html for clients, dpdpa/verify.html public).
 *
 * Set-up: paste this file and appsscript.json into a new Apps Script project, run setup(),
 * then Deploy > New deployment > Web app (Execute as: Me; Who has access: Anyone). See README.md.
 */

var APP = {
  NAME: 'SAFE Legal Workplace Compliance Audits',
  TZ: 'Asia/Kolkata',
  SESSION_SECONDS: 8 * 3600,
  PORTAL_SESSION_SECONDS: 6 * 3600,
  MAX_FAILS: 5,
  LOCK_SECONDS: 900,
  MAX_UPLOAD_BYTES: 20 * 1024 * 1024
};

var DEFAULT_SETTINGS = {
  safeTo: 'info@safelegal.org',
  safeCc: 'operations@safelegal.org',
  fromAddress: 'operations@safelegal.org',
  senderName: 'SAFE Legal Solutions',
  studioUrl: 'https://safelegalsolutions.github.io/safe-master-studio/audits/',
  reminderDaysBefore: 60,
  reminderIntervalDays: 7,
  pulseGraceDays: 30,
  engineStandard: 'claude-sonnet-5-5',   // SAFE AI standard engine (internal model id, never shown to users)
  engineAudit: 'claude-opus-5-5',        // SAFE AI audit engine
  usdInr: 100,
  prices: { 'claude-sonnet-5-5': { in: 2, out: 10 }, 'claude-opus-5-5': { in: 4, out: 20 } },
  budgets: { small: 3000, mid: 6000, large: 15000 },
  budgetAlertPct: 80,
  requireIndependence: true,
  reportIssuers: 'admin',                 // who may issue signed interim/final reports: 'admin' or 'advocate'
  signatoryName: 'Adv. Sandeep Kumar N',
  signatoryTitle: 'Founder and Managing Partner',
  signatoryEnrolment: ''
};

// Audit types. "context" is added to SAFE AI's instructions for that audit.
var FW = {
  dpdpa: { code: 'DPDPA', name: 'DPDPA Compliance Audit', law: 'the Digital Personal Data Protection Act, 2023 and the DPDP Rules, 2025',
    context: 'Key DPDP dates: Rules 1, 2 and 17-21 in force from 13 November 2025; Rule 4 (Consent Managers) from 13 November 2026; Rules 3, 5-16, 22 and 23 from 13 May 2027. Breach: Board intimation without delay and a detailed report within 72 hours; affected Data Principals without delay. Grievances: within a reasonable period not exceeding 90 days. Logs: at least one year (Rule 6). In the applicability memo also give "sdfAssessment" (whether Significant Data Fiduciary designation is likely) and "thirdSchedule".' },
  labour: { code: 'LABOUR', name: 'Labour Codes Compliance Audit', law: 'the Code on Wages, 2019, the Industrial Relations Code, 2020, the Code on Social Security, 2020 and the Occupational Safety, Health and Working Conditions Code, 2020, with state labour laws',
    context: 'The four Labour Codes came into force on 21 November 2025 and replaced 29 earlier labour laws. Rules under the earlier laws continue to the extent the Codes keep them in force until new rules are notified; state rules vary. Key points: uniform wage definition (excluded allowances above half of remuneration are added back), wages by the 7th and full settlement within two working days of exit, appointment letters to all, gratuity for fixed-term employees, Grievance Redressal Committee (20+ workers), standing orders and prior permission for lay-off/retrenchment/closure (300+), women at night only with consent and safeguards, crèche (50+), gig and platform worker contributions. State Shops and Establishments, professional tax and labour welfare fund laws still apply.' },
  poshdei: { code: 'POSHDEI', name: 'POSH and DEI Compliance Audit', law: 'the POSH Act, 2013 and Rules, and the equal opportunity laws (RPwD Act, 2016; Transgender Persons Act, 2019; Code on Wages s.3; Code on Social Security maternity provisions; HIV and AIDS Act, 2017; Mental Healthcare Act, 2017)',
    context: 'POSH: Internal Committee at every office with 10 or more employees (senior woman presiding, two employee members, one external member, at least half women, term up to three years); complaints within three months (extendable by three); conciliation only at the complainant\'s request and never for money; inquiry within 90 days; report within 10 days; employer action within 60 days; confidentiality; annual report to the District Officer; disclosure in the annual/Board report. DEI: RPwD Equal Opportunity Policy (s.21) and Grievance Redressal Officer (s.23); Transgender Persons Act equal opportunity policy and complaint officer (s.10, s.11); equal pay (Code on Wages s.3); maternity benefit 26 weeks and crèche for 50+; HIV Act complaints officer for 100+ persons.' },
  corporate: { code: 'CORP', name: 'Corporate Legal Compliance Audit', law: 'the central, state and sector laws applicable to the business (other than matters covered by statutory, tax, cost and secretarial audits)',
    context: 'This is a law-firm compliance audit supporting the directors\' statement under Companies Act s.134(5)(f). It covers registrations and licences, legal (non-secretarial) Companies Act matters, FEMA, the Prevention of Corruption Act s.9 adequate procedures, competition, consumer protection, Legal Metrology, PMLA (for reporting entities), environmental permits, MSME payments and IP. Do not give opinions on accounting, tax computation or secretarial matters.' },
  contract: { code: 'CONTRACT', name: 'Contract Compliance Audit', law: 'the Indian Contract Act, 1872, stamp and registration laws, the IT Act, 2000, the Arbitration and Conciliation Act, 1996, the Limitation Act, 1963 and the regulatory laws that govern contract terms',
    context: 'Key points: signatory authority; correct parties; stamp duty under the state stamp law (unstamped documents are inadmissible until duty and penalty are paid); registration of leases over one year (Registration Act s.17); electronic signatures under IT Act s.3A/s.5 and the First Schedule exclusions; post-termination non-competes void under Contract Act s.27; liquidated damages limited to reasonable compensation (s.74); written arbitration agreement with a seat (Arbitration Act s.7); IP assignment in writing (Copyright Act s.19); MSME payment within 45 days; DPDPA processor contracts (s.8(2)); limitation of three years for most contract claims.' }
};
var COMMON_KEYS = ['legalName', 'entityType', 'cin', 'address', 'website', 'industry', 'businessDesc', 'employees', 'turnover', 'locations', 'groupEntities', 'contactPerson',
  'establishments', 'women', 'contractLabour', 'contractLabourCount', 'fixedTerm', 'gig', 'nightShiftWomen', 'migrant', 'unions', 'payroll'];
function fwOf_(a) { return FW[(a && a.framework) || 'dpdpa'] || FW.dpdpa; }
/** Ids of a client's open audits (one per audit type). Also reads the older single-audit field. */
function activeIds_(c) {
  var ids = []; var m = c.activeAudits || {};
  for (var k in m) if (m[k] && ids.indexOf(m[k]) < 0) ids.push(m[k]);
  if (c.activeAuditId && ids.indexOf(c.activeAuditId) < 0) ids.push(c.activeAuditId);
  return ids;
}
function migrateClient_(c) {
  c.activeAudits = c.activeAudits || {};
  if (c.activeAuditId) { var has = false; for (var k in c.activeAudits) if (c.activeAudits[k] === c.activeAuditId) has = true; if (!has) c.activeAudits.dpdpa = c.activeAuditId; delete c.activeAuditId; }
}

// ================================================================ setup
function setup() {
  var props = PropertiesService.getScriptProperties();
  getRoot_();
  var db = readDb_();
  if (!db.users.length) {
    var pin = String(Math.floor(100000 + Math.random() * 900000));
    var salt = randomToken_().slice(0, 16);
    db.users.push({ email: Session.getEffectiveUser().getEmail(), name: 'SAFE Admin', role: 'admin', active: true, salt: salt, pinHash: hashPin_(salt, pin), mustChange: true, createdAt: now_() });
    writeDb_(db);
    Logger.log('First admin: ' + Session.getEffectiveUser().getEmail() + '  PIN: ' + pin + '  (change it after signing in)');
  }
  ScriptApp.getProjectTriggers().forEach(function (t) { if (t.getHandlerFunction() === 'dailyJob') ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger('dailyJob').timeBased().everyDays(1).atHour(9).inTimezone(APP.TZ).create();
  Logger.log('Drive folder: ' + getRoot_().getUrl());
  Logger.log('Setup complete. Next: Deploy > New deployment > Web app, then add the SAFE AI key in Studio Settings.');
}

// ================================================================ storage
function getRoot_() {
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty('ROOT_ID');
  if (id) { try { return DriveApp.getFolderById(id); } catch (e) { /* recreate */ } }
  var f = DriveApp.createFolder(APP.NAME);
  props.setProperty('ROOT_ID', f.getId());
  return f;
}
function sub_(parent, name) { var it = parent.getFoldersByName(name); return it.hasNext() ? it.next() : parent.createFolder(name); }
function fileIn_(folder, name) { var it = folder.getFilesByName(name); return it.hasNext() ? it.next() : null; }

function readJson_(folder, name, fallback) {
  var f = fileIn_(folder, name);
  if (!f) return fallback;
  return JSON.parse(f.getBlob().getDataAsString('UTF-8'));
}
function writeJson_(folder, name, obj) {
  var f = fileIn_(folder, name);
  var s = JSON.stringify(obj);
  if (f) f.setContent(s); else folder.createFile(name, s, 'application/json');
}

function readDb_() {
  var db = readJson_(getRoot_(), 'db.json', null) || {};
  db.clients = db.clients || []; db.users = db.users || []; db.certs = db.certs || [];
  db.settings = db.settings || {}; db.counters = db.counters || { audit: 0, cert: 0 }; db.auditIndex = db.auditIndex || [];
  return db;
}
function writeDb_(db) {
  db.savedAt = now_();
  writeJson_(getRoot_(), 'db.json', db);
  var props = PropertiesService.getScriptProperties();
  var day = Utilities.formatDate(new Date(), APP.TZ, 'yyyy-MM-dd');
  if (props.getProperty('LAST_BACKUP') !== day) {
    sub_(getRoot_(), '_backups').createFile('db-' + day + '.json', JSON.stringify(db), 'application/json');
    props.setProperty('LAST_BACKUP', day);
  }
}
function auditsFolder_() { return sub_(getRoot_(), '_audits'); }
function readAudit_(id) {
  var a = readJson_(auditsFolder_(), 'audit-' + id + '.json', null);
  if (!a) throw new Error('Audit not found.');
  return a;
}
function writeAudit_(a) { a.updatedAt = now_(); writeJson_(auditsFolder_(), 'audit-' + a.id + '.json', a); }

function clientFolder_(c) {
  if (c.folderId) { try { return DriveApp.getFolderById(c.folderId); } catch (e) { /* recreate */ } }
  var f = sub_(sub_(getRoot_(), 'Clients'), String(c.name || c.id).replace(/[\\/:*?"<>|]/g, '-'));
  c.folderId = f.getId();
  return f;
}
function settings_(db) {
  var s = {}; var k;
  for (k in DEFAULT_SETTINGS) s[k] = DEFAULT_SETTINGS[k];
  for (k in (db.settings || {})) if (db.settings[k] !== '' && db.settings[k] != null) s[k] = db.settings[k];
  return s;
}

// ================================================================ web entry points
function doGet(e) {
  var p = (e && e.parameter) || {};
  if (p.verify) return json_(verifyCert_(String(p.verify)));
  return json_({ ok: true, app: APP.NAME });
}

var NO_LOCK = { ai: 1, portalAi: 1, getFile: 1, portalGetFile: 1, login: 1, portalLogin: 1, bootstrap: 1, getAudit: 1, portalLoad: 1 };

function doPost(e) {
  var req;
  try { req = JSON.parse(e.postData.contents); } catch (err) { return json_({ ok: false, error: 'Bad request' }); }
  var run = function () { return /^portal/.test(String(req.action || '')) ? portal_(req) : staff_(req); };
  try {
    if (NO_LOCK[req.action]) return json_({ ok: true, data: run() });
    var lock = LockService.getScriptLock();
    lock.waitLock(30000);
    try { return json_({ ok: true, data: run() }); } finally { lock.releaseLock(); }
  } catch (err2) {
    return json_({ ok: false, error: String(err2 && err2.message || err2) });
  }
}

// ================================================================ SAFE team API
function staff_(req) {
  var cache = CacheService.getScriptCache();
  if (req.action === 'login') return login_(req);
  var email = req.token ? cache.get('tok_' + req.token) : null;
  if (!email) throw new Error('AUTH: Please sign in again.');
  var db = readDb_();
  var me = db.users.filter(function (u) { return u.email === email && u.active; })[0];
  if (!me) throw new Error('AUTH: Your access has been switched off.');
  var isAdmin = me.role === 'admin';
  var a, c;
  switch (req.action) {
    case 'logout': cache.remove('tok_' + req.token); return true;
    case 'changePin': {
      if (!/^\d{6}$/.test(String(req.pin || ''))) throw new Error('Choose a 6-digit PIN.');
      me.salt = randomToken_().slice(0, 16); me.pinHash = hashPin_(me.salt, req.pin); me.mustChange = false;
      writeDb_(db); return true;
    }
    case 'bootstrap': return bootstrap_(db, me);
    case 'saveClient': {
      var inC = req.client || {};
      c = inC.id ? clientById_(db, inC.id) : null;
      if (!c) { c = { id: 'c' + randomToken_().slice(0, 10), createdAt: now_(), createdBy: me.email, certs: [] }; db.clients.push(c); }
      ['name', 'legalName', 'industry', 'website', 'address', 'cin', 'tier', 'notes', 'status'].forEach(function (k) { if (inC[k] !== undefined) c[k] = clip_(inC[k], 2000); });
      if (inC.contacts) c.contacts = (inC.contacts || []).slice(0, 10).map(function (x) { return { name: clip_(x.name, 120), email: clip_(x.email, 160), role: clip_(x.role, 120) }; }).filter(function (x) { return x.email; });
      if (inC.budgetInr !== undefined) c.budgetInr = Number(inC.budgetInr) || 0;
      if (inC.letterhead !== undefined) c.letterhead = inC.letterhead;
      c.updatedAt = now_();
      clientFolder_(c);
      writeDb_(db);
      return publicClient_(c);
    }
    case 'setPortal': {
      c = mustClient_(db, req.clientId);
      c.portal = c.portal || { id: randomToken_().slice(0, 20) };
      c.portal.enabled = !!req.enabled;
      if (req.pin) {
        if (!/^\d{6}$/.test(String(req.pin))) throw new Error('The client PIN must be 6 digits.');
        c.portal.salt = randomToken_().slice(0, 16); c.portal.pinHash = hashPin_(c.portal.salt, String(req.pin)); c.portal.pinSetAt = now_();
      }
      if (req.resetLink) c.portal.id = randomToken_().slice(0, 20);
      writeDb_(db);
      if (req.emailClient && req.pin) emailPortalInvite_(db, c, String(req.pin));
      return { id: c.portal.id, enabled: c.portal.enabled, hasPin: !!c.portal.pinHash };
    }
    case 'uploadClientFile': {
      c = mustClient_(db, req.clientId);
      var f = saveUpload_(sub_(clientFolder_(c), 'Letterhead'), req);
      c.letterhead = { kind: /wordprocessingml/.test(req.mime) ? 'docx' : 'image', fileId: f.getId(), name: clip_(req.name, 200), mime: req.mime, width: Number(req.width) || 0, height: Number(req.height) || 0, uploadedAt: now_() };
      writeDb_(db);
      return c.letterhead;
    }
    case 'getFile': return getFile_(db, req.fileId, null);
    case 'uploadSignature': {
      if (!isAdmin) throw new Error('Only an admin can change the report signature.');
      if (!/^image\/(png|jpeg)$/.test(String(req.mime))) throw new Error('Upload the signature as a PNG or JPEG image.');
      var sf = saveUpload_(sub_(getRoot_(), '_signature'), req);
      var props0 = PropertiesService.getScriptProperties();
      var old = props0.getProperty('SIGNATURE_FILE_ID');
      if (old) { try { DriveApp.getFileById(old).setTrashed(true); } catch (e) { /* ignore */ } }
      props0.setProperty('SIGNATURE_FILE_ID', sf.getId());
      props0.setProperty('SIGNATURE_META', JSON.stringify({ width: Number(req.width) || 0, height: Number(req.height) || 0, mime: req.mime, at: now_(), by: me.email }));
      return { ok: true };
    }
    case 'getSignature': {
      if (me.role === 'member') throw new Error('Not allowed.');
      var props1 = PropertiesService.getScriptProperties();
      var fid = props1.getProperty('SIGNATURE_FILE_ID');
      if (!fid) return null;
      var meta = JSON.parse(props1.getProperty('SIGNATURE_META') || '{}');
      var sblob = DriveApp.getFileById(fid).getBlob();
      return { data: Utilities.base64Encode(sblob.getBytes()), mime: meta.mime || sblob.getContentType(), width: meta.width, height: meta.height };
    }
    case 'newAudit': {
      c = mustClient_(db, req.clientId);
      migrateClient_(c);
      var fwId = FW[req.framework] ? req.framework : 'dpdpa';
      var fwx = FW[fwId];
      var current = c.activeAudits[fwId] ? readAudit_(c.activeAudits[fwId]) : null;
      if (current && current.stage !== 'certified' && !req.carryForward) throw new Error('A ' + fwx.name + ' is already open for this client.');
      var prev = req.carryForward && current ? current : null;
      // shared organisation answers are copied from the client's other audits
      var common = { legalName: c.legalName || c.name, industry: c.industry || '', website: c.website || '' };
      activeIds_(c).forEach(function (id) { try { var o = readAudit_(id); COMMON_KEYS.forEach(function (k) { if (o.env && o.env[k] !== undefined && o.env[k] !== '') common[k] = o.env[k]; }); } catch (e) { /* ignore */ } });
      db.counters.audit = (db.counters.audit || 0) + 1;
      a = {
        id: 'a' + randomToken_().slice(0, 10), clientId: c.id, framework: fwId, ref: 'SAFE/' + fwx.code + '/' + new Date().getFullYear() + '/' + ('000' + db.counters.audit).slice(-4),
        type: prev ? 'renewal' : 'initial', previousAuditId: prev ? prev.id : '', createdAt: now_(), createdBy: me.email,
        stage: 'onboarding', env: prev ? prev.env : common,
        responses: prev ? carryResponses_(prev.responses) : {}, evidence: [], findings: [], docs: prev ? (prev.docs || []).filter(function (d) { return d.status === 'issued'; }) : [],
        reports: [], log: [], usage: { usd: 0, inr: 0, calls: 0, byTask: {} }, team: { lead: me.email }
      };
      log_(a, me.email, prev ? 'Renewal audit opened (answers carried forward from ' + prev.ref + ')' : fwx.name + ' opened');
      writeAudit_(a);
      c.activeAudits[fwId] = a.id; c.updatedAt = now_();
      db.auditIndex.push({ id: a.id, clientId: c.id, framework: fwId, ref: a.ref, type: a.type, createdAt: a.createdAt });
      writeDb_(db);
      return a;
    }
    case 'getAudit': return readAudit_(req.auditId);
    case 'saveAudit': {
      a = readAudit_(req.auditId);
      applyPatch_(a, req.patch || {}, me.email, true);
      if (req.logNote) log_(a, me.email, clip_(req.logNote, 500));
      writeAudit_(a);
      touchClientStage_(db, a);
      return a;
    }
    case 'uploadEvidence': {
      a = readAudit_(req.auditId); c = mustClient_(db, a.clientId);
      var ev = addEvidence_(a, c, req, me.email + ' (SAFE)');
      writeAudit_(a); writeDb_(db);
      return { audit: a, evidenceId: ev.id };
    }
    case 'deleteEvidence': {
      a = readAudit_(req.auditId);
      a.evidence = (a.evidence || []).map(function (x) { if (x.id === req.evidenceId) { x.deleted = true; x.controlIds = []; } return x; });
      log_(a, me.email, 'Evidence removed: ' + req.evidenceId);
      writeAudit_(a); return a;
    }
    case 'ai': return aiTask_(db, req, { by: me.email, staff: true });
    case 'issueReport': return issueReport_(db, req, me);
    case 'signOff': return signOff_(db, req, me);
    case 'certAction': {
      if (me.role === 'member') throw new Error('Only an advocate or admin can change a certificate.');
      var cert = db.certs.filter(function (x) { return x.no === req.certNo; })[0];
      if (!cert) throw new Error('Certificate not found.');
      var reason = clip_(req.reason, 500);
      if (!reason) throw new Error('Give a reason.');
      if (req.op === 'suspend') cert.status = 'suspended';
      else if (req.op === 'reinstate') cert.status = 'valid';
      else if (req.op === 'revoke') cert.status = 'revoked';
      else throw new Error('Unknown certificate action.');
      cert.history = (cert.history || []).concat([{ at: now_(), by: me.email, action: req.op, reason: reason }]);
      writeDb_(db);
      notifyCertChange_(db, cert, req.op, reason);
      return cert;
    }
    case 'saveSettings': {
      if (!isAdmin) throw new Error('Only an admin can change settings.');
      var s = req.settings || {};
      ['safeTo', 'safeCc', 'fromAddress', 'senderName', 'studioUrl', 'engineStandard', 'engineAudit', 'reportIssuers', 'signatoryName', 'signatoryTitle', 'signatoryEnrolment'].forEach(function (k) { if (s[k] !== undefined) db.settings[k] = clip_(s[k], 300); });
      ['reminderDaysBefore', 'reminderIntervalDays', 'pulseGraceDays', 'usdInr', 'budgetAlertPct'].forEach(function (k) { if (s[k] !== undefined && s[k] !== '') db.settings[k] = Number(s[k]); });
      if (s.prices) db.settings.prices = s.prices;
      if (s.budgets) db.settings.budgets = s.budgets;
      if (s.requireIndependence !== undefined) db.settings.requireIndependence = !!s.requireIndependence;
      if (s.aiKey) PropertiesService.getScriptProperties().setProperty('AI_KEY', String(s.aiKey).trim());
      writeDb_(db);
      return bootstrap_(db, me).settings;
    }
    case 'testAi': return { reply: callAi_({ system: SYS, prompt: 'Reply with the words: SAFE AI is connected.', maxTokens: 30 }).text };
    case 'saveUser': {
      if (!isAdmin) throw new Error('Only an admin can manage the team.');
      var u = req.user || {};
      if (!/@/.test(u.email || '')) throw new Error('Enter an email.');
      var ex = db.users.filter(function (x) { return x.email === u.email; })[0];
      if (!ex) { ex = { email: clip_(u.email, 160), createdAt: now_() }; db.users.push(ex); }
      ex.name = clip_(u.name, 120); ex.role = ['admin', 'advocate', 'member'].indexOf(u.role) >= 0 ? u.role : 'member'; ex.active = u.active !== false;
      ex.enrolment = clip_(u.enrolment, 80);
      if (u.pin) { if (!/^\d{6}$/.test(String(u.pin))) throw new Error('PIN must be 6 digits.'); ex.salt = randomToken_().slice(0, 16); ex.pinHash = hashPin_(ex.salt, String(u.pin)); ex.mustChange = true; }
      writeDb_(db);
      return bootstrap_(db, me).users;
    }
    case 'runReminders': return runDaily_(db, !!req.dryRun);
    case 'sendTestEmail': {
      var st = settings_(db);
      sendMail_(db, { to: me.email, subject: 'SAFE Compliance Audits — test email', html: emailShell_('Test email', '<p>This confirms that SAFE Legal Workplace Compliance Audits can send email' + (st.fromAddress ? ' from ' + esc_(st.fromAddress) : '') + '.</p>') });
      return true;
    }
    default: throw new Error('Unknown action: ' + req.action);
  }
}

function login_(req) {
  var cache = CacheService.getScriptCache();
  var email = String(req.email || '').trim().toLowerCase();
  var fk = 'sfail_' + email;
  var fails = Number(cache.get(fk) || 0);
  if (fails >= APP.MAX_FAILS) throw new Error('Too many attempts. Try again in 15 minutes.');
  var db = readDb_();
  var u = db.users.filter(function (x) { return String(x.email).toLowerCase() === email && x.active; })[0];
  if (!u || hashPin_(u.salt, String(req.pin || '')) !== u.pinHash) { cache.put(fk, String(fails + 1), APP.LOCK_SECONDS); throw new Error('Email or PIN is not correct.'); }
  cache.remove(fk);
  var token = randomToken_();
  cache.put('tok_' + token, u.email, APP.SESSION_SECONDS);
  return { token: token, user: publicUser_(u) };
}
function publicClient_(c) {
  var o = {}; for (var k in c) o[k] = c[k];
  if (c.portal) o.portal = { id: c.portal.id, enabled: !!c.portal.enabled, hasPin: !!c.portal.pinHash, pinSetAt: c.portal.pinSetAt || '' };
  return o;
}
function publicUser_(u) { return { email: u.email, name: u.name, role: u.role, active: u.active, enrolment: u.enrolment || '', mustChange: !!u.mustChange }; }

function bootstrap_(db, me) {
  var s = settings_(db);
  var key = PropertiesService.getScriptProperties().getProperty('AI_KEY');
  var out = {
    me: publicUser_(me),
    clients: db.clients.map(publicClient_),
    certs: db.certs,
    auditIndex: db.auditIndex,
    users: db.users.map(publicUser_),
    settings: {
      safeTo: s.safeTo, safeCc: s.safeCc, fromAddress: s.fromAddress, senderName: s.senderName, studioUrl: s.studioUrl,
      reminderDaysBefore: s.reminderDaysBefore, reminderIntervalDays: s.reminderIntervalDays, pulseGraceDays: s.pulseGraceDays,
      usdInr: s.usdInr, prices: s.prices, budgets: s.budgets, budgetAlertPct: s.budgetAlertPct, requireIndependence: s.requireIndependence,
      engineStandard: s.engineStandard, engineAudit: s.engineAudit, reportIssuers: s.reportIssuers,
      signatoryName: s.signatoryName, signatoryTitle: s.signatoryTitle, signatoryEnrolment: s.signatoryEnrolment, hasSignature: !!PropertiesService.getScriptProperties().getProperty('SIGNATURE_FILE_ID'),
      aiConnected: !!key, aiKeyHint: key ? '••••' + key.slice(-4) : ''
    },
    mailErrors: JSON.parse(PropertiesService.getScriptProperties().getProperty('MAIL_ERRORS') || '[]')
  };
  // summaries of active audits for the dashboard
  out.audits = {};
  db.clients.forEach(function (c) {
    activeIds_(c).forEach(function (id) { try { var a = readAudit_(id); out.audits[a.id] = summariseAudit_(a); } catch (e) { /* ignore */ } });
  });
  return out;
}
function summariseAudit_(a) {
  return { id: a.id, ref: a.ref, clientId: a.clientId, framework: a.framework || 'dpdpa', stage: a.stage, type: a.type, createdAt: a.createdAt, updatedAt: a.updatedAt,
    env: a.env, responses: a.responses, evidence: (a.evidence || []).map(function (e) { return { id: e.id, controlIds: e.controlIds, review: e.review ? { verdict: e.review.verdict } : null, deleted: e.deleted }; }),
    findings: (a.findings || []).map(function (f) { return { id: f.id, controlId: f.controlId, status: f.status, grade: f.grade, state: f.state, needsReview: f.needsReview, reviewedBy: f.reviewedBy, dueDate: f.dueDate }; }),
    reports: (a.reports || []).map(function (r) { return { kind: r.kind, at: r.at }; }), usage: a.usage, signoff: a.signoff || null };
}

// ================================================================ audit patching
var CLIENT_PATCH = { env: 1, responses: 1 };
function applyPatch_(a, patch, by, staff) {
  if (patch.env) { a.env = a.env || {}; for (var k in patch.env) a.env[k] = patch.env[k]; }
  if (patch.responses) {
    a.responses = a.responses || {};
    for (var id in patch.responses) {
      var r = patch.responses[id] || {};
      var cur = a.responses[id] || {};
      ['answer', 'note', 'owner'].forEach(function (f) { if (r[f] !== undefined) cur[f] = clip_(r[f], 4000); });
      if (r.followups) cur.followups = (r.followups || []).slice(0, 20).map(function (q) { return { id: clip_(q.id, 40), q: clip_(q.q, 600), a: clip_(q.a, 4000), at: q.at || now_() }; });
      cur.updatedAt = now_(); cur.by = by;
      a.responses[id] = cur;
    }
  }
  if (!staff) return;
  ['findings', 'docs', 'team', 'roleMemo', 'notes', 'scope', 'auditRunAt'].forEach(function (f) { if (patch[f] !== undefined) a[f] = patch[f]; });
  // field-level merges, so SAFE and the client can work on findings and documents at the same time
  [['findingUpdates', 'findings'], ['docUpdates', 'docs'], ['evidenceUpdates', 'evidence']].forEach(function (pair) {
    var upd = patch[pair[0]]; if (!upd) return;
    a[pair[1]] = a[pair[1]] || [];
    Object.keys(upd).forEach(function (id) {
      var row = a[pair[1]].filter(function (x) { return x.id === id; })[0];
      if (!row) { if (upd[id] && upd[id].id === id) a[pair[1]].push(upd[id]); return; }
      for (var k in upd[id]) row[k] = upd[id][k];
    });
  });
  if (patch.stage && patch.stage !== a.stage) { log_(a, by, 'Stage moved from ' + a.stage + ' to ' + patch.stage); a.stage = patch.stage; }
}
function carryResponses_(resp) {
  var out = {};
  for (var id in (resp || {})) out[id] = { answer: resp[id].answer, note: resp[id].note, carried: true, updatedAt: resp[id].updatedAt };
  return out;
}
function touchClientStage_(db, a) {
  var c = clientById_(db, a.clientId);
  if (c) { c.stages = c.stages || {}; var k = a.framework || 'dpdpa'; if (c.stages[k] !== a.stage || c.stage !== a.stage) { c.stages[k] = a.stage; c.stage = a.stage; writeDb_(db); } }
}
function log_(a, by, action) { a.log = (a.log || []).concat([{ at: now_(), by: by, action: action }]).slice(-500); }

// ================================================================ evidence and files
function saveUpload_(folder, req) {
  var data = String(req.data || '');
  var bytes = Utilities.base64Decode(data);
  if (bytes.length > APP.MAX_UPLOAD_BYTES) throw new Error('Files must be under 20 MB.');
  var blob = Utilities.newBlob(bytes, clip_(req.mime, 120) || 'application/octet-stream', clip_(req.name, 200) || 'file');
  return folder.createFile(blob);
}
function addEvidence_(a, c, req, by) {
  var folder = sub_(sub_(clientFolder_(c), a.ref.replace(/\//g, '-')), 'Evidence');
  var f = saveUpload_(folder, req);
  var ev = { id: 'e' + randomToken_().slice(0, 10), fileId: f.getId(), name: clip_(req.name, 200), mime: clip_(req.mime, 120), size: f.getSize(),
    controlIds: (req.controlIds || []).slice(0, 20), text: clip_(req.text, 60000), uploadedAt: now_(), by: by, note: clip_(req.note, 1000), source: clip_(req.source || 'upload', 40) };
  a.evidence = (a.evidence || []).concat([ev]);
  log_(a, by, 'Evidence uploaded: ' + ev.name + ' (' + ev.controlIds.join(', ') + ')');
  return ev;
}
function getFile_(db, fileId, clientId) {
  // Only files the studio knows about can be fetched, and a client only its own.
  var known = false;
  db.clients.forEach(function (c) {
    if (clientId && c.id !== clientId) return;
    if (c.letterhead && c.letterhead.fileId === fileId) known = true;
  });
  if (!known) {
    var list = clientId ? db.clients.filter(function (c) { return c.id === clientId; }) : db.clients;
    list.forEach(function (c) {
      if (known) return;
      var ids = activeIds_(c).concat((db.auditIndex || []).filter(function (x) { return x.clientId === c.id; }).map(function (x) { return x.id; }));
      ids.forEach(function (aid) {
        if (known) return;
        try {
          var a = readAudit_(aid);
          (a.evidence || []).forEach(function (e) { if (e.fileId === fileId && !e.deleted) known = true; });
          (a.reports || []).forEach(function (r) { if (r.pdfId === fileId || r.htmlId === fileId) known = true; });
          (a.docs || []).forEach(function (d) { if (d.fileId === fileId) known = true; });
        } catch (e) { /* ignore */ }
      });
    });
  }
  if (!known) throw new Error('File not available.');
  var file = DriveApp.getFileById(fileId);
  return { name: file.getName(), mime: file.getMimeType(), data: Utilities.base64Encode(file.getBlob().getBytes()) };
}

// ================================================================ client portal API
function portal_(req) {
  var cache = CacheService.getScriptCache();
  var db = readDb_();
  if (req.action === 'portalLogin') {
    var pid = clip_(req.portalId, 64);
    var fk = 'pfail_' + pid;
    var fails = Number(cache.get(fk) || 0);
    if (fails >= APP.MAX_FAILS) throw new Error('Too many attempts. Please try again in 15 minutes.');
    var pc = db.clients.filter(function (x) { return x.portal && x.portal.id === pid && x.portal.enabled && x.portal.pinHash; })[0];
    if (!pc || hashPin_(pc.portal.salt, clip_(req.pin, 12)) !== pc.portal.pinHash) { cache.put(fk, String(fails + 1), APP.LOCK_SECONDS); throw new Error('The link or PIN is not correct.'); }
    cache.remove(fk);
    var token = randomToken_();
    cache.put('ps_' + token, pc.id, APP.PORTAL_SESSION_SECONDS);
    return { session: token, view: portalView_(db, pc) };
  }
  var cid = req.session ? cache.get('ps_' + req.session) : null;
  if (!cid) throw new Error('AUTH: Your session has ended. Please sign in again.');
  var c = clientById_(db, cid);
  if (!c || !c.portal || !c.portal.enabled) throw new Error('AUTH: Portal access is switched off.');
  var who = clip_(req.who || 'Client user', 120) + ' (' + c.name + ')';
  var ids = activeIds_(c);
  var aid = req.auditId && ids.indexOf(req.auditId) >= 0 ? req.auditId : ids[0];
  var a = aid ? readAudit_(aid) : null;
  var editable = a && ['onboarding', 'environment', 'assessment', 'remediation'].indexOf(a.stage) >= 0;
  switch (req.action) {
    case 'portalLogout': cache.remove('ps_' + req.session); return true;
    case 'portalLoad': return portalView_(db, c);
    case 'portalSave': {
      if (!a) throw new Error('No audit is open yet.');
      if (!editable) throw new Error('Your answers are locked while SAFE completes the audit.');
      var patch = {};
      if (req.patch && req.patch.env && ['onboarding', 'environment', 'assessment'].indexOf(a.stage) >= 0) patch.env = req.patch.env;
      if (req.patch && req.patch.responses) patch.responses = req.patch.responses;
      if (a.stage === 'onboarding') { a.stage = 'environment'; log_(a, who, 'Client started the environment assessment'); }
      applyPatch_(a, patch, who, false);
      writeAudit_(a);
      touchClientStage_(db, a);
      return portalView_(db, c, a);
    }
    case 'portalUpload': {
      if (!a) throw new Error('No audit is open yet.');
      if (!editable) throw new Error('Uploads are closed while SAFE completes the audit.');
      var ev = addEvidence_(a, c, req, who);
      writeAudit_(a);
      writeDb_(db);
      return { evidenceId: ev.id, view: portalView_(db, c, a) };
    }
    case 'portalSubmit': {
      if (!a) throw new Error('No audit is open yet.');
      var what = req.what;
      if (what === 'environment' && ['onboarding', 'environment'].indexOf(a.stage) >= 0) { a.stage = 'assessment'; a.envSubmittedAt = now_(); }
      else if (what === 'assessment' && a.stage === 'assessment') { a.stage = 'audit'; a.assessmentSubmittedAt = now_(); }
      else if (what === 'remediation' && a.stage === 'remediation') { a.remediationSubmittedAt = now_(); a.stage = 'signoff'; }
      else throw new Error('This step cannot be submitted now.');
      log_(a, who, 'Client submitted: ' + what);
      writeAudit_(a);
      touchClientStage_(db, a);
      notifySafe_(db, c, a, 'Client submitted the ' + what + ' step', '<p>' + esc_(c.name) + ' has submitted the <b>' + esc_(what) + '</b> step of audit ' + esc_(a.ref) + '.</p>');
      return portalView_(db, c, a);
    }
    case 'portalFinding': {
      if (!a || a.stage !== 'remediation') throw new Error('Remediation is not open.');
      var f = (a.findings || []).filter(function (x) { return x.id === req.findingId; })[0];
      if (!f) throw new Error('Finding not found.');
      if (req.owner !== undefined) f.owner = clip_(req.owner, 120);
      if (req.dueDate !== undefined) f.dueDate = clip_(req.dueDate, 10);
      if (req.note || req.evidenceId) {
        f.remediation = (f.remediation || []).concat([{ at: now_(), by: who, note: clip_(req.note, 4000), evidenceId: clip_(req.evidenceId, 40) }]);
        if (f.state === 'open') f.state = 'submitted';
      }
      log_(a, who, 'Remediation update on ' + (f.controlId || f.id));
      writeAudit_(a);
      return portalView_(db, c, a);
    }
    case 'portalAi': return aiTask_(db, req, { by: who, clientId: c.id, portal: true });
    case 'portalPulse': {
      var cert = db.certs.filter(function (x) { return x.clientId === c.id && x.status !== 'revoked' && (!req.certNo || x.no === req.certNo); }).sort(function (x, y) { return y.issued > x.issued ? 1 : -1; })[0];
      if (!cert) throw new Error('No certificate is in force.');
      var pulse = { at: now_(), by: who, answers: req.answers || {} };
      cert.pulses = (cert.pulses || []).concat([pulse]);
      var material = Object.keys(pulse.answers).filter(function (k) { return pulse.answers[k] === 'yes'; });
      if (material.indexOf('breach') >= 0 && cert.status === 'valid') {
        cert.status = 'suspended';
        cert.history = (cert.history || []).concat([{ at: now_(), by: 'SAFE AI', action: 'suspend', reason: 'Client reported a breach in the quarterly pulse check.' }]);
      }
      writeDb_(db);
      notifySafe_(db, c, a, 'Quarterly pulse check received', '<p>' + esc_(c.name) + ' completed the quarterly pulse check for certificate ' + esc_(cert.no) + '.</p><p>Material changes reported: <b>' + (material.length ? esc_(material.join(', ')) : 'none') + '</b>.' + (pulse.answers.detail ? '<br>Details: ' + esc_(pulse.answers.detail) : '') + '</p>' + (cert.status === 'suspended' ? '<p><b>The certificate has been suspended automatically pending re-assessment.</b></p>' : ''));
      return portalView_(db, c, a);
    }
    case 'portalGetFile': return getFile_(db, req.fileId, c.id);
    default: throw new Error('Unknown action.');
  }
}

function portalView_(db, c, a) {
  var ids = activeIds_(c);
  a = a || (ids[0] ? readAudit_(ids[0]) : null);
  var list = ids.map(function (id) { try { var x = id === (a && a.id) ? a : readAudit_(id); return { id: x.id, ref: x.ref, framework: x.framework || 'dpdpa', stage: x.stage, type: x.type, createdAt: x.createdAt }; } catch (e) { return null; } }).filter(function (x) { return x; });
  var certs = db.certs.filter(function (x) { return x.clientId === c.id; }).map(publicCert_);
  var view = {
    client: { id: c.id, name: c.name, legalName: c.legalName, industry: c.industry, contacts: c.contacts || [], letterhead: c.letterhead ? { kind: c.letterhead.kind, name: c.letterhead.name, fileId: c.letterhead.fileId, mime: c.letterhead.mime, width: c.letterhead.width, height: c.letterhead.height } : null },
    certs: certs,
    audits: list,
    audit: null
  };
  if (a) {
    var budget = budgetFor_(db, c, a);
    view.audit = {
      id: a.id, ref: a.ref, framework: a.framework || 'dpdpa', type: a.type, stage: a.stage, createdAt: a.createdAt, env: a.env, responses: a.responses, roleMemo: a.roleMemo || null,
      evidence: (a.evidence || []).filter(function (e) { return !e.deleted; }).map(function (e) { return { id: e.id, name: e.name, mime: e.mime, size: e.size, controlIds: e.controlIds, uploadedAt: e.uploadedAt, by: e.by, review: e.review || null, fileId: e.fileId }; }),
      // findings are shown to the client only once SAFE has issued the interim report
      findings: (a.reports || []).some(function (r) { return r.kind === 'interim'; }) ? (a.findings || []).map(function (f) { var o = {}; for (var k in f) if (['reviewNote', 'aiRaw'].indexOf(k) < 0) o[k] = f[k]; return o; }) : [],
      docs: (a.docs || []).filter(function (d) { return d.status === 'approved' || d.status === 'issued' || d.requestedByClient; }),
      reports: (a.reports || []).map(function (r) { return { id: r.id, kind: r.kind, at: r.at, pdfId: r.pdfId, htmlId: r.htmlId, opinion: r.opinion, score: r.score }; }),
      aiBudget: { usedInr: Math.round((a.usage && a.usage.inr) || 0), budgetInr: budget, blocked: budget > 0 && (a.usage && a.usage.inr || 0) >= budget }
    };
  }
  return view;
}

// ================================================================ SAFE AI
var SAFE_AI_SYSTEM = 'You are SAFE AI, the compliance intelligence of SAFE Legal Solutions, a law firm in Bengaluru, India. ' +
  'You support legal compliance assessments and audits of Indian organisations that follow ISO 19011 audit practice. ' +
  'Identity: always call yourself SAFE AI. Never name, mention or hint at any AI company, model or vendor, even if asked; if asked what you are built on, say you are SAFE AI, SAFE Legal Solutions\' proprietary compliance engine. ' +
  'Accuracy: rely only on Indian law as in force and the facts given. Never invent section numbers, rule numbers, circulars or cases; if unsure of a number, name the law or chapter without it. ' +
  'In audit observations, recommendations, report text and drafted documents, write in the voice of SAFE Legal Solutions\' audit team: never mention SAFE AI, artificial intelligence, an audit engine, software or any tool. ' +
  'Write in clear Indian English for business readers. Be specific and practical. When asked for JSON, reply with valid JSON only, no commentary and no code fences.';
function systemFor_(a) { var f = fwOf_(a); return SAFE_AI_SYSTEM + ' This engagement is a ' + f.name + ' under ' + f.law + '. ' + f.context; }

function aiTask_(db, req, ctx) {
  var a = readAudit_(req.auditId || (ctx.clientId ? activeIds_(clientById_(db, ctx.clientId))[0] : ''));
  if (ctx.clientId && (a.clientId !== ctx.clientId || activeIds_(clientById_(db, ctx.clientId)).indexOf(a.id) < 0)) throw new Error('Not allowed.');
  var fwx = fwOf_(a); var SYS = systemFor_(a);
  var c = clientById_(db, a.clientId);
  var s = settings_(db);
  var portalAllowed = { followups: 1, reviewEvidence: 1, ask: 1, verifyRemediation: 1, roleMemo: 1, draftDoc: 1 };
  if (ctx.portal && !portalAllowed[req.task]) throw new Error('Not available in the portal.');
  var budget = budgetFor_(db, c, a);
  if (ctx.portal && budget > 0 && (a.usage && a.usage.inr || 0) >= budget) throw new Error('SAFE AI usage for this audit has reached its limit. SAFE Legal has been informed and will extend it.');
  if (ctx.portal) rate_('ai_' + c.id, 120, 3600);
  var envBrief = envBrief_(a.env, c);
  var out, r, prompt;
  var mut = [];
  switch (req.task) {
    case 'roleMemo': {
      prompt = 'Assess how ' + fwx.law + ' apply to this organisation, for a ' + fwx.name + '.\n\n' + envBrief + '\n\nReturn JSON: {"role": "the organisation\'s status under these laws, in a few words", ' +
        '"summary": "4-6 sentence plain-English applicability memo", "keyApplicability": ["3-6 thresholds or provisions that apply, with the reason"], ' +
        '"keyRisks": ["top 5 risks specific to this business"], "priorityAreas": ["5 areas to fix first"], "sectorOverlays": ["other laws or regulators that also apply"]' + (a.framework === 'dpdpa' || !a.framework ? ', "sdfAssessment": "...", "thirdSchedule": "..."' : '') + '}';
      r = callAi_({ system: SYS, prompt: prompt, maxTokens: 1800, model: s.engineStandard });
      out = parseJson_(r.text); out.at = now_();
      mut.push(function (x) { x.roleMemo = out; });
      break;
    }
    case 'followups': {
      var ctrls = (req.controls || []).slice(0, 15);
      prompt = 'You are interviewing the client for the "' + clip_(req.domainName, 120) + '" area of a ' + fwx.name + '.\n\n' + envBrief + '\n\nControls and the client\'s answers so far:\n' +
        ctrls.map(function (x) { var rr = (a.responses || {})[x.id] || {}; return '- ' + x.id + ' [' + x.ref + '] ' + x.t + '\n  Requirement: ' + x.req + '\n  Answer: ' + (rr.answer || 'not answered') + (rr.note ? '\n  Client note: ' + clip_(rr.note, 1200) : '') + ((rr.followups || []).length ? '\n  Earlier follow-ups: ' + rr.followups.map(function (q) { return q.q + ' => ' + (q.a || '(unanswered)'); }).join(' | ') : ''); }).join('\n') +
        '\n\nAsk the follow-up questions an experienced auditor would ask to test these answers, close ambiguities and identify the evidence needed. Ask at most 2 per control and at most 8 in total; skip controls that are clearly settled or marked not applicable with a good reason. ' +
        'Return JSON: [{"controlId": "...", "q": "the question, one sentence", "why": "what this tests, one short phrase", "evidence": "the document or screenshot that would prove it"}]';
      r = callAi_({ system: SYS, prompt: prompt, maxTokens: 2000, model: s.engineStandard });
      out = parseJson_(r.text);
      break;
    }
    case 'reviewEvidence': {
      var ev = (a.evidence || []).filter(function (x) { return x.id === req.evidenceId && !x.deleted; })[0];
      if (!ev) throw new Error('Evidence not found.');
      var ctl = (req.controls || []).slice(0, 10);
      var head = 'Review this evidence for a ' + fwx.name + '.\n\n' + envBrief + '\n\nEvidence file: ' + ev.name + (ev.note ? '\nUploader\'s note: ' + ev.note : '') + '\n\nIt was submitted for these controls:\n' +
        ctl.map(function (x) { return '- ' + x.id + ' [' + x.ref + '] ' + x.t + ': ' + x.req + (x.ev ? ' (Expected evidence: ' + x.ev + ')' : ''); }).join('\n') +
        '\n\nJudge whether the evidence actually demonstrates each requirement. Be strict but fair: a policy alone does not prove a process operates; a screenshot proves only what it shows. ' +
        'Return JSON: {"verdict": "accepted | partial | rejected", "summary": "2-3 sentences on what the document is and shows", "perControl": {"<controlId>": {"verdict": "accepted | partial | rejected", "meets": "what is satisfied", "gaps": "what is missing"}}, ' +
        '"gaps": ["specific missing elements"], "confidence": 0.0-1.0, "pointers": ["where in the document the key provisions are, e.g. section or page"]}';
      var content = [];
      var blob = null;
      if (/pdf|image\//.test(ev.mime) && ev.size <= 20 * 1024 * 1024) { blob = DriveApp.getFileById(ev.fileId).getBlob(); }
      if (blob && /pdf/.test(ev.mime)) content.push({ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: Utilities.base64Encode(blob.getBytes()) } });
      else if (blob && /image\/(png|jpeg|gif|webp)/.test(ev.mime)) content.push({ type: 'image', source: { type: 'base64', media_type: ev.mime, data: Utilities.base64Encode(blob.getBytes()) } });
      else if (ev.text) content.push({ type: 'text', text: 'Text of the evidence file:\n' + clip_(ev.text, 60000) });
      else throw new Error('SAFE AI cannot read this file type. Upload a PDF, an image, a Word file or a text file.');
      content.push({ type: 'text', text: head });
      r = callAi_({ system: SYS, content: content, maxTokens: 2000, model: s.engineStandard });
      out = parseJson_(r.text); out.at = now_(); out.by = 'SAFE AI';
      mut.push(function (x) { (x.evidence || []).forEach(function (e) { if (e.id === ev.id) e.review = out; }); });
      break;
    }
    case 'gradeDomain': {
      if (!ctx.staff) throw new Error('Not allowed.');
      var gc = (req.controls || []).slice(0, 20);
      prompt = 'Act as the lead auditor. Grade each control in the "' + clip_(req.domainName, 120) + '" area of this ' + fwx.name + ', following ISO 19011: findings must rest on objective evidence measured against the stated criteria.\n\n' + envBrief +
        '\n\nGrading scale: "conformity" (requirement fully met with evidence), "partial" (met in part, or claimed but not evidenced), "notmet" (not met, or the client is unsure), "na" (genuinely not applicable — explain why).\n' +
        'Suggested grade: "major" (statutory breach, systemic failure or total absence), "minor" (isolated or partial lapse), "ofi" (requirement met but could be better), "conformity". Never record a legal non-compliance as an "ofi".\n\nControls:\n' +
        gc.map(function (x) {
          var rr = (a.responses || {})[x.id] || {};
          var evs = (a.evidence || []).filter(function (e) { return !e.deleted && (e.controlIds || []).indexOf(x.id) >= 0; });
          return '### ' + x.id + ' [' + x.ref + '] (' + ({ M: 'Must have', S: 'Should have', W: 'Might have' })[x.pri] + ') ' + x.t + '\nRequirement: ' + x.req +
            '\nClient answer: ' + (rr.answer || 'not answered') + (rr.note ? '\nClient explanation: ' + clip_(rr.note, 1500) : '') +
            ((rr.followups || []).length ? '\nFollow-up Q&A: ' + rr.followups.map(function (q) { return 'Q: ' + q.q + ' A: ' + (q.a || '(no answer)'); }).join(' | ') : '') +
            '\nEvidence: ' + (evs.length ? evs.map(function (e) { return e.name + (e.review ? ' — reviewed ' + e.review.verdict + ': ' + clip_(e.review.summary, 400) + (e.review.perControl && e.review.perControl[x.id] ? ' | gaps: ' + clip_(e.review.perControl[x.id].gaps, 300) : '') : ' — not yet reviewed'); }).join('; ') : 'none');
        }).join('\n\n') +
        '\n\nReturn JSON: [{"controlId": "...", "status": "conformity | partial | notmet | na", "grade": "major | minor | ofi | conformity", "observation": "the auditor\'s observation in 1-3 sentences, citing evidence by file name", ' +
        '"risk": "the legal and business risk, 1 sentence", "recommendation": "specific corrective action, 1-3 sentences", "confidence": 0.0-1.0}] — one entry for every control listed.';
      r = callAi_({ system: SYS, prompt: prompt, maxTokens: 6000, model: s.engineAudit });
      out = parseJson_(r.text);
      break;
    }
    case 'draftDoc': {
      var dt = req.doc || {};
      prompt = 'Draft the following document for this organisation, ready for its letterhead.\n\nDocument: ' + clip_(dt.title, 200) + '\nAudience: ' + clip_(dt.audience, 200) + '\n\n' + envBrief +
        '\n\nIt must satisfy these requirements:\n' + (req.controls || []).slice(0, 15).map(function (x) { return '- ' + x.id + ' [' + x.ref + ']: ' + x.req; }).join('\n') +
        (req.instructions ? '\n\nAdditional instructions: ' + clip_(req.instructions, 2000) : '') +
        '\n\nWrite the complete operative text, specific to this business (its data, systems, vendors and purposes as described), not generic. Use the company\'s name. ' +
        'Where a fact must come from the client, write ??short description?? so it is highlighted. Formatting: start each section with "## Heading"; clauses as "1.1 Text"; bullets with "- "; tables as "| a | b |" lines with a header row; **bold** sparingly. ' +
        'Do not add a title block, letterhead, signature block, or any mention of who drafted it.';
      r = callAi_({ system: SYS, prompt: prompt, maxTokens: 8000, model: s.engineStandard });
      out = { text: r.text, docId: '' };
      mut.push(function (x) {
        x.docs = x.docs || [];
        var d = x.docs.filter(function (y) { return y.type === dt.id; })[0];
        if (!d) { d = { id: 'd' + randomToken_().slice(0, 10), type: dt.id, title: dt.title, history: [] }; x.docs.push(d); }
        d.content = r.text; d.status = 'draft'; d.draftedAt = now_(); d.draftedBy = 'SAFE AI'; d.requestedBy = ctx.by; d.requestedByClient = !!ctx.portal;
        d.approvedBy = ''; d.approvedAt = '';
        d.history = (d.history || []).concat([{ at: now_(), by: ctx.by, action: 'Drafted by SAFE AI' }]).slice(-30);
        out.docId = d.id;
      });
      if (ctx.portal) notifySafe_(db, c, a, 'Document drafted for review', '<p>' + esc_(c.name) + ' asked SAFE AI to draft <b>' + esc_(dt.title) + '</b>. Please review and approve it in the Studio.</p>');
      break;
    }
    case 'reportSummary': {
      if (!ctx.staff) throw new Error('Not allowed.');
      prompt = 'Write the executive summary of this ' + fwx.name + ' report.\n\n' + envBrief + '\n\nAudit facts (use these numbers exactly):\n' + clip_(JSON.stringify(req.facts || {}), 20000) +
        '\n\nReturn JSON: {"executiveSummary": "two short paragraphs for the board", "strengths": ["3-5"], "keyRisks": ["3-6, most serious first"], "opinionText": "the formal audit conclusion in 2-3 sentences, consistent with the opinion given in the facts", "nextSteps": ["3-6 actions with timing"]}';
      r = callAi_({ system: SYS, prompt: prompt, maxTokens: 2500, model: s.engineAudit });
      out = parseJson_(r.text);
      break;
    }
    case 'verifyRemediation': {
      var fd = (a.findings || []).filter(function (x) { return x.id === req.findingId; })[0];
      if (!fd) throw new Error('Finding not found.');
      var proof = (fd.remediation || []).slice(-3);
      var evIds = proof.map(function (p) { return p.evidenceId; }).filter(String);
      var cont = [];
      (a.evidence || []).filter(function (e) { return evIds.indexOf(e.id) >= 0 && !e.deleted; }).forEach(function (e) {
        if (/pdf/.test(e.mime) && e.size < 20 * 1024 * 1024) cont.push({ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: Utilities.base64Encode(DriveApp.getFileById(e.fileId).getBlob().getBytes()) } });
        else if (/image\/(png|jpeg|gif|webp)/.test(e.mime)) cont.push({ type: 'image', source: { type: 'base64', media_type: e.mime, data: Utilities.base64Encode(DriveApp.getFileById(e.fileId).getBlob().getBytes()) } });
        else if (e.text) cont.push({ type: 'text', text: 'Proof file ' + e.name + ':\n' + clip_(e.text, 40000) });
      });
      var ctlx = req.control || {};
      cont.push({ type: 'text', text: 'Verify whether this corrective action closes the audit finding.\n\n' + envBrief + '\n\nControl ' + ctlx.id + ' [' + ctlx.ref + ']: ' + ctlx.req + '\nFinding (' + fd.grade + '): ' + fd.observation + '\nRecommendation: ' + fd.recommendation +
        '\nClient\'s remediation notes: ' + proof.map(function (p) { return p.note; }).join(' | ') +
        '\n\nReturn JSON: {"verdict": "closed | insufficient", "reason": "1-3 sentences", "remaining": "what is still needed, if anything", "confidence": 0.0-1.0}' });
      r = callAi_({ system: SYS, content: cont, maxTokens: 1200, model: s.engineStandard });
      out = parseJson_(r.text); out.at = now_();
      mut.push(function (x) {
        var f2 = (x.findings || []).filter(function (y) { return y.id === fd.id; })[0]; if (!f2) return;
        f2.verification = (f2.verification || []).concat([out]);
        if (out.verdict === 'closed' && Number(out.confidence) >= 0.75) { f2.state = 'closed'; f2.closedAt = now_(); f2.closedBy = 'SAFE AI (verified)'; }
        else if (out.verdict === 'closed') { f2.state = 'submitted'; f2.needsReview = true; f2.reviewedBy = ''; }
        else f2.state = 'open';
        log_(x, 'SAFE AI', 'Remediation check on ' + (f2.controlId || f2.id) + ': ' + out.verdict);
      });
      break;
    }
    case 'ask': {
      prompt = 'A ' + (ctx.portal ? 'client' : 'SAFE team member') + ' asks about ' + fwx.name.replace(' Audit', '') + '.\n\n' + envBrief + (req.controlId ? '\n\nThe question relates to control ' + clip_(req.controlId, 20) + '.' : '') +
        '\n\nQuestion: ' + clip_(req.question, 3000) + '\n\nAnswer practically in under 250 words, citing the law where relevant. End with one line: "SAFE Legal\'s advocates will confirm this in your audit."';
      r = callAi_({ system: SYS, prompt: prompt, maxTokens: 900, model: s.engineStandard });
      out = { answer: r.text };
      break;
    }
    default: throw new Error('Unknown SAFE AI task.');
  }
  // The AI call ran without the lock; take it now and apply the change to the latest saved copy.
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    db = readDb_(); c = clientById_(db, c.id); a = readAudit_(a.id);
    mut.forEach(function (fn) { fn(a); });
    meter_(db, c, a, req.task, r);
    log_(a, ctx.by, 'SAFE AI: ' + req.task);
    writeAudit_(a);
    writeDb_(db);
  } finally { lock.releaseLock(); }
  return { result: out, audit: ctx.portal ? null : a, view: ctx.portal ? portalView_(db, c, a) : null };
}

function envBrief_(env, c) {
  env = env || {};
  var lines = ['Organisation: ' + (env.legalName || (c && c.name) || '')];
  Object.keys(env).forEach(function (k) {
    if (k === 'legalName' || k === 'existingDocs') return;
    var v = env[k]; if (v === '' || v == null || (Array.isArray(v) && !v.length)) return;
    lines.push(k + ': ' + clip_(Array.isArray(v) ? v.join(', ') : (v === true ? 'yes' : v === false ? 'no' : v), 1500));
  });
  if ((env.existingDocs || []).length) lines.push('documents already held: ' + env.existingDocs.join(', '));
  return 'Client profile:\n' + lines.join('\n');
}

/** Calls the SAFE AI engine. Returns { text, usage, model }. */
function callAi_(o) {
  var key = PropertiesService.getScriptProperties().getProperty('AI_KEY');
  if (!key) throw new Error('SAFE AI is not connected yet. An admin must add the SAFE AI key in Settings.');
  var s = settings_(readDb_());
  var model = o.model || s.engineStandard;
  var body = { model: model, max_tokens: o.maxTokens || 2000, system: o.system || SAFE_AI_SYSTEM, messages: [{ role: 'user', content: o.content || o.prompt }] };
  var last = '';
  for (var attempt = 0; attempt < 3; attempt++) {
    var res = UrlFetchApp.fetch('https://api.anthropic.com/v1/messages', {
      method: 'post', contentType: 'application/json', muteHttpExceptions: true, payload: JSON.stringify(body),
      headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01' }
    });
    var code = res.getResponseCode();
    var text = res.getContentText();
    if (code === 200) {
      var out = JSON.parse(text);
      var t = (out.content || []).filter(function (x) { return x.type === 'text'; }).map(function (x) { return x.text; }).join('').trim();
      return { text: scrub_(t), usage: out.usage || {}, model: model };
    }
    last = code + ' ' + text.slice(0, 300);
    if (code === 429 || code === 529 || code >= 500) { Utilities.sleep(2500 * (attempt + 1)); continue; }
    break;
  }
  Logger.log('SAFE AI error: ' + last);
  if (/401|authentication/i.test(last)) throw new Error('The SAFE AI key was rejected. An admin must check it in Settings.');
  if (/credit|billing|balance/i.test(last)) throw new Error('SAFE AI credit has run out. An admin must top up the SAFE AI account.');
  throw new Error('SAFE AI did not respond. Please try again in a minute.');
}
/** Keeps the SAFE AI brand: removes any vendor or model names from generated text. */
function scrub_(t) {
  return String(t || '').replace(/\b(Anthropic|Claude(?:\s+(?:Opus|Sonnet|Haiku|Fable|Mythos))?(?:\s*\d+(?:\.\d+)?)?)\b/gi, 'SAFE AI');
}
function parseJson_(text) {
  var t = String(text || '').replace(/```json|```/g, '');
  var ai = t.indexOf('['), oi = t.indexOf('{');
  var start = ai < 0 ? oi : (oi < 0 ? ai : Math.min(ai, oi));
  if (start < 0) throw new Error('SAFE AI returned an unreadable answer. Please try again.');
  var close = t.charAt(start) === '[' ? ']' : '}';
  return JSON.parse(t.slice(start, t.lastIndexOf(close) + 1));
}

// ---------------------------------------------------------------- metering and budgets
function meter_(db, c, a, task, r) {
  if (!r || !r.usage) return;
  var s = settings_(db);
  var p = (s.prices || {})[r.model] || { in: 2, out: 10 };
  var inTok = Number(r.usage.input_tokens || 0) + Number(r.usage.cache_creation_input_tokens || 0) * 1.25 + Number(r.usage.cache_read_input_tokens || 0) * 0.1;
  var usd = (inTok * p.in + Number(r.usage.output_tokens || 0) * p.out) / 1e6;
  a.usage = a.usage || { usd: 0, inr: 0, calls: 0, byTask: {} };
  a.usage.usd += usd; a.usage.inr = a.usage.usd * Number(s.usdInr || 100); a.usage.calls++;
  a.usage.byTask[task] = (a.usage.byTask[task] || 0) + usd;
  c.usage = c.usage || { usd: 0, calls: 0 };
  c.usage.usd += usd; c.usage.calls++;
  var budget = budgetFor_(db, c, a);
  var pct = budget ? (a.usage.inr / budget) * 100 : 0;
  if (budget && pct >= Number(s.budgetAlertPct || 80) && !a.usage.alerted) {
    a.usage.alerted = now_();
    notifySafe_(db, c, a, 'SAFE AI budget at ' + Math.round(pct) + '%', '<p>SAFE AI usage on audit ' + esc_(a.ref) + ' for ' + esc_(c.name) + ' has reached <b>₹' + Math.round(a.usage.inr) + '</b> of its ₹' + budget + ' budget. Portal AI stops at 100% until you raise the budget on the client record.</p>');
  }
}
function budgetFor_(db, c, a) {
  if (c.budgetInr) return Number(c.budgetInr);
  var s = settings_(db);
  return Number((s.budgets || {})[c.tier || tierOf_(a && a.env)] || 0);
}
function tierOf_(env) {
  env = env || {};
  if (['501–2,000', 'Over 2,000'].indexOf(env.employees) >= 0 || ['10 lakh – 1 crore', '1 crore – 2 crore', 'Over 2 crore'].indexOf(env.principals) >= 0 || env.sdfNotified === 'yes') return 'large';
  if (env.employees === '1–50' && ['Under 10,000', '10,000 – 1 lakh'].indexOf(env.principals) >= 0) return 'small';
  return 'mid';
}
function rate_(key, max, seconds) {
  var cache = CacheService.getScriptCache();
  var n = Number(cache.get(key) || 0);
  if (n >= max) throw new Error('SAFE AI is busy for your account. Please try again in an hour.');
  cache.put(key, String(n + 1), seconds);
}

// ================================================================ reports and certificate
function issueReport_(db, req, me) {
  var a = readAudit_(req.auditId); var c = mustClient_(db, a.clientId);
  var s0 = settings_(db);
  if (me.role === 'member' || (s0.reportIssuers !== 'advocate' && me.role !== 'admin')) throw new Error('Signed reports can be issued only by ' + (s0.reportIssuers === 'advocate' ? 'an advocate or admin.' : 'an admin.'));
  var fwx = fwOf_(a);
  var kind = req.kind === 'final' ? 'final' : 'interim';
  var folder = sub_(sub_(clientFolder_(c), a.ref.replace(/\//g, '-')), 'Reports');
  var stamp = Utilities.formatDate(new Date(), APP.TZ, 'yyyy-MM-dd');
  var base = a.ref.replace(/\//g, '-') + ' ' + (kind === 'final' ? 'Final' : 'Interim') + ' Audit Report ' + stamp;
  var rep = { id: 'r' + randomToken_().slice(0, 10), kind: kind, at: now_(), by: me.email, opinion: clip_(req.opinion, 40), score: Number(req.score) || 0, counts: req.counts || {}, summary: req.summary || null };
  if (req.pdf) { var pf = saveUpload_(folder, { name: base + '.pdf', mime: 'application/pdf', data: req.pdf }); rep.pdfId = pf.getId(); }
  if (req.docx) { var df = saveUpload_(folder, { name: base + '.docx', mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', data: req.docx }); rep.htmlId = df.getId(); }
  a.reports = (a.reports || []).concat([rep]);
  if (kind === 'interim' && a.stage === 'audit') a.stage = 'remediation';
  log_(a, me.email, (kind === 'final' ? 'Final' : 'Interim') + ' audit report issued');
  writeAudit_(a);
  touchClientStage_(db, a);
  var s = settings_(db);
  var link = s.studioUrl ? s.studioUrl.replace(/\/?$/, '/') + 'portal.html?c=' + encodeURIComponent((c.portal || {}).id || '') : '';
  var to = contactEmails_(c);
  if (to && req.emailClient !== false) {
    sendMail_(db, { to: to, cc: s.safeCc, subject: (kind === 'final' ? 'Final' : 'Interim') + ' ' + fwx.name.replace(' Audit', '') + ' audit report — ' + c.name + ' (' + a.ref + ')',
      html: emailShell_('Your ' + kind + ' ' + fwx.name.replace(' Audit', '') + ' audit report is ready', '<p>Dear ' + esc_(c.name) + ' team,</p><p>SAFE Legal Solutions has issued the <b>' + kind + ' audit report</b> for audit ' + esc_(a.ref) + '. Overall score: <b>' + rep.score + '%</b>. Opinion: <b>' + esc_(rep.opinion) + '</b>.</p>' +
        (kind === 'interim' ? '<p>Please open the portal to see each finding, assign an owner and a target date, and upload proof as you fix them. SAFE AI checks each fix and closes it once verified.</p>' : '<p>The report is in your portal.</p>') +
        (link ? '<p><a href="' + link + '">Open the SAFE client portal</a></p>' : '')) });
  }
  return a;
}

function signOff_(db, req, me) {
  if (me.role === 'member') throw new Error('Only an advocate or admin can sign the certificate.');
  var a = readAudit_(req.auditId); var c = mustClient_(db, a.clientId);
  var s = settings_(db);
  // server-side checks (the browser shows the same list)
  var findings = a.findings || [];
  var openMajor = findings.filter(function (f) { return f.grade === 'major' && f.state !== 'closed'; }).length;
  var byDomain = {};
  findings.forEach(function (f) { if (f.grade === 'minor' && f.state !== 'closed') { var d = f.domain || String(f.controlId).replace(/-\d+$/, ''); byDomain[d] = (byDomain[d] || 0) + 1; } });
  var systemic = Object.keys(byDomain).filter(function (d) { return byDomain[d] >= 3; }).length;
  if (!findings.length) throw new Error('The audit has not been run.');
  if (openMajor + systemic > 0) throw new Error('Must-have findings are still open. The certificate cannot be issued.');
  if (findings.some(function (f) { return f.needsReview && !f.reviewedBy; })) throw new Error('Some findings still need advocate review.');
  if (!(a.reports || []).some(function (r) { return r.kind === 'interim'; })) throw new Error('Issue the interim report first.');
  if (Number(req.score) < 70) throw new Error('The overall score is below 70%.');
  if (s.requireIndependence && (a.docs || []).some(function (d) { return d.approvedBy === me.email; })) throw new Error('Independence rule: you approved documents drafted for this client. Another advocate must sign the certificate.');
  var fwx = fwOf_(a);
  db.counters.cert = (db.counters.cert || 0) + 1;
  var issued = Utilities.formatDate(new Date(), APP.TZ, 'yyyy-MM-dd');
  var until = addMonthsIso_(issued, 12, -1);
  var cert = {
    no: 'SAFE-' + fwx.code + '-' + issued.slice(0, 4) + '-' + ('0000' + db.counters.cert).slice(-5),
    clientId: c.id, auditId: a.id, auditRef: a.ref, framework: a.framework || 'dpdpa', title: clip_(req.certTitle || fwx.name.replace(' Audit', ' Certificate'), 200), clientName: a.env && a.env.legalName || c.legalName || c.name,
    scope: clip_(req.scope || 'The organisation\'s operations in India', 600), role: clip_(req.role, 120),
    opinion: clip_(req.opinion, 60), score: Number(req.score) || 0, issued: issued, validUntil: until, nextAuditDue: until,
    signedBy: me.name || me.email, signerEmail: me.email, signerEnrolment: me.enrolment || '', status: 'valid',
    readiness: (a.framework || 'dpdpa') === 'dpdpa' && issued < '2027-05-13', history: [{ at: now_(), by: me.email, action: 'issued', reason: '' }], reminders: [], pulses: [], pulseDue: [3, 6, 9].map(function (m) { return addMonthsIso_(issued, m, 0); })
  };
  db.certs.push(cert);
  c.certs = (c.certs || []).concat([cert.no]);
  a.signoff = { by: me.email, at: now_(), certNo: cert.no };
  a.stage = 'certified';
  log_(a, me.email, 'Certificate ' + cert.no + ' issued (valid until ' + until + ')');
  writeAudit_(a);
  c.stages = c.stages || {}; c.stages[a.framework || 'dpdpa'] = 'certified'; c.stage = 'certified';
  writeDb_(db);
  var to = contactEmails_(c);
  var link = s.studioUrl ? s.studioUrl.replace(/\/?$/, '/') + 'verify.html?no=' + encodeURIComponent(cert.no) : '';
  if (to) sendMail_(db, { to: to, cc: s.safeCc, subject: cert.title + ' issued — ' + c.name,
    html: emailShell_('Certificate issued', '<p>Dear ' + esc_(c.name) + ' team,</p><p>We are pleased to issue certificate <b>' + esc_(cert.no) + '</b>, valid until <b>' + fmtIso_(until) + '</b>. Your next audit is due by ' + fmtIso_(until) + '; we will remind you from 60 days before.</p><p>Every quarter SAFE AI will ask you a short pulse check. Please tell us at once about any breach, complaint, merger or other material change, as these can suspend the certificate.</p>' + (link ? '<p>Anyone can verify the certificate at <a href="' + link + '">' + link + '</a></p>' : '')) });
  return { cert: cert, audit: a };
}

function publicCert_(x) {
  return { no: x.no, framework: x.framework || 'dpdpa', title: x.title || 'DPDPA Compliance Certificate', clientName: x.clientName, scope: x.scope, role: x.role, opinion: x.opinion, score: x.score, issued: x.issued, validUntil: x.validUntil, nextAuditDue: x.nextAuditDue,
    signedBy: x.signedBy, signerEnrolment: x.signerEnrolment, status: effectiveCertStatus_(x), readiness: x.readiness, auditRef: x.auditRef, pulseDue: x.pulseDue, pulses: (x.pulses || []).map(function (p) { return { at: p.at }; }) };
}
function effectiveCertStatus_(x) {
  if (x.status === 'revoked' || x.status === 'suspended') return x.status;
  return Utilities.formatDate(new Date(), APP.TZ, 'yyyy-MM-dd') > x.validUntil ? 'expired' : 'valid';
}
function verifyCert_(no) {
  var db = readDb_();
  var x = db.certs.filter(function (c) { return c.no === no; })[0];
  if (!x) return { ok: false, error: 'No certificate with this number was issued by SAFE Legal Solutions.' };
  var p = publicCert_(x);
  return { ok: true, cert: { no: p.no, framework: p.framework, title: p.title, clientName: p.clientName, scope: p.scope, opinion: p.opinion, issued: p.issued, validUntil: p.validUntil, status: p.status, signedBy: p.signedBy, readiness: p.readiness } };
}

// ================================================================ daily job: renewals, expiry, pulses
function dailyJob() {
  var lock = LockService.getScriptLock();
  lock.waitLock(60000);
  try { runDaily_(readDb_(), false); } finally { lock.releaseLock(); }
}
function runDaily_(db, dryRun) {
  var s = settings_(db);
  var today = Utilities.formatDate(new Date(), APP.TZ, 'yyyy-MM-dd');
  var done = [];
  db.certs.forEach(function (x) {
    if (x.status === 'revoked') return;
    var c = clientById_(db, x.clientId); if (!c) return;
    var days = daysBetween_(today, x.validUntil);
    var to = contactEmails_(c);
    var portalLink = s.studioUrl ? s.studioUrl.replace(/\/?$/, '/') + 'portal.html?c=' + encodeURIComponent((c.portal || {}).id || '') : '';
    // expiry
    if (days < 0 && x.status !== 'expired') {
      done.push(x.no + ': expired');
      if (!dryRun) {
        x.status = 'expired'; x.history = (x.history || []).concat([{ at: now_(), by: 'SAFE AI', action: 'expired', reason: 'Validity ended' }]);
        if (to) sendMail_(db, { to: to, cc: s.safeTo + ',' + s.safeCc, subject: 'Your ' + (x.title || 'compliance certificate') + ' has expired — ' + c.name, html: emailShell_('Certificate expired', '<p>Certificate <b>' + esc_(x.no) + '</b> expired on ' + fmtIso_(x.validUntil) + '. Please complete the renewal audit to restore certification.</p>' + (portalLink ? '<p><a href="' + portalLink + '">Open the SAFE client portal</a></p>' : '')) });
      }
      return;
    }
    // renewal reminders: from N days before expiry, every M days
    if (days >= 0 && days <= Number(s.reminderDaysBefore)) {
      var last = (x.reminders || []).slice(-1)[0];
      if (!last || daysBetween_(String(last.at).slice(0, 10), today) >= Number(s.reminderIntervalDays)) {
        done.push(x.no + ': renewal reminder (' + days + ' days left)');
        if (!dryRun) {
          x.reminders = (x.reminders || []).concat([{ at: now_(), daysLeft: days }]);
          if (to) sendMail_(db, { to: to, cc: s.safeTo + ',' + s.safeCc, subject: (x.title || 'Compliance certificate') + ' — renewal due in ' + days + ' days — ' + c.name,
            html: emailShell_('Renewal due in ' + days + ' days', '<p>Dear ' + esc_(c.name) + ' team,</p><p>Your SAFE ' + esc_(x.title || 'compliance certificate') + ' <b>' + esc_(x.no) + '</b> is valid until <b>' + fmtIso_(x.validUntil) + '</b>. Your annual re-audit is due by that date.</p><p>The renewal audit carries forward last year\'s answers, so you only update what has changed and refresh the evidence. SAFE Legal will open it for you — reply to this email to schedule it.</p>' + (portalLink ? '<p><a href="' + portalLink + '">Open the SAFE client portal</a></p>' : '')) });
        }
      }
    }
    // quarterly pulse checks
    (x.pulseDue || []).forEach(function (pd, i) {
      x.pulseSent = x.pulseSent || [];
      if (today >= pd && x.pulseSent.indexOf(pd) < 0 && x.status === 'valid') {
        done.push(x.no + ': pulse ' + (i + 1) + ' requested');
        if (!dryRun) {
          x.pulseSent.push(pd);
          if (to) sendMail_(db, { to: to, cc: s.safeCc, subject: 'Quarterly compliance pulse check — ' + c.name, html: emailShell_('Quarterly pulse check', '<p>Please take two minutes to complete your quarterly pulse check for ' + esc_(x.title || 'your certificate') + ' in the SAFE client portal. It confirms that nothing material has changed since certification (breaches, complaints, new sites or systems, mergers).</p>' + (portalLink ? '<p><a href="' + portalLink + '">Complete the pulse check</a></p>' : '')) });
        }
      }
      var answered = (x.pulses || []).some(function (p) { return String(p.at).slice(0, 10) >= pd; });
      if (x.pulseSent && x.pulseSent.indexOf(pd) >= 0 && !answered && daysBetween_(pd, today) === Number(s.pulseGraceDays)) {
        done.push(x.no + ': pulse ' + (i + 1) + ' overdue');
        if (!dryRun) notifySafe_(db, c, null, 'Pulse check overdue', '<p>' + esc_(c.name) + ' has not answered the quarterly pulse check due ' + fmtIso_(pd) + ' (certificate ' + esc_(x.no) + '). Consider following up or suspending the certificate.</p>');
      }
    });
  });
  if (!dryRun) writeDb_(db);
  return done;
}

// ================================================================ email
function sendMail_(db, o) {
  var s = settings_(db);
  var opts = { htmlBody: o.html, name: s.senderName, cc: o.cc || '' };
  if (s.fromAddress) opts.from = s.fromAddress;
  var plain = String(o.html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  try {
    GmailApp.sendEmail(o.to, o.subject, plain, opts);
    return true;
  } catch (err) {
    try { delete opts.from; GmailApp.sendEmail(o.to, o.subject, plain, opts); return true; } catch (err2) {
      var props = PropertiesService.getScriptProperties();
      var logArr = JSON.parse(props.getProperty('MAIL_ERRORS') || '[]');
      logArr.push({ at: now_(), to: String(o.to), subject: String(o.subject), error: String(err2 && err2.message || err2) });
      props.setProperty('MAIL_ERRORS', JSON.stringify(logArr.slice(-30)));
      return false;
    }
  }
}
function emailShell_(title, inner) {
  return '<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#1f1f1f;max-width:640px">' +
    '<div style="border-bottom:3px solid #821526;padding:8px 0 10px;margin-bottom:16px"><span style="font-family:Georgia,serif;font-size:20px;font-weight:bold;color:#821526">SAFE Legal Solutions</span><br><span style="font-size:11px;letter-spacing:1.5px;color:#555">WORKPLACE COMPLIANCE AUDITS</span></div>' +
    '<h2 style="font-family:Georgia,serif;color:#821526;font-size:18px;margin:0 0 12px">' + esc_(title) + '</h2>' + inner +
    '<p style="margin-top:24px">Regards,<br><b>SAFE Legal Solutions</b><br>Bengaluru · info@safelegal.org · +91-9886181839 · <a href="https://safelegal.in">safelegal.in</a></p>' +
    '<p style="font-size:11px;color:#888;border-top:1px solid #eee;padding-top:8px">This message was sent by SAFE Legal Workplace Compliance Audits. It is confidential and intended only for the addressee.</p></div>';
}
function notifySafe_(db, c, a, subject, html) {
  var s = settings_(db);
  sendMail_(db, { to: s.safeTo, cc: s.safeCc, subject: '[SAFE Audits] ' + subject + ' — ' + (c ? c.name : ''), html: emailShell_(subject, html + (a ? '<p class="small">Audit: ' + esc_(a.ref) + '</p>' : '')) });
}
function emailPortalInvite_(db, c, pin) {
  var s = settings_(db);
  var link = s.studioUrl.replace(/\/?$/, '/') + 'portal.html?c=' + encodeURIComponent(c.portal.id);
  var to = contactEmails_(c);
  if (!to) throw new Error('Add a client contact email first.');
  sendMail_(db, { to: to, cc: s.safeCc, subject: 'Your SAFE compliance audit portal — ' + c.name,
    html: emailShell_('Welcome to SAFE Legal Workplace Compliance Audits', '<p>Dear ' + esc_(c.name) + ' team,</p><p>SAFE Legal Solutions has opened your compliance audit. In the portal you will describe your organisation, answer guided questions, upload evidence, and track findings to certification. SAFE AI guides you at every step.</p><p><a href="' + link + '">Open your portal</a></p><p>Your 6-digit PIN will be shared separately by your SAFE Legal contact.</p>') });
}
function notifyCertChange_(db, cert, op, reason) {
  var c = clientById_(db, cert.clientId); if (!c) return;
  var to = contactEmails_(c); if (!to) return;
  var s = settings_(db);
  var label = { suspend: 'suspended', reinstate: 'reinstated', revoke: 'revoked' }[op];
  sendMail_(db, { to: to, cc: s.safeTo + ',' + s.safeCc, subject: 'Your ' + (cert.title || 'compliance certificate') + ' has been ' + label + ' — ' + c.name, html: emailShell_('Certificate ' + label, '<p>Certificate <b>' + esc_(cert.no) + '</b> has been ' + label + '.</p><p>Reason: ' + esc_(reason) + '</p>') });
}
function contactEmails_(c) { return (c.contacts || []).map(function (x) { return x.email; }).filter(function (e) { return /@/.test(e); }).join(','); }

// ================================================================ utilities
function clientById_(db, id) { return db.clients.filter(function (x) { return x.id === id; })[0]; }
function mustClient_(db, id) { var c = clientById_(db, id); if (!c) throw new Error('Client not found.'); return c; }
function json_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
function now_() { return new Date().toISOString(); }
function randomToken_() { return (Utilities.getUuid() + Utilities.getUuid()).replace(/-/g, ''); }
function hashPin_(salt, pin) { return Utilities.base64Encode(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, salt + ':' + pin, Utilities.Charset.UTF_8)); }
function clip_(v, n) { return String(v == null ? '' : v).slice(0, n); }
function esc_(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function daysBetween_(a, b) { return Math.round((new Date(b + 'T00:00:00Z') - new Date(a + 'T00:00:00Z')) / 86400000); }
function addMonthsIso_(iso, m, dayAdj) { var d = new Date(iso + 'T00:00:00Z'); d.setUTCMonth(d.getUTCMonth() + m); d.setUTCDate(d.getUTCDate() + (dayAdj || 0)); return d.toISOString().slice(0, 10); }
function fmtIso_(iso) { var m = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']; var p = String(iso).split('-'); return Number(p[2]) + ' ' + m[Number(p[1]) - 1] + ' ' + p[0]; }
