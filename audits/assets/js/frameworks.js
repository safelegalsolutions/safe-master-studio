/* SAFE Legal Workplace Compliance Audits — audit framework registry.
 * Each audit type (DPDPA, Labour Codes, POSH & DEI, Corporate legal, Contract) registers a framework:
 * its domains, controls, documents, questionnaire, applicability rules, penalties and report wording.
 * The organisation profile below is shared, so a client answers it once for all audits.
 */
(function (root) {
  const S = (root.SAFE = root.SAFE || {});
  const opt = (arr) => arr.map((v) => (Array.isArray(v) ? { v: v[0], l: v[1] } : { v, l: v }));
  S.opt = opt;

  S.STUDIO_NAME = 'SAFE Legal Workplace Compliance Audits';
  S.FRAMEWORKS = {};
  S.FW_ORDER = [];
  S.ALL_CONTROLS = {};

  S.registerFramework = (fw) => {
    fw.controls.forEach((c) => {
      c.fw = fw.id;
      if (S.ALL_CONTROLS[c.id]) console.warn('Duplicate control id', c.id);
      S.ALL_CONTROLS[c.id] = c;
    });
    fw.common = fw.common || ['org'];
    S.FRAMEWORKS[fw.id] = fw;
    S.FW_ORDER.push(fw.id);
  };
  S.fw = (x) => S.FRAMEWORKS[(x && typeof x === 'object' ? x.framework : x) || 'dpdpa'] || S.FRAMEWORKS.dpdpa;
  S.controlById = (id) => S.ALL_CONTROLS[id];
  S.domainById = (id, fwId) => {
    if (fwId) return S.fw(fwId).domains.find((d) => d.id === id);
    for (const k of S.FW_ORDER) { const d = S.FRAMEWORKS[k].domains.find((x) => x.id === id); if (d) return d; }
    return null;
  };

  // ---------------------------------------------------------------- shared organisation profile
  S.INDUSTRIES = ['Banking / NBFC / payments (RBI-regulated)', 'Securities / broking / asset management (SEBI-regulated)', 'Insurance / insurance broking (IRDAI-regulated)', 'Healthcare / hospitals / diagnostics', 'Pharma / life sciences', 'Education / EdTech', 'E-commerce / marketplace', 'Online gaming', 'Social media / content platform', 'IT / software / SaaS', 'IT-enabled services / BPO / call centre', 'Telecom / internet services', 'Manufacturing', 'Retail / consumer goods', 'Real estate / construction', 'Travel / hospitality', 'Logistics / mobility', 'Media / advertising / marketing', 'HR / staffing / recruitment', 'Professional services (legal, accounting, consulting)', 'Wellness / fitness / beauty', 'Energy / utilities', 'Agriculture / agri-tech', 'Space / defence / R&D', 'Non-profit / trust / society', 'Government contractor / PSU', 'Other'];
  S.HEADCOUNTS = ['1–9', '10–19', '20–49', '50–99', '100–299', '300–999', '1,000–4,999', '5,000 or more'];
  const HC_MIN = { '1–9': 1, '10–19': 10, '20–49': 20, '50–99': 50, '100–299': 100, '300–999': 300, '1,000–4,999': 1000, '5,000 or more': 5000,
    // older ranges, kept so earlier answers still work
    '1–50': 1, '51–200': 51, '201–500': 201, '501–2,000': 501, 'Over 2,000': 2001 };
  S.headcount = (env) => HC_MIN[(env || {}).employees] || 0;
  S.TURNOVERS = ['Under ₹1 crore', '₹1–10 crore', '₹10–50 crore', '₹50–250 crore', '₹250–1,000 crore', 'Over ₹1,000 crore'];
  S.ENTITY_TYPES = ['Private limited company', 'Public unlisted company', 'Listed company', 'LLP', 'Partnership firm', 'Proprietorship', 'Section 8 company / trust / society', 'Branch or subsidiary of a foreign company'];

  S.COMMON_SECTIONS = {
    org: { id: 'org', title: 'About the organisation', fields: [
      { k: 'legalName', l: 'Legal name of the entity', t: 'text', req: true },
      { k: 'entityType', l: 'Type of entity', t: 'select', o: opt(S.ENTITY_TYPES), req: true },
      { k: 'cin', l: 'CIN / LLPIN / registration number', t: 'text' },
      { k: 'address', l: 'Registered office address', t: 'textarea' },
      { k: 'website', l: 'Website / app names', t: 'text' },
      { k: 'industry', l: 'Industry', t: 'select', o: opt(S.INDUSTRIES), req: true },
      { k: 'businessDesc', l: 'Describe what the business does and who its customers are', t: 'textarea', req: true, help: 'Two or three sentences. This is used to tailor every question and draft.' },
      { k: 'employees', l: 'Number of people working for you (employees, workers and contractors\' staff on your premises)', t: 'select', o: opt(S.HEADCOUNTS), req: true },
      { k: 'turnover', l: 'Annual turnover', t: 'select', o: opt(S.TURNOVERS) },
      { k: 'locations', l: 'States and cities where you have offices, units or staff', t: 'text', req: true },
      { k: 'groupEntities', l: 'Group companies (parent, subsidiaries) relevant to this audit', t: 'text' },
      { k: 'contactPerson', l: 'Contact person for this audit (name, designation, email)', t: 'text', req: true }
    ] },
    workforce: { id: 'workforce', title: 'Your workforce', fields: [
      { k: 'establishments', l: 'Types of workplace you run', t: 'multi', o: opt(['Office', 'Factory / manufacturing unit', 'Warehouse / logistics hub', 'Shop / showroom / outlet', 'Construction or project site', 'Hospital / clinic / lab', 'Remote / work-from-home staff']), req: true },
      { k: 'women', l: 'Number of women working for you', t: 'select', o: opt(['None', '1–9', '10–49', '50 or more']), req: true },
      { k: 'contractLabour', l: 'Do you engage workers through contractors (housekeeping, security, staffing, production)?', t: 'bool', req: true },
      { k: 'contractLabourCount', l: 'If yes, how many contract workers at the largest site?', t: 'select', o: opt(['Under 20', '20–49', '50 or more']) },
      { k: 'fixedTerm', l: 'Do you hire employees on fixed-term contracts?', t: 'bool' },
      { k: 'gig', l: 'Do you engage gig or platform workers through an app or aggregator model?', t: 'bool' },
      { k: 'nightShiftWomen', l: 'Do women work night shifts (before 6 a.m. or after 7 p.m.)?', t: 'bool' },
      { k: 'migrant', l: 'Do you employ workers from other states?', t: 'bool' },
      { k: 'unions', l: 'Is there a trade union among your workers?', t: 'bool' },
      { k: 'payroll', l: 'How is payroll run (in-house system or provider, e.g. Keka, Zoho Payroll, a CA firm)?', t: 'text' }
    ] }
  };
  S.COMMON_KEYS = Object.values(S.COMMON_SECTIONS).flatMap((s) => s.fields.map((f) => f.k));

  /** Questionnaire sections for one audit: the shared sections it uses, then its own. */
  S.envSections = (audit) => {
    const fw = S.fw(audit);
    return fw.common.map((k) => S.COMMON_SECTIONS[k]).concat(fw.envSections || []);
  };
  S.envFields = (audit) => S.envSections(audit).flatMap((s) => s.fields);
  S.existingDocsField = (fw) => ({ k: 'existingDocs', l: 'Which of these documents do you already have?', t: 'multi', o: fw.docTypes.map((d) => ({ v: d.id, l: d.title })), help: 'SAFE drafts the ones you do not have.' });

  /** Flags shared by every framework. */
  S.commonFlags = (env) => {
    env = env || {};
    const hc = S.headcount(env);
    const has = (k, v) => Array.isArray(env[k]) && env[k].includes(v);
    const et = env.entityType || '';
    return {
      hc,
      company: /company|subsidiary/i.test(et),
      listed: et === 'Listed company',
      publicCo: et === 'Listed company' || et === 'Public unlisted company',
      factory: has('establishments', 'Factory / manufacturing unit'),
      shop: has('establishments', 'Shop / showroom / outlet'),
      site: has('establishments', 'Construction or project site'),
      women: env.women && env.women !== 'None',
      women50: env.women === '50 or more',
      contractLabour: env.contractLabour === true,
      contract50: env.contractLabourCount === '50 or more',
      fixedTerm: env.fixedTerm === true,
      gig: env.gig === true,
      nightWomen: env.nightShiftWomen === true,
      migrant: env.migrant === true,
      unions: env.unions === true,
      karnataka: /karnataka|bengaluru|bangalore|mysuru|mysore|mangal|hubli|belgaum|belagavi/i.test(env.locations || ''),
      multiState: String(env.locations || '').split(/[,;/]| and /).filter((x) => x.trim()).length > 1
    };
  };

  S.PRI_LABEL = { M: 'Must have', S: 'Should have', W: 'Might have' };
})(typeof window !== 'undefined' ? window : globalThis);
