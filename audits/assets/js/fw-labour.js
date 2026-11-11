/* SAFE Legal Workplace Compliance Audits — Labour Codes framework
 * Code on Wages, 2019 ("CoW"); Industrial Relations Code, 2020 ("IRC"); Code on Social Security, 2020 ("SSC");
 * Occupational Safety, Health and Working Conditions Code, 2020 ("OSHC") — all in force from 21 November 2025 —
 * plus state laws that continue to apply (Shops and Establishments, professional tax, labour welfare fund, holidays).
 */
(function (root) {
  const S = root.SAFE;
  const PHASES = { p1: { date: '2025-11-21', label: 'In force from 21 Nov 2025' }, st: { date: '', label: 'State law' }, bp: { date: '', label: 'Good practice' } };
  const PENALTIES = {
    wages: { max: 0, label: 'Code on Wages, s.54 — fine up to ₹50,000; on a repeat offence within five years, imprisonment up to three months or fine up to ₹1 lakh, or both' },
    ss: { max: 0, label: 'Code on Social Security — fine and, for failure to pay contributions deducted from employees, imprisonment; interest and damages on late contributions' },
    osh: { max: 0, label: 'OSH Code — fine and, where a contravention causes death or serious injury, imprisonment' },
    ir: { max: 0, label: 'Industrial Relations Code — fine, and for illegal lay-off, retrenchment or closure, higher fines' },
    state: { max: 0, label: 'Penalty under the applicable state law' },
    none: { max: 0, label: 'No direct penalty (good practice)' }
  };
  const DOMAINS = [
    { id: 'LREG', name: 'Registrations and licences' },
    { id: 'LWAG', name: 'Wages, bonus and payment' },
    { id: 'LHRS', name: 'Working hours, leave and conditions of service' },
    { id: 'LSSC', name: 'Social security (PF, ESI, gratuity, maternity, gig workers)' },
    { id: 'LIRC', name: 'Industrial relations, grievances and termination' },
    { id: 'LOSH', name: 'Occupational safety, health and welfare' },
    { id: 'LCLB', name: 'Contract labour and inter-state migrant workers' },
    { id: 'LREC', name: 'Registers, returns and notices' },
    { id: 'LSTA', name: 'State labour laws' },
    { id: 'LTRN', name: 'Transition to the Codes and HR documentation' }
  ];
  const C = [];
  const add = (d, list) => list.forEach((c) => C.push(Object.assign({ d, when: '', ph: 'p1', pen: 'none', stat: true, crit: false, iso: '' }, c)));

  add('LREG', [
    { id: 'LC-REG-01', t: 'Establishment registered under the OSH Code', pri: 'M', crit: true, pen: 'osh', when: 'hc10',
      req: 'Every establishment to which the OSH Code applies (generally 10 or more workers) is registered with the registering officer, and registration details are kept current, including changes in ownership or activity.', ref: 'OSHC s.3', ev: 'Registration certificate (or certificate deemed under the earlier laws), with any amendments.', q: 'Is each establishment registered under the OSH Code (or holding a registration that continues from the earlier labour laws)?' },
    { id: 'LC-REG-02', t: 'Factory licence', pri: 'M', crit: true, pen: 'osh', when: 'factory',
      req: 'Each factory holds a valid licence under the OSH Code (or a licence continuing from the Factories Act, 1948), with approved plans and the permitted number of workers and power not exceeded.', ref: 'OSHC (licence for factories); Factories Act licence continuing', ev: 'Factory licence with validity, approved plan, renewal acknowledgement.', q: 'Does each factory hold a valid licence, and is the licensed headcount and power not exceeded?' },
    { id: 'LC-REG-03', t: 'EPF and ESI registration', pri: 'M', crit: true, pen: 'ss', when: 'hc10',
      req: 'The establishment is registered with the Employees\' Provident Fund Organisation (where 20 or more employees) and with the ESI Corporation (where 10 or more employees, in notified areas).', ref: 'SSC s.3 read with the First Schedule', ev: 'EPF establishment code and ESI code; coverage letters.', q: 'Are you registered with EPFO and ESIC (where your headcount and location require it)?' },
    { id: 'LC-REG-04', t: 'Shops and Establishments registration', pri: 'M', pen: 'state', ph: 'st', when: 'officeOrShop',
      req: 'Every office, shop and commercial establishment is registered under the state Shops and Establishments Act, and renewals are current.', ref: 'State Shops and Establishments Act (Karnataka: Karnataka Shops and Commercial Establishments Act, 1961)', ev: 'Registration certificate for each location and renewal proof.', q: 'Is every office, shop or branch registered under the state Shops and Establishments law, with current renewal?' },
    { id: 'LC-REG-05', t: 'Registration as principal employer and contractor licences', pri: 'M', pen: 'osh', when: 'contractLabour',
      req: 'Where contract labour is engaged, the establishment holds the registration required of a principal employer, and each contractor holds a licence where the Code requires it (contractors engaging 50 or more contract workers).', ref: 'OSHC Chapter XI (contract labour)', ev: 'Principal employer registration; list of contractors with licence numbers and validity.', q: 'Where you use contract labour, are you registered as a principal employer, and do your contractors hold valid licences where needed?' }
  ]);

  add('LWAG', [
    { id: 'LC-WAG-01', t: 'Minimum wages and floor wage', pri: 'M', crit: true, pen: 'wages',
      req: 'No employee is paid less than the minimum rate of wages fixed by the appropriate Government for the employment, skill category and area, which cannot be lower than the floor wage.', ref: 'CoW s.5, s.6, s.9', ev: 'Wage register compared with the current minimum wage notification for each state and category.', q: 'Is every employee and worker (including trainees and contract workers) paid at least the applicable minimum wage for their state and skill category?' },
    { id: 'LC-WAG-02', t: 'Uniform definition of "wages" applied (50% rule)', pri: 'M', crit: true, pen: 'ss',
      req: 'Pay is structured so that excluded allowances do not exceed one-half (or the notified percentage) of total remuneration; any excess is treated as wages when computing PF, gratuity, bonus and other benefits.', ref: 'CoW s.2(y) and proviso; SSC s.2(88)', ev: 'Salary structure review; recomputation of PF and gratuity base.', q: 'Have you checked that basic pay plus dearness allowance is at least half of total pay (or that the excess is added back when computing PF, gratuity and bonus)?' },
    { id: 'LC-WAG-03', t: 'Timely payment of wages and full-and-final settlement', pri: 'M', crit: true, pen: 'wages',
      req: 'Wages are paid within the time limits (monthly wages by the seventh day of the next month), and on removal, dismissal, retrenchment or resignation, wages due are paid within two working days.', ref: 'CoW s.16, s.17', ev: 'Payroll calendar; sample of exit settlements with dates.', q: 'Are monthly wages paid by the 7th of the following month, and are dues paid within two working days when someone leaves?' },
    { id: 'LC-WAG-04', t: 'Mode of payment and wage slips', pri: 'M', pen: 'wages',
      req: 'Wages are paid by bank transfer, electronic mode, cheque or in cash as permitted, and every employee receives a wage slip.', ref: 'CoW s.15, s.50', ev: 'Bank payment files; sample wage slips.', q: 'Are wages paid through bank or electronic transfer, and does every employee get a wage slip?' },
    { id: 'LC-WAG-05', t: 'Deductions only as authorised and within limits', pri: 'M', pen: 'wages',
      req: 'Deductions from wages are only those authorised by the Code (fines, absence, damage, advances, statutory deductions) and do not exceed fifty per cent of wages in a wage period.', ref: 'CoW s.18', ev: 'Deduction register; payroll sample.', q: 'Are all salary deductions authorised by law and within 50% of the wage for the period?' },
    { id: 'LC-WAG-06', t: 'Overtime paid at twice the normal rate', pri: 'M', pen: 'wages',
      req: 'Work beyond normal working hours is paid at not less than twice the normal rate of wages.', ref: 'CoW s.14; OSHC s.27', ev: 'Overtime register and payroll.', q: 'Is overtime paid at twice the normal wage rate and recorded?' },
    { id: 'LC-WAG-07', t: 'No gender discrimination in wages or recruitment', pri: 'M', crit: true, pen: 'wages',
      req: 'There is no discrimination on the ground of gender, including transgender identity, in wages for the same or similar work, or in recruitment and conditions of employment, except where employment of women is prohibited by law.', ref: 'CoW s.3', ev: 'Pay-equity analysis by role and grade; recruitment policy.', q: 'Have you checked that men, women and transgender employees doing the same or similar work are paid the same and recruited on equal terms?' },
    { id: 'LC-WAG-08', t: 'Statutory bonus', pri: 'M', pen: 'wages',
      req: 'Eligible employees who have worked at least 30 days in the year receive bonus of at least 8.33% (up to 20%) of wages within the statutory time, computed on the wage ceiling notified.', ref: 'CoW Chapter IV (payment of bonus)', ev: 'Bonus computation and payment register.', q: 'Is statutory bonus computed and paid to eligible employees within the time allowed?' }
  ]);

  add('LHRS', [
    { id: 'LC-HRS-01', t: 'Appointment letter to every employee', pri: 'M', crit: true, pen: 'osh',
      req: 'Every employee is issued an appointment letter in the prescribed form on joining (existing employees within the time prescribed).', ref: 'OSHC s.6(1)(f)', ev: 'Template and a sample of issued letters, including for older employees.', q: 'Has every employee, including those who joined before the Codes, received a written appointment letter?' },
    { id: 'LC-HRS-02', t: 'Daily and weekly working hours, rest and spread-over', pri: 'M', pen: 'osh',
      req: 'No worker works more than the daily and weekly limits fixed (eight hours a day under the Code, subject to the rules), with rest intervals, weekly holiday and spread-over as prescribed.', ref: 'OSHC s.25, s.26; CoW s.13', ev: 'Attendance and shift records; notice of periods of work.', q: 'Are working hours, breaks and weekly offs within the legal limits and recorded?' },
    { id: 'LC-HRS-03', t: 'Annual leave with wages', pri: 'M', pen: 'osh',
      req: 'Workers who have worked 180 days or more in a calendar year receive annual leave with wages at the rate prescribed (one day for every 20 days worked), with carry-forward and encashment as allowed.', ref: 'OSHC s.32', ev: 'Leave policy and leave register.', q: 'Does your leave policy give at least one day of paid leave for every 20 days worked (after 180 days), with carry-forward and encashment?' },
    { id: 'LC-HRS-04', t: 'Free annual health check-up', pri: 'M', pen: 'osh',
      req: 'Employees of the class and age prescribed receive a free annual health examination arranged by the employer.', ref: 'OSHC s.6(1)(c)', ev: 'Health check-up records or vendor contract.', q: 'Do you provide a free annual health check-up to the employees the rules require (for example those above the prescribed age)?' },
    { id: 'LC-HRS-05', t: 'Women working at night only with consent and safeguards', pri: 'M', crit: true, pen: 'osh', when: 'nightWomen',
      req: 'Women work before 6 a.m. or after 7 p.m. only with their consent and subject to the conditions on safety, holidays, working hours and transport prescribed by the appropriate Government.', ref: 'OSHC s.43', ev: 'Written consent; transport and safety arrangements; notification conditions.', q: 'Where women work night shifts, do you have their written consent and provide the transport and safety measures required?' },
    { id: 'LC-HRS-06', t: 'National and festival holidays', pri: 'M', pen: 'state', ph: 'st',
      req: 'National and festival holidays are granted as required by state law, with double wages or a substitute holiday for work on those days.', ref: 'State holidays law (Karnataka: Karnataka Industrial Establishments (National and Festival Holidays) Act, 1963)', ev: 'Holiday list and register.', q: 'Do you grant the national and festival holidays required by your state, with double pay or a substitute holiday if staff work on them?' }
  ]);

  add('LSSC', [
    { id: 'LC-SSC-01', t: 'PF contributions deducted and deposited on time', pri: 'M', crit: true, pen: 'ss', when: 'hc20',
      req: 'Employer and employee provident fund contributions are computed on wages (as defined), covering all eligible employees including contract workers, and deposited by the due date with returns filed.', ref: 'SSC Chapter III (Employees\' Provident Fund)', ev: 'ECR challans for 12 months; coverage reconciliation with payroll.', q: 'Are PF contributions computed on the correct wage base for all eligible employees and paid by the due date every month?' },
    { id: 'LC-SSC-02', t: 'ESI contributions and coverage', pri: 'M', crit: true, pen: 'ss', when: 'hc10',
      req: 'Employees within the ESI wage ceiling in notified areas are covered, contributions are deposited on time and accident reports are made.', ref: 'SSC Chapter IV (Employees\' State Insurance)', ev: 'ESI challans and returns; coverage list.', q: 'Are eligible employees covered under ESI and contributions paid on time?' },
    { id: 'LC-SSC-03', t: 'Gratuity, including for fixed-term employees', pri: 'M', crit: true, pen: 'ss',
      req: 'Gratuity is paid on termination after five years of continuous service (and for fixed-term employees on a pro-rata basis without the five-year condition), at 15 days\' wages per year of service, within 30 days, and the liability is funded or insured as required.', ref: 'SSC Chapter V (gratuity), s.53', ev: 'Gratuity policy; actuarial valuation; payment records; insurance/trust.', q: 'Is gratuity paid correctly within 30 days, including pro-rata gratuity to fixed-term employees, and is the liability funded?' },
    { id: 'LC-SSC-04', t: 'Maternity benefit (26 weeks) and related protections', pri: 'M', crit: true, pen: 'ss', when: 'women',
      req: 'Eligible women receive maternity benefit for up to 26 weeks (12 weeks for adopting and commissioning mothers), nursing breaks, work-from-home where the work allows, and are not dismissed during maternity leave.', ref: 'SSC Chapter VI (maternity benefit)', ev: 'Maternity policy; leave and payment records.', q: 'Do women employees receive up to 26 weeks of paid maternity leave and the other protections (no dismissal, nursing breaks, work-from-home where possible)?' },
    { id: 'LC-SSC-05', t: 'Crèche facility', pri: 'M', pen: 'ss', when: 'hc50',
      req: 'Every establishment with 50 or more employees provides a crèche (separately or as a common facility within the prescribed distance), with the prescribed number of visits allowed to the mother.', ref: 'SSC s.67', ev: 'Crèche arrangement or tie-up agreement; policy.', q: 'With 50 or more employees, do you provide a crèche facility (own, shared or tied up)?' },
    { id: 'LC-SSC-06', t: 'Employee compensation for injury', pri: 'M', pen: 'ss',
      req: 'Employees not covered by ESI are protected for employment injury: compensation is paid as required and accidents are reported.', ref: 'SSC Chapter VII (employee\'s compensation)', ev: 'Employee compensation insurance policy; accident register.', q: 'For staff outside ESI, do you hold employee compensation insurance and report workplace accidents?' },
    { id: 'LC-SSC-07', t: 'Gig and platform worker contributions', pri: 'M', pen: 'ss', when: 'gig',
      req: 'Aggregators engaging gig or platform workers register as required, share worker data and pay the contribution notified for the social security scheme (one to two per cent of annual turnover, capped at five per cent of payments to such workers).', ref: 'SSC Chapter IX (gig and platform workers), s.114', ev: 'Aggregator registration; contribution computation and payment.', q: 'As an aggregator, have you registered and do you pay the notified contribution for gig and platform workers?' },
    { id: 'LC-SSC-08', t: 'Contract workers covered for PF and ESI', pri: 'M', pen: 'ss', when: 'contractLabour',
      req: 'The principal employer verifies that contractors deposit PF and ESI for contract workers deployed, and pays them if the contractor fails, recovering from the contractor.', ref: 'SSC (principal employer liability)', ev: 'Monthly contractor challans and reconciliations.', q: 'Do you check every month that your contractors have paid PF and ESI for the workers deployed with you?' }
  ]);

  add('LIRC', [
    { id: 'LC-IRC-01', t: 'Grievance Redressal Committee', pri: 'M', pen: 'ir', when: 'hc20',
      req: 'Every industrial establishment with 20 or more workers has a Grievance Redressal Committee with equal employer and worker representatives (and proportionate women representation), which resolves grievances within 30 days.', ref: 'IRC s.4', ev: 'Constitution order; minutes; grievance register.', q: 'With 20 or more workers, have you constituted a Grievance Redressal Committee and does it resolve grievances within 30 days?' },
    { id: 'LC-IRC-02', t: 'Standing orders', pri: 'M', pen: 'ir', when: 'hc300',
      req: 'Establishments with 300 or more workers have standing orders on the matters in the First Schedule, either certified or adopting the model standing orders with any required notice.', ref: 'IRC s.28–s.30', ev: 'Certified or adopted standing orders; communication to workers.', q: 'With 300 or more workers, do you have certified standing orders or have you adopted the model standing orders?' },
    { id: 'LC-IRC-03', t: 'Fixed-term employees on equal terms', pri: 'M', pen: 'ir', when: 'fixedTerm',
      req: 'Fixed-term employees have the same hours, wages, allowances and benefits as permanent workers doing the same or similar work, and receive gratuity on a pro-rata basis.', ref: 'IRC s.2(o)', ev: 'Fixed-term contracts and pay comparison.', q: 'Are fixed-term employees paid and treated the same as permanent staff doing similar work?' },
    { id: 'LC-IRC-04', t: 'Retrenchment notice, compensation and re-skilling fund', pri: 'M', crit: true, pen: 'ir',
      req: 'Retrenchment of a worker with one year\'s service follows one month\'s notice (or pay in lieu), compensation of 15 days\' average pay per completed year, notice to the Government, and the contribution of 15 days\' wages to the Worker Re-skilling Fund.', ref: 'IRC s.70, s.83', ev: 'Retrenchment files: notices, settlement, fund payment.', q: 'When you retrench workers, do you give notice, pay retrenchment compensation and pay the re-skilling fund contribution?' },
    { id: 'LC-IRC-05', t: 'Prior permission for lay-off, retrenchment and closure (300+ workers)', pri: 'M', crit: true, pen: 'ir', when: 'hc300',
      req: 'Industrial establishments with 300 or more workers obtain prior Government permission before lay-off, retrenchment or closure.', ref: 'IRC Chapter X', ev: 'Permission applications and orders, if any.', q: 'With 300 or more workers, do you seek prior Government permission before any lay-off, retrenchment or closure?' },
    { id: 'LC-IRC-06', t: 'Notice of change in conditions of service', pri: 'M', pen: 'ir',
      req: 'Before changing conditions of service listed in the Third Schedule (wages, hours, leave, shifts, rationalisation), the employer gives 21 days\' notice to affected workers.', ref: 'IRC s.40', ev: 'Change notices and dates.', q: 'Do you give 21 days\' notice before changing wages, working hours, leave or shifts?' },
    { id: 'LC-IRC-07', t: 'Fair disciplinary process', pri: 'S', stat: false, ph: 'bp',
      req: 'Misconduct is handled through a written process: charge-sheet, opportunity to reply, fair inquiry and a reasoned order, in line with standing orders and natural justice.', ref: 'IRC; principles of natural justice', ev: 'Disciplinary policy and sample files.', q: 'Do you follow a written disciplinary process with a charge-sheet, reply, inquiry and reasoned order?' },
    { id: 'LC-IRC-08', t: 'Trade union recognition and strike notices', pri: 'S', pen: 'ir', when: 'unions',
      req: 'Where unions exist, the negotiating union or council is recognised as the Code provides, and strike and lock-out notice requirements are known and followed.', ref: 'IRC s.14, s.62', ev: 'Recognition correspondence; settlements.', q: 'Where there is a union, have you recognised the negotiating union and do you follow the strike and lock-out notice rules?' }
  ]);

  add('LOSH', [
    { id: 'LC-OSH-01', t: 'General duties of employer: safe workplace', pri: 'M', crit: true, pen: 'osh',
      req: 'The workplace is free from hazards that cause or are likely to cause injury or occupational disease, and the employer complies with the safety and health standards declared.', ref: 'OSHC s.6', ev: 'Risk assessment; safety policy; inspection records.', q: 'Have you assessed workplace hazards and put safety measures in place, with records of inspections?' },
    { id: 'LC-OSH-02', t: 'Notice of accidents and dangerous occurrences', pri: 'M', pen: 'osh',
      req: 'Accidents causing death or bodily injury, and dangerous occurrences, are notified to the authorities within the time prescribed and recorded.', ref: 'OSHC s.10', ev: 'Accident register; notices sent.', q: 'Do you notify the authorities of accidents and dangerous occurrences in time and keep an accident register?' },
    { id: 'LC-OSH-03', t: 'Welfare facilities: water, toilets, first aid, canteen', pri: 'M', pen: 'osh',
      req: 'Drinking water, separate toilets and washrooms for men, women and transgender persons, first-aid boxes, and (where the thresholds are met) canteen, rest rooms and welfare officer are provided.', ref: 'OSHC (welfare facilities) and rules', ev: 'Facility checklist with photographs.', q: 'Are drinking water, separate toilets, first aid and (above the thresholds) a canteen and welfare officer provided?' },
    { id: 'LC-OSH-04', t: 'Safety committee and safety officer', pri: 'M', pen: 'osh', when: 'factory',
      req: 'Where the thresholds and notifications apply (factories with 500 or more workers, hazardous processes), a safety committee is constituted and safety officers appointed.', ref: 'OSHC s.22', ev: 'Committee constitution and minutes; appointment letters.', q: 'Where required, have you constituted a safety committee and appointed safety officers?' },
    { id: 'LC-OSH-05', t: 'Fire safety and emergency preparedness', pri: 'M', pen: 'osh',
      req: 'Fire NOC (where required), fire-fighting equipment, evacuation plans and periodic drills are in place.', ref: 'OSHC; state fire services law', ev: 'Fire NOC; extinguisher service records; drill log.', q: 'Do you hold a fire NOC where required and run evacuation drills?' },
    { id: 'LC-OSH-06', t: 'Hazardous processes and occupational health', pri: 'M', crit: true, pen: 'osh', when: 'factory',
      req: 'Hazardous processes are disclosed, emergency plans prepared, exposure monitored and workers given medical examination as prescribed.', ref: 'OSHC (special provisions for factories and hazardous processes)', ev: 'Disclosure, on-site emergency plan, medical records.', q: 'If you run hazardous processes, have you made the disclosures, prepared the emergency plan and arranged medical examinations?' }
  ]);

  add('LCLB', [
    { id: 'LC-CLB-01', t: 'Principal employer responsibility for contract workers\' wages and welfare', pri: 'M', crit: true, pen: 'osh', when: 'contractLabour',
      req: 'The principal employer ensures welfare facilities for contract labour and that wages are paid by the contractor; if the contractor fails, the principal employer pays and recovers.', ref: 'OSHC Chapter XI (contract labour)', ev: 'Contractor wage disbursement checks; welfare facility records.', q: 'Do you check that contractors pay their workers correctly and on time, and provide welfare facilities to contract workers?' },
    { id: 'LC-CLB-02', t: 'Contract labour not used in core activities (except as permitted)', pri: 'S', pen: 'osh', when: 'contractLabour',
      req: 'Contract labour is not employed in core activities of the establishment except in the situations the Code permits.', ref: 'OSHC s.57', ev: 'Mapping of contract roles to activities.', q: 'Have you checked that contract workers are not deployed in your core activities (other than as the law allows)?' },
    { id: 'LC-CLB-03', t: 'Contractor agreements with compliance obligations', pri: 'S', stat: false, ph: 'bp', when: 'contractLabour',
      req: 'Contractor agreements require licences, payment of wages, PF and ESI, records, indemnity and audit rights, and are monitored monthly.', ref: 'Good practice', ev: 'Agreements and monthly compliance checklist.', q: 'Do contractor agreements require full labour law compliance, with monthly evidence and audit rights?' },
    { id: 'LC-CLB-04', t: 'Inter-state migrant workers', pri: 'M', pen: 'osh', when: 'migrant',
      req: 'Inter-state migrant workers receive the same wages and facilities as local workers, an annual journey allowance as prescribed, and the employer maintains the required records and helpline information.', ref: 'OSHC Chapter X (inter-State migrant workers)', ev: 'Migrant worker register; journey allowance payments.', q: 'Are workers from other states paid the same as local workers and given the annual journey allowance?' }
  ]);

  add('LREC', [
    { id: 'LC-REC-01', t: 'Registers maintained (electronically where allowed)', pri: 'M', pen: 'wages',
      req: 'Registers of employees, wages, attendance, overtime, deductions, leave and accidents are maintained in the forms prescribed under the Codes, electronically where permitted.', ref: 'CoW s.50; OSHC s.33', ev: 'Sample registers from the HR system.', q: 'Do you maintain the statutory registers (employees, wages, attendance, leave, overtime, deductions) in the prescribed form?' },
    { id: 'LC-REC-02', t: 'Returns filed', pri: 'M', pen: 'osh',
      req: 'Annual and other returns under the Codes and state laws are filed on the government portals within time.', ref: 'OSHC s.33; CoW s.50; state laws', ev: 'Filing acknowledgements.', q: 'Are annual and other labour returns filed on time?' },
    { id: 'LC-REC-03', t: 'Statutory notices displayed', pri: 'M', pen: 'osh',
      req: 'Abstracts of the Codes, working hours, holidays, grievance committee and inspector details are displayed at the workplace (and electronically where allowed).', ref: 'OSHC s.33; CoW', ev: 'Photographs of notice boards or intranet notices.', q: 'Are the required abstracts and notices displayed at each workplace?' },
    { id: 'LC-REC-04', t: 'Readiness for inspector-cum-facilitator visits', pri: 'S', stat: false, ph: 'bp',
      req: 'A named person handles inspections, records are retrievable, and past inspection observations are closed.', ref: 'OSHC s.34; CoW s.51 (inspector-cum-facilitator)', ev: 'Inspection log and closure notes.', q: 'Is there a named person and file ready for labour inspections, with past observations closed?' }
  ]);

  add('LSTA', [
    { id: 'LC-STA-01', t: 'Professional tax', pri: 'M', pen: 'state', ph: 'st', when: 'ptState',
      req: 'Professional tax is deducted from salaries and paid with returns, and the employer holds registration and enrolment certificates where the state levies it.', ref: 'State professional tax law (Karnataka Tax on Professions, Trades, Callings and Employments Act, 1976)', ev: 'Registration and payment challans.', q: 'Is professional tax deducted, paid and returned for each state that levies it?' },
    { id: 'LC-STA-02', t: 'Labour welfare fund', pri: 'M', pen: 'state', ph: 'st',
      req: 'Employer and employee contributions to the state labour welfare fund are paid where the state requires them.', ref: 'State labour welfare fund law (Karnataka Labour Welfare Fund Act, 1965)', ev: 'Contribution receipts.', q: 'Do you pay labour welfare fund contributions in the states that require them?' },
    { id: 'LC-STA-03', t: 'State Shops and Establishments conditions', pri: 'M', pen: 'state', ph: 'st', when: 'officeOrShop',
      req: 'Opening hours, leave, holidays, employment of women at night and other conditions under the state Shops and Establishments law are complied with.', ref: 'State Shops and Establishments Act', ev: 'Policy mapping; exemptions held.', q: 'Do you meet your state\'s Shops and Establishments rules on hours, leave and night work (or hold an exemption)?' }
  ]);

  add('LTRN', [
    { id: 'LC-TRN-01', t: 'Transition plan to the four Labour Codes', pri: 'S', stat: false, ph: 'bp',
      req: 'A documented plan has mapped changes from the earlier labour laws to the Codes (wage definition, gratuity for fixed-term staff, appointment letters, registrations, returns) with owners and dates.', ref: 'Good practice on transition to the Codes', ev: 'Transition plan and status.', q: 'Do you have a written plan for moving from the old labour laws to the four Codes, with owners and dates?' },
    { id: 'LC-TRN-02', t: 'HR policies updated for the Codes', pri: 'S', stat: false, ph: 'bp',
      req: 'The HR manual, leave, working hours, overtime, exit and disciplinary policies reflect the Codes and applicable state laws.', ref: 'Good practice', ev: 'Updated HR manual with version date.', q: 'Have your HR policies been updated for the Labour Codes?' },
    { id: 'LC-TRN-03', t: 'Payroll restructuring reviewed for cost impact', pri: 'W', stat: false, ph: 'bp', pen: 'none',
      req: 'The impact of the uniform wage definition on PF, gratuity, bonus and leave encashment has been costed and approved.', ref: 'Good practice', ev: 'Costing note and approval.', q: 'Have you costed the effect of the new wage definition on PF, gratuity and other benefits?' },
    { id: 'LC-TRN-04', t: 'Labour compliance calendar and owner', pri: 'W', stat: false, ph: 'bp', pen: 'none',
      req: 'A compliance calendar lists every monthly, half-yearly and annual labour obligation by state, with a named owner and evidence of completion.', ref: 'Good practice', ev: 'Calendar with completion evidence.', q: 'Is there a labour compliance calendar with a named owner and proof of each filing?' }
  ]);

  const DOC_TYPES = [
    { id: 'appointment-letter', title: 'Appointment Letter Template (Labour Codes compliant)', audience: 'Employees', controls: ['LC-HRS-01', 'LC-IRC-03'] },
    { id: 'hr-manual', title: 'HR Policy Manual — working hours, leave, overtime and holidays', audience: 'All staff', controls: ['LC-HRS-02', 'LC-HRS-03', 'LC-HRS-06', 'LC-TRN-02'] },
    { id: 'grc-procedure', title: 'Grievance Redressal Committee — constitution order and procedure', audience: 'Workers and management', controls: ['LC-IRC-01'], when: 'hc20' },
    { id: 'standing-orders', title: 'Standing Orders (draft for certification or adoption)', audience: 'Workers', controls: ['LC-IRC-02'], when: 'hc300' },
    { id: 'disciplinary', title: 'Disciplinary and Exit Procedure (including full-and-final settlement in two working days)', audience: 'HR and managers', controls: ['LC-IRC-07', 'LC-WAG-03'] },
    { id: 'maternity-policy', title: 'Maternity Benefit and Crèche Policy', audience: 'Employees', controls: ['LC-SSC-04', 'LC-SSC-05'], when: 'women' },
    { id: 'contractor-clauses', title: 'Contractor Compliance Clauses and Monthly Checklist', audience: 'Contractors and procurement', controls: ['LC-CLB-01', 'LC-CLB-03', 'LC-SSC-08'], when: 'contractLabour' },
    { id: 'night-shift', title: 'Night Shift Policy for Women Employees (consent and safety)', audience: 'Women employees and managers', controls: ['LC-HRS-05'], when: 'nightWomen' },
    { id: 'transition-plan', title: 'Labour Codes Transition Plan and Compliance Calendar', audience: 'Management', controls: ['LC-TRN-01', 'LC-TRN-04'] }
  ];

  const F = (k, l, t, extra) => Object.assign({ k, l, t }, extra || {});
  const fw = {
    id: 'labour', code: 'LABOUR', name: 'Labour Codes Compliance Audit', short: 'Labour Codes', icon: 'people',
    tagline: 'The four Labour Codes in force from 21 November 2025, with state labour laws',
    criteria: 'Code on Wages, 2019; Industrial Relations Code, 2020; Code on Social Security, 2020; Occupational Safety, Health and Working Conditions Code, 2020 (in force from 21 November 2025); rules under the Codes; applicable state labour laws',
    criteriaShort: 'the Code on Wages, 2019, the Industrial Relations Code, 2020, the Code on Social Security, 2020 and the Occupational Safety, Health and Working Conditions Code, 2020 (together, the Labour Codes), the rules under them, and the state labour laws that apply to the organisation',
    contextNote: 'The four Labour Codes came into force on 21 November 2025. Where the appropriate Government had not yet notified rules under a Code, the audit applied the rules and forms continued from the earlier laws to the extent the Codes keep them in force.',
    stdLabel: 'Related law',
    certTitle: () => 'Certificate of Labour Codes Compliance',
    certLaw: 'Code on Wages, 2019 · Industrial Relations Code, 2020 · Code on Social Security, 2020 · OSH Code, 2020',
    certDisclaimer: 'This certificate is not issued by any labour authority. It does not replace registrations, licences, returns or inspections required under the Labour Codes or state laws.',
    reportTitle: () => 'LABOUR CODES COMPLIANCE AUDIT REPORT',
    phases: PHASES, penalties: PENALTIES, domains: DOMAINS, controls: C, docTypes: DOC_TYPES,
    common: ['org', 'workforce'],
    envSections: [{ id: 'labourEnv', title: 'Labour compliance today', fields: [
      F('pfCode', 'EPF establishment code (if registered)', 'text'), F('esiCode', 'ESI code (if registered)', 'text'),
      F('contractors', 'Main contractors (housekeeping, security, staffing, production) and approximate headcount each', 'textarea'),
      F('inspections', 'Labour inspections, notices or disputes in the last two years', 'textarea'),
      null
    ] }],
    flags: (env) => {
      const f = S.commonFlags(env);
      return Object.assign(f, { hc10: f.hc >= 10, hc20: f.hc >= 20, hc50: f.hc >= 50, hc300: f.hc >= 300, officeOrShop: true, ptState: true });
    },
    roleLabel: (f) => (f.factory ? 'Employer operating a factory' : 'Employer') + (f.contractLabour ? ' and principal employer of contract labour' : '') + (f.gig ? '; aggregator of gig/platform workers' : ''),
    roleCaption: 'Status under the Codes',
    applicabilityRows: (f, env) => [
      ['Headcount band', env.employees || '—'],
      ['Thresholds triggered', [f.hc >= 10 && 'OSH registration and ESI (10+)', f.hc >= 20 && 'PF and Grievance Redressal Committee (20+)', f.hc >= 50 && 'Crèche (50+)', f.hc >= 300 && 'Standing orders and prior permission for lay-off, retrenchment, closure (300+)'].filter(Boolean).join('; ') || 'Below the main thresholds'],
      ['Factory provisions', f.factory ? 'Apply' : 'Do not apply'],
      ['Contract labour provisions', f.contractLabour ? 'Apply' + (f.contract50 ? ' (contractor licensing threshold reached)' : '') : 'Not applicable'],
      ['Women at night', f.nightWomen ? 'Applies — consent and safeguards required' : 'Not applicable'],
      ['States', env.locations || '—']
    ],
    landscapeTitle: 'Workforce profile',
    landscapeRows: (env) => [['Workplaces', (env.establishments || []).join(', ')], ['Women employees', env.women || ''], ['Contract labour', env.contractLabour ? 'Yes (' + (env.contractLabourCount || 'number not given') + ')' : 'No'], ['Fixed-term employees', env.fixedTerm ? 'Yes' : 'No'], ['Gig / platform workers', env.gig ? 'Yes' : 'No'], ['Inter-state migrant workers', env.migrant ? 'Yes' : 'No'], ['Trade union', env.unions ? 'Yes' : 'No'], ['Payroll', env.payroll || ''], ['Main contractors', env.contractors || '']],
    glossary: [['Worker / employee', 'As defined in each Code; "worker" excludes persons employed mainly in managerial or administrative capacity and supervisors drawing wages above the notified limit.'], ['Wages', 'The uniform definition in section 2(y) of the Code on Wages, with excluded allowances above one-half of remuneration added back.'], ['Principal employer', 'The person responsible for the establishment in which contract labour is engaged.'], ['Inspector-cum-facilitator', 'The officer appointed under the Codes to inspect and advise employers.']],
    scopeDefault: (env, name) => 'Employment practices of ' + name + ' at its establishments in India, including contract labour engaged at those establishments'
  };
  fw.envSections[0].fields[4] = S.existingDocsField(fw);
  S.registerFramework(fw);
})(typeof window !== 'undefined' ? window : globalThis);
