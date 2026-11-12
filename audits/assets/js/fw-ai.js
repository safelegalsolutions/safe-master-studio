/* SAFE Legal Workplace Compliance Audits — AI Governance and Compliance framework
 * India has no single AI statute. This audit tests AI use against the laws that already apply to it and the
 * Government's AI guidance:
 *  - Digital Personal Data Protection Act, 2023 and DPDP Rules, 2025
 *  - Information Technology Act, 2000; IT (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021 as amended by
 *    the IT (Amendment) Rules, 2026 on synthetically generated information (notified 16 Feb 2026, in force 20 Feb 2026)
 *  - CERT-In Directions of 28 April 2022 (IT Act s.70B)
 *  - Consumer Protection Act, 2019, the E-Commerce Rules, 2020 and the Dark Patterns Guidelines, 2023
 *  - Copyright Act, 1957; Trade Marks Act, 1999; personality rights recognised by courts
 *  - Bharatiya Nyaya Sanhita, 2023 and IT Act offences (impersonation, privacy, obscenity)
 *  - Equality laws for AI in employment (Code on Wages s.3, RPwD Act, Transgender Persons Act)
 *  - Sector rules: RBI (FREE-AI Framework, 2025; IT Governance and IT Outsourcing Directions, 2023), SEBI (2025 amendment
 *    making regulated entities responsible for AI/ML tools), IRDAI cyber security guidelines, ICMR AI ethics guidelines (2023)
 *  - MeitY India AI Governance Guidelines (5 Nov 2025) and NITI Aayog Responsible AI principles (voluntary)
 *  - ISO/IEC 42001:2023 AI management system (good-practice reference) and, where EU users are served, the EU AI Act
 */
