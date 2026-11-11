/* SAFE Legal Workplace Compliance Audits — Corporate Legal Compliance framework
 * A law-firm review of the laws that apply to the business (other than financial, tax, cost and secretarial audits,
 * which need a CA, cost accountant or company secretary). Supports the directors' responsibility statement in
 * section 134(5)(f) of the Companies Act, 2013 that systems exist to ensure compliance with all applicable laws.
 */
(function (root) {
  const S = root.SAFE;
  const PHASES = { p1: { date: '', label: 'In force' }, bp: { date: '', label: 'Good practice' } };
  const PENALTIES = {
    co: { max: 0, label: 'Companies Act — specific penalties, or the general penalty under s.450 (₹10,000 plus ₹1,000 a day for a continuing default)' },
    fema: { max: 0, label: 'FEMA s.13 — penalty up to three times the amount involved (or up to ₹2 lakh where the amount cannot be quantified)' },
    pca: { max: 0, label: 'Prevention of Corruption Act s.9 — the company is guilty and liable to fine if a person associated with it bribes, unless it proves adequate procedures' },
    comp: { max: 0, label: 'Competition Act s.27 — penalty up to 10% of average turnover (or global turnover, as amended)' },
    pmla: { max: 0, label: 'PMLA s.13 — fine of ₹10,000 to ₹1 lakh for each failure, and other directions' },
    consumer: { max: 0, label: 'Consumer Protection Act — CCPA penalties (up to ₹10 lakh, and ₹50 lakh for repeat misleading advertisements) and product liability' },
    env: { max: 0, label: 'Water, Air and Environment (Protection) Acts — penalties and closure directions' },
    lic: { max: 0, label: 'Penalty, closure or prosecution under the licensing law concerned' },
    none: { max: 0, label: 'No direct penalty (good practice)' }
  };
  const DOMAINS = [
    { id: 'CGOV', name: 'Compliance governance' },
    { id: 'CREG', name: 'Registrations and licences' },
    { id: 'CCOR', name: 'Corporate law (legal, non-secretarial)' },
    { id: 'CFEM', name: 'Foreign investment and FEMA' },
    { id: 'CLIT', name: 'Litigation, notices and regulatory exposure' },
    { id: 'CABC', name: 'Anti-bribery, ethics and whistleblowing' },
    { id: 'CCMP', name: 'Competition, consumer and product laws' },
    { id: 'CLST', name: 'Listed company legal obligations' },
    { id: 'CAML', name: 'Anti-money laundering' },
    { id: 'CENV', name: 'Environment and premises permits' },
    { id: 'CIPR', name: 'Intellectual property and data' },
    { id: 'CRSK', name: 'Insurance and risk' }
  ];
  const C = [];
  const add = (d, list) => list.forEach((c) => C.push(Object.assign({ d, when: '', ph: 'p1', pen: 'none', stat: true, crit: false, iso: '' }, c)));

  add('CGOV', [
    { id: 'CL-GOV-01', t: 'Register of applicable laws', pri: 'M', crit: true, pen: 'co',
      req: 'A current register lists every central, state and sector law that applies to the business, the obligations under each, and the owner responsible.', ref: 'Companies Act s.134(5)(f) (directors\' responsibility for compliance systems)', ev: 'Applicable-law register with owners and review date.', q: 'Do you keep a register of all laws that apply to the business, with the obligations and a named owner for each?' },
    { id: 'CL-GOV-02', t: 'Compliance calendar and evidence of completion', pri: 'M', pen: 'co',
      req: 'Recurring filings, renewals and payments are tracked in a calendar, with evidence of completion retained.', ref: 'Companies Act s.134(5)(f)', ev: 'Calendar or compliance tool export with evidence.', q: 'Is there a compliance calendar showing each filing and renewal, with proof that it was done?' },
    { id: 'CL-GOV-03', t: 'Periodic compliance report to the Board', pri: 'M', pen: 'co', when: 'company',
      req: 'The Board receives a compliance report (at least half-yearly; quarterly for listed companies) and the directors\' responsibility statement on compliance systems is supported by it.', ref: 'Companies Act s.134(5)(f); SEBI LODR Reg. 17(3)', ev: 'Board minutes and compliance reports.', q: 'Does the Board receive a regular compliance report that supports the directors\' statement on compliance systems?' },
    { id: 'CL-GOV-04', t: 'Compliance ownership and escalation', pri: 'S', stat: false, ph: 'bp',
      req: 'A compliance officer or legal function owns the programme, with an escalation route for breaches and a record of remediation.', ref: 'Good practice', ev: 'Role description; breach log.', q: 'Is there a named compliance owner with a process to escalate and fix breaches?' },
    { id: 'CL-GOV-05', t: 'Document retention policy', pri: 'S', stat: false, ph: 'bp',
      req: 'A retention schedule sets how long statutory records, contracts, HR and tax records are kept (for example eight years for books of account under the Companies Act) and how they are destroyed.', ref: 'Companies Act s.128(5); good practice', ev: 'Retention policy.', q: 'Do you have a document retention policy covering statutory, HR, tax and contract records?' }
  ]);

  add('CREG', [
    { id: 'CL-REG-01', t: 'Core registrations held for every location', pri: 'M', crit: true, pen: 'lic',
      req: 'PAN, TAN, GST registration for each state of operation, Shops and Establishments or factory registration, professional tax and trade licence are held and current for every place of business.', ref: 'Income-tax Act, 2025; CGST Act s.22, s.25; state laws', ev: 'Registration certificates by location.', q: 'Do you hold all core registrations (PAN, TAN, GST per state, Shops and Establishments, trade licence, professional tax) for every location?' },
    { id: 'CL-REG-02', t: 'Sector and activity licences', pri: 'M', crit: true, pen: 'lic',
      req: 'Licences required for the business activity (for example FSSAI, drug licence, Import Export Code, RBI/SEBI/IRDAI registration, telecom, BIS, Legal Metrology, pollution consents) are held, valid and their conditions met.', ref: 'Sector laws', ev: 'Licence register with validity and conditions.', q: 'Do you hold every licence your activity needs, with validity and conditions tracked?' },
    { id: 'CL-REG-03', t: 'Licence renewals tracked', pri: 'M', pen: 'lic',
      req: 'Expiry dates of registrations and licences are tracked and renewals filed in time.', ref: 'Sector laws', ev: 'Renewal tracker.', q: 'Are licence expiry dates tracked so that renewals are filed in time?' },
    { id: 'CL-REG-04', t: 'Name, CIN and registered office displayed', pri: 'M', pen: 'co', when: 'company',
      req: 'The company\'s name, registered office address, CIN, phone, email and website are shown on letterheads, invoices, notices and the website, and the name is displayed at every office.', ref: 'Companies Act s.12(3)', ev: 'Letterhead, invoice and website screenshots; office signage.', q: 'Do letterheads, invoices and your website show the company name, CIN and registered office as the Act requires?' }
  ]);

  add('CCOR', [
    { id: 'CL-COR-01', t: 'Significant beneficial owners identified and declared', pri: 'M', pen: 'co', when: 'company',
      req: 'Significant beneficial owners are identified, declarations received and the company has filed the required return.', ref: 'Companies Act s.90; Companies (Significant Beneficial Owners) Rules, 2018', ev: 'BEN-1 declarations; BEN-2 filing.', q: 'Have you identified your significant beneficial owners and filed the required declaration?' },
    { id: 'CL-COR-02', t: 'Related party transactions approved', pri: 'M', crit: true, pen: 'co', when: 'company',
      req: 'Contracts with related parties are identified and approved by the Board or shareholders as required (or are on an arm\'s length basis in the ordinary course of business), and disclosed.', ref: 'Companies Act s.188; SEBI LODR Reg. 23 (listed)', ev: 'Related party register; approvals.', q: 'Are contracts with related parties identified and approved as the law requires?' },
    { id: 'CL-COR-03', t: 'Mandatory policies and committees in place', pri: 'M', pen: 'co', when: 'publicCo',
      req: 'Policies and committees required for the class of company (vigil mechanism, nomination and remuneration, risk management, CSR where applicable) exist and operate.', ref: 'Companies Act s.135, s.177, s.178, s.134(3)(n)', ev: 'Policies and committee minutes.', q: 'Do you have the policies and Board committees the Act requires for your class of company (vigil mechanism, NRC, CSR, risk)?' },
    { id: 'CL-COR-04', t: 'MSME suppliers paid within 45 days', pri: 'M', pen: 'co',
      req: 'Micro and small enterprise suppliers are paid within the agreed period, not exceeding 45 days; delayed payments carry compound interest at three times the bank rate; half-yearly returns of outstanding dues are filed.', ref: 'MSMED Act s.15, s.16, s.22; MSME Form I', ev: 'Supplier ageing for MSME vendors; MSME Form I filings.', q: 'Do you pay micro and small enterprise suppliers within 45 days and file the half-yearly MSME return?' },
    { id: 'CL-COR-05', t: 'CSR obligation met', pri: 'M', pen: 'co', when: 'csr',
      req: 'Where CSR applies (net worth ₹500 crore, turnover ₹1,000 crore or net profit ₹5 crore), the CSR committee and policy exist, 2% of average net profit is spent or unspent amounts transferred, and impact assessment is done where required.', ref: 'Companies Act s.135; CSR Rules', ev: 'CSR policy, spend statement, transfers.', q: 'If CSR applies to you, is the required amount spent or transferred, with the policy and committee in place?' }
  ]);

  add('CFEM', [
    { id: 'CL-FEM-01', t: 'Foreign investment reported in time', pri: 'M', crit: true, pen: 'fema', when: 'fdi',
      req: 'Foreign direct investment is received through permitted routes and reported (FC-GPR for issue of shares within 30 days, FC-TRS for transfers) on the RBI FIRMS portal.', ref: 'FEMA (Non-Debt Instruments) Rules, 2019; FEMA (Mode of Payment and Reporting of Non-Debt Instruments) Regulations, 2019', ev: 'FIRMS filings and acknowledgements.', q: 'Have all foreign investments been received through permitted routes and reported to RBI in time?' },
    { id: 'CL-FEM-02', t: 'Annual Return on Foreign Liabilities and Assets', pri: 'M', pen: 'fema', when: 'fdi',
      req: 'Entities with foreign investment received or made file the Annual Return on Foreign Liabilities and Assets by 15 July each year.', ref: 'FEMA; RBI Master Direction on reporting', ev: 'FLA filing acknowledgement.', q: 'Do you file the FLA return with RBI by 15 July every year?' },
    { id: 'CL-FEM-03', t: 'Sectoral caps, pricing guidelines and Press Note 3', pri: 'M', pen: 'fema', when: 'fdi',
      req: 'Investment complies with sectoral caps and conditions, pricing guidelines, and the requirement of Government approval for investment from countries sharing a land border with India.', ref: 'FEMA (Non-Debt Instruments) Rules, 2019; Press Note 3 (2020)', ev: 'Valuation reports; approvals.', q: 'Has each foreign investment complied with sectoral caps, pricing rules and (for land-border countries) Government approval?' },
    { id: 'CL-FEM-04', t: 'Overseas investment and borrowings reported', pri: 'M', pen: 'fema', when: 'odi',
      req: 'Overseas direct investment, external commercial borrowings and guarantees are made within limits and reported as required.', ref: 'FEMA (Overseas Investment) Rules and Regulations, 2022; ECB Master Direction', ev: 'ODI and ECB filings.', q: 'Are overseas investments and foreign borrowings within limits and reported to RBI?' }
  ]);

  add('CLIT', [
    { id: 'CL-LIT-01', t: 'Litigation and notice register', pri: 'M', pen: 'none', stat: false,
      req: 'All pending cases, legal notices, regulatory show-cause notices and inspections are recorded with exposure, next date, counsel and status.', ref: 'Good practice; Ind AS 37 / AS 29 (contingent liabilities)', ev: 'Litigation register.', q: 'Do you keep a register of all cases, legal notices and regulatory notices, with exposure and status?' },
    { id: 'CL-LIT-02', t: 'Responses filed within statutory timelines', pri: 'M', pen: 'lic',
      req: 'Replies to notices, appeals and filings are made within limitation and statutory timelines.', ref: 'Limitation Act, 1963; statute concerned', ev: 'Response log with dates.', q: 'Are replies and appeals filed within the time limits?' },
    { id: 'CL-LIT-03', t: 'Contingent liabilities assessed and disclosed', pri: 'S', pen: 'co',
      req: 'Material claims are assessed with counsel and disclosed or provided for in the financial statements.', ref: 'Companies Act Schedule III; accounting standards', ev: 'Assessment memo; auditor confirmation.', q: 'Are material claims assessed with counsel and disclosed in the accounts?' }
  ]);

  add('CABC', [
    { id: 'CL-ABC-01', t: 'Anti-bribery policy and adequate procedures', pri: 'M', crit: true, pen: 'pca',
      req: 'The company has adequate procedures to prevent persons associated with it from giving undue advantage to public servants: a board-approved anti-bribery policy, gifts and hospitality rules, third-party due diligence and training.', ref: 'Prevention of Corruption Act, 1988 s.9 (as amended in 2018)', ev: 'Policy, gifts register, due diligence files, training records.', q: 'Do you have an anti-bribery policy with gifts rules, checks on agents and intermediaries, and training?' },
    { id: 'CL-ABC-02', t: 'Code of conduct and conflicts of interest', pri: 'S', stat: false, ph: 'bp',
      req: 'A code of conduct is acknowledged by employees and directors, with annual conflict-of-interest declarations.', ref: 'Good practice; SEBI LODR Reg. 17(5) (listed)', ev: 'Code; acknowledgements; declarations.', q: 'Do employees and directors acknowledge a code of conduct and declare conflicts of interest every year?' },
    { id: 'CL-ABC-03', t: 'Whistleblower channel', pri: 'M', pen: 'co',
      req: 'A vigil mechanism or whistleblower channel lets directors and employees report concerns safely, with protection from victimisation (mandatory for listed companies and certain public companies).', ref: 'Companies Act s.177(9)–(10); SEBI LODR Reg. 22', ev: 'Policy, channel details, case log.', q: 'Is there a safe whistleblower channel, with protection from retaliation and a case log?' },
    { id: 'CL-ABC-04', t: 'Foreign anti-bribery laws for group companies', pri: 'S', stat: false, ph: 'bp', when: 'foreignGroup',
      req: 'Where the group is subject to the US Foreign Corrupt Practices Act or the UK Bribery Act, the Indian entity\'s controls meet the group standard.', ref: 'FCPA; UK Bribery Act 2010', ev: 'Group policy adoption; training.', q: 'If your group is subject to US or UK anti-bribery laws, are the Indian entity\'s controls aligned?' }
  ]);

  add('CCMP', [
    { id: 'CL-CMP-01', t: 'Competition law compliance', pri: 'M', pen: 'comp',
      req: 'Agreements with competitors, distributors and suppliers avoid price-fixing, market sharing, bid-rigging and restrictive vertical terms with appreciable adverse effect; where dominant, conduct avoids abuse.', ref: 'Competition Act, 2002 s.3, s.4', ev: 'Competition compliance manual; contract review; training.', q: 'Have agreements and sales practices been reviewed for competition law risk, with staff trained?' },
    { id: 'CL-CMP-02', t: 'Combinations notified where thresholds met', pri: 'M', pen: 'comp', when: 'mna',
      req: 'Acquisitions, mergers and amalgamations meeting the asset, turnover or deal-value thresholds are notified to the Competition Commission before completion.', ref: 'Competition Act s.5, s.6', ev: 'Threshold analysis; CCI approvals.', q: 'Were acquisitions or mergers checked against the merger-control thresholds and notified where needed?' },
    { id: 'CL-CMP-03', t: 'Consumer protection: grievance officer, fair terms and advertising', pri: 'M', pen: 'consumer', when: 'consumer',
      req: 'Consumer-facing businesses avoid unfair trade practices and unfair contract terms, honour refunds and warranties, avoid misleading advertisements and dark patterns, and (for e-commerce) appoint a grievance officer and make the disclosures required.', ref: 'Consumer Protection Act, 2019; Consumer Protection (E-Commerce) Rules, 2020; Guidelines for Prevention and Regulation of Dark Patterns, 2023', ev: 'Terms of sale, website disclosures, grievance officer details, advertising review.', q: 'Do your consumer terms, advertising and website meet consumer protection rules (grievance officer, disclosures, no dark patterns)?' },
    { id: 'CL-CMP-04', t: 'Legal Metrology declarations on packaged goods', pri: 'M', pen: 'consumer', when: 'packaged',
      req: 'Pre-packaged commodities carry the mandatory declarations (name, net quantity, MRP, date, customer care) and the company is registered as manufacturer, packer or importer as required.', ref: 'Legal Metrology Act, 2009; Legal Metrology (Packaged Commodities) Rules, 2011', ev: 'Label samples; registration.', q: 'Do your packaged products carry all mandatory label declarations, and are you registered as packer or importer?' }
  ]);

  add('CLST', [
    { id: 'CL-LST-01', t: 'Insider trading code and structured digital database', pri: 'M', crit: true, pen: 'co', when: 'listed',
      req: 'A code of conduct and fair disclosure code are in place, designated persons are identified, the trading window is administered, and a structured digital database of unpublished price-sensitive information sharing is maintained.', ref: 'SEBI (Prohibition of Insider Trading) Regulations, 2015 Reg. 3(5), 8, 9', ev: 'Codes; designated person list; SDD extract; trading window notices.', q: 'Do you maintain the insider trading codes, designated person list and structured digital database?' },
    { id: 'CL-LST-02', t: 'Disclosure of material events', pri: 'M', pen: 'co', when: 'listed',
      req: 'A board-approved materiality policy exists and material events (including litigation and regulatory actions) are disclosed to the exchanges within the timelines.', ref: 'SEBI LODR Reg. 30', ev: 'Policy; disclosure log.', q: 'Are material events, including litigation and regulatory actions, disclosed to the stock exchanges in time?' }
  ]);

  add('CAML', [
    { id: 'CL-AML-01', t: 'PMLA obligations of a reporting entity', pri: 'M', crit: true, pen: 'pmla', when: 'reportingEntity',
      req: 'As a reporting entity, the company has registered with FIU-IND, appointed a Principal Officer and Designated Director, performs customer due diligence, files cash, suspicious and other transaction reports and keeps records for five years.', ref: 'Prevention of Money-laundering Act, 2002 s.11A, s.12; PML (Maintenance of Records) Rules, 2005', ev: 'FIU-IND registration; KYC policy; STR/CTR filings.', q: 'As a reporting entity under PMLA, are you registered with FIU-IND and doing KYC and transaction reporting?' }
  ]);

  add('CENV', [
    { id: 'CL-ENV-01', t: 'Consent to establish and operate', pri: 'M', crit: true, pen: 'env', when: 'factory',
      req: 'Units hold valid consent to establish and consent to operate from the State Pollution Control Board, and comply with the conditions (emissions, effluent, monitoring).', ref: 'Water (Prevention and Control of Pollution) Act, 1974 s.25; Air (Prevention and Control of Pollution) Act, 1981 s.21', ev: 'CTE/CTO with validity; monitoring reports.', q: 'Does each unit hold valid pollution control consents and meet their conditions?' },
    { id: 'CL-ENV-02', t: 'Waste authorisations and EPR registration', pri: 'M', pen: 'env', when: 'factory',
      req: 'Hazardous waste authorisation, e-waste and plastic Extended Producer Responsibility registrations and annual returns are in place where applicable.', ref: 'Hazardous and Other Wastes Rules, 2016; Plastic Waste Management Rules, 2016; E-Waste (Management) Rules, 2022', ev: 'Authorisations; EPR certificates and returns.', q: 'Where applicable, do you hold hazardous waste authorisation and EPR registrations, with returns filed?' },
    { id: 'CL-ENV-03', t: 'Fire NOC and occupancy certificate for premises', pri: 'M', pen: 'lic',
      req: 'Premises have an occupancy certificate and, where the building\'s height or use requires, a fire no-objection certificate.', ref: 'State fire services law; municipal building bye-laws', ev: 'Occupancy certificate; fire NOC; lease clauses.', q: 'Do your premises have an occupancy certificate and fire NOC where required?' }
  ]);

  add('CIPR', [
    { id: 'CL-IPR-01', t: 'Brands and key IP registered', pri: 'S', pen: 'none', stat: false,
      req: 'Trade names, logos and key product names are registered or applied for as trade marks in relevant classes; domain names are held in the company\'s name.', ref: 'Trade Marks Act, 1999', ev: 'Trade mark register extract; domain records.', q: 'Are your brand names and logos registered as trade marks in the company\'s name?' },
    { id: 'CL-IPR-02', t: 'IP created by employees and contractors assigned to the company', pri: 'M', pen: 'none',
      req: 'Employment and consultancy agreements assign IP to the company; contractor-created copyright is assigned in writing.', ref: 'Copyright Act, 1957 s.17, s.18, s.19', ev: 'Agreement clauses; assignment deeds.', q: 'Do employment and contractor agreements assign IP (software, designs, content) to the company in writing?' },
    { id: 'CL-IPR-03', t: 'Software licences and open source compliance', pri: 'S', stat: false, ph: 'bp',
      req: 'Commercial software is licensed for the users and installations in use; open-source licences in products are tracked and their obligations met.', ref: 'Copyright Act, 1957; licence terms', ev: 'Licence inventory; open-source register.', q: 'Are software licences and open-source components tracked and compliant?' },
    { id: 'CL-IPR-04', t: 'Data protection programme in place', pri: 'M', pen: 'none',
      req: 'The company has assessed its obligations under the Digital Personal Data Protection Act, 2023 and has a privacy notice, data protection policy and breach procedure (a full DPDPA audit is available as a separate SAFE audit).', ref: 'DPDP Act, 2023; DPDP Rules, 2025', ev: 'DPDPA assessment; privacy notice.', q: 'Have you assessed your DPDPA obligations and put a privacy notice and data protection policy in place?' }
  ]);

  add('CRSK', [
    { id: 'CL-RSK-01', t: 'Insurance cover matched to legal risks', pri: 'W', stat: false, ph: 'bp', pen: 'none',
      req: 'Directors and officers, commercial general liability, professional indemnity, cyber, property and employee covers are in place, at limits reviewed annually.', ref: 'Good practice', ev: 'Insurance schedule.', q: 'Do you hold D&O, liability, cyber and property insurance at limits reviewed every year?' },
    { id: 'CL-RSK-02', t: 'Legal risk register reviewed by management', pri: 'W', stat: false, ph: 'bp', pen: 'none',
      req: 'A legal risk register (regulatory change, litigation, contracts, IP, data) is reviewed by management at least half-yearly.', ref: 'Good practice; Companies Act s.134(3)(n)', ev: 'Risk register and minutes.', q: 'Is there a legal risk register reviewed by management at least twice a year?' }
  ]);

  const DOC_TYPES = [
    { id: 'law-register', title: 'Register of Applicable Laws and Compliance Calendar', audience: 'Management and compliance owners', controls: ['CL-GOV-01', 'CL-GOV-02'] },
    { id: 'board-compliance', title: 'Board Compliance Report and Certificate Format', audience: 'Board of Directors', controls: ['CL-GOV-03'], when: 'company' },
    { id: 'abc-policy', title: 'Anti-Bribery and Anti-Corruption Policy', audience: 'Employees, directors and third parties', controls: ['CL-ABC-01'] },
    { id: 'code-conduct', title: 'Code of Conduct and Conflict of Interest Policy', audience: 'Employees and directors', controls: ['CL-ABC-02'] },
    { id: 'whistleblower', title: 'Vigil Mechanism and Whistleblower Policy', audience: 'Employees and directors', controls: ['CL-ABC-03'] },
    { id: 'rpt-policy', title: 'Related Party Transactions Policy', audience: 'Board and finance', controls: ['CL-COR-02'], when: 'company' },
    { id: 'competition-manual', title: 'Competition Law Compliance Manual', audience: 'Sales, procurement and management', controls: ['CL-CMP-01'] },
    { id: 'retention-policy', title: 'Document Retention and Destruction Policy', audience: 'All functions', controls: ['CL-GOV-05'] },
    { id: 'insider-code', title: 'Insider Trading Code of Conduct and Fair Disclosure Code', audience: 'Designated persons', controls: ['CL-LST-01'], when: 'listed' },
    { id: 'aml-policy', title: 'KYC and Anti-Money Laundering Policy', audience: 'Operations and compliance', controls: ['CL-AML-01'], when: 'reportingEntity' },
    { id: 'msme-policy', title: 'MSME Supplier Payment Policy', audience: 'Finance and procurement', controls: ['CL-COR-04'] }
  ];

  const F = (k, l, t, extra) => Object.assign({ k, l, t }, extra || {});
  const fw = {
    id: 'corporate', code: 'CORP', name: 'Corporate Legal Compliance Audit', short: 'Corporate Legal', icon: 'building',
    tagline: 'The laws that apply to the business, behind the Board\'s compliance statement',
    criteria: 'Companies Act, 2013 (legal provisions other than those covered by the secretarial audit); FEMA, 1999 and rules; Prevention of Corruption Act, 1988; Competition Act, 2002; Consumer Protection Act, 2019; Legal Metrology Act, 2009; PMLA, 2002; MSMED Act, 2006; environmental and licensing laws; IP laws, as applicable',
    criteriaShort: 'the central, state and sector laws that apply to the organisation\'s business, as recorded in section 5 of this report, including the Companies Act, 2013 (other than the matters covered by the secretarial audit), FEMA, the Prevention of Corruption Act, 1988, the Competition Act, 2002, consumer, environmental, licensing and intellectual property laws',
    contextNote: 'This audit does not replace the statutory financial audit, tax audit, cost audit or secretarial audit, which must be carried out by a chartered accountant, cost accountant or company secretary.',
    stdLabel: 'Related law',
    certTitle: () => 'Certificate of Corporate Legal Compliance',
    certLaw: 'Applicable central, state and sector laws, as set out in the audit report',
    certDisclaimer: 'This certificate is not a statutory, tax, cost or secretarial audit report and does not replace them.',
    reportTitle: () => 'CORPORATE LEGAL COMPLIANCE AUDIT REPORT',
    phases: PHASES, penalties: PENALTIES, domains: DOMAINS, controls: C, docTypes: DOC_TYPES,
    common: ['org'],
    envSections: [{ id: 'corpEnv', title: 'Business and regulatory profile', fields: [
      F('licences', 'Licences and registrations you hold (list)', 'textarea', { help: 'For example: GST (Karnataka, Maharashtra), FSSAI, IEC, Shops and Establishments, factory licence, RBI registration.' }),
      F('establishments', 'Types of workplace you run', 'multi', { o: S.opt(['Office', 'Factory / manufacturing unit', 'Warehouse / logistics hub', 'Shop / showroom / outlet', 'Construction or project site', 'Hospital / clinic / lab', 'Remote / work-from-home staff']) }),
      F('foreignInvestment', 'Has the company received foreign investment (FDI)?', 'bool', { req: true }),
      F('overseas', 'Has the company invested abroad, borrowed from abroad or given foreign guarantees?', 'bool'),
      F('foreignGroup', 'Is the company part of a foreign group (subject to US or UK anti-bribery laws)?', 'bool'),
      F('consumer', 'Do you sell to consumers (B2C), including online?', 'bool', { req: true }),
      F('packaged', 'Do you manufacture, pack or import pre-packaged goods?', 'bool'),
      F('reportingEntity', 'Are you a reporting entity under PMLA (bank, NBFC, payment system, intermediary, VDA service provider, real estate agent, dealer in precious metals or stones)?', 'bool'),
      F('mna', 'Any acquisitions, mergers or joint ventures in the last three years or planned?', 'bool'),
      F('csr', 'Does CSR apply (net worth ₹500 crore+, turnover ₹1,000 crore+ or net profit ₹5 crore+)?', 'bool'),
      F('litigation', 'Pending cases, legal notices or regulatory notices (brief list)', 'textarea'),
      null
    ] }],
    flags: (env) => {
      const f = S.commonFlags(env);
      return Object.assign(f, { fdi: env.foreignInvestment === true, odi: env.overseas === true, foreignGroup: env.foreignGroup === true, consumer: env.consumer === true, packaged: env.packaged === true, reportingEntity: env.reportingEntity === true, mna: env.mna === true, csr: env.csr === true });
    },
    roleLabel: (f) => (f.listed ? 'Listed company' : f.publicCo ? 'Public company' : f.company ? 'Private company' : 'Business entity') + (f.fdi ? ' with foreign investment' : ''),
    roleCaption: 'Entity status',
    applicabilityRows: (f, env) => [
      ['Entity type', env.entityType || '—'], ['Foreign investment (FEMA)', f.fdi ? 'Applies' : 'Not applicable'], ['Listed company obligations', f.listed ? 'Apply' : 'Do not apply'],
      ['PMLA reporting entity', f.reportingEntity ? 'Yes' : 'No'], ['Consumer-facing', f.consumer ? 'Yes' : 'No'], ['Manufacturing permits', f.factory ? 'Apply' : 'Not applicable'], ['CSR', f.csr ? 'Applies' : 'Not applicable on the facts given']
    ],
    landscapeTitle: 'Business and regulatory profile',
    landscapeRows: (env) => [['Turnover', env.turnover || ''], ['Licences held', env.licences || ''], ['Workplaces', (env.establishments || []).join(', ')], ['Foreign investment', env.foreignInvestment ? 'Yes' : 'No'], ['Overseas investment / borrowing', env.overseas ? 'Yes' : 'No'], ['Group', env.groupEntities || ''], ['Pending litigation and notices', env.litigation || 'None reported']],
    glossary: [['Applicable laws', 'The laws recorded in the applicable-law register as applying to the organisation\'s business and locations.'], ['Adequate procedures', 'The procedures a company must prove under section 9 of the Prevention of Corruption Act to defend itself when a person associated with it gives a bribe.'], ['Reporting entity', 'An entity with obligations under section 12 of the PMLA.']],
    scopeDefault: (env, name) => 'Compliance by ' + name + ' with the central, state and sector laws applicable to its business in India (excluding matters reserved for the statutory, tax, cost and secretarial audits)'
  };
  fw.envSections[0].fields[11] = S.existingDocsField(fw);
  S.registerFramework(fw);
})(typeof window !== 'undefined' ? window : globalThis);
