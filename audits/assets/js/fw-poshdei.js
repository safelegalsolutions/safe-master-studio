/* SAFE Legal Workplace Compliance Audits — POSH and DEI framework (Workplace Equality and Safety)
 * Sexual Harassment of Women at Workplace (Prevention, Prohibition and Redressal) Act, 2013 and Rules, 2013 ("POSH");
 * Rights of Persons with Disabilities Act, 2016 ("RPwD"); Transgender Persons (Protection of Rights) Act, 2019 and Rules, 2020;
 * Code on Wages, 2019 s.3; Code on Social Security, 2020 (maternity); HIV and AIDS (Prevention and Control) Act, 2017;
 * Mental Healthcare Act, 2017; Companies Act, 2013 s.149; SEBI LODR and BRSR.
 */
(function (root) {
  const S = root.SAFE;
  const PHASES = { p1: { date: '', label: 'In force' }, bp: { date: '', label: 'Good practice' } };
  const PENALTIES = {
    posh: { max: 0, label: 'POSH Act s.26 — fine up to ₹50,000; on repetition, twice the punishment and possible cancellation of licence or registration' },
    rpwd: { max: 0, label: 'RPwD Act s.89 — fine up to ₹10,000 for a first contravention; ₹50,000 to ₹5 lakh for subsequent contraventions' },
    wages: { max: 0, label: 'Code on Wages s.54 — fine up to ₹50,000; higher punishment on repetition' },
    ss: { max: 0, label: 'Code on Social Security — fine and other penalties for denial of maternity benefit' },
    other: { max: 0, label: 'Penalty or liability under the applicable law, including civil claims for discrimination' },
    none: { max: 0, label: 'No direct penalty (good practice)' }
  };
  const DOMAINS = [
    { id: 'PICC', name: 'Internal Committee (POSH)' },
    { id: 'PPOL', name: 'POSH policy, awareness and training' },
    { id: 'PCMP', name: 'Complaint handling and inquiry' },
    { id: 'PREP', name: 'POSH reporting and disclosure' },
    { id: 'DDIS', name: 'Persons with disabilities' },
    { id: 'DTGP', name: 'Transgender persons' },
    { id: 'DPAY', name: 'Pay equity, maternity and family benefits' },
    { id: 'DHLT', name: 'HIV status and mental health' },
    { id: 'DBRD', name: 'Board diversity and disclosures' },
    { id: 'DCUL', name: 'DEI policy, data and culture' }
  ];
  const C = [];
  const add = (d, list) => list.forEach((c) => C.push(Object.assign({ d, when: '', ph: 'p1', pen: 'none', stat: true, crit: false, iso: '' }, c)));

  add('PICC', [
    { id: 'PD-ICC-01', t: 'Internal Committee constituted at every office or branch', pri: 'M', crit: true, pen: 'posh', when: 'hc10',
      req: 'An Internal Committee is constituted by written order at each office or administrative unit with 10 or more employees (or a single committee validly covering several locations).', ref: 'POSH s.4(1)', ev: 'Constitution orders for each location.', q: 'Is there a written order constituting an Internal Committee covering every office or branch with 10 or more employees?' },
    { id: 'PD-ICC-02', t: 'Composition of the Internal Committee', pri: 'M', crit: true, pen: 'posh', when: 'hc10',
      req: 'The Presiding Officer is a woman employed at a senior level; at least two members are employees committed to the cause of women or with legal or social work experience; one external member is from an NGO or association committed to women\'s causes or familiar with sexual harassment issues; at least half the members are women.', ref: 'POSH s.4(2)', ev: 'Member list with designations, gender and external member credentials.', q: 'Is the Committee headed by a senior woman, with at least two employee members, one external member from an NGO or legal background, and at least half women?' },
    { id: 'PD-ICC-03', t: 'Term of members and vacancies filled', pri: 'M', pen: 'posh', when: 'hc10',
      req: 'Members hold office for no more than three years; vacancies are filled promptly; members who breach confidentiality or are found guilty of misconduct are removed.', ref: 'POSH s.4(3)–(5)', ev: 'Appointment dates; reconstitution orders.', q: 'Are Committee members within their three-year term, with vacancies filled?' },
    { id: 'PD-ICC-04', t: 'External member fees and independence', pri: 'S', pen: 'posh', when: 'hc10',
      req: 'The external member is paid fees or allowances as prescribed and is independent of the organisation.', ref: 'POSH s.4(4); POSH Rules r.4', ev: 'Engagement letter and fee payments.', q: 'Is the external member independent of the company and paid as the Rules provide?' },
    { id: 'PD-ICC-05', t: 'Committee members trained', pri: 'S', when: 'hc10',
      req: 'Internal Committee members receive orientation and skill-building on inquiry procedure, evidence and the law.', ref: 'POSH s.19(c); POSH Rules r.13', ev: 'Training records and content.', q: 'Have Committee members been trained on how to run an inquiry under the Act?' }
  ]);

  add('PPOL', [
    { id: 'PD-POL-01', t: 'Written POSH policy', pri: 'M', crit: true, pen: 'posh',
      req: 'A written policy prohibits sexual harassment, explains what it is, the complaint procedure, Internal Committee details, consequences and protection against retaliation, and covers all employees, interns, contract staff and visitors.', ref: 'POSH s.19; POSH Rules r.13', ev: 'Approved policy with version date and circulation proof.', q: 'Do you have a written POSH policy that covers all staff, interns, contract workers and visitors?' },
    { id: 'PD-POL-02', t: 'Display of consequences and Committee details', pri: 'M', pen: 'posh',
      req: 'The penal consequences of sexual harassment and the order constituting the Internal Committee are displayed at a conspicuous place in the workplace.', ref: 'POSH s.19(b)', ev: 'Photographs of notices at each location and on the intranet.', q: 'Are the consequences of sexual harassment and the Committee members\' details displayed at every workplace?' },
    { id: 'PD-POL-03', t: 'Awareness workshops for employees', pri: 'M', pen: 'posh',
      req: 'Workshops and awareness programmes are organised at regular intervals to sensitise employees to the Act.', ref: 'POSH s.19(c)', ev: 'Training calendar and attendance (at least annually).', q: 'Do all employees attend a POSH awareness session at least once a year?' },
    { id: 'PD-POL-04', t: 'Safe working environment, including for visitors', pri: 'M', pen: 'posh',
      req: 'The employer provides a safe working environment, including safety from persons coming into contact at the workplace, and assists a woman who wishes to file a criminal complaint.', ref: 'POSH s.19(a), (g)', ev: 'Visitor and client conduct clauses; security measures.', q: 'Do you have measures to protect employees from harassment by clients, vendors and visitors, and help a complainant approach the police if she wishes?' }
  ]);

  add('PCMP', [
    { id: 'PD-CMP-01', t: 'Complaints received and acknowledged within limitation', pri: 'M', pen: 'posh', when: 'hc10',
      req: 'Written complaints are accepted within three months of the incident (extendable by a further three months for reasons recorded), with assistance in writing the complaint where needed.', ref: 'POSH s.9', ev: 'Complaint register; acknowledgements.', q: 'Is there a clear way to file a written complaint, accepted within three months of the incident (extendable by three months)?' },
    { id: 'PD-CMP-02', t: 'Conciliation only at the complainant\'s request, without money', pri: 'M', pen: 'posh', when: 'hc10',
      req: 'Conciliation is attempted only if the complainant requests it, and no monetary settlement is the basis of conciliation.', ref: 'POSH s.10', ev: 'Conciliation records, if any.', q: 'Is conciliation used only when the complainant asks for it, and never with a money settlement?' },
    { id: 'PD-CMP-03', t: 'Inquiry completed within 90 days following natural justice', pri: 'M', crit: true, pen: 'posh', when: 'hc10',
      req: 'The inquiry follows service rules or the POSH Rules procedure, gives both parties a hearing, is completed within 90 days, and the report is given to the employer within 10 days of completion.', ref: 'POSH s.11, s.13(1); POSH Rules r.7', ev: 'Inquiry files with dates.', q: 'Are inquiries completed within 90 days with both sides heard, and reports issued within 10 days?' },
    { id: 'PD-CMP-04', t: 'Action on the report within 60 days and interim relief', pri: 'M', pen: 'posh', when: 'hc10',
      req: 'The employer acts on the Committee\'s recommendations within 60 days and grants interim relief (transfer, leave) during the inquiry when recommended.', ref: 'POSH s.12, s.13(4)', ev: 'Action-taken records.', q: 'Does management act on the Committee\'s recommendations within 60 days and give interim relief when asked?' },
    { id: 'PD-CMP-05', t: 'Confidentiality', pri: 'M', pen: 'posh', when: 'hc10',
      req: 'The identity of the complainant, respondent and witnesses, the inquiry proceedings and the recommendations are not published or disclosed to the public, press or media.', ref: 'POSH s.16, s.17', ev: 'Confidentiality undertakings; access controls on files.', q: 'Are POSH case details kept strictly confidential, with restricted access to the files?' },
    { id: 'PD-CMP-06', t: 'No retaliation and appeal rights explained', pri: 'S', pen: 'posh', when: 'hc10',
      req: 'Complainants and witnesses are protected from victimisation, and parties are told of their right to appeal within 90 days.', ref: 'POSH s.18; POSH policy', ev: 'Policy clause; communications to parties.', q: 'Are complainants and witnesses protected from retaliation, and told about their right to appeal?' }
  ]);

  add('PREP', [
    { id: 'PD-REP-01', t: 'Internal Committee annual report to the employer and District Officer', pri: 'M', crit: true, pen: 'posh', when: 'hc10',
      req: 'The Internal Committee prepares an annual report (complaints received, disposed, pending over 90 days, workshops held, action taken) and submits it to the employer and the District Officer.', ref: 'POSH s.21; POSH Rules r.14', ev: 'Annual reports and proof of submission (for example on the state portal).', q: 'Does the Committee prepare its annual report and is it sent to the District Officer every year?' },
    { id: 'PD-REP-02', t: 'Disclosure in the annual report / Board report', pri: 'M', pen: 'posh', when: 'company',
      req: 'The organisation\'s annual report discloses the number of POSH cases filed and their disposal; companies state in the Board report that they have complied with the Internal Committee requirement and give complaint numbers as the Companies (Accounts) Rules require.', ref: 'POSH s.22; Companies (Accounts) Rules, r.8(5)(x)', ev: 'Extract of the latest Board report.', q: 'Does your Board report state compliance with the POSH Internal Committee requirement and give the number of complaints?' },
    { id: 'PD-REP-03', t: 'Registration on the state or national POSH portal', pri: 'S', pen: 'posh', when: 'hc10',
      req: 'Where the state or the SHe-Box portal requires, the Internal Committee details are registered and kept current.', ref: 'State directions; SHe-Box', ev: 'Portal registration screenshot.', q: 'Are your Internal Committee details registered on the state or SHe-Box portal where required?' }
  ]);

  add('DDIS', [
    { id: 'PD-DIS-01', t: 'Equal Opportunity Policy for persons with disabilities', pri: 'M', crit: true, pen: 'rpwd',
      req: 'The establishment has notified an Equal Opportunity Policy setting out measures for persons with disabilities (posts identified, facilities, accommodations, training, preference in transfers), displayed on its website or premises and registered with the Chief Commissioner or State Commissioner.', ref: 'RPwD s.21; RPwD Rules, 2017 r.8', ev: 'Equal Opportunity Policy; website link; registration proof.', q: 'Have you published an Equal Opportunity Policy for persons with disabilities and registered it with the Commissioner?' },
    { id: 'PD-DIS-02', t: 'No discrimination and reasonable accommodation', pri: 'M', pen: 'rpwd',
      req: 'No employee is discriminated against on the ground of disability; reasonable accommodation and a barrier-free environment are provided; no one is denied promotion only because of disability.', ref: 'RPwD s.20', ev: 'Accommodation requests log; HR policy.', q: 'Do you provide reasonable accommodations and ensure no one is denied a job or promotion because of disability?' },
    { id: 'PD-DIS-03', t: 'Grievance Redressal Officer for disability complaints', pri: 'M', pen: 'rpwd',
      req: 'A Grievance Redressal Officer is appointed, the appointment is notified to the Commissioner, and a register of complaints is maintained and acted on within two weeks.', ref: 'RPwD s.23', ev: 'Appointment order; complaints register.', q: 'Have you appointed a Grievance Redressal Officer for disability-related complaints and kept a register?' },
    { id: 'PD-DIS-04', t: 'Accessibility of premises and digital systems', pri: 'S', pen: 'rpwd',
      req: 'Buildings, transport and information and communication technology (websites, apps, HR systems) meet the accessibility standards notified.', ref: 'RPwD s.40–s.46; Accessibility standards', ev: 'Accessibility audit of premises and digital systems.', q: 'Are your premises, website and internal systems accessible to persons with disabilities?' }
  ]);

  add('DTGP', [
    { id: 'PD-TGP-01', t: 'No discrimination against transgender persons', pri: 'M', pen: 'other',
      req: 'No transgender person is discriminated against in recruitment, promotion or other matters of employment.', ref: 'Transgender Persons Act s.3, s.9', ev: 'HR policy clauses; recruitment practice.', q: 'Do your policies prohibit discrimination against transgender persons in hiring, promotion and benefits?' },
    { id: 'PD-TGP-02', t: 'Equal opportunity policy and facilities for transgender persons', pri: 'M', pen: 'other',
      req: 'The establishment has an equal opportunity policy for transgender persons and provides infrastructure such as unisex toilets, hygiene products and confidentiality of gender identity, as the Rules require.', ref: 'Transgender Persons Act s.10; Transgender Persons Rules, 2020', ev: 'Policy and facility details.', q: 'Do you have an equal opportunity policy and facilities (for example unisex toilets) for transgender persons?' },
    { id: 'PD-TGP-03', t: 'Complaint officer for transgender persons', pri: 'M', pen: 'other',
      req: 'A person is designated as complaint officer to deal with complaints of violation of the Act.', ref: 'Transgender Persons Act s.11', ev: 'Designation order.', q: 'Have you designated a complaint officer for complaints under the Transgender Persons Act?' }
  ]);

  add('DPAY', [
    { id: 'PD-PAY-01', t: 'Equal pay for the same or similar work', pri: 'M', crit: true, pen: 'wages',
      req: 'There is no discrimination on the ground of gender (including transgender identity) in wages, recruitment or conditions of employment for the same or similar work.', ref: 'Code on Wages s.3', ev: 'Pay-equity analysis by grade and role; remediation of gaps.', q: 'Have you analysed pay by gender for the same or similar roles and corrected any unexplained gap?' },
    { id: 'PD-PAY-02', t: 'Maternity benefit and protection from dismissal', pri: 'M', crit: true, pen: 'ss', when: 'women',
      req: 'Eligible women receive maternity benefit (up to 26 weeks; 12 weeks for adopting or commissioning mothers), nursing breaks and work-from-home where the work allows, and are not dismissed or disadvantaged because of maternity.', ref: 'Code on Social Security, Chapter VI', ev: 'Maternity policy; leave and pay records; return-to-work data.', q: 'Do women receive full maternity benefit and return to work without loss of role or pay?' },
    { id: 'PD-PAY-03', t: 'Crèche facility', pri: 'M', pen: 'ss', when: 'hc50',
      req: 'Establishments with 50 or more employees provide a crèche facility (own, shared or within the prescribed distance).', ref: 'Code on Social Security s.67', ev: 'Crèche arrangement.', q: 'With 50 or more employees, do you provide access to a crèche?' },
    { id: 'PD-PAY-04', t: 'Night work and safety of women employees', pri: 'M', pen: 'other', when: 'nightWomen',
      req: 'Women work at night only with consent and with the safeguards (transport, security, adequate number of women on the shift) required by law.', ref: 'OSH Code s.43; state Shops and Establishments law', ev: 'Consent forms; transport and security arrangements.', q: 'For women on night shifts, do you have consent and the transport and security safeguards in place?' },
    { id: 'PD-PAY-05', t: 'Family-friendly benefits', pri: 'W', stat: false, ph: 'bp',
      req: 'Paternity, adoption, caregiver leave and flexible working are offered on a gender-neutral basis.', ref: 'Good practice', ev: 'Benefits policy.', q: 'Do you offer paternity, adoption or caregiver leave and flexible working to all genders?' }
  ]);

  add('DHLT', [
    { id: 'PD-HLT-01', t: 'No HIV-based discrimination or compulsory testing', pri: 'M', pen: 'other',
      req: 'No person is discriminated against in employment on the ground of HIV status, no HIV test is required as a condition of employment, and HIV status is kept confidential.', ref: 'HIV and AIDS Act s.3, s.4, s.8', ev: 'Policy; pre-employment medical forms.', q: 'Do your hiring and medical processes avoid HIV testing as a condition of employment and keep health status confidential?' },
    { id: 'PD-HLT-02', t: 'Complaints officer under the HIV and AIDS Act', pri: 'M', pen: 'other', when: 'hc100',
      req: 'Establishments with 100 or more persons designate a complaints officer to deal with complaints of violation of the Act.', ref: 'HIV and AIDS Act s.21', ev: 'Designation order.', q: 'With 100 or more people, have you designated a complaints officer under the HIV and AIDS Act?' },
    { id: 'PD-HLT-03', t: 'Equal treatment for persons with mental illness', pri: 'S', pen: 'other',
      req: 'Persons with mental illness are treated equally, and employee assistance or mental health support is available without discrimination.', ref: 'Mental Healthcare Act, 2017 s.18, s.21', ev: 'Policy; employee assistance programme.', q: 'Do your policies ensure equal treatment of employees with mental health conditions, with support available?' }
  ]);

  add('DBRD', [
    { id: 'PD-BRD-01', t: 'Woman director on the Board', pri: 'M', pen: 'other', when: 'womanDirector',
      req: 'Listed companies and public companies above the prescribed thresholds (paid-up capital of ₹100 crore or turnover of ₹300 crore) have at least one woman director; the top listed companies have at least one woman independent director.', ref: 'Companies Act s.149(1), second proviso; Companies (Appointment and Qualification of Directors) Rules r.3; SEBI LODR Reg. 17(1)(a)', ev: 'Board composition from MCA records.', q: 'Does your Board include the woman director (and, if listed, the woman independent director) required by law?' },
    { id: 'PD-BRD-02', t: 'Accurate diversity disclosures in BRSR', pri: 'M', pen: 'other', when: 'listed',
      req: 'Gender, disability, pay and POSH figures in the Business Responsibility and Sustainability Report are accurate and supported by records.', ref: 'SEBI LODR Reg. 34(2)(f); BRSR format', ev: 'BRSR extract reconciled with HR data.', q: 'Are the diversity, disability and POSH figures in your BRSR backed by HR records?' }
  ]);

  add('DCUL', [
    { id: 'PD-CUL-01', t: 'DEI policy and anti-discrimination statement', pri: 'S', stat: false, ph: 'bp',
      req: 'A board- or management-approved policy commits to diversity, equity and inclusion and prohibits discrimination on protected grounds, with a grievance route.', ref: 'Good practice; Constitution of India Arts. 14–16 (public employers)', ev: 'Approved DEI policy.', q: 'Do you have an approved DEI and anti-discrimination policy with a clear grievance route?' },
    { id: 'PD-CUL-02', t: 'Inclusive recruitment and promotion', pri: 'S', stat: false, ph: 'bp',
      req: 'Job descriptions, interview panels and promotion criteria are reviewed for bias; diverse shortlists are sought.', ref: 'Good practice', ev: 'Recruitment guidelines; panel composition.', q: 'Are job adverts, interview panels and promotion criteria checked for bias?' },
    { id: 'PD-CUL-03', t: 'Diversity data collected lawfully', pri: 'S', stat: false, ph: 'bp',
      req: 'Diversity data is collected voluntarily, with notice and consent where required, stored securely and used in aggregate.', ref: 'DPDP Act, 2023 (where applicable); good practice', ev: 'Survey notice; access controls.', q: 'Is diversity data collected voluntarily, with a notice, and kept secure?' },
    { id: 'PD-CUL-04', t: 'Sensitisation training for managers', pri: 'W', stat: false, ph: 'bp', pen: 'none',
      req: 'Managers receive training on unconscious bias, inclusive leadership, disability etiquette and gender identity.', ref: 'Good practice', ev: 'Training records.', q: 'Do managers receive training on bias and inclusive leadership?' },
    { id: 'PD-CUL-05', t: 'DEI metrics reviewed by leadership', pri: 'W', stat: false, ph: 'bp', pen: 'none',
      req: 'Leadership reviews representation, pay equity, attrition and grievance metrics at least annually, with targets.', ref: 'Good practice', ev: 'DEI dashboard and minutes.', q: 'Does leadership review DEI metrics at least once a year?' }
  ]);

  const DOC_TYPES = [
    { id: 'posh-policy', title: 'POSH Policy (Prevention of Sexual Harassment)', audience: 'All staff, interns, contract workers and visitors', controls: ['PD-POL-01', 'PD-POL-04', 'PD-CMP-01', 'PD-CMP-05', 'PD-CMP-06'] },
    { id: 'ic-order', title: 'Internal Committee Constitution Order', audience: 'All staff', controls: ['PD-ICC-01', 'PD-ICC-02', 'PD-ICC-03'], when: 'hc10' },
    { id: 'ic-annual-report', title: 'Internal Committee Annual Report (format)', audience: 'Employer and District Officer', controls: ['PD-REP-01'], when: 'hc10' },
    { id: 'eop-disability', title: 'Equal Opportunity Policy for Persons with Disabilities', audience: 'All staff; Commissioner for Persons with Disabilities', controls: ['PD-DIS-01', 'PD-DIS-02', 'PD-DIS-03'] },
    { id: 'eop-transgender', title: 'Equal Opportunity Policy for Transgender Persons', audience: 'All staff', controls: ['PD-TGP-01', 'PD-TGP-02', 'PD-TGP-03'] },
    { id: 'hiv-policy', title: 'HIV/AIDS and Health Non-Discrimination Policy', audience: 'All staff', controls: ['PD-HLT-01', 'PD-HLT-02', 'PD-HLT-03'] },
    { id: 'maternity-policy', title: 'Maternity, Crèche and Family Benefits Policy', audience: 'Employees', controls: ['PD-PAY-02', 'PD-PAY-03', 'PD-PAY-05'], when: 'women' },
    { id: 'dei-policy', title: 'Diversity, Equity and Inclusion Policy', audience: 'All staff', controls: ['PD-CUL-01', 'PD-CUL-02', 'PD-CUL-03'] },
    { id: 'grievance-officers', title: 'Order designating grievance and complaint officers (RPwD, Transgender Persons and HIV Acts)', audience: 'All staff', controls: ['PD-DIS-03', 'PD-TGP-03', 'PD-HLT-02'] }
  ];

  const F = (k, l, t, extra) => Object.assign({ k, l, t }, extra || {});
  const fw = {
    id: 'poshdei', code: 'POSHDEI', name: 'POSH and DEI Compliance Audit', short: 'POSH & DEI', icon: 'balance',
    tagline: 'Prevention of sexual harassment, and diversity, equity and inclusion obligations',
    criteria: 'Sexual Harassment of Women at Workplace (Prevention, Prohibition and Redressal) Act, 2013 and Rules, 2013; Rights of Persons with Disabilities Act, 2016; Transgender Persons (Protection of Rights) Act, 2019 and Rules, 2020; Code on Wages, 2019 (s.3); Code on Social Security, 2020 (maternity benefit); HIV and AIDS (Prevention and Control) Act, 2017; Mental Healthcare Act, 2017; Companies Act, 2013 (s.149) and SEBI LODR where applicable',
    criteriaShort: 'the Sexual Harassment of Women at Workplace (Prevention, Prohibition and Redressal) Act, 2013 and its Rules (POSH), and the laws on equal opportunity and non-discrimination: the Rights of Persons with Disabilities Act, 2016, the Transgender Persons (Protection of Rights) Act, 2019, the Code on Wages, 2019, the Code on Social Security, 2020, the HIV and AIDS (Prevention and Control) Act, 2017, the Mental Healthcare Act, 2017 and, where applicable, the Companies Act, 2013 and SEBI regulations',
    stdLabel: 'Related law',
    certTitle: () => 'Certificate of POSH and DEI Compliance',
    certLaw: 'POSH Act, 2013 · RPwD Act, 2016 · Transgender Persons Act, 2019 · Code on Wages, 2019 · Code on Social Security, 2020',
    certDisclaimer: 'This certificate is not issued by any government authority and does not replace the annual report the Internal Committee must submit to the District Officer.',
    reportTitle: () => 'POSH AND DEI COMPLIANCE AUDIT REPORT',
    phases: PHASES, penalties: PENALTIES, domains: DOMAINS, controls: C, docTypes: DOC_TYPES,
    common: ['org', 'workforce'],
    envSections: [{ id: 'poshEnv', title: 'POSH and inclusion today', fields: [
      F('icStatus', 'Internal Committee status', 'select', { o: S.opt(['Constituted at all locations', 'Constituted at some locations', 'Not constituted', 'Not sure']), req: true }),
      F('complaints', 'POSH complaints received in the last 12 months', 'select', { o: S.opt(['None', '1–2', '3–10', 'More than 10']) }),
      F('pwdEmployees', 'Do you employ persons with disabilities?', 'bool'),
      F('transEmployees', 'Do you have (or expect to have) transgender employees?', 'select', { o: S.opt(['Yes', 'No', 'Not known']) }),
      null
    ] }],
    flags: (env) => {
      const f = S.commonFlags(env);
      const big = ['₹250–1,000 crore', 'Over ₹1,000 crore'].includes(env.turnover);
      return Object.assign(f, { hc10: f.hc >= 10, hc50: f.hc >= 50, hc100: f.hc >= 100, womanDirector: f.listed || (f.publicCo && big) });
    },
    roleLabel: (f) => (f.hc >= 10 ? 'Employer required to constitute an Internal Committee' : 'Employer below 10 employees (Local Committee jurisdiction)'),
    roleCaption: 'Status under POSH',
    applicabilityRows: (f, env) => [
      ['Internal Committee', f.hc >= 10 ? 'Required at every office or branch with 10 or more employees' : 'Not required; complaints go to the Local Committee'],
      ['Women employees', env.women || '—'],
      ['Crèche (Social Security Code)', f.hc >= 50 ? 'Required (50 or more employees)' : 'Not required'],
      ['HIV Act complaints officer', f.hc >= 100 ? 'Required (100 or more persons)' : 'Not required'],
      ['Woman director', f.womanDirector ? 'Required' : 'Not required on the facts given'],
      ['BRSR disclosures', f.listed ? 'Apply' : 'Do not apply']
    ],
    landscapeTitle: 'Workforce and inclusion profile',
    landscapeRows: (env) => [['Workplaces', (env.establishments || []).join(', ')], ['Women employees', env.women || ''], ['Internal Committee', env.icStatus || ''], ['POSH complaints (12 months)', env.complaints || ''], ['Employees with disabilities', env.pwdEmployees ? 'Yes' : 'No / not reported'], ['Transgender employees', env.transEmployees || ''], ['Women on night shifts', env.nightShiftWomen ? 'Yes' : 'No']],
    glossary: [['Internal Committee', 'The committee constituted by the employer under section 4 of the POSH Act.'], ['Local Committee', 'The committee constituted by the District Officer for workplaces with fewer than 10 employees, among others.'], ['Reasonable accommodation', 'Necessary and appropriate modification and adjustments to ensure persons with disabilities enjoy rights equally (RPwD s.2(y)).'], ['Equal Opportunity Policy', 'The policy every establishment must notify under section 21 of the RPwD Act.']],
    scopeDefault: (env, name) => 'Workplace safety, equality and inclusion practices of ' + name + ' at its workplaces in India'
  };
  fw.envSections[0].fields[4] = S.existingDocsField(fw);
  S.registerFramework(fw);
})(typeof window !== 'undefined' ? window : globalThis);
