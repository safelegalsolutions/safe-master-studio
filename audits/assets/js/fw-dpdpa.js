/* SAFE Legal Workplace Compliance Audits — DPDPA framework (control library)
 * Every control maps to the Digital Personal Data Protection Act, 2023 ("Act"), the
 * DPDP Rules, 2025 ("Rules", G.S.R. 846(E), 13 Nov 2025), and ISO/IEC 27701 themes.
 *
 * pri   : M = Must have (statutory; failure = Major nonconformity)
 *         S = Should have (expected practice / partial statutory; failure = Minor nonconformity)
 *         W = Might have (good practice; gap = Opportunity for Improvement)
 * stat  : true when the control restates a legal obligation (never graded below Minor when unmet)
 * crit  : true when even a partial gap is a Major nonconformity
 * when  : applicability flag (see SAFE.applicability); empty = applies to every Data Fiduciary
 * ph    : commencement phase — p1 13 Nov 2025, p2 13 Nov 2026, p3 13 May 2027
 * pen   : Schedule penalty bracket key (see SAFE.PENALTIES)
 * ev    : evidence a reviewer expects to see
 * q     : the base question put to the client (SAFE AI adds follow-ups)
 */
(function (root) {
  const S = (root.SAFE = root.SAFE || {});

  const PHASES = {
    p1: { date: '2025-11-13', label: 'In force from 13 Nov 2025' },
    p2: { date: '2026-11-13', label: 'In force from 13 Nov 2026' },
    p3: { date: '2027-05-13', label: 'In force from 13 May 2027' },
    bp: { date: '', label: 'Good practice (no statutory date)' }
  };

  const PENALTIES = {
    sec:    { max: 250, label: 'Failure to take reasonable security safeguards — up to ₹250 crore' },
    breach: { max: 200, label: 'Failure to intimate a personal data breach — up to ₹200 crore' },
    child:  { max: 200, label: 'Breach of obligations for children — up to ₹200 crore' },
    sdf:    { max: 150, label: 'Breach of Significant Data Fiduciary obligations — up to ₹150 crore' },
    other:  { max: 50,  label: 'Breach of any other provision of the Act or Rules — up to ₹50 crore' },
    none:   { max: 0,   label: 'No direct penalty (good practice)' }
  };

  const DOMAINS = [
    { id: 'GOV', name: 'Governance and accountability', icon: 'shield' },
    { id: 'MAP', name: 'Personal data inventory and mapping', icon: 'map' },
    { id: 'LAW', name: 'Lawful processing and legitimate uses', icon: 'scale' },
    { id: 'NOT', name: 'Notice to Data Principals', icon: 'doc' },
    { id: 'CON', name: 'Consent and Consent Managers', icon: 'check' },
    { id: 'RIG', name: 'Data Principal rights and grievance redressal', icon: 'user' },
    { id: 'CHD', name: 'Children and persons with disability', icon: 'child' },
    { id: 'SEC', name: 'Reasonable security safeguards', icon: 'lock' },
    { id: 'BRE', name: 'Personal data breach management', icon: 'alert' },
    { id: 'RET', name: 'Retention and erasure', icon: 'clock' },
    { id: 'PRO', name: 'Data Processors and third parties', icon: 'link' },
    { id: 'XBT', name: 'Transfer outside India', icon: 'globe' },
    { id: 'SDF', name: 'Significant Data Fiduciary obligations', icon: 'star' },
    { id: 'SEC2', name: 'Sector regulator overlays', icon: 'bank' },
    { id: 'CUL', name: 'Privacy by design, training and culture', icon: 'spark' }
  ];

  const C = [];
  const add = (d, list) => list.forEach((c) => C.push(Object.assign({ d, when: '', ph: 'p3', pen: 'other', stat: true, crit: false, iso: '' }, c)));

  // ---------------------------------------------------------------- Governance
  add('GOV', [
    { id: 'GOV-01', t: 'Accountability for processing, including by processors', pri: 'M', crit: true,
      req: 'The organisation accepts responsibility for complying with the Act for all processing it undertakes or that is undertaken on its behalf by a Data Processor.', ref: 'Act s.8(1)', iso: '27701 5.2, 7.2',
      ev: 'Board or management resolution adopting the data protection programme; approved Data Protection Policy naming accountability.', q: 'Has the Board or top management formally adopted a data protection policy and accepted accountability for DPDPA compliance, including work done by vendors?' },
    { id: 'GOV-02', t: 'Data Protection Policy approved and communicated', pri: 'M',
      req: 'A written data protection and privacy policy that sets out how the organisation meets each obligation under the Act and the Rules, approved by management and communicated to staff.', ref: 'Act s.8(1), s.8(4)', iso: '27701 6.2 (policy)',
      ev: 'Approved policy with version control, approval date and evidence of circulation.', q: 'Do you have a written internal Data Protection and Privacy Policy that is approved and circulated to staff?' },
    { id: 'GOV-03', t: 'Appropriate technical and organisational measures', pri: 'M',
      req: 'Implementation of appropriate technical and organisational measures to ensure effective observance of the Act and the Rules.', ref: 'Act s.8(4)', iso: '27701 5.4, 6.x',
      ev: 'Documented privacy programme: roles, procedures, controls register, management review minutes.', q: 'Is there a documented privacy programme (owners, procedures, controls, periodic review) that puts the policy into practice?' },
    { id: 'GOV-04', t: 'Published business contact for data protection queries', pri: 'M',
      req: 'Publish, prominently on the website or app and in every response to a Data Principal, the business contact information of the Data Protection Officer (if applicable) or a person able to answer questions on processing.', ref: 'Act s.8(9); Rule 9', iso: '27701 7.3.3',
      ev: 'Screenshot of the website/app page with the contact; template response showing the contact.', q: 'Have you published the name/designation and contact details of the person who answers data protection questions on your website or app?' },
    { id: 'GOV-05', t: 'Privacy roles and responsibilities assigned', pri: 'S', stat: false, ph: 'bp',
      req: 'A named privacy lead with defined responsibilities, authority and reporting line, and named owners for each business function that processes personal data.', ref: 'Act s.8(1) (good practice)', iso: '27701 5.3, 6.3.1',
      ev: 'Appointment letter or RACI chart.', q: 'Is a named person responsible for data protection, with clear owners in HR, sales, IT and other functions?' },
    { id: 'GOV-06', t: 'Management review and internal audit of the programme', pri: 'S', stat: false, ph: 'bp',
      req: 'Periodic management review and internal audit of the privacy programme, with tracked corrective actions.', ref: 'ISO 19011; good practice', iso: '27701 5.7, 5.8',
      ev: 'Review minutes, internal audit report, action tracker.', q: 'Does management review data protection compliance at least once a year, with an action tracker?' },
    { id: 'GOV-07', t: 'Records to demonstrate compliance', pri: 'S', ph: 'p3',
      req: 'The organisation keeps records sufficient to demonstrate that notice was given and consent was obtained, since the burden of proof lies on the Data Fiduciary.', ref: 'Act s.6(10)', iso: '27701 7.2.8',
      ev: 'Consent logs, notice version history, records of processing.', q: 'Can you prove, for any Data Principal, which notice they saw and when and how they consented?' }
  ]);

  // ---------------------------------------------------------------- Mapping
  add('MAP', [
    { id: 'MAP-01', t: 'Inventory of personal data and processing activities', pri: 'M', crit: true,
      req: 'A complete record of personal data processed: categories of data and Data Principals, purposes, sources, systems, recipients, processors, locations and retention.', ref: 'Act s.5, s.8, s.11 (needed to comply)', iso: '27701 7.2.8',
      ev: 'Record of Processing Activities (RoPA) or data map, current within 12 months.', q: 'Do you maintain an up-to-date inventory (RoPA/data map) of all personal data, purposes, systems and vendors?' },
    { id: 'MAP-02', t: 'Purpose specification for each processing activity', pri: 'M',
      req: 'Each processing activity is tied to a specified, lawful purpose; data is not reused for unrelated purposes without a fresh lawful basis.', ref: 'Act s.4, s.5(1)(i), s.6(1)', iso: '27701 7.2.1',
      ev: 'Purpose column in the RoPA; purpose limitation clause in the policy.', q: 'Is every processing activity linked to a specific, documented purpose?' },
    { id: 'MAP-03', t: 'Data minimisation', pri: 'M',
      req: 'Only personal data necessary for the specified purpose is collected (consent is limited to data necessary for the purpose).', ref: 'Act s.6(1)', iso: '27701 7.4.1, 7.4.2',
      ev: 'Review of forms/fields against purposes; minimisation assessment.', q: 'Have you reviewed your forms, apps and HR files to remove personal data you do not need?' },
    { id: 'MAP-04', t: 'Data flow diagrams for key systems', pri: 'W', stat: false, ph: 'bp', pen: 'none',
      req: 'Data flow diagrams for high-volume or high-risk systems showing collection, storage, sharing and deletion points.', ref: 'Good practice', iso: '27701 7.2.8',
      ev: 'Diagrams for CRM, HRMS, payment and app back-ends.', q: 'Do you have data flow diagrams for your main systems?' },
    { id: 'MAP-05', t: 'Accuracy and completeness of data used for decisions', pri: 'M', ph: 'p3',
      req: 'Where personal data is used to make a decision affecting the Data Principal or is disclosed to another Data Fiduciary, reasonable efforts ensure it is complete, accurate and consistent.', ref: 'Act s.8(3)', iso: '27701 7.4.3',
      ev: 'Data quality checks, verification steps before decisions/disclosures.', q: 'Where you use personal data to make decisions about people or share it with another company, do you check it is accurate and complete?' }
  ]);

  // ---------------------------------------------------------------- Lawful basis
  add('LAW', [
    { id: 'LAW-01', t: 'Lawful ground identified for each purpose', pri: 'M', crit: true,
      req: 'Personal data is processed only for a lawful purpose, on the basis of consent or a legitimate use under section 7; the ground is recorded for each purpose.', ref: 'Act s.4', iso: '27701 7.2.2',
      ev: 'RoPA column showing consent vs. the specific section 7 clause.', q: 'For each purpose, have you recorded whether you rely on consent or on a specific legitimate use under section 7?' },
    { id: 'LAW-02', t: 'Legitimate uses applied correctly', pri: 'M',
      req: 'Reliance on legitimate uses (for example voluntary provision for a specified purpose, legal obligation, medical emergency, employment purposes) is limited to the conditions in section 7.', ref: 'Act s.7', iso: '27701 7.2.2',
      ev: 'Legitimate-use assessment for each such purpose.', q: 'Where you do not take consent, have you checked that the purpose fits one of the legitimate uses in section 7 exactly?' },
    { id: 'LAW-03', t: 'Employee data processed under the employment legitimate use', pri: 'S', when: 'employees',
      req: 'Processing of employee and applicant data relies on the employment legitimate use only for purposes of employment or safeguarding the employer from loss or liability; other uses need consent.', ref: 'Act s.7(i)', iso: '27701 7.2.2',
      ev: 'Employee privacy notice; HR purpose register.', q: 'Have you separated employee data uses that are purely for employment from uses that need consent (for example marketing, wellness programmes, photos)?' },
    { id: 'LAW-04', t: 'Automated decisions and AI on personal data assessed', pri: 'S', stat: false, ph: 'bp', when: 'ai',
      req: 'Profiling, automated decision-making and AI tools using personal data are assessed for lawful basis, accuracy (s.8(3)) and fairness, with human review of significant decisions.', ref: 'Act s.4, s.8(3) (good practice)', iso: '27701 7.3.10',
      ev: 'AI/automation register and impact assessment.', q: 'If you use AI, scoring or automated decisions on personal data, have you assessed them and kept human review?' }
  ]);

  // ---------------------------------------------------------------- Notice
  add('NOT', [
    { id: 'NOT-01', t: 'Notice accompanies or precedes every consent request', pri: 'M', crit: true,
      req: 'Every request for consent is accompanied or preceded by a notice to the Data Principal.', ref: 'Act s.5(1)', iso: '27701 7.3.2, 7.3.3',
      ev: 'Screenshots of every collection point (web, app, forms) showing the notice.', q: 'At every point where you ask for consent (website, app, paper forms, call centre), is a notice shown first?' },
    { id: 'NOT-02', t: 'Notice is standalone, clear and in plain language', pri: 'M',
      req: 'The notice is presented and understandable independently of any other information, in clear and plain language.', ref: 'Rule 3(a)', iso: '27701 7.3.2',
      ev: 'The notice text; readability review.', q: 'Is the privacy notice a standalone document in plain language, not buried in terms and conditions?' },
    { id: 'NOT-03', t: 'Notice gives an itemised description of personal data and purposes', pri: 'M',
      req: 'The notice gives a fair account of the details needed for informed consent, including an itemised description of the personal data and the specified purpose(s) and the goods, services or uses enabled.', ref: 'Act s.5(1)(i); Rule 3(b)', iso: '27701 7.3.3',
      ev: 'Notice text with itemised data list per purpose.', q: 'Does the notice list each item of personal data you collect and the specific purpose for each?' },
    { id: 'NOT-04', t: 'Notice explains withdrawal, rights and complaint to the Board', pri: 'M',
      req: 'The notice states the manner of withdrawing consent and exercising rights (with a link to the website/app and other means), and how to complain to the Data Protection Board.', ref: 'Act s.5(1)(ii)–(iii); Rule 3(c)', iso: '27701 7.3.3',
      ev: 'Notice text with withdrawal link, rights section and Board complaint section.', q: 'Does the notice explain how to withdraw consent, how to exercise rights and how to complain to the Data Protection Board, with working links?' },
    { id: 'NOT-05', t: 'Notice available in English or an Eighth Schedule language', pri: 'M',
      req: 'The Data Principal has the option to access the notice in English or any language in the Eighth Schedule to the Constitution.', ref: 'Act s.5(3)', iso: '27701 7.3.2',
      ev: 'Language selector or translated notices.', q: 'Can a person choose to read your notice in English or an Indian language listed in the Eighth Schedule?' },
    { id: 'NOT-06', t: 'Notice to existing Data Principals for legacy consents', pri: 'M',
      req: 'Where consent was given before the commencement of the Act, a notice is given as soon as reasonably practicable with the prescribed details.', ref: 'Act s.5(2)', iso: '27701 7.3.3',
      ev: 'Legacy notice campaign plan and send logs.', q: 'Have you planned or sent a notice to existing customers/users whose data you collected before the Act came into force?' },
    { id: 'NOT-07', t: 'Notice version control', pri: 'S', stat: false, ph: 'bp',
      req: 'Every version of the notice is kept with dates, so the version seen by any Data Principal can be shown.', ref: 'Act s.6(10) (good practice)', iso: '27701 7.2.8',
      ev: 'Notice change log.', q: 'Do you keep every past version of your notices with the dates they were live?' }
  ]);

  // ---------------------------------------------------------------- Consent
  add('CON', [
    { id: 'CON-01', t: 'Consent is free, specific, informed, unconditional and unambiguous', pri: 'M', crit: true,
      req: 'Consent is free, specific, informed, unconditional and unambiguous with a clear affirmative action, and limited to data necessary for the purpose; no pre-ticked boxes, bundling or consent-as-a-condition for unrelated data.', ref: 'Act s.6(1)', iso: '27701 7.2.3, 7.2.4',
      ev: 'Screenshots of consent flows; consent text; absence of pre-ticked boxes.', q: 'Are consents opt-in (no pre-ticked boxes), separate for each purpose, and not a condition for services that do not need the data?' },
    { id: 'CON-02', t: 'Consent records kept', pri: 'M',
      req: 'Records of consent (who, when, which notice version, which purposes, how) are retained to discharge the burden of proof.', ref: 'Act s.6(10)', iso: '27701 7.2.8',
      ev: 'Consent log extract.', q: 'Do your systems log each consent with date, time, notice version and purposes?' },
    { id: 'CON-03', t: 'Withdrawal as easy as giving consent', pri: 'M',
      req: 'The Data Principal can withdraw consent at any time with ease comparable to giving it.', ref: 'Act s.6(4)', iso: '27701 7.3.4',
      ev: 'Withdrawal flow screenshots; time to action.', q: 'Can a person withdraw consent as easily as they gave it (for example one click in the app)?' },
    { id: 'CON-04', t: 'Processing stops after withdrawal, including by processors', pri: 'M',
      req: 'On withdrawal, the organisation and its processors cease processing within a reasonable time, unless processing is required or authorised by law.', ref: 'Act s.6(6)', iso: '27701 7.3.4, 8.5',
      ev: 'Withdrawal procedure; processor notification mechanism.', q: 'When consent is withdrawn, do you and your vendors stop processing within a defined time?' },
    { id: 'CON-05', t: 'Consent Manager integration (where used)', pri: 'S', when: 'cms', ph: 'p2',
      req: 'Where consent is managed through a Consent Manager, the Consent Manager is registered with the Board and the integration lets the Data Principal give, manage, review and withdraw consent.', ref: 'Act s.6(7)–(9); Rule 4', iso: '27701 7.2.3',
      ev: 'Consent Manager registration details and integration documents.', q: 'If you use a Consent Manager, is it registered with the Data Protection Board and integrated for give/review/withdraw?' },
    { id: 'CON-06', t: 'Request for consent in clear language with contact details', pri: 'M',
      req: 'Every consent request is in clear and plain language, offers English or an Eighth Schedule language, and gives the contact details of the DPO or authorised person.', ref: 'Act s.6(3)', iso: '27701 7.3.2',
      ev: 'Consent request text.', q: 'Does every consent request show a contact for questions and offer an Indian language option?' }
  ]);

  // ---------------------------------------------------------------- Rights
  add('RIG', [
    { id: 'RIG-01', t: 'Means to make rights requests published', pri: 'M', crit: true,
      req: 'The organisation publishes the means (website/app, or both) by which a Data Principal can make a request, and the particulars needed to identify them.', ref: 'Rule 14(1)', iso: '27701 7.3.1',
      ev: 'Rights request page or form.', q: 'Is there a published way (form, email, in-app) for people to request access, correction or erasure?' },
    { id: 'RIG-02', t: 'Right to access information', pri: 'M',
      req: 'On request, a summary of personal data processed and processing activities, and the identities of other Data Fiduciaries and Processors with whom it is shared, with a description of the data shared.', ref: 'Act s.11', iso: '27701 7.3.6, 7.3.8',
      ev: 'Access request procedure and a sample response.', q: 'Can you produce, for one person, a summary of their data, how it is used, and who it was shared with?' },
    { id: 'RIG-03', t: 'Right to correction, completion, updating and erasure', pri: 'M',
      req: 'Requests to correct, complete, update or erase personal data are actioned, with erasure unless retention is necessary for the purpose or for compliance with law.', ref: 'Act s.12', iso: '27701 7.3.6, 7.3.7',
      ev: 'Procedure, request log, sample closures.', q: 'Do you have a procedure to correct, update or erase data on request, including in vendor systems?' },
    { id: 'RIG-04', t: 'Grievance redressal mechanism and 90-day resolution', pri: 'M', crit: true,
      req: 'An effective grievance redressal mechanism that responds within a reasonable period not exceeding ninety days; the Data Principal must be able to exhaust it before approaching the Board.', ref: 'Act s.8(10), s.13; Rule 14(3)', iso: '27701 7.3.9',
      ev: 'Grievance procedure with SLA; grievance register with closure dates.', q: 'Do you have a grievance procedure that resolves data protection complaints within 90 days, with a register?' },
    { id: 'RIG-05', t: 'Right to nominate', pri: 'M',
      req: 'Data Principals can nominate another individual to exercise their rights in the event of death or incapacity, by the means published.', ref: 'Act s.14; Rule 14(4)', iso: '27701 7.3.1',
      ev: 'Nomination form or flow.', q: 'Can a person nominate someone to exercise their rights if they die or become incapable?' },
    { id: 'RIG-06', t: 'Identity verification and request tracking', pri: 'S', stat: false, ph: 'bp',
      req: 'Requests are verified proportionately, logged, assigned and tracked to closure with timestamps and outcome.', ref: 'Good practice', iso: '27701 7.3.1',
      ev: 'Request tracker.', q: 'Do you verify identity and track every rights request to closure?' }
  ]);

  // ---------------------------------------------------------------- Children
  add('CHD', [
    { id: 'CHD-01', t: 'Verifiable consent of parent or lawful guardian', pri: 'M', crit: true, when: 'children', pen: 'child',
      req: 'Before processing a child\'s personal data, verifiable consent of the parent is obtained, with due diligence that the person is an identifiable adult (using reliable details already held, or details/virtual token issued by an authorised entity such as DigiLocker).', ref: 'Act s.9(1); Rule 10', iso: '27701 7.2.3',
      ev: 'Parental consent flow; verification method; logs.', q: 'Before processing data of anyone under 18, do you obtain and verify a parent\'s consent (for example via DigiLocker or details you already hold)?' },
    { id: 'CHD-02', t: 'Age-gating to identify children', pri: 'M', when: 'children', pen: 'child',
      req: 'Mechanisms to identify when a Data Principal is a child (under 18), so that section 9 obligations apply.', ref: 'Act s.2(f), s.9', iso: '27701 7.2.3',
      ev: 'Age declaration/verification step.', q: 'Do your sign-up and collection flows identify users under 18?' },
    { id: 'CHD-03', t: 'No tracking, behavioural monitoring or targeted advertising to children', pri: 'M', crit: true, when: 'children', pen: 'child',
      req: 'No tracking or behavioural monitoring of children or targeted advertising directed at children, unless an exemption under the Rules applies.', ref: 'Act s.9(3); Rule 12, Fourth Schedule', iso: '27701 7.4.x',
      ev: 'Ad-tech and analytics configuration for child users; exemption analysis.', q: 'Are analytics, tracking and targeted ads switched off for users under 18 (or is a Fourth Schedule exemption documented)?' },
    { id: 'CHD-04', t: 'No processing detrimental to a child\'s well-being', pri: 'M', when: 'children', pen: 'child',
      req: 'No processing likely to cause any detrimental effect on the well-being of a child.', ref: 'Act s.9(2)', iso: '27701 7.4.x',
      ev: 'Child impact review.', q: 'Have you reviewed your services for any processing that could harm children\'s well-being?' },
    { id: 'CHD-05', t: 'Exemptions documented (Fourth Schedule)', pri: 'S', when: 'children',
      req: 'Where an exemption for classes of Data Fiduciaries or purposes is relied upon (for example healthcare, educational institutions, child safety), the basis is documented.', ref: 'Rule 12; Fourth Schedule', iso: '27701 7.2.2',
      ev: 'Exemption memo.', q: 'If you rely on an exemption for children\'s data (healthcare, education, etc.), is it documented?' },
    { id: 'CHD-06', t: 'Lawful guardian consent for persons with disability', pri: 'M', when: 'pwd', pen: 'child',
      req: 'For a person with disability who cannot take legally binding decisions despite support, verifiable consent of the lawful guardian is obtained after verifying the guardian\'s appointment.', ref: 'Act s.9(1); Rule 11', iso: '27701 7.2.3',
      ev: 'Guardian verification procedure.', q: 'Where you process data of persons with disability who need a guardian, do you verify the guardian\'s appointment and take their consent?' }
  ]);

  // ---------------------------------------------------------------- Security (Rule 6)
  add('SEC', [
    { id: 'SEC-01', t: 'Reasonable security safeguards to prevent breach', pri: 'M', crit: true, pen: 'sec',
      req: 'Reasonable security safeguards to prevent personal data breach, including in processing by processors.', ref: 'Act s.8(5); Rule 6', iso: '27701 6.x (27002 controls)',
      ev: 'Information security policy; risk assessment; ISO 27001/SOC 2 report if held.', q: 'Do you have a documented information security programme based on a risk assessment (ISO 27001 or similar)?' },
    { id: 'SEC-02', t: 'Encryption, obfuscation, masking or tokenisation', pri: 'M', pen: 'sec',
      req: 'Appropriate data security measures including encryption, obfuscation, masking or virtual tokens mapped to personal data.', ref: 'Rule 6(1)(a)', iso: '27701 6.7, 6.10',
      ev: 'Encryption configuration at rest and in transit; masking in non-production.', q: 'Is personal data encrypted at rest and in transit, and masked in test environments?' },
    { id: 'SEC-03', t: 'Access control to systems holding personal data', pri: 'M', pen: 'sec',
      req: 'Appropriate measures to control access to computer resources used for processing personal data.', ref: 'Rule 6(1)(b)', iso: '27701 6.6',
      ev: 'Access control policy; role-based access; MFA; quarterly access reviews.', q: 'Is access to personal data role-based, protected with multi-factor authentication and reviewed regularly?' },
    { id: 'SEC-04', t: 'Logging, monitoring and review of access', pri: 'M', pen: 'sec',
      req: 'Visibility on access to personal data through appropriate logs, monitoring and review, for detection, investigation and remediation of unauthorised access.', ref: 'Rule 6(1)(c)', iso: '27701 6.9.4',
      ev: 'Log sources; SIEM or log review records.', q: 'Do you log and review who accesses personal data, so unauthorised access can be detected?' },
    { id: 'SEC-05', t: 'Backups and continuity', pri: 'M', pen: 'sec',
      req: 'Reasonable measures for continued processing if confidentiality, integrity or availability is compromised, including data backups.', ref: 'Rule 6(1)(d)', iso: '27701 6.9.3, 6.15',
      ev: 'Backup policy, restore test records, BCP/DR plan.', q: 'Are backups taken and restore-tested, with a business continuity plan?' },
    { id: 'SEC-06', t: 'Logs and personal data retained for at least one year', pri: 'M', pen: 'sec',
      req: 'Logs and personal data are retained for at least one year for detection, investigation and remediation of unauthorised access and to prevent recurrence, unless law requires otherwise.', ref: 'Rule 6(1)(e); Rule 8(3)', iso: '27701 6.9.4',
      ev: 'Log retention configuration showing ≥ 1 year.', q: 'Are access logs and related records kept for at least one year?' },
    { id: 'SEC-07', t: 'Security obligations in processor contracts', pri: 'M', pen: 'sec', when: 'processors',
      req: 'Contracts with Data Processors contain appropriate provisions requiring them to take reasonable security safeguards.', ref: 'Rule 6(1)(f)', iso: '27701 8.2.1, 6.12',
      ev: 'Processor contract clauses.', q: 'Do your vendor contracts require them to keep personal data secure (encryption, access control, logs, backups)?' },
    { id: 'SEC-08', t: 'Technical and organisational measures monitored for effectiveness', pri: 'S', pen: 'sec',
      req: 'Appropriate technical and organisational measures to ensure effective observance of the security safeguards, monitored and tested.', ref: 'Rule 6(1)(g)', iso: '27701 6.15.2',
      ev: 'VAPT reports, security testing calendar, remediation tracker.', q: 'Are vulnerability assessments / penetration tests done at least yearly and issues fixed?' },
    { id: 'SEC-09', t: 'Endpoint, email and cloud hygiene', pri: 'W', stat: false, ph: 'bp', pen: 'none',
      req: 'Endpoint protection, email security, secure configuration of cloud services and device management for staff handling personal data.', ref: 'Good practice; CERT-In advisories', iso: '27701 6.8, 6.11',
      ev: 'EDR/MDM coverage report.', q: 'Do staff devices have endpoint protection and device management?' }
  ]);

  // ---------------------------------------------------------------- Breach (Rule 7)
  add('BRE', [
    { id: 'BRE-01', t: 'Breach intimation to the Data Protection Board', pri: 'M', crit: true, pen: 'breach',
      req: 'On becoming aware of a personal data breach, intimate the Board without delay, and within 72 hours (or longer as the Board allows on written request) give detailed information: facts, circumstances, reasons, mitigation, findings on the person who caused it, remedial measures and a report on the intimations to affected Data Principals.', ref: 'Act s.8(6); Rule 7(2)', iso: '27701 6.13.1.5',
      ev: 'Breach response procedure with the 72-hour Board report template.', q: 'Does your breach procedure require an immediate intimation to the Data Protection Board and a detailed report within 72 hours?' },
    { id: 'BRE-02', t: 'Breach intimation to each affected Data Principal', pri: 'M', crit: true, pen: 'breach',
      req: 'Intimate each affected Data Principal without delay, concisely and in plain language, through their user account or registered mode of communication: description, likely consequences, mitigation, safety measures they can take, and business contact.', ref: 'Act s.8(6); Rule 7(1)', iso: '27701 6.13.1.5',
      ev: 'Data Principal notification template and channels.', q: 'Do you have a ready template and channel to inform every affected person without delay if their data is breached?' },
    { id: 'BRE-03', t: 'Incident detection, triage and breach register', pri: 'M', pen: 'breach',
      req: 'A process to detect, assess and record incidents and breaches, with a register showing awareness time, decisions and notifications.', ref: 'Act s.8(6); Rule 7', iso: '27701 6.13',
      ev: 'Incident register; triage criteria.', q: 'Do you keep an incident and breach register showing when you became aware and what you did?' },
    { id: 'BRE-04', t: 'Breach response tested', pri: 'S', stat: false, ph: 'bp',
      req: 'The breach response plan is tested at least yearly by a tabletop exercise including the 72-hour and CERT-In 6-hour clocks.', ref: 'Good practice', iso: '27701 6.13',
      ev: 'Tabletop exercise report.', q: 'Have you rehearsed a data breach (tabletop exercise) in the last 12 months?' },
    { id: 'BRE-05', t: 'Processors obliged to report breaches promptly', pri: 'M', pen: 'breach', when: 'processors',
      req: 'Processor contracts require immediate notice of any breach to the organisation, so it can meet its own intimation duties.', ref: 'Act s.8(1), s.8(6)', iso: '27701 8.5.x',
      ev: 'Processor contract breach clause.', q: 'Do your vendor contracts require them to tell you immediately about any breach?' }
  ]);

  // ---------------------------------------------------------------- Retention
  add('RET', [
    { id: 'RET-01', t: 'Erasure when purpose is served or consent withdrawn', pri: 'M', crit: true,
      req: 'Personal data is erased (and processors are made to erase it) when consent is withdrawn or as soon as it is reasonable to assume the specified purpose is no longer served, unless retention is necessary for compliance with law.', ref: 'Act s.8(7)', iso: '27701 7.4.4, 7.4.7',
      ev: 'Retention and erasure schedule; deletion logs.', q: 'Do you erase personal data once the purpose is over or consent is withdrawn, including in vendor systems?' },
    { id: 'RET-02', t: 'Retention schedule with legal holds', pri: 'M',
      req: 'A documented retention schedule by data category, with legal retention periods (tax, labour, sector regulators) and legal-hold handling.', ref: 'Act s.8(7), s.8(8)', iso: '27701 7.4.7',
      ev: 'Retention schedule.', q: 'Is there a retention schedule listing how long each type of personal data is kept and why?' },
    { id: 'RET-03', t: 'Third Schedule time limits and 48-hour pre-erasure notice', pri: 'M', when: 'thirdSchedule',
      req: 'For classes in the Third Schedule (e-commerce entities with ≥ 2 crore registered users in India, online gaming intermediaries with ≥ 50 lakh, social media intermediaries with ≥ 2 crore), personal data is erased three years after the Data Principal last approached or exercised rights, with at least 48 hours\' notice before erasure.', ref: 'Act s.8(8); Rule 8(1)–(2); Third Schedule', iso: '27701 7.4.7',
      ev: 'Inactivity-based deletion job; 48-hour notice template.', q: 'As a large platform under the Third Schedule, do you delete inactive users\' data after three years and warn them 48 hours before?' },
    { id: 'RET-04', t: 'Secure deletion methods', pri: 'S', stat: false, ph: 'bp',
      req: 'Deletion methods are secure and verifiable across primary systems, backups (with expiry) and processors.', ref: 'Good practice', iso: '27701 7.4.5, 6.8.3',
      ev: 'Deletion certificates from vendors; backup expiry policy.', q: 'Can you show that data was securely deleted, including from backups and vendors?' }
  ]);

  // ---------------------------------------------------------------- Processors
  add('PRO', [
    { id: 'PRO-01', t: 'Processors engaged only under a valid contract', pri: 'M', crit: true, when: 'processors',
      req: 'A Data Processor is engaged to process personal data on the organisation\'s behalf only under a valid contract.', ref: 'Act s.8(2)', iso: '27701 7.2.6, 8.2.1',
      ev: 'Vendor register with contract status; Data Processing Agreements.', q: 'Is every vendor that handles your personal data (cloud, payroll, CRM, marketing, call centre) under a signed contract or DPA?' },
    { id: 'PRO-02', t: 'Data Processing Agreement content', pri: 'M', when: 'processors',
      req: 'Contracts cover processing only on instructions, purpose limitation, security (Rule 6), breach notice, sub-processor approval, assistance with rights, erasure/return at end, audit rights.', ref: 'Act s.8(2), s.8(5)–(7); Rule 6(1)(f)', iso: '27701 8.2, 8.5',
      ev: 'DPA template and signed copies.', q: 'Do your DPAs cover instructions, security, breach notice, sub-processors, rights assistance, deletion at the end and audit rights?' },
    { id: 'PRO-03', t: 'Vendor due diligence and monitoring', pri: 'S', stat: false, ph: 'bp', when: 'processors',
      req: 'Risk-based due diligence before onboarding and periodic review of processors handling personal data.', ref: 'Act s.8(1) (good practice)', iso: '27701 6.12',
      ev: 'Vendor risk questionnaires and reviews.', q: 'Do you assess vendors\' data protection before onboarding and review them yearly?' },
    { id: 'PRO-04', t: 'Sharing with other Data Fiduciaries recorded', pri: 'S', when: 'sharing',
      req: 'Disclosures to other Data Fiduciaries are recorded (needed to answer access requests under s.11) and made on a lawful basis.', ref: 'Act s.11(1)(b)', iso: '27701 7.5.3',
      ev: 'Disclosure register.', q: 'Do you keep a record of every other company you share personal data with, and why?' },
    { id: 'PRO-05', t: 'Obligations as a Data Processor for clients', pri: 'S', when: 'processor',
      req: 'Where the organisation acts as a processor for other businesses, it processes only on documented instructions, applies Rule 6 safeguards, notifies breaches and deletes on instruction.', ref: 'Act s.8(2); Rule 6', iso: '27701 8.2–8.5',
      ev: 'Client DPAs; processor procedures.', q: 'Where you process data for your clients, do you follow their written instructions and have processor procedures?' }
  ]);

  // ---------------------------------------------------------------- Cross-border
  add('XBT', [
    { id: 'XBT-01', t: 'Transfers outside India mapped and checked against restrictions', pri: 'M', when: 'crossBorder',
      req: 'Transfers and access from outside India are mapped and checked against any restriction notified by the Central Government and against stricter sectoral laws.', ref: 'Act s.16; Rule 15', iso: '27701 7.5.1, 7.5.2',
      ev: 'Transfer register (country, recipient, purpose, safeguard).', q: 'Have you listed every country where your personal data is stored or accessed, and checked it against government restrictions?' },
    { id: 'XBT-02', t: 'Requirements of the Central Government met for transfers', pri: 'M', when: 'crossBorder',
      req: 'Any requirements the Central Government specifies by general or special order for making personal data available to a foreign State or entity are met.', ref: 'Rule 15', iso: '27701 7.5.1',
      ev: 'Regulatory watch log; legal review.', q: 'Do you monitor and comply with any government orders on making personal data available abroad?' },
    { id: 'XBT-03', t: 'Sectoral localisation requirements', pri: 'M', when: 'crossBorder',
      req: 'Stricter sectoral localisation rules (for example RBI payment data storage) continue to apply and are met.', ref: 'Act s.16(2)', iso: '27701 7.5.1',
      ev: 'Localisation compliance confirmation.', q: 'If a sector regulator requires data to stay in India (for example payment data), is that met?' }
  ]);

  // ---------------------------------------------------------------- SDF
  add('SDF', [
    { id: 'SDF-01', t: 'Data Protection Officer based in India', pri: 'M', crit: true, when: 'sdf', pen: 'sdf',
      req: 'A Data Protection Officer who represents the organisation, is based in India, is responsible to the Board of Directors or similar governing body, and is the point of contact for grievance redressal.', ref: 'Act s.10(2)(a)', iso: '27701 6.3.1.1',
      ev: 'DPO appointment resolution; published contact.', q: 'Has a Data Protection Officer based in India been appointed, reporting to the Board?' },
    { id: 'SDF-02', t: 'Independent data auditor appointed', pri: 'M', crit: true, when: 'sdf', pen: 'sdf',
      req: 'An independent data auditor is appointed to carry out data audit and evaluate compliance.', ref: 'Act s.10(2)(b)', iso: '27701 5.8',
      ev: 'Auditor engagement letter confirming independence.', q: 'Has an independent data auditor been appointed?' },
    { id: 'SDF-03', t: 'Annual DPIA and audit, with report to the Board', pri: 'M', crit: true, when: 'sdf', pen: 'sdf',
      req: 'A Data Protection Impact Assessment and an audit once in every twelve months from notification; the person conducting them furnishes a report of significant observations to the Data Protection Board.', ref: 'Act s.10(2)(c); Rule 13(1)–(2)', iso: '27701 7.2.5',
      ev: 'DPIA report, audit report, Board submission.', q: 'Is an annual DPIA and audit planned with a report of significant observations to the Data Protection Board?' },
    { id: 'SDF-04', t: 'Algorithmic software due diligence', pri: 'M', when: 'sdf', pen: 'sdf',
      req: 'Due diligence to verify that technical measures, including algorithmic software used for processing personal data, are not likely to pose a risk to the rights of Data Principals.', ref: 'Rule 13(3)', iso: '27701 7.3.10',
      ev: 'Algorithm assessment records.', q: 'Have you verified that algorithms used on personal data do not pose a risk to people\'s rights?' },
    { id: 'SDF-05', t: 'Localisation of specified personal data', pri: 'M', when: 'sdf', pen: 'sdf',
      req: 'Personal data and traffic data specified by the Central Government on the recommendation of the committee are processed subject to the restriction that they are not transferred outside India.', ref: 'Rule 13(4)', iso: '27701 7.5.1',
      ev: 'Localisation confirmation for specified data.', q: 'Is any data category specified by the government for localisation kept within India?' },
    { id: 'SDF-06', t: 'SDF designation monitored', pri: 'S', when: 'sdfLikely',
      req: 'Where the organisation may be notified as a Significant Data Fiduciary (volume and sensitivity of data, risk to rights, impact on sovereignty, democracy, security or public order), it monitors notifications and prepares SDF controls in advance.', ref: 'Act s.10(1)', iso: '27701 5.2',
      ev: 'SDF readiness note.', q: 'Given your volume or sensitivity of data, are you prepared in case you are notified as a Significant Data Fiduciary?' }
  ]);

  // ---------------------------------------------------------------- Sector overlays
  add('SEC2', [
    { id: 'OVR-01', t: 'CERT-In 6-hour incident reporting', pri: 'M', ph: 'p1', pen: 'none', when: 'it',
      req: 'Cyber incidents of the specified types are reported to CERT-In within 6 hours of noticing them, in addition to DPDPA breach intimations.', ref: 'CERT-In Directions, 28 Apr 2022 (IT Act s.70B)', iso: '27701 6.13',
      ev: 'Breach procedure showing the CERT-In clock and contact.', q: 'Does your incident procedure include reporting to CERT-In within 6 hours?' },
    { id: 'OVR-02', t: 'CERT-In log retention (180 days, in India) and clock sync', pri: 'M', ph: 'p1', pen: 'none', when: 'it',
      req: 'Logs of ICT systems are maintained securely for a rolling 180 days within Indian jurisdiction, and system clocks are synchronised with NTP servers of NIC/NPL or traceable sources.', ref: 'CERT-In Directions, 28 Apr 2022', iso: '27701 6.9.4',
      ev: 'Log retention and NTP configuration.', q: 'Are system logs kept for 180 days in India and clocks synchronised to approved time servers?' },
    { id: 'OVR-03', t: 'RBI requirements for regulated entities', pri: 'M', ph: 'p1', pen: 'none', when: 'rbi',
      req: 'RBI directions on IT governance, cyber security, outsourcing, digital lending and payment-data storage are met alongside the DPDPA.', ref: 'RBI Master Directions (IT Governance 2023; Outsourcing; Payment data storage 2018)', iso: '27701 6.15.1',
      ev: 'RBI compliance certificate or IT audit report.', q: 'As an RBI-regulated entity, are RBI IT, outsourcing and data storage directions met and audited?' },
    { id: 'OVR-04', t: 'SEBI CSCRF for regulated entities', pri: 'M', ph: 'p1', pen: 'none', when: 'sebi',
      req: 'The SEBI Cybersecurity and Cyber Resilience Framework applicable to the entity category is implemented.', ref: 'SEBI CSCRF (Aug 2024)', iso: '27701 6.15.1',
      ev: 'CSCRF compliance report.', q: 'As a SEBI-regulated entity, is the CSCRF implemented for your category?' },
    { id: 'OVR-05', t: 'IRDAI information and cyber security guidelines', pri: 'M', ph: 'p1', pen: 'none', when: 'irdai',
      req: 'IRDAI Information and Cyber Security Guidelines and IRDAI record-retention requirements for policyholder data are met.', ref: 'IRDAI Information & Cyber Security Guidelines, 2023', iso: '27701 6.15.1',
      ev: 'IRDAI cyber audit report; record retention policy.', q: 'As an IRDAI-regulated entity, are IRDAI cyber security and record retention requirements met?' },
    { id: 'OVR-06', t: 'Health data practices', pri: 'S', ph: 'bp', stat: false, pen: 'none', when: 'health',
      req: 'Health data is handled with heightened safeguards in line with clinical establishment rules, ABDM health data management policy where applicable, and professional confidentiality.', ref: 'ABDM Health Data Management Policy (where integrated); good practice', iso: '27701 7.4',
      ev: 'Health data handling SOP.', q: 'Is health information handled with stricter access, consent and confidentiality controls?' }
  ]);

  // ---------------------------------------------------------------- Culture
  add('CUL', [
    { id: 'CUL-01', t: 'Staff data protection training', pri: 'S', stat: false, ph: 'bp',
      req: 'All staff handling personal data are trained at induction and yearly, with records.', ref: 'Act s.8(4) (good practice)', iso: '27701 6.4.2.2',
      ev: 'Training records and content.', q: 'Are all staff trained on data protection at joining and every year?' },
    { id: 'CUL-02', t: 'Privacy by design for new products and changes', pri: 'S', stat: false, ph: 'bp',
      req: 'New products, systems and vendor engagements go through a privacy review (lightweight impact assessment) before launch.', ref: 'Good practice', iso: '27701 7.4, 7.2.5',
      ev: 'Privacy review checklist and records.', q: 'Are new products, systems and vendors reviewed for privacy before launch?' },
    { id: 'CUL-03', t: 'Cookie and tracker governance on websites and apps', pri: 'S', when: 'web',
      req: 'Non-essential cookies, SDKs and trackers are switched on only after consent, with a cookie notice and preference centre.', ref: 'Act s.5, s.6', iso: '27701 7.2.3',
      ev: 'Cookie banner and scan report.', q: 'Do non-essential cookies and trackers on your website or app wait for consent?' },
    { id: 'CUL-04', t: 'Confidentiality undertakings', pri: 'W', stat: false, ph: 'bp', pen: 'none',
      req: 'Staff and contractors sign confidentiality and acceptable-use undertakings covering personal data.', ref: 'Good practice', iso: '27701 6.4.1.2',
      ev: 'Signed undertakings.', q: 'Do staff and contractors sign confidentiality undertakings?' },
    { id: 'CUL-05', t: 'Privacy metrics reported to management', pri: 'W', stat: false, ph: 'bp', pen: 'none',
      req: 'Key metrics (rights requests, grievances, incidents, training completion, open findings) are reported to management quarterly.', ref: 'Good practice', iso: '27701 5.7',
      ev: 'Quarterly privacy dashboard.', q: 'Does management receive a quarterly privacy dashboard?' }
  ]);

  // Documents SAFE AI can draft when the client does not have them.
  const DOC_TYPES = [
    { id: 'privacy-notice', title: 'Privacy Notice (Rule 3)', audience: 'External — Data Principals', controls: ['NOT-01', 'NOT-02', 'NOT-03', 'NOT-04', 'NOT-05', 'CON-06', 'GOV-04'], when: '' },
    { id: 'dp-policy', title: 'Data Protection and Privacy Policy', audience: 'Internal — all staff', controls: ['GOV-01', 'GOV-02', 'GOV-03', 'MAP-02', 'MAP-03'], when: '' },
    { id: 'consent-notice', title: 'Consent Request and Withdrawal Text', audience: 'External — collection points', controls: ['CON-01', 'CON-03', 'CON-06'], when: '' },
    { id: 'rights-sop', title: 'Data Principal Rights and Grievance Redressal Procedure', audience: 'Internal — operations', controls: ['RIG-01', 'RIG-02', 'RIG-03', 'RIG-04', 'RIG-05'], when: '' },
    { id: 'breach-sop', title: 'Personal Data Breach Response Procedure', audience: 'Internal — IT, legal, management', controls: ['BRE-01', 'BRE-02', 'BRE-03'], when: '' },
    { id: 'retention', title: 'Data Retention and Erasure Schedule', audience: 'Internal — all functions', controls: ['RET-01', 'RET-02'], when: '' },
    { id: 'security-policy', title: 'Information Security Safeguards Policy (Rule 6)', audience: 'Internal — IT', controls: ['SEC-01', 'SEC-02', 'SEC-03', 'SEC-04', 'SEC-05', 'SEC-06'], when: '' },
    { id: 'dpa', title: 'Data Processing Addendum for Vendors', audience: 'Vendors / processors', controls: ['PRO-01', 'PRO-02', 'SEC-07', 'BRE-05'], when: 'processors' },
    { id: 'employee-notice', title: 'Employee and Applicant Privacy Notice', audience: 'Employees and candidates', controls: ['LAW-03'], when: 'employees' },
    { id: 'child-procedure', title: 'Children\'s Data and Verifiable Parental Consent Procedure', audience: 'Internal — product, operations', controls: ['CHD-01', 'CHD-02', 'CHD-03'], when: 'children' },
    { id: 'cookie-notice', title: 'Cookie and Tracker Notice', audience: 'Website and app visitors', controls: ['CUL-03'], when: 'web' },
    { id: 'dpia', title: 'Data Protection Impact Assessment', audience: 'Board and Data Protection Board', controls: ['SDF-03'], when: 'sdf' }
  ];

  const F = (k, l, t, extra) => Object.assign({ k, l, t }, extra || {});
  const opt = S.opt;
  const ENV = [
    { id: 'role', title: 'Your role under the DPDPA', fields: [
      F('ownPurposes', 'Do you decide why and how personal data is processed (for your own customers, users or staff)?', 'bool', { req: true, help: 'If yes, you are a Data Fiduciary.' }),
      F('processorForOthers', 'Do you also process personal data on behalf of other businesses (as a service provider)?', 'bool', { req: true, help: 'If yes, you are also a Data Processor for those clients.' }),
      F('sdfNotified', 'Has the Central Government notified you as a Significant Data Fiduciary?', 'select', { o: opt([['no', 'No'], ['yes', 'Yes'], ['unsure', 'Not sure']]), req: true }),
      F('thirdSchedule', 'Are you any of these large platforms in India?', 'select', { o: opt([['none', 'None of these'], ['ecom', 'E-commerce entity with 2 crore or more registered users'], ['gaming', 'Online gaming intermediary with 50 lakh or more users'], ['social', 'Social media intermediary with 2 crore or more users']]), req: true })
    ] },
    { id: 'data', title: 'Personal data you handle', fields: [
      F('principals', 'Approximate number of individuals whose personal data you hold (customers, users, patients, staff)', 'select', { o: opt(['Under 10,000', '10,000 – 1 lakh', '1 lakh – 10 lakh', '10 lakh – 1 crore', '1 crore – 2 crore', 'Over 2 crore']), req: true }),
      F('principalTypes', 'Whose personal data do you handle?', 'multi', { o: opt(['Customers / users', 'Employees', 'Job applicants', 'Contractors / consultants', 'Vendors\' staff', 'Patients', 'Students', 'Visitors (CCTV, registers)', 'Website / app visitors', 'Leads / prospects']), req: true }),
      F('dataCategories', 'What kinds of personal data?', 'multi', { o: opt(['Name and contact details', 'Government IDs (Aadhaar, PAN, passport)', 'Financial / bank / card details', 'Health or medical information', 'Biometrics (fingerprint, face)', 'Precise location', 'Photos / video / CCTV', 'Online identifiers, cookies, device IDs', 'Employment and payroll records', 'Education records', 'Insurance policy / claim data', 'Credit / KYC information', 'Call recordings']), req: true }),
      F('children', 'Do you process personal data of anyone under 18?', 'bool', { req: true }),
      F('pwd', 'Do you process personal data of persons with disability who act through a lawful guardian?', 'bool'),
      F('channels', 'How do you collect personal data?', 'multi', { o: opt(['Website forms', 'Mobile app', 'Paper forms', 'Call centre / phone', 'Email / WhatsApp', 'Partners / referrals', 'Purchased or third-party lists', 'Walk-in / branch / clinic', 'HR onboarding']) }),
      F('aiUse', 'Do you use AI, automated scoring or profiling on personal data?', 'bool'),
      F('marketing', 'Do you send marketing to individuals (email, SMS, WhatsApp, ads)?', 'bool')
    ] },
    { id: 'systems', title: 'Systems, vendors and transfers', fields: [
      F('systems', 'Main systems holding personal data (name, purpose, cloud/on-premise, where hosted)', 'textarea', { req: true, help: 'For example: Zoho CRM – sales leads – cloud – India; Keka – HR & payroll – cloud – India; AWS – app back-end – Mumbai.' }),
      F('usesProcessors', 'Do vendors process personal data for you (cloud, payroll, CRM, call centre, marketing, IT support)?', 'bool', { req: true }),
      F('vendors', 'List the key vendors', 'textarea'),
      F('sharesWithFiduciaries', 'Do you share personal data with other companies that use it for their own purposes (insurers, lenders, partners)?', 'bool'),
      F('crossBorder', 'Is personal data stored in or accessed from outside India?', 'bool', { req: true }),
      F('countries', 'Which countries?', 'text'),
      F('consentManager', 'Do you use, or plan to use, a registered Consent Manager?', 'bool')
    ] },
    { id: 'reg', title: 'Regulators and existing compliance', fields: [
      F('regulators', 'Sector regulators that supervise you', 'multi', { o: opt(['RBI', 'SEBI', 'IRDAI', 'PFRDA', 'TRAI / DoT', 'NHA / ABDM', 'CDSCO', 'None']) }),
      F('certifications', 'Certifications or reports you hold', 'multi', { o: opt(['ISO/IEC 27001', 'ISO/IEC 27701', 'SOC 2', 'PCI DSS', 'None']) }),
      null, // existing documents (filled below)
      F('breaches12m', 'Any personal data breaches or cyber incidents in the last 12 months?', 'bool'),
      F('breachDetail', 'If yes, describe briefly', 'textarea')
    ] }
  ];

  const fw = {
    id: 'dpdpa', code: 'DPDPA', name: 'DPDPA Compliance Audit', short: 'DPDPA', icon: 'shield',
    tagline: 'Digital Personal Data Protection Act, 2023 and DPDP Rules, 2025',
    criteria: 'Digital Personal Data Protection Act, 2023; Digital Personal Data Protection Rules, 2025 (G.S.R. 846(E), 13 November 2025); applicable sector regulations; ISO/IEC 27701 (reference)',
    criteriaShort: 'the Digital Personal Data Protection Act, 2023 (the Act) and the Digital Personal Data Protection Rules, 2025 (the Rules), supplemented by applicable sector regulations and good practice drawn from ISO/IEC 27701 and ISO/IEC 27001',
    stdLabel: 'ISO/IEC 27701 reference',
    readinessDate: '2027-05-13',
    readinessNote: 'Most substantive obligations under the Act and the Rules come into force on 13 May 2027. Until then, findings against those obligations are readiness gaps. They are graded on the same scale so that the organisation is compliant on the day they apply.',
    certTitle: (readiness) => 'Certificate of DPDPA Compliance' + (readiness ? ' Assessment' : ''),
    certLaw: 'Digital Personal Data Protection Act, 2023 · Digital Personal Data Protection Rules, 2025',
    certDisclaimer: 'This certificate is not issued by the Data Protection Board of India and does not replace the independent data audit required of a Significant Data Fiduciary under section 10 of the Act.',
    certReadinessText: 'including the obligations that come into force on 13 May 2027',
    reportTitle: (readiness) => 'DPDPA ' + (readiness ? 'COMPLIANCE AND READINESS' : 'COMPLIANCE') + ' AUDIT REPORT',
    exposureAmounts: true,
    phases: PHASES, penalties: PENALTIES, domains: DOMAINS, controls: C, docTypes: DOC_TYPES,
    common: ['org'],
    envSections: ENV,
    flags: (env) => {
      env = env || {};
      const cf = S.commonFlags(env);
      const has = (k, v) => Array.isArray(env[k]) && env[k].includes(v);
      const ind = String(env.industry || '');
      const bigPrincipals = ['1 crore – 2 crore', 'Over 2 crore'].includes(env.principals);
      const sensitive = has('dataCategories', 'Health or medical information') || has('dataCategories', 'Biometrics (fingerprint, face)') || has('dataCategories', 'Financial / bank / card details') || has('dataCategories', 'Credit / KYC information');
      return Object.assign(cf, {
        fiduciary: env.ownPurposes !== false,
        processor: env.processorForOthers === true,
        employees: has('principalTypes', 'Employees') || has('principalTypes', 'Job applicants'),
        children: env.children === true || has('principalTypes', 'Students'),
        pwd: env.pwd === true,
        processors: env.usesProcessors !== false,
        sharing: env.sharesWithFiduciaries === true,
        crossBorder: env.crossBorder === true,
        cms: env.consentManager === true,
        ai: env.aiUse === true,
        web: has('channels', 'Website forms') || has('channels', 'Mobile app') || has('principalTypes', 'Website / app visitors') || !!env.website,
        thirdSchedule: !!env.thirdSchedule && env.thirdSchedule !== 'none',
        sdf: env.sdfNotified === 'yes',
        sdfLikely: env.sdfNotified !== 'yes' && (env.sdfNotified === 'unsure' || bigPrincipals || (sensitive && ['10 lakh – 1 crore', '1 crore – 2 crore', 'Over 2 crore'].includes(env.principals))),
        it: true,
        rbi: has('regulators', 'RBI') || /RBI/.test(ind),
        sebi: has('regulators', 'SEBI') || /SEBI/.test(ind),
        irdai: has('regulators', 'IRDAI') || /IRDAI/.test(ind),
        health: has('dataCategories', 'Health or medical information') || /Health|Pharma/.test(ind)
      });
    },
    filterControl: (c, f) => (f.fiduciary || c.id === 'PRO-05' || ['SEC', 'SEC2', 'BRE'].includes(c.d)),
    roleLabel: (f) => { const r = []; if (f.fiduciary) r.push(f.sdf ? 'Significant Data Fiduciary' : 'Data Fiduciary'); if (f.processor) r.push('Data Processor (for clients)'); return r.join(' and ') || 'Data Processor'; },
    roleCaption: 'Role under the Act',
    applicabilityRows: (f, env) => [
      ['Role', fw.roleLabel(f)],
      ['Significant Data Fiduciary', f.sdf ? 'Notified — section 10 and Rule 13 apply' : f.sdfLikely ? 'Not notified; designation is possible — readiness controls applied' : 'Not notified; designation unlikely on current facts'],
      ['Children\'s data (section 9)', f.children ? 'Applies' : 'Not applicable on the facts given'],
      ['Third Schedule retention limits', f.thirdSchedule ? 'Apply' : 'Do not apply'],
      ['Transfers outside India', f.crossBorder ? 'Yes — ' + (env.countries || 'countries listed in the inventory') : 'None reported'],
      ['Sector overlays', [f.rbi && 'RBI', f.sebi && 'SEBI', f.irdai && 'IRDAI', 'CERT-In Directions 2022'].filter(Boolean).join(', ')]
    ],
    landscapeTitle: 'Personal data landscape',
    landscapeRows: (env) => [
      ['Data Principals', (env.principalTypes || []).join(', ')], ['Categories of data', (env.dataCategories || []).join(', ')],
      ['Volume', env.principals || ''], ['Collection channels', (env.channels || []).join(', ')], ['Systems', env.systems || ''],
      ['Data Processors', env.usesProcessors === false ? 'None' : (env.vendors || 'Yes — see inventory')], ['Regulators', (env.regulators || []).join(', ')], ['Certifications', (env.certifications || []).join(', ')]
    ],
    glossary: [['Data Fiduciary', 'A person who alone or with others decides the purpose and means of processing personal data (section 2(i)).'], ['Data Processor', 'A person who processes personal data on behalf of a Data Fiduciary (section 2(k)).'], ['Data Principal', 'The individual to whom the personal data relates; for a child, includes the parent or lawful guardian (section 2(j)).'], ['Significant Data Fiduciary', 'A Data Fiduciary notified under section 10 on the basis of volume and sensitivity of data, risk to Data Principals and other factors.'], ['Board', 'The Data Protection Board of India.']],
    scopeDefault: (env, name) => 'Processing of digital personal data by ' + name + ' in India, including processing by its Data Processors'
  };
  ENV[3].fields[2] = S.existingDocsField(fw);
  S.registerFramework(fw);
})(typeof window !== 'undefined' ? window : globalThis);