(function (root) {
  const S = root.SAFE;
  const PHASES = {
    p1: { date: '', label: 'In force' },
    sgi: { date: '2026-02-20', label: 'IT Rules amendment on synthetic content, in force 20 Feb 2026' },
    dp: { date: '2027-05-13', label: 'DPDP Rules obligations, in force 13 May 2027' },
    ig: { date: '', label: 'India AI Governance Guidelines (voluntary)' },
    bp: { date: '', label: 'Good practice (ISO/IEC 42001)' }
  };
  const PENALTIES = {
    dpdp: { max: 250, label: 'DPDP Act Schedule — up to ₹250 crore for failing to take reasonable security safeguards; up to ₹200 crore for children\'s data or breach intimation failures; up to ₹50 crore for other breaches' },
    itrules: { max: 0, label: 'Loss of safe-harbour protection as an intermediary (IT Act s.79) and liability for the content, plus action under the IT Act and Bharatiya Nyaya Sanhita' },
    certin: { max: 0, label: 'IT Act s.70B(7) — imprisonment up to one year, or fine up to ₹1 lakh, or both, for not complying with CERT-In directions' },
    consumer: { max: 0, label: 'Consumer Protection Act s.21 — CCPA penalty up to ₹10 lakh (₹50 lakh for repeat contraventions), corrective advertising and discontinuation orders' },
    ip: { max: 0, label: 'Civil damages, injunctions and criminal liability for infringement (Copyright Act s.51, s.55, s.63; Trade Marks Act; personality rights)' },
    crime: { max: 0, label: 'Criminal liability for impersonation, privacy violation, obscene or defamatory content (IT Act s.66C–s.67; BNS s.319, s.356)' },
    equality: { max: 0, label: 'Liability under equality laws (Code on Wages s.54; RPwD Act s.89) and civil claims for discrimination' },
    sector: { max: 0, label: 'Regulatory action by the sector regulator (RBI, SEBI, IRDAI, CDSCO), including directions, monetary penalties and licence conditions' },
    contract: { max: 0, label: 'Contractual and civil liability (no direct statutory penalty)' },
    none: { max: 0, label: 'No direct penalty (good practice)' }
  };
  const DOMAINS = [
    { id: 'AGOV', name: 'AI governance and accountability' },
    { id: 'AINV', name: 'AI inventory, risk and impact assessment' },
    { id: 'ADAT', name: 'Personal data in AI (DPDPA)' },
    { id: 'ATRN', name: 'Transparency, labelling and synthetic content' },
    { id: 'AFAR', name: 'Fairness, human oversight and grievances' },
    { id: 'ASEC', name: 'AI security, testing and incidents' },
    { id: 'AVND', name: 'AI vendors, models and contracts' },
    { id: 'AIPR', name: 'Intellectual property and training data' },
    { id: 'ACON', name: 'Consumer protection and AI marketing' },
    { id: 'ASEC2', name: 'Sector rules (finance, insurance, health)' },
    { id: 'AUSE', name: 'Employees\' use of AI' }
  ];
  const C = [];
  const add = (d, list) => list.forEach((c) => C.push(Object.assign({ d, when: '', ph: 'p1', pen: 'none', stat: true, crit: false, iso: '' }, c)));

  add('AGOV', [
    { id: 'AI-GOV-01', t: 'Approved AI governance policy', pri: 'M', crit: true, pen: 'none', stat: false, ph: 'ig',
      req: 'A board- or management-approved AI policy sets out where AI may and may not be used, who approves new AI uses, the risk assessment required, human oversight, transparency, data protection and how incidents are handled.', ref: 'India AI Governance Guidelines, 2025 (Accountability pillar); RBI FREE-AI Framework (board-approved AI policy) for regulated entities', iso: '42001 5.2, A.2',
      ev: 'Approved AI policy with version and approval date.', q: 'Do you have an AI policy approved by the Board or senior management that says how AI may be used in the business?' },
    { id: 'AI-GOV-02', t: 'Named owner and AI oversight forum', pri: 'M', stat: false, ph: 'ig',
      req: 'A senior person is accountable for AI, and a cross-functional forum (legal, technology, data protection, business) approves and reviews AI uses.', ref: 'India AI Governance Guidelines, 2025; NITI Aayog Responsible AI principles (accountability)', iso: '42001 5.3, A.3.2',
      ev: 'Appointment note; terms of reference; minutes.', q: 'Is a senior person accountable for AI, with a group (legal, tech, data protection) that approves new AI uses?' },
    { id: 'AI-GOV-03', t: 'Applicable AI laws and guidance mapped', pri: 'M', pen: 'none',
      req: 'The laws and regulator guidance that apply to the organisation\'s AI uses (DPDPA, IT Rules, consumer law, sector rules, foreign laws where products are offered abroad) are identified, with an owner who tracks changes.', ref: 'India AI Governance Guidelines, 2025 (compliance with existing laws); DPDP Act s.8(1)', iso: '42001 4.1, 4.2',
      ev: 'Legal register for AI; change log.', q: 'Have you listed the Indian laws and regulator rules that apply to your AI uses, with someone tracking changes?' },
    { id: 'AI-GOV-04', t: 'Board or senior management reporting on AI risk', pri: 'S', stat: false, ph: 'ig',
      req: 'AI risks, incidents and the AI inventory are reported to the Board or senior management at least annually.', ref: 'RBI FREE-AI Framework (governance pillar); good practice', iso: '42001 9.3',
      ev: 'Board or management papers and minutes.', q: 'Are AI risks and incidents reported to the Board or senior management at least once a year?' },
    { id: 'AI-GOV-05', t: 'AI management system aligned to ISO/IEC 42001', pri: 'W', stat: false, ph: 'bp',
      req: 'AI governance follows a recognised management system standard (ISO/IEC 42001, adopted by BIS) with objectives, internal audit and continual improvement.', ref: 'ISO/IEC 42001:2023; NIST AI RMF (reference)', iso: '42001 (whole)',
      ev: 'Gap assessment or certification plan.', q: 'Is your AI governance aligned to ISO/IEC 42001, or do you plan to certify?' }
  ]);

  add('AINV', [
    { id: 'AI-INV-01', t: 'Inventory of AI systems and tools', pri: 'M', crit: true, stat: false, ph: 'ig',
      req: 'A register lists every AI system and tool in use or development (including third-party SaaS and generative AI tools used by staff), with owner, purpose, data used, users affected, vendor and risk rating.', ref: 'India AI Governance Guidelines, 2025; RBI FREE-AI Framework (AI inventory)', iso: '42001 A.4, A.6.2',
      ev: 'AI register.', q: 'Do you keep a register of all AI systems and tools used in the business, including tools staff use like ChatGPT or Copilot?' },
    { id: 'AI-INV-02', t: 'Risk classification of each AI use', pri: 'M', stat: false, ph: 'ig',
      req: 'Each AI use is rated (for example low, medium, high) based on its effect on people\'s rights, safety, money or access to services; prohibited or unacceptable uses are defined.', ref: 'India AI Governance Guidelines, 2025 (risk mitigation); ISO/IEC 23894', iso: '42001 6.1.2, A.5',
      ev: 'Risk methodology; ratings in the register.', q: 'Is each AI use rated for risk to people (rights, safety, money, access to services)?' },
    { id: 'AI-INV-03', t: 'AI impact assessment before high-risk use', pri: 'M', crit: true, pen: 'dpdp', when: 'impactful',
      req: 'Before an AI system that makes or supports decisions about individuals goes live, an impact assessment covers purpose, lawful basis, data quality, bias, explainability, human oversight, security and the rights of affected persons, and is signed off.', ref: 'DPDP Act s.8(1), s.8(3); DPDP Rules r.13 (periodic DPIA and algorithmic due diligence for Significant Data Fiduciaries); ISO/IEC 42005', iso: '42001 6.1.4, A.5.2',
      ev: 'Completed impact assessments and sign-offs.', q: 'Before AI that decides or influences decisions about people goes live, do you complete a written impact assessment?' },
    { id: 'AI-INV-04', t: 'Change control for AI models and prompts', pri: 'S', stat: false, ph: 'bp', when: 'builds',
      req: 'Changes to models, training data, prompts, guardrails and vendors are versioned, tested and approved before release.', ref: 'Good practice; RBI IT Governance Directions, 2023 (change management) for regulated entities', iso: '42001 A.6.2.5–A.6.2.7',
      ev: 'Model and prompt version history; release approvals.', q: 'Are changes to your AI models, prompts and guardrails tested and approved before release?' }
  ]);

  add('ADAT', [
    { id: 'AI-DAT-01', t: 'Lawful basis for personal data used in AI', ph: 'dp', pri: 'M', crit: true, pen: 'dpdp', when: 'pd',
      req: 'Personal data used to train, fine-tune, prompt or run AI is processed on consent or a legitimate use under the Act, for a lawful purpose stated in the notice; reuse of customer or employee data for AI training is covered by the original purpose or a fresh consent.', ref: 'DPDP Act s.4, s.6, s.7', iso: '27701 7.2.2',
      ev: 'Data flow map for AI; notices and consent records.', q: 'Is the personal data you feed into AI (for training or use) covered by consent or a lawful ground, and by the purpose told to people?' },
    { id: 'AI-DAT-02', t: 'Notice explains AI processing', pri: 'M', pen: 'dpdp', ph: 'dp', when: 'pd',
      req: 'Privacy notices state, in clear and plain language, the personal data processed by AI and the specific purposes (for example profiling, automated screening, chatbot conversations).', ref: 'DPDP Act s.5; DPDP Rules r.3', iso: '27701 7.3.2',
      ev: 'Privacy notice extracts.', q: 'Do your privacy notices tell people what personal data your AI uses and why?' },
    { id: 'AI-DAT-03', t: 'Accuracy of personal data used for decisions', ph: 'dp', pri: 'M', crit: true, pen: 'dpdp', when: 'impactful',
      req: 'Where personal data is used by AI to make a decision that affects the person, the organisation ensures it is complete, accurate and consistent.', ref: 'DPDP Act s.8(3)', iso: '42001 A.7.4',
      ev: 'Data quality checks; error-correction procedure.', q: 'When AI uses personal data to make decisions about people, do you check the data is complete, accurate and consistent?' },
    { id: 'AI-DAT-04', t: 'No tracking, profiling or targeted ads directed at children', pri: 'M', crit: true, pen: 'dpdp', ph: 'dp', when: 'children',
      req: 'AI is not used for tracking, behavioural monitoring or targeted advertising directed at children, and verifiable parental consent is obtained before processing a child\'s data (subject to the exemptions in the Rules).', ref: 'DPDP Act s.9; DPDP Rules r.10, r.12 and Fourth Schedule', iso: '27701 7.2.3',
      ev: 'Age-gating and parental consent flow; ad-targeting settings.', q: 'If children may use your AI products, do you avoid profiling and targeted ads and obtain parental consent?' },
    { id: 'AI-DAT-05', t: 'Rights requests work for AI systems', pri: 'M', pen: 'dpdp', ph: 'dp', when: 'pd',
      req: 'Requests for access, correction, erasure and grievance can be met for data held in AI systems (including chat logs, embeddings and training sets where feasible), and personal data is erased when the purpose is served.', ref: 'DPDP Act s.8(7), s.11–s.13; DPDP Rules r.8, r.14', iso: '27701 7.3',
      ev: 'Procedure for AI data; sample requests handled.', q: 'Can you find, correct and delete a person\'s data held in AI systems (chat logs, training data) when they ask?' },
    { id: 'AI-DAT-06', t: 'Scraped or publicly available data used carefully', ph: 'dp', pri: 'S', pen: 'dpdp', when: 'trains',
      req: 'Data collected from the internet for AI is limited to data the person made publicly available or data with another lawful basis; sources, terms of use and opt-outs are recorded.', ref: 'DPDP Act s.3(c)(ii); IT Act s.43; website terms', iso: '42001 A.7.3',
      ev: 'Data source register with lawful basis.', q: 'If you collect data from the internet to train AI, do you record the sources and the lawful basis?' },
    { id: 'AI-DAT-07', t: 'Personal data not entered into public AI tools', ph: 'dp', pri: 'M', pen: 'dpdp', when: 'pd',
      req: 'Staff are prohibited from entering customer, employee or confidential personal data into AI tools that are not approved and contracted as processors; technical controls (enterprise accounts, data-loss prevention) support the rule.', ref: 'DPDP Act s.8(2), s.8(5)', iso: '27701 8.2',
      ev: 'Policy clause; approved-tool list; DLP settings.', q: 'Are staff stopped from pasting customer or employee personal data into free or unapproved AI tools?' },
    { id: 'AI-DAT-08', t: 'Algorithmic due diligence by Significant Data Fiduciaries', pri: 'M', pen: 'dpdp', ph: 'dp', when: 'sdf',
      req: 'A Significant Data Fiduciary verifies that its technical measures, including algorithmic software for hosting, displaying, uploading, modifying, publishing, transmitting, storing, updating or sharing personal data, are not likely to pose a risk to the rights of Data Principals, and conducts a DPIA and audit every 12 months.', ref: 'DPDP Act s.10; DPDP Rules r.13', iso: '42001 A.5',
      ev: 'Algorithmic due diligence report; DPIA; audit report.', q: 'As a likely Significant Data Fiduciary, do you check your algorithms for risks to individuals and run a yearly DPIA and audit?' }
  ]);

  add('ATRN', [
    { id: 'AI-TRN-01', t: 'People told when they deal with AI', pri: 'S', stat: false, ph: 'ig', when: 'customerAi',
      req: 'Customers and users are told clearly when they are interacting with an AI system (for example a chatbot or voice bot) and how to reach a human.', ref: 'India AI Governance Guidelines, 2025 (Understandable by Design); Consumer Protection Act s.2(47) (unfair trade practice)', iso: '42001 A.8.2',
      ev: 'Screenshots of disclosures.', q: 'Do your customers know when they are talking to an AI chatbot or bot, and how to reach a human?' },
    { id: 'AI-TRN-02', t: 'Synthetic audio, image and video labelled', pri: 'M', crit: true, pen: 'itrules', ph: 'sgi', when: 'synthetic',
      req: 'Synthetically generated audio, visual or audio-visual content that appears real is prominently labelled (visible label for images and video, prefixed audio disclosure for audio) and carries provenance information where the Rules require; labels are not removed or suppressed.', ref: 'IT Rules, 2021 as amended by the IT (Amendment) Rules, 2026 (synthetically generated information)', iso: '42001 A.8.2',
      ev: 'Sample labelled outputs; labelling settings.', q: 'Is AI-generated audio, image or video that looks real clearly labelled as AI-generated?' },
    { id: 'AI-TRN-03', t: 'Platform duties for synthetic content', pri: 'M', crit: true, pen: 'itrules', ph: 'sgi', when: 'platform',
      req: 'As an intermediary that lets users create or share synthetic content: terms of use prohibit unlawful synthetic content; technical measures prevent prohibited content (for example non-consensual intimate imagery, impersonation, false documents); synthetic content is labelled; and the terms are notified to users periodically.', ref: 'IT Rules, 2021 r.3 as amended by the IT (Amendment) Rules, 2026', iso: '42001 A.8',
      ev: 'Terms of use; moderation and labelling tools; user notices.', q: 'As a platform, do your terms and tools prevent unlawful AI content and label synthetic content?' },
    { id: 'AI-TRN-04', t: 'User declaration and verification (significant social media intermediary)', pri: 'M', crit: true, pen: 'itrules', ph: 'sgi', when: 'ssmi',
      req: 'Users are asked to declare whether content they upload is synthetically generated, and technical measures verify the declaration before the content is displayed with a label.', ref: 'IT Rules, 2021 r.4 as amended by the IT (Amendment) Rules, 2026', iso: '42001 A.8',
      ev: 'Upload flow screenshots; verification tool description.', q: 'Do users declare whether uploaded content is AI-generated, and do you verify that declaration?' },
    { id: 'AI-TRN-05', t: 'Takedown and grievance timelines met', pri: 'M', crit: true, pen: 'itrules', ph: 'sgi', when: 'platform',
      req: 'Unlawful content is removed within 3 hours of a court order or reasoned government intimation, and non-consensual intimate or morphed imagery within 2 hours of a complaint; grievances are acknowledged and resolved within the reduced timelines (7 days generally; 36 hours for unlawful content).', ref: 'IT Rules, 2021 r.3(1)(d), r.3(2) as amended by the IT (Amendment) Rules, 2026', iso: '42001 A.8.3',
      ev: 'Takedown log with timestamps; grievance register.', q: 'Can you take down unlawful content within 3 hours of an order, and intimate deepfakes within 2 hours of a complaint?' },
    { id: 'AI-TRN-06', t: 'Explanation of AI-supported decisions', pri: 'S', stat: false, ph: 'ig', when: 'impactful',
      req: 'People affected by an AI-supported decision (for example a loan, claim or job rejection) can get a meaningful explanation of the main reasons, in plain language.', ref: 'India AI Governance Guidelines, 2025; RBI Fair Practices Code (reasons for rejection) for lenders', iso: '42001 A.8.2, A.9',
      ev: 'Explanation templates; sample communications.', q: 'If AI helps reject someone (loan, claim, job), can you give them the main reasons in plain language?' },
    { id: 'AI-TRN-07', t: 'Public AI transparency statement', pri: 'W', stat: false, ph: 'ig',
      req: 'The organisation publishes a short statement on how it uses AI, the safeguards it applies and how to raise concerns.', ref: 'India AI Governance Guidelines, 2025 (transparency reports)', iso: '42001 A.8.5',
      ev: 'Published statement.', q: 'Do you publish a short statement on how you use AI and the safeguards you apply?' }
  ]);

  add('AFAR', [
    { id: 'AI-FAR-01', t: 'Bias testing before and after deployment', pri: 'M', pen: 'equality', when: 'impactful',
      req: 'AI that affects individuals is tested for unfair outcomes across gender, disability, age, caste, religion, region and language before release and at regular intervals, with results recorded and gaps fixed.', ref: 'Constitution of India Arts. 14–16 (public bodies); Code on Wages s.3; RPwD Act s.20; Transgender Persons Act s.3; India AI Governance Guidelines (Fairness and Equity)', iso: '42001 A.7.4, A.6.2.4',
      ev: 'Bias test reports; remediation log.', q: 'Is AI that affects people tested for unfair results by gender, disability, age, caste, religion or language?' },
    { id: 'AI-FAR-02', t: 'Human oversight of significant decisions', pri: 'M', crit: true, when: 'impactful',
      req: 'A trained person reviews, and can override, AI outputs before decisions with significant effect on a person (hiring, termination, credit, insurance, medical advice) become final; the reviewer\'s role is documented.', ref: 'India AI Governance Guidelines, 2025 (People First; human-in-the-loop); RBI FREE-AI Framework; ICMR AI Guidelines, 2023 (health)', iso: '42001 A.9.2',
      ev: 'Process notes; override logs.', q: 'Does a trained person review and can overrule AI before decisions that significantly affect someone are final?' },
    { id: 'AI-FAR-03', t: 'AI in recruitment and HR decisions', pri: 'M', crit: true, pen: 'equality', when: 'hr',
      req: 'AI used to screen, assess, monitor or rate employees and candidates is disclosed to them, tested for bias (including against persons with disabilities, who must be given reasonable accommodation), uses only job-relevant data and is subject to human review.', ref: 'Code on Wages s.3; RPwD Act s.3, s.20; Transgender Persons Act s.3; DPDP Act s.5, s.8(3)', iso: '42001 A.7, A.9',
      ev: 'HR AI tool list; candidate notices; bias tests; accommodation route.', q: 'If you use AI in hiring or HR (CV screening, video interviews, performance rating), is it disclosed, bias-tested and reviewed by a person?' },
    { id: 'AI-FAR-04', t: 'Grievance and human review route for AI outcomes', pri: 'M', pen: 'dpdp', when: 'customerAi',
      req: 'People can complain about an AI outcome and ask for human review through an accessible, multilingual channel, with timelines and a feedback loop to fix the system.', ref: 'DPDP Act s.13; Consumer Protection (E-Commerce) Rules, 2020 r.4(4)–(5) (grievance officer); India AI Governance Guidelines, 2025', iso: '42001 A.8.3',
      ev: 'Grievance procedure; complaint log.', q: 'Can customers complain about an AI decision and ask for a human to review it?' },
    { id: 'AI-FAR-05', t: 'Accessibility of AI interfaces', pri: 'S', pen: 'equality', when: 'customerAi',
      req: 'Customer-facing AI interfaces (chatbots, voice bots, apps) meet accessibility standards and offer an alternative channel for persons with disabilities.', ref: 'RPwD Act s.40, s.42, s.46', iso: '42001 A.8',
      ev: 'Accessibility test results.', q: 'Are your chatbots and AI apps accessible to persons with disabilities, with another way to get help?' }
  ]);

  add('ASEC', [
    { id: 'AI-SEC-01', t: 'Security safeguards for AI systems and data', pri: 'M', crit: true, pen: 'dpdp',
      req: 'AI systems and the data they use are protected by access control, encryption, logging and monitoring, and tested against AI-specific attacks (prompt injection, data poisoning, model extraction, data leakage through outputs).', ref: 'DPDP Act s.8(5); DPDP Rules r.6; CERT-In and MeitY guidance', iso: '42001 A.6.2.6; 27001 A.8',
      ev: 'Security architecture; penetration or red-team test report.', q: 'Are your AI systems protected and tested against attacks like prompt injection and leaking of data through answers?' },
    { id: 'AI-SEC-02', t: 'Cyber incidents involving AI reported to CERT-In within 6 hours', pri: 'M', crit: true, pen: 'certin',
      req: 'Reportable cyber incidents (including those affecting AI systems, such as data leaks, unauthorised access or malicious code) are reported to CERT-In within 6 hours of noticing them; ICT logs are kept for 180 days in India and clocks are synchronised.', ref: 'CERT-In Directions dated 28 April 2022 under IT Act s.70B(6)', iso: '27001 A.5.24–A.5.26',
      ev: 'Incident procedure; log retention settings; past reports.', q: 'Would an AI-related cyber incident be reported to CERT-In within 6 hours, and are system logs kept for 180 days?' },
    { id: 'AI-SEC-03', t: 'Personal data breach through AI reported', pri: 'M', crit: true, pen: 'dpdp', ph: 'dp', when: 'pd',
      req: 'A personal data breach involving AI (for example a chatbot exposing another user\'s data) is intimated to the Data Protection Board without delay with a detailed report within 72 hours, and to affected persons without delay.', ref: 'DPDP Act s.8(6); DPDP Rules r.7', iso: '27701 6.13',
      ev: 'Breach procedure covering AI.', q: 'Does your breach procedure cover AI systems, with notice to the Data Protection Board and affected people?' },
    { id: 'AI-SEC-04', t: 'Testing for accuracy, reliability and harmful output', pri: 'M', stat: false, ph: 'ig', when: 'builds',
      req: 'AI is tested before release and monitored in use for accuracy, hallucination, harmful or unlawful output and performance drift, against documented acceptance criteria.', ref: 'India AI Governance Guidelines, 2025 (Safety, Resilience and Sustainability)', iso: '42001 A.6.2.4, A.6.2.8',
      ev: 'Test plans and results; monitoring dashboard.', q: 'Is your AI tested before release and monitored for wrong, harmful or made-up answers?' },
    { id: 'AI-SEC-05', t: 'AI incident register and response', pri: 'S', stat: false, ph: 'ig',
      req: 'AI incidents and near misses (harmful output, bias complaints, misuse, outages) are logged, investigated and fixed, and serious incidents are escalated; contributing to the national AI incident database is considered.', ref: 'India AI Governance Guidelines, 2025 (AI incident database)', iso: '42001 A.8.4, 10.2',
      ev: 'Incident register.', q: 'Do you log and investigate AI incidents, like harmful outputs or complaints of bias?' },
    { id: 'AI-SEC-06', t: 'Fallback when AI fails', pri: 'S', stat: false, ph: 'bp', when: 'customerAi',
      req: 'Critical processes that depend on AI have a manual fallback and can switch the AI off quickly if it misbehaves.', ref: 'Good practice; RBI IT Governance Directions, 2023 (business continuity) for regulated entities', iso: '42001 A.6.2.6',
      ev: 'Continuity plan; kill-switch procedure.', q: 'If your AI fails or misbehaves, can you switch it off and carry on manually?' }
  ]);

  add('AVND', [
    { id: 'AI-VND-01', t: 'Due diligence on AI vendors and models', pri: 'M', pen: 'contract',
      req: 'Before adopting a third-party AI tool or model, the vendor is assessed for data use (including whether customer data trains the vendor\'s models), data location, security, reliability, IP indemnity and regulatory fit.', ref: 'DPDP Act s.8(1), s.8(2); RBI Master Direction on Outsourcing of IT Services, 2023 (regulated entities)', iso: '42001 A.10.3',
      ev: 'Vendor assessments.', q: 'Before you take up an AI tool or model, do you check how the vendor uses your data, where it is stored and its security?' },
    { id: 'AI-VND-02', t: 'Contract terms for AI vendors', ph: 'dp', pri: 'M', pen: 'dpdp', when: 'pd',
      req: 'AI vendor contracts require processing only on instructions, no training on the client\'s data without consent, security safeguards, breach notice, sub-processor control, deletion at the end and audit rights; they also allocate liability and IP risk in outputs.', ref: 'DPDP Act s.8(2); DPDP Rules r.6(1)(f); Indian Contract Act, 1872', iso: '42001 A.10.2; 27701 8.2',
      ev: 'Signed AI vendor contracts or DPAs.', q: 'Do contracts with AI vendors stop them training on your data and require security, breach notice and deletion?' },
    { id: 'AI-VND-03', t: 'Cross-border transfer of data to AI providers', ph: 'dp', pri: 'S', pen: 'dpdp', when: 'pd',
      req: 'Personal data sent to AI providers abroad is not sent to a country restricted by the Central Government, and sectoral data localisation rules (for example RBI payment data, IRDAI, SEBI) are respected.', ref: 'DPDP Act s.16; DPDP Rules r.15; RBI payment data storage direction (2018)', iso: '27701 8.5',
      ev: 'Data location map for AI vendors.', q: 'Do you know in which country your AI vendors store and process your data, and is it allowed for your sector?' },
    { id: 'AI-VND-04', t: 'Customer contracts address AI', pri: 'S', pen: 'contract', when: 'builds',
      req: 'Where the organisation supplies AI-powered products, customer contracts describe the AI functionality, limits of accuracy, human oversight expected of the customer, data use and liability.', ref: 'Indian Contract Act, 1872; Consumer Protection Act, 2019', iso: '42001 A.10.4',
      ev: 'Customer terms.', q: 'Do your customer contracts explain the AI features, their limits and who is responsible for decisions?' }
  ]);

  add('AIPR', [
    { id: 'AI-IPR-01', t: 'Rights to training data and content', pri: 'M', pen: 'ip', when: 'trains',
      req: 'Data and content used to train or fine-tune models is owned, licensed or otherwise lawfully used; licences and website terms are recorded, given the unsettled position on AI training under Indian copyright law and pending litigation.', ref: 'Copyright Act, 1957 s.14, s.51, s.52; licence terms', iso: '42001 A.7.3',
      ev: 'Training data register with licence status.', q: 'Do you own or have a licence for the data and content used to train your AI models?' },
    { id: 'AI-IPR-02', t: 'Ownership of AI outputs and IP protection', pri: 'S', pen: 'ip',
      req: 'The organisation knows who owns AI-assisted outputs under vendor terms and employee or contractor agreements, keeps human creative input where copyright protection matters, and checks outputs for third-party IP before commercial use.', ref: 'Copyright Act, 1957 s.2(d), s.17, s.19; vendor terms', iso: '42001 A.10',
      ev: 'Vendor terms review; IP clauses; output review process.', q: 'Is it clear who owns content made with AI, and are outputs checked for others\' copyright or trade marks before use?' },
    { id: 'AI-IPR-03', t: 'No unauthorised use of a person\'s likeness or voice', pri: 'M', pen: 'crime', when: 'synthetic',
      req: 'AI is not used to imitate a real person\'s face, voice, name or style without written consent, protecting personality and publicity rights recognised by Indian courts and avoiding impersonation offences.', ref: 'Personality rights decisions of the Delhi and Bombay High Courts; IT Act s.66C, s.66D; BNS s.319', iso: '42001 A.9',
      ev: 'Consent records for likeness or voice use.', q: 'Do you get written consent before using AI to copy a real person\'s face, voice or name?' },
    { id: 'AI-IPR-04', t: 'Confidential information and trade secrets protected', pri: 'S', pen: 'contract',
      req: 'Source code, business plans and client confidential information are not entered into AI tools that may retain or train on them, consistent with NDAs and client contracts.', ref: 'Indian Contract Act, 1872 (confidentiality obligations); client NDAs', iso: '27001 A.5.12–A.5.14',
      ev: 'Policy clause; tool settings.', q: 'Are source code, client secrets and confidential plans kept out of AI tools that may store or learn from them?' }
  ]);

  add('ACON', [
    { id: 'AI-CON-01', t: 'Claims about AI are true and substantiated', pri: 'M', pen: 'consumer', when: 'customerAi',
      req: 'Marketing claims about AI capability ("AI-powered", accuracy, results) are accurate and backed by evidence, and AI-generated advertising does not mislead.', ref: 'Consumer Protection Act, 2019 s.2(28), s.21; Guidelines for Prevention of Misleading Advertisements, 2022', iso: '42001 A.8.5',
      ev: 'Marketing material and substantiation file.', q: 'Are your marketing claims about your AI (accuracy, results, "AI-powered") true and backed by evidence?' },
    { id: 'AI-CON-02', t: 'No AI-driven dark patterns', pri: 'M', pen: 'consumer', when: 'customerAi',
      req: 'AI personalisation, chatbots and pricing do not use dark patterns such as false urgency, basket sneaking, confirm shaming, nagging, drip pricing or disguised advertisements.', ref: 'Guidelines for Prevention and Regulation of Dark Patterns, 2023; Consumer Protection Act s.2(47)', iso: '42001 A.9',
      ev: 'Self-audit of user journeys.', q: 'Have you checked that your AI-driven pages, chats and pricing avoid dark patterns like false urgency or hidden charges?' },
    { id: 'AI-CON-03', t: 'AI-generated reviews and endorsements controlled', pri: 'M', pen: 'consumer', when: 'customerAi',
      req: 'AI is not used to write fake reviews or testimonials, and AI-generated influencer or celebrity content is disclosed and authorised.', ref: 'Consumer Protection Act s.2(28); Endorsement guidelines; IS 19000:2022 (online consumer reviews)', iso: '42001 A.9',
      ev: 'Review and endorsement policy.', q: 'Do you ensure AI is never used to write fake reviews, and that AI endorsements are disclosed?' }
  ]);

  add('ASEC2', [
    { id: 'AI-REG-01', t: 'RBI expectations for AI (FREE-AI Framework)', pri: 'S', pen: 'sector', when: 'rbi',
      req: 'As an RBI-regulated entity, AI governance follows the FREE-AI Framework: board-approved AI policy, AI inventory, risk-based controls, consumer disclosure, grievance redress, audit and AI incident reporting; IT and outsourcing directions are applied to AI systems and vendors.', ref: 'RBI Framework for Responsible and Ethical Enablement of AI (FREE-AI), August 2025; RBI Master Directions on IT Governance (2023) and Outsourcing of IT Services (2023)', iso: '42001',
      ev: 'Gap analysis against FREE-AI recommendations.', q: 'As an RBI-regulated entity, have you checked your AI governance against the RBI FREE-AI Framework and the IT directions?' },
    { id: 'AI-REG-02', t: 'SEBI responsibility for AI and ML tools', pri: 'M', crit: true, pen: 'sector', when: 'sebi',
      req: 'As a SEBI-regulated entity, the organisation accepts sole responsibility for AI and ML tools it uses (in-house or third-party): privacy and security of investor data, the output of the tools and compliance with securities laws; AI use is reported to SEBI or the exchange as required.', ref: 'SEBI (Intermediaries) Regulations, 2008 as amended in 2025 (AI and ML tools); SEBI circulars on reporting AI and ML applications', iso: '42001',
      ev: 'AI register; reports to SEBI or exchanges.', q: 'As a SEBI-regulated entity, do you take responsibility for every AI tool you use and report AI use as SEBI requires?' },
    { id: 'AI-REG-03', t: 'IRDAI cyber security and outsourcing rules applied to AI', pri: 'S', pen: 'sector', when: 'irdai',
      req: 'AI systems and vendors used for underwriting, claims or customer service fall within the insurer\'s or broker\'s IRDAI information and cyber security framework and outsourcing controls; AI-driven decisions are fair to policyholders.', ref: 'IRDAI Information and Cyber Security Guidelines, 2023; IRDAI (Protection of Policyholders\' Interests) Regulations, 2024', iso: '42001',
      ev: 'Cyber security policy coverage of AI; vendor approvals.', q: 'Are your AI systems and vendors covered by your IRDAI cyber security and outsourcing controls?' },
    { id: 'AI-REG-04', t: 'AI in healthcare follows ICMR guidelines and device rules', pri: 'M', pen: 'sector', when: 'health',
      req: 'AI used in diagnosis, treatment or health research follows the ICMR ethical guidelines (consent, data protection, validation, clinician accountability); software that qualifies as a medical device is licensed under the Medical Devices Rules; AI does not prescribe without a registered practitioner.', ref: 'ICMR Ethical Guidelines for Application of AI in Biomedical Research and Healthcare, 2023; Medical Devices Rules, 2017; Telemedicine Practice Guidelines, 2020', iso: '42001',
      ev: 'Ethics approvals; CDSCO status; clinical validation.', q: 'If you use AI in healthcare, do you follow the ICMR AI guidelines and check whether the software needs a medical device licence?' },
    { id: 'AI-REG-05', t: 'Foreign AI laws for products offered abroad', pri: 'S', pen: 'sector', when: 'eu',
      req: 'Where AI products or outputs are offered to users in the EU or other regulated markets, the organisation has assessed obligations under the EU AI Act (prohibited practices, AI literacy, transparency, high-risk and general-purpose AI duties on the applicable timetable) and similar laws.', ref: 'EU Artificial Intelligence Act (Regulation (EU) 2024/1689)', iso: '42001',
      ev: 'Foreign law assessment.', q: 'If you offer AI to users in Europe or elsewhere abroad, have you checked the EU AI Act and similar laws?' }
  ]);

  add('AUSE', [
    { id: 'AI-USE-01', t: 'Acceptable-use rules for staff', pri: 'M', crit: true, stat: false, ph: 'ig',
      req: 'Employees and contractors have written rules on which AI tools they may use, what data must never be entered, checking outputs before relying on them, disclosure of AI use in client work, and consequences of misuse.', ref: 'India AI Governance Guidelines, 2025; DPDP Act s.8(5); employment terms', iso: '42001 A.9.4',
      ev: 'Acceptable-use policy and acknowledgements.', q: 'Do staff have written rules on which AI tools they can use and what they must never put into them?' },
    { id: 'AI-USE-02', t: 'Approved tools and control of shadow AI', pri: 'S', stat: false, ph: 'bp',
      req: 'A list of approved AI tools is maintained, enterprise versions with data protections are used, and unapproved AI tools are detected or blocked.', ref: 'Good practice', iso: '42001 A.4.4',
      ev: 'Approved-tool list; network or browser controls.', q: 'Do you have an approved list of AI tools, and can you see or block staff using unapproved ones?' },
    { id: 'AI-USE-03', t: 'AI literacy training', pri: 'S', stat: false, ph: 'ig',
      req: 'Staff who use or oversee AI are trained on its limits (hallucination, bias), data protection, IP and the AI policy, with role-based training for reviewers and developers.', ref: 'India AI Governance Guidelines, 2025 (capacity building); EU AI Act Art. 4 where applicable', iso: '42001 7.2, 7.3',
      ev: 'Training records.', q: 'Have staff who use AI been trained on its limits, data protection and your AI policy?' },
    { id: 'AI-USE-04', t: 'Workplace monitoring using AI is lawful and proportionate', ph: 'dp', pri: 'S', pen: 'dpdp', when: 'monitoring',
      req: 'AI-based employee monitoring (productivity tracking, CCTV analytics, biometric attendance, email scanning) has a lawful basis, is disclosed, proportionate to a stated purpose and not used for decisions without human review.', ref: 'DPDP Act s.5, s.7(i) (employment purposes); Justice K.S. Puttaswamy v. Union of India (2017) proportionality', iso: '27701 7.2',
      ev: 'Monitoring notice; proportionality assessment.', q: 'If you use AI to monitor employees (CCTV analytics, productivity tracking, biometrics), is it disclosed and proportionate?' }
  ]);

  const DOC_TYPES = [
    { id: 'ai-policy', title: 'AI Governance Policy', audience: 'Board, management and all staff', controls: ['AI-GOV-01', 'AI-GOV-02', 'AI-GOV-03', 'AI-GOV-04', 'AI-INV-02'] },
    { id: 'ai-aup', title: 'Employee AI Acceptable Use Policy', audience: 'All employees and contractors', controls: ['AI-USE-01', 'AI-USE-02', 'AI-DAT-07', 'AI-IPR-04'] },
    { id: 'ai-register', title: 'AI System Register and Risk Classification (format)', audience: 'AI owner and oversight forum', controls: ['AI-INV-01', 'AI-INV-02'] },
    { id: 'ai-impact', title: 'AI Impact Assessment (template, with DPDPA questions)', audience: 'Project owners, legal and data protection', controls: ['AI-INV-03', 'AI-DAT-03', 'AI-FAR-01'], when: 'impactful' },
    { id: 'ai-notice', title: 'AI Transparency Notice for Customers and Users', audience: 'Customers and users', controls: ['AI-TRN-01', 'AI-DAT-02', 'AI-TRN-06', 'AI-FAR-04'], when: 'customerAi' },
    { id: 'ai-hr', title: 'Policy on AI in Recruitment and HR Decisions', audience: 'HR, managers and candidates', controls: ['AI-FAR-03', 'AI-FAR-02'], when: 'hr' },
    { id: 'sgi-procedure', title: 'Synthetic Content Labelling and Takedown Procedure', audience: 'Content, trust and safety, and grievance teams', controls: ['AI-TRN-02', 'AI-TRN-03', 'AI-TRN-04', 'AI-TRN-05'], when: 'synthetic' },
    { id: 'ai-incident', title: 'AI Incident Response Procedure (CERT-In and DPDPA)', audience: 'IT, security and data protection teams', controls: ['AI-SEC-02', 'AI-SEC-03', 'AI-SEC-05', 'AI-SEC-06'] },
    { id: 'ai-vendor', title: 'AI Vendor Due Diligence Checklist and Contract Clauses', audience: 'Procurement and legal', controls: ['AI-VND-01', 'AI-VND-02', 'AI-VND-03'] },
    { id: 'ai-grievance', title: 'AI Grievance and Human Review Procedure', audience: 'Customers, users and grievance officer', controls: ['AI-FAR-04', 'AI-FAR-02'], when: 'customerAi' }
  ];

  const F = (k, l, t, extra) => Object.assign({ k, l, t }, extra || {});
  const has = (env, k, v) => Array.isArray(env[k]) && env[k].includes(v);
  const ROLES = ['We use AI tools inside the business (for example ChatGPT, Copilot, Gemini)', 'We build AI features into our products or services', 'We train or fine-tune our own AI models', 'We run a platform where users create or share AI-generated content'];
  const USES = ['Customer chatbot or voice bot', 'Marketing and content generation', 'Recruitment, HR or performance decisions', 'Credit, lending or insurance decisions', 'Fraud detection or KYC', 'Medical or diagnostic support', 'Software development', 'Facial recognition, biometrics or surveillance', 'Pricing, recommendations or personalisation', 'Trading or investment advice', 'Employee monitoring', 'Internal productivity (drafting, summaries, research)'];
  const fw = {
    id: 'ai', code: 'AI', name: 'AI Governance and Compliance Audit', short: 'AI Governance', icon: 'chip',
    tagline: 'Responsible and lawful use of AI under Indian law, DPDPA, the IT Rules and MeitY\'s AI Governance Guidelines',
    criteria: 'Digital Personal Data Protection Act, 2023 and DPDP Rules, 2025; Information Technology Act, 2000 and the IT (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021 as amended by the IT (Amendment) Rules, 2026; CERT-In Directions, 2022; Consumer Protection Act, 2019 and the Dark Patterns Guidelines, 2023; Copyright Act, 1957; Bharatiya Nyaya Sanhita, 2023; Code on Wages, 2019 (s.3), Rights of Persons with Disabilities Act, 2016 and Transgender Persons (Protection of Rights) Act, 2019; sector rules of RBI, SEBI, IRDAI and ICMR where applicable; India AI Governance Guidelines (MeitY, 2025); ISO/IEC 42001:2023 as good-practice reference',
    criteriaShort: 'the Indian laws that apply to the use of artificial intelligence — the Digital Personal Data Protection Act, 2023 and DPDP Rules, 2025, the Information Technology Act, 2000 and the IT Rules, 2021 (including the 2026 amendment on synthetically generated information), the CERT-In Directions, consumer protection, copyright, criminal and equality laws, and sector regulators\' rules — together with the India AI Governance Guidelines issued by MeitY in 2025 and ISO/IEC 42001:2023 as a good-practice reference',
    contextNote: 'India does not yet have a dedicated AI statute. The audit tested AI use against the laws and regulator rules already in force and against the India AI Governance Guidelines, 2025, which are voluntary. Three core governance controls (an approved AI policy, an AI register and written rules for staff) are graded as Must have, because without them an organisation cannot show that it meets its legal duties, including accountability under the DPDP Act. Other controls based only on guidance are graded as Should have or Might have. DPDP Rules obligations that commence on 13 May 2027 were assessed for readiness.',
    stdLabel: 'Related law or guidance',
    certTitle: () => 'Certificate of AI Governance and Compliance',
    certLaw: 'DPDP Act, 2023 · IT Act, 2000 and IT Rules, 2021 (as amended 2026) · India AI Governance Guidelines, 2025',
    certDisclaimer: 'This certificate covers the AI systems listed in the audit scope at the date of the audit. It is not a certification of any AI model\'s accuracy or safety, and it is not issued by any government authority.',
    reportTitle: () => 'AI GOVERNANCE AND COMPLIANCE AUDIT REPORT',
    phases: PHASES, penalties: PENALTIES, domains: DOMAINS, controls: C, docTypes: DOC_TYPES,
    common: ['org'],
    envSections: [{ id: 'aiEnv', title: 'How you use AI', fields: [
      F('aiRole', 'Which of these describe you?', 'multi', { o: S.opt(ROLES), req: true }),
      F('aiUses', 'What do you use AI for?', 'multi', { o: S.opt(USES), req: true }),
      F('aiTools', 'AI tools, models and vendors you use (for example ChatGPT Enterprise, Microsoft Copilot, Gemini, AWS Bedrock, an HR screening tool)', 'textarea', { req: true }),
      F('aiPersonalData', 'Do your AI systems or tools process personal data (customers\', employees\' or anyone else\'s)?', 'bool', { req: true }),
      F('aiChildren', 'Could your AI products be used by, or process data about, children under 18?', 'bool'),
      F('aiSynthetic', 'Do you create, or let users create, AI-generated audio, images or video?', 'bool', { req: true }),
      F('aiPlatformUsers', 'If you run a platform for user content, how many registered users in India?', 'select', { o: S.opt(['Not a platform', 'Under 50 lakh', '50 lakh or more']) }),
      F('aiSdf', 'Has the Government notified you as a Significant Data Fiduciary, or do you process large volumes of sensitive personal data?', 'select', { o: S.opt(['Notified as SDF', 'Possibly (large or sensitive data)', 'No']) }),
      F('aiAbroad', 'Do you offer AI products or AI outputs to users in the EU or other countries?', 'bool'),
      F('aiPolicy', 'Where are you on AI governance today?', 'select', { o: S.opt(['Approved AI policy in place', 'Informal guidance only', 'Nothing yet', 'Not sure']), req: true }),
      null
    ] }],
    flags: (env) => {
      const f = S.commonFlags(env);
      const ind = env.industry || '';
      const uses = (k) => has(env, 'aiUses', k);
      const builds = has(env, 'aiRole', ROLES[1]) || has(env, 'aiRole', ROLES[2]);
      const platform = has(env, 'aiRole', ROLES[3]) || (env.aiPlatformUsers && env.aiPlatformUsers !== 'Not a platform');
      const impactful = ['Recruitment, HR or performance decisions', 'Credit, lending or insurance decisions', 'Medical or diagnostic support', 'Facial recognition, biometrics or surveillance', 'Fraud detection or KYC', 'Trading or investment advice'].some(uses);
      return Object.assign(f, {
        builds, trains: has(env, 'aiRole', ROLES[2]), platform: !!platform, ssmi: env.aiPlatformUsers === '50 lakh or more',
        pd: env.aiPersonalData !== false, children: env.aiChildren === true, synthetic: env.aiSynthetic === true || !!platform,
        sdf: env.aiSdf === 'Notified as SDF' || env.aiSdf === 'Possibly (large or sensitive data)',
        impactful, hr: uses('Recruitment, HR or performance decisions'), monitoring: uses('Employee monitoring') || uses('Facial recognition, biometrics or surveillance'),
        customerAi: builds || !!platform || uses('Customer chatbot or voice bot') || uses('Pricing, recommendations or personalisation') || uses('Credit, lending or insurance decisions') || uses('Trading or investment advice'),
        rbi: /RBI/.test(ind), sebi: /SEBI/.test(ind), irdai: /IRDAI/.test(ind), health: /Healthcare|Pharma/.test(ind) || uses('Medical or diagnostic support'),
        eu: env.aiAbroad === true
      });
    },
    roleLabel: (f) => (f.platform ? 'Intermediary hosting AI-generated content' + (f.ssmi ? ' (significant social media intermediary)' : '') : f.builds ? 'Developer and deployer of AI systems' : 'Deployer (user) of AI tools'),
    roleCaption: 'AI role',
    applicabilityRows: (f, env) => [
      ['AI role', f.platform ? 'Platform for AI content' : f.builds ? 'Builds AI into products' + (f.trains ? ' and trains models' : '') : 'Uses third-party AI tools'],
      ['DPDPA (personal data in AI)', f.pd ? 'Applies' : 'Not on the facts given'],
      ['IT Rules on synthetic content (2026)', f.ssmi ? 'Apply, including declaration and verification duties' : f.platform ? 'Apply as an intermediary' : f.synthetic ? 'Labelling expected for synthetic content' : 'Do not apply on the facts given'],
      ['High-impact uses on individuals', f.impactful ? 'Yes: impact assessment, bias testing and human oversight required' : 'None reported'],
      ['AI in HR decisions', f.hr ? 'Yes: equality laws apply' : 'No'],
      ['Children', f.children ? 'Yes: DPDP s.9 restrictions apply' : 'No'],
      ['Sector rules', [f.rbi && 'RBI', f.sebi && 'SEBI', f.irdai && 'IRDAI', f.health && 'Health (ICMR, CDSCO)'].filter(Boolean).join(', ') || 'None identified'],
      ['Foreign AI laws (EU AI Act)', f.eu ? 'Assessment required' : 'Not applicable on the facts given']
    ],
    landscapeTitle: 'AI landscape',
    landscapeRows: (env) => [['AI role', (env.aiRole || []).join('; ')], ['Uses of AI', (env.aiUses || []).join(', ')], ['Tools, models and vendors', env.aiTools || ''], ['Personal data in AI', env.aiPersonalData === false ? 'No' : 'Yes'], ['Synthetic media', env.aiSynthetic ? 'Yes' : 'No'], ['Platform users in India', env.aiPlatformUsers || ''], ['Current AI governance', env.aiPolicy || '']],
    glossary: [
      ['AI system', 'A machine-based system that generates outputs such as predictions, content, recommendations or decisions from the inputs it receives.'],
      ['Synthetically generated information', 'Audio, visual or audio-visual content artificially or algorithmically created or altered so that it appears real and is indistinguishable from a real person or event (IT Rules, 2021 as amended in 2026).'],
      ['Deployer', 'An organisation that uses an AI system under its authority, as opposed to the developer that builds it.'],
      ['Human oversight', 'Review of AI outputs by a trained person who can intervene or override before a decision takes effect.'],
      ['AI impact assessment', 'A documented assessment of an AI system\'s effects on individuals and the organisation before and during use (ISO/IEC 42005).'],
      ['ISO/IEC 42001', 'The international standard for an AI management system, adopted in India by the Bureau of Indian Standards.']
    ],
    scopeDefault: (env, name) => 'Development, procurement and use of artificial intelligence systems by ' + name + ' in India, as listed in the AI register'
  };
  fw.envSections[0].fields[10] = S.existingDocsField(fw);
  S.registerFramework(fw);
})(typeof window !== 'undefined' ? window : globalThis);
