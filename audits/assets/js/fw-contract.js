/* SAFE Legal Workplace Compliance Audits — Contract Compliance framework
 * Indian Contract Act, 1872; Indian Stamp Act, 1899 and state stamp laws (Karnataka Stamp Act, 1957);
 * Registration Act, 1908; Information Technology Act, 2000; Arbitration and Conciliation Act, 1996;
 * Specific Relief Act, 1963; Limitation Act, 1963; Copyright Act, 1957; MSMED Act, 2006; DPDP Act, 2023;
 * Competition Act, 2002; Consumer Protection Act, 2019; FEMA, 1999.
 */
(function (root) {
  const S = root.SAFE;
  const PHASES = { p1: { date: '', label: 'In force' }, bp: { date: '', label: 'Good practice' } };
  const PENALTIES = {
    stamp: { max: 0, label: 'Stamp law — an unstamped or under-stamped document is inadmissible in evidence until the duty and a penalty (up to ten times the deficit) are paid' },
    void: { max: 0, label: 'Indian Contract Act — the clause or agreement may be void or unenforceable' },
    msme: { max: 0, label: 'MSMED Act s.16 — compound interest at three times the RBI bank rate on delayed payments to micro and small suppliers' },
    reg: { max: 0, label: 'Registration Act s.49 — an unregistered document requiring registration does not affect the property and is not admissible as evidence of the transaction' },
    loss: { max: 0, label: 'Commercial exposure — uncapped liability, loss of rights or unrecoverable claims' },
    regl: { max: 0, label: 'Regulatory penalty under the applicable law (DPDPA, FEMA, Competition Act, Consumer Protection Act)' },
    none: { max: 0, label: 'No direct penalty (good practice)' }
  };
  const DOMAINS = [
    { id: 'KINV', name: 'Contract inventory and lifecycle' },
    { id: 'KEXE', name: 'Authority, execution, stamping and registration' },
    { id: 'KTRM', name: 'Key commercial and legal terms' },
    { id: 'KRST', name: 'Restrictive covenants and IP' },
    { id: 'KDPA', name: 'Data protection and security clauses' },
    { id: 'KREG', name: 'Regulatory clauses' },
    { id: 'KPRF', name: 'Performance, notices and disputes' },
    { id: 'KVEN', name: 'Vendor and third-party governance' }
  ];
  const C = [];
  const add = (d, list) => list.forEach((c) => C.push(Object.assign({ d, when: '', ph: 'p1', pen: 'none', stat: true, crit: false, iso: '' }, c)));

  add('KINV', [
    { id: 'CC-INV-01', t: 'Central contract repository', pri: 'M', crit: true, pen: 'loss', stat: false,
      req: 'All signed contracts (customer, vendor, employment, lease, NDA, licence, financing) are stored in one repository with the final executed copy, amendments and metadata.', ref: 'Good practice; Evidence (Bharatiya Sakshya Adhiniyam, 2023) — proof of documents', ev: 'Repository extract showing contracts and metadata.', q: 'Are all executed contracts and their amendments stored in one place where they can be found quickly?' },
    { id: 'CC-INV-02', t: 'Key dates tracked: expiry, renewal, notice periods', pri: 'M', pen: 'loss', stat: false,
      req: 'Expiry, auto-renewal, notice and lock-in dates are tracked with alerts, so rights to renew, renegotiate or terminate are not lost.', ref: 'Good practice', ev: 'Renewal tracker with alerts.', q: 'Are expiry, renewal and notice dates tracked with reminders?' },
    { id: 'CC-INV-03', t: 'Contract owner and obligation tracking', pri: 'S', stat: false, ph: 'bp',
      req: 'Each contract has a business owner responsible for performance, obligations (deliverables, reports, audits, insurance) and renewal decisions.', ref: 'Good practice', ev: 'Owner field in the repository; obligation log.', q: 'Does each contract have a named owner who tracks your obligations under it?' },
    { id: 'CC-INV-04', t: 'Approved templates and negotiation playbook', pri: 'S', stat: false, ph: 'bp',
      req: 'Standard templates and a playbook with fallback positions are used, and deviations need legal approval.', ref: 'Good practice', ev: 'Template library; approval records for deviations.', q: 'Do you use approved templates and a playbook, with legal approval for deviations?' }
  ]);

  add('KEXE', [
    { id: 'CC-EXE-01', t: 'Signatory authority', pri: 'M', crit: true, pen: 'void',
      req: 'Contracts are signed by persons authorised by board resolution, delegation of authority or power of attorney, within their financial limits.', ref: 'Companies Act s.21; Indian Contract Act s.186–s.188 (agency); articles of association', ev: 'Delegation of authority matrix; resolutions; sample of signed contracts.', q: 'Is there a delegation of authority, and are contracts signed only by authorised persons within their limits?' },
    { id: 'CC-EXE-02', t: 'Correct parties and execution formalities', pri: 'M', pen: 'void',
      req: 'Contracts name the correct legal entities, are dated, signed by all parties, witnessed or notarised where required, and executed in the counterparts needed.', ref: 'Indian Contract Act s.10', ev: 'Sample review of executed contracts.', q: 'Are contracts made in the correct legal names, dated and signed by all parties (with witnesses where needed)?' },
    { id: 'CC-EXE-03', t: 'Stamp duty paid', pri: 'M', crit: true, pen: 'stamp',
      req: 'Agreements are stamped at the rate in the state of execution (and any differential paid on receipt in another state) before or at execution.', ref: 'Indian Stamp Act, 1899 s.3, s.35; state stamp laws (Karnataka Stamp Act, 1957)', ev: 'Stamp papers / e-stamp certificates for sampled contracts.', q: 'Is stamp duty paid on agreements (for example by e-stamping) at the rate of the state where they are signed?' },
    { id: 'CC-EXE-04', t: 'Registration of documents that require it', pri: 'M', crit: true, pen: 'reg', when: 'property',
      req: 'Leases of immovable property for more than one year (or year to year) and other documents requiring registration are registered with the Sub-Registrar.', ref: 'Registration Act, 1908 s.17, s.49', ev: 'Registered lease deeds.', q: 'Are leases of premises for more than a year registered with the Sub-Registrar?' },
    { id: 'CC-EXE-05', t: 'Electronic signatures used only where valid', pri: 'M', pen: 'void', when: 'esign',
      req: 'Electronic signatures meet the IT Act (Aadhaar e-sign or digital signature certificate, or a reliable electronic method), and are not used for documents excluded by the First Schedule (negotiable instruments other than cheques, powers of attorney, trusts, wills, and contracts for sale or conveyance of immovable property).', ref: 'Information Technology Act, 2000 s.3A, s.5, s.10A and First Schedule', ev: 'E-sign platform settings; sample audit trail.', q: 'Where you e-sign, is the method valid under the IT Act, and are excluded documents (property sale, POA, wills, trusts) signed on paper?' }
  ]);

  add('KTRM', [
    { id: 'CC-TRM-01', t: 'Limitation of liability', pri: 'M', pen: 'loss', stat: false,
      req: 'Material contracts cap liability at an appropriate level, exclude indirect and consequential loss, and the carve-outs (fraud, wilful misconduct, data breach, IP) are deliberate.', ref: 'Indian Contract Act s.73, s.74; commercial practice', ev: 'Clause review of material contracts.', q: 'Do material contracts cap your liability and exclude indirect loss, with deliberate carve-outs?' },
    { id: 'CC-TRM-02', t: 'Indemnities scoped and backed', pri: 'M', pen: 'loss', stat: false,
      req: 'Indemnities given are limited to matters within the company\'s control and capped where possible; indemnities received are backed by insurance or creditworthy parties.', ref: 'Indian Contract Act s.124, s.125', ev: 'Clause review.', q: 'Are indemnities you give limited and capped, and those you receive backed by insurance or a solvent party?' },
    { id: 'CC-TRM-03', t: 'Termination rights and consequences', pri: 'M', pen: 'loss', stat: false,
      req: 'Contracts provide termination for convenience and for cause, cure periods, and exit obligations (data return, transition, final payments).', ref: 'Indian Contract Act s.39; Specific Relief Act, 1963 s.14', ev: 'Clause review.', q: 'Do contracts give you clear termination rights and exit obligations (transition, data return)?' },
    { id: 'CC-TRM-04', t: 'Dispute resolution and governing law', pri: 'M', crit: true, pen: 'loss', stat: false,
      req: 'Arbitration clauses are in writing, name the seat, institution or appointment method and number of arbitrators; governing law and jurisdiction are stated and consistent.', ref: 'Arbitration and Conciliation Act, 1996 s.7, s.11, s.20', ev: 'Clause review.', q: 'Do contracts have a valid dispute clause naming the seat of arbitration, the rules and the governing law?' },
    { id: 'CC-TRM-05', t: 'Liquidated damages and penalties reasonable', pri: 'S', pen: 'void',
      req: 'Liquidated damages are a genuine pre-estimate and reasonable compensation, as courts award only reasonable compensation up to the stipulated amount.', ref: 'Indian Contract Act s.74', ev: 'Clause review.', q: 'Are liquidated damages set at a reasonable pre-estimate of loss?' },
    { id: 'CC-TRM-06', t: 'Force majeure and change in law', pri: 'S', pen: 'loss', stat: false,
      req: 'Force majeure clauses define events, notice, mitigation and termination after prolonged events; change-in-law risk is allocated.', ref: 'Indian Contract Act s.32, s.56', ev: 'Clause review.', q: 'Do contracts have clear force majeure and change-in-law clauses?' },
    { id: 'CC-TRM-07', t: 'Confidentiality', pri: 'M', pen: 'loss', stat: false,
      req: 'Confidentiality obligations cover the information exchanged, survive termination for an appropriate period, and permit legally required disclosure.', ref: 'Indian Contract Act; equity (breach of confidence)', ev: 'NDA and clause review.', q: 'Do contracts and NDAs protect your confidential information, surviving termination?' },
    { id: 'CC-TRM-08', t: 'Assignment and change of control', pri: 'S', stat: false, ph: 'bp',
      req: 'Assignment requires consent, and change-of-control clauses are identified for transactions.', ref: 'Indian Contract Act s.37, s.40', ev: 'Clause review; change-of-control list.', q: 'Have you identified contracts that need consent on assignment or change of control?' }
  ]);

  add('KRST', [
    { id: 'CC-RST-01', t: 'Non-compete restrictions enforceable', pri: 'M', pen: 'void',
      req: 'Restraints of trade apply during the term of the relationship; post-termination non-competes (other than on sale of goodwill) are avoided as void, with reliance instead on confidentiality and reasonable non-solicitation.', ref: 'Indian Contract Act s.27', ev: 'Employment, consultant and vendor clause review.', q: 'Have you reviewed non-compete clauses so that post-termination restraints (other than on sale of goodwill) are not relied on?' },
    { id: 'CC-RST-02', t: 'IP ownership and assignment in writing', pri: 'M', crit: true, pen: 'loss',
      req: 'Work commissioned from vendors and consultants is assigned to the company in writing, identifying the work, rights, duration and territory; licences received are adequate for the use.', ref: 'Copyright Act, 1957 s.17, s.18, s.19', ev: 'IP clauses in development and services contracts.', q: 'Do vendor and consultant contracts assign the IP in deliverables to you in writing?' }
  ]);

  add('KDPA', [
    { id: 'CC-DPA-01', t: 'Processors engaged under a contract with data protection terms', pri: 'M', crit: true, pen: 'regl', when: 'personalData',
      req: 'Vendors processing personal data on the company\'s behalf are engaged under a valid contract covering instructions, security safeguards, breach notification, sub-processors, assistance with rights requests and deletion at the end.', ref: 'DPDP Act, 2023 s.8(2), s.8(5)–(7); DPDP Rules, 2025 r.6(1)(f)', ev: 'Data processing addenda with key vendors.', q: 'Do vendors that handle personal data for you sign a data processing addendum with security, breach notice and deletion terms?' },
    { id: 'CC-DPA-02', t: 'Information security and audit rights', pri: 'S', pen: 'loss', stat: false, when: 'personalData',
      req: 'Technology and outsourcing contracts include security standards, audit rights and incident cooperation.', ref: 'Good practice; CERT-In Directions, 2022', ev: 'Clause review.', q: 'Do technology contracts include security standards, audit rights and incident cooperation?' }
  ]);

  add('KREG', [
    { id: 'CC-REG-01', t: 'MSME payment terms within 45 days', pri: 'M', pen: 'msme',
      req: 'Payment terms with micro and small enterprise suppliers do not exceed 45 days from acceptance, and MSME status is captured at onboarding.', ref: 'MSMED Act, 2006 s.15, s.16', ev: 'Vendor master with MSME status; payment terms.', q: 'Do contracts with micro and small enterprise suppliers allow no more than 45 days for payment?' },
    { id: 'CC-REG-02', t: 'Tax clauses: GST and TDS', pri: 'M', pen: 'loss', stat: false,
      req: 'Contracts state whether prices include GST, require valid tax invoices and allocate TDS and tax credit risk.', ref: 'CGST Act; Income-tax Act, 2025', ev: 'Clause review.', q: 'Do contracts deal clearly with GST, tax invoices and TDS?' },
    { id: 'CC-REG-03', t: 'Anti-bribery and compliance-with-laws clauses', pri: 'S', pen: 'regl',
      req: 'Contracts with agents, distributors and vendors include anti-bribery undertakings, audit rights and termination for breach.', ref: 'Prevention of Corruption Act, 1988 s.9', ev: 'Clause review.', q: 'Do contracts with agents, distributors and vendors include anti-bribery clauses?' },
    { id: 'CC-REG-04', t: 'Competition law in commercial terms', pri: 'S', pen: 'regl', when: 'distribution',
      req: 'Exclusivity, resale price, territorial and tie-in terms are reviewed for appreciable adverse effect on competition.', ref: 'Competition Act, 2002 s.3(4)', ev: 'Distribution and supply agreement review.', q: 'Have exclusive dealing, resale price and territory clauses been reviewed for competition law risk?' },
    { id: 'CC-REG-05', t: 'Fair consumer contract terms', pri: 'M', pen: 'regl', when: 'consumer',
      req: 'Standard terms with consumers avoid unfair contract terms (excessive security deposits, one-sided penalties, unilateral termination, unreasonable charges).', ref: 'Consumer Protection Act, 2019 s.2(46), s.49(2)', ev: 'Consumer terms review.', q: 'Have your standard consumer terms been checked for unfair terms?' },
    { id: 'CC-REG-06', t: 'Cross-border contracts and FEMA', pri: 'S', pen: 'regl', when: 'foreignContracts',
      req: 'Contracts with foreign parties address currency, remittance, withholding tax, guarantees and FEMA compliance.', ref: 'FEMA, 1999 and current account rules; Income-tax Act, 2025', ev: 'Review of foreign contracts.', q: 'Do contracts with foreign parties deal with currency, remittance, withholding tax and FEMA requirements?' }
  ]);

  add('KPRF', [
    { id: 'CC-PRF-01', t: 'Obligations performed and documented', pri: 'S', stat: false, ph: 'bp',
      req: 'Deliveries, acceptances, service levels and change requests are documented, so performance can be proved.', ref: 'Good practice', ev: 'Acceptance certificates; SLA reports.', q: 'Do you keep proof of delivery, acceptance and service levels for key contracts?' },
    { id: 'CC-PRF-02', t: 'Contractual notices sent in the agreed form and time', pri: 'M', pen: 'loss', stat: false,
      req: 'Breach, termination, renewal and claim notices are sent to the address and in the manner the contract requires, within the time allowed.', ref: 'Indian Contract Act; contract terms', ev: 'Notice log.', q: 'Are contractual notices sent to the right address, in the right form and within time?' },
    { id: 'CC-PRF-03', t: 'Claims preserved within limitation', pri: 'M', pen: 'loss',
      req: 'Claims for unpaid amounts or breach are pursued within the limitation period (generally three years for contract claims).', ref: 'Limitation Act, 1963, Schedule (Articles 55 and others)', ev: 'Receivables ageing; claims register.', q: 'Are unpaid amounts and breach claims pursued before the three-year limitation period expires?' },
    { id: 'CC-PRF-04', t: 'Dispute register', pri: 'W', stat: false, ph: 'bp', pen: 'none',
      req: 'Contract disputes are logged with status, exposure and next steps, and reviewed by management.', ref: 'Good practice', ev: 'Dispute register.', q: 'Do you keep a register of contract disputes reviewed by management?' }
  ]);

  add('KVEN', [
    { id: 'CC-VEN-01', t: 'Vendor due diligence and onboarding', pri: 'S', stat: false, ph: 'bp',
      req: 'Vendors are checked before contracting (legal status, GST, MSME status, sanctions, litigation, financial standing) proportionate to risk.', ref: 'Good practice', ev: 'Onboarding checklist.', q: 'Do you check a vendor\'s legal, tax and financial standing before signing?' },
    { id: 'CC-VEN-02', t: 'Subcontracting and insurance controls', pri: 'S', stat: false, ph: 'bp',
      req: 'Subcontracting needs consent; vendors maintain the insurances the contract requires and provide certificates.', ref: 'Good practice', ev: 'Consents; insurance certificates.', q: 'Do you control subcontracting and collect vendors\' insurance certificates?' },
    { id: 'CC-VEN-03', t: 'Exit and transition plans for critical vendors', pri: 'W', stat: false, ph: 'bp', pen: 'none',
      req: 'Critical vendor contracts include transition assistance, data return and continuity obligations.', ref: 'Good practice', ev: 'Exit clauses; transition plans.', q: 'Do critical vendor contracts include transition assistance and data return on exit?' }
  ]);

  const DOC_TYPES = [
    { id: 'contract-policy', title: 'Contract Management Policy (lifecycle, repository, renewals)', audience: 'Legal, procurement and business owners', controls: ['CC-INV-01', 'CC-INV-02', 'CC-INV-03'] },
    { id: 'doa', title: 'Delegation of Authority Matrix for Contract Signing', audience: 'Board and management', controls: ['CC-EXE-01'] },
    { id: 'playbook', title: 'Contract Playbook and Standard Clause Library', audience: 'Legal and business teams', controls: ['CC-INV-04', 'CC-TRM-01', 'CC-TRM-02', 'CC-TRM-03', 'CC-TRM-04'] },
    { id: 'execution-checklist', title: 'Execution Checklist (authority, stamping, registration, e-signature)', audience: 'Legal and administration', controls: ['CC-EXE-02', 'CC-EXE-03', 'CC-EXE-04', 'CC-EXE-05'] },
    { id: 'dpa', title: 'Data Processing Addendum for Vendors', audience: 'Vendors', controls: ['CC-DPA-01', 'CC-DPA-02'], when: 'personalData' },
    { id: 'vendor-template', title: 'Master Vendor / Services Agreement Template', audience: 'Vendors', controls: ['CC-TRM-01', 'CC-TRM-07', 'CC-RST-02', 'CC-REG-02', 'CC-REG-03'] },
    { id: 'nda', title: 'Mutual Non-Disclosure Agreement Template', audience: 'Counterparties', controls: ['CC-TRM-07'] },
    { id: 'renewal-register', title: 'Contract Register and Renewal Tracker (format)', audience: 'Contract owners', controls: ['CC-INV-01', 'CC-INV-02'] }
  ];

  const F = (k, l, t, extra) => Object.assign({ k, l, t }, extra || {});
  const fw = {
    id: 'contract', code: 'CONTRACT', name: 'Contract Compliance Audit', short: 'Contracts', icon: 'doc',
    tagline: 'Execution, enforceability, key terms and regulatory clauses across the contract portfolio',
    criteria: 'Indian Contract Act, 1872; Indian Stamp Act, 1899 and state stamp laws; Registration Act, 1908; Information Technology Act, 2000; Arbitration and Conciliation Act, 1996; Limitation Act, 1963; Copyright Act, 1957; MSMED Act, 2006; DPDP Act, 2023; Competition Act, 2002; Consumer Protection Act, 2019; FEMA, 1999',
    criteriaShort: 'the Indian Contract Act, 1872, the stamp and registration laws, the Information Technology Act, 2000 (electronic contracts and signatures), the Arbitration and Conciliation Act, 1996, the Limitation Act, 1963, and the regulatory laws that govern contract terms (MSMED Act, DPDP Act, Competition Act, Consumer Protection Act and FEMA)',
    contextNote: 'The audit reviewed the contract management process and a risk-based sample of material contracts. Contracts outside the sample were not reviewed clause by clause.',
    stdLabel: 'Related law',
    certTitle: () => 'Certificate of Contract Compliance',
    certLaw: 'Indian Contract Act, 1872 · Stamp and Registration laws · IT Act, 2000 · Arbitration and Conciliation Act, 1996',
    certDisclaimer: 'This certificate covers the contract management process and the contracts sampled in the audit. It is not an opinion on the enforceability of any particular contract.',
    reportTitle: () => 'CONTRACT COMPLIANCE AUDIT REPORT',
    phases: PHASES, penalties: PENALTIES, domains: DOMAINS, controls: C, docTypes: DOC_TYPES,
    common: ['org'],
    envSections: [{ id: 'contractEnv', title: 'Your contracts', fields: [
      F('contractCount', 'Approximate number of active contracts', 'select', { o: S.opt(['Under 50', '50–200', '200–1,000', 'Over 1,000']), req: true }),
      F('contractTypes', 'Main types of contract', 'multi', { o: S.opt(['Customer / sales', 'Vendor / services', 'Software and technology', 'Distribution / channel partner', 'Leases of premises', 'Employment and consultancy', 'NDAs', 'Loans and financing', 'Licences (IP, software)', 'Joint ventures / partnerships']), req: true }),
      F('repository', 'Where are signed contracts kept?', 'select', { o: S.opt(['Contract management system', 'Shared drive with folders', 'Email and individual laptops', 'Paper files', 'Mixed / not sure']), req: true }),
      F('signing', 'How are contracts signed?', 'multi', { o: S.opt(['Wet ink on paper', 'Aadhaar e-sign', 'DocuSign / Adobe Sign / similar', 'Digital signature certificate (DSC)', 'Click-wrap / online acceptance']) }),
      F('personalData', 'Do vendors handle personal data (customers\' or employees\') for you?', 'bool', { req: true }),
      F('foreignContracts', 'Do you have contracts with foreign parties?', 'bool'),
      F('distribution', 'Do you appoint distributors, dealers or resellers?', 'bool'),
      F('consumer', 'Do you contract with consumers on standard terms (B2C)?', 'bool'),
      F('property', 'Do you lease or license premises?', 'bool'),
      F('sample', 'Contracts you would like SAFE to review closely (names or list)', 'textarea'),
      null
    ] }],
    flags: (env) => {
      const f = S.commonFlags(env);
      const has = (k, v) => Array.isArray(env[k]) && env[k].includes(v);
      return Object.assign(f, { personalData: env.personalData !== false, foreignContracts: env.foreignContracts === true, distribution: env.distribution === true || has('contractTypes', 'Distribution / channel partner'), consumer: env.consumer === true, property: env.property !== false || has('contractTypes', 'Leases of premises'), esign: (env.signing || []).some((x) => !/Wet ink/.test(x)) });
    },
    roleLabel: (f) => 'Contracting party' + (f.consumer ? ' (including consumer contracts)' : ''),
    roleCaption: 'Profile',
    applicabilityRows: (f, env) => [
      ['Active contracts', env.contractCount || '—'], ['Contract types', (env.contractTypes || []).join(', ') || '—'], ['Electronic signatures', f.esign ? 'Used — IT Act conditions apply' : 'Not used'],
      ['Personal data with vendors (DPDPA)', f.personalData ? 'Yes' : 'No'], ['Premises leases (registration)', f.property ? 'Yes' : 'No'], ['Foreign contracts (FEMA)', f.foreignContracts ? 'Yes' : 'No']
    ],
    landscapeTitle: 'Contract portfolio',
    landscapeRows: (env) => [['Active contracts', env.contractCount || ''], ['Types', (env.contractTypes || []).join(', ')], ['Repository', env.repository || ''], ['Signing methods', (env.signing || []).join(', ')], ['Contracts selected for close review', env.sample || 'Risk-based sample chosen by SAFE']],
    glossary: [['Material contract', 'A contract whose value, duration, exclusivity or risk makes it significant to the business, as identified in the audit.'], ['Stamp duty', 'Tax payable on instruments under the Indian Stamp Act and state stamp laws.'], ['Restraint of trade', 'An agreement restraining a person from exercising a lawful profession, trade or business, void under section 27 of the Indian Contract Act except as permitted.']],
    scopeDefault: (env, name) => 'Contract management process of ' + name + ' and the material contracts sampled in the audit'
  };
  fw.envSections[0].fields[10] = S.existingDocsField(fw);
  S.registerFramework(fw);
})(typeof window !== 'undefined' ? window : globalThis);
