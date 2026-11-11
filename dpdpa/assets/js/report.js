/* SAFE DPDPA Compliance Studio — audit report, certificate and document output.
 * One block list feeds both the on-screen/print HTML and the Word (.docx) file.
 * Word headings are bold paragraphs, not Heading styles, so Word shows no collapse arrows.
 */
(function (root) {
  const S = (root.SAFE = root.SAFE || {});
  const esc = S.esc;
  const T = (text, o) => Object.assign({ text: String(text == null ? '' : text) }, o || {});
  const cell = (text, o) => String(text == null ? '' : text).split(/\r?\n/).reduce((acc, line, i) => (i ? acc.concat([{ br: true }, T(line, o)]) : [T(line, o)]), []);

  // ---------------------------------------------------------------- markdown-ish text -> blocks
  S.inlineRuns = (line) => {
    const runs = [];
    String(line).split(/(\*\*[^*]+\*\*|\?\?[^?]+\?\?)/).forEach((part) => {
      if (!part) return;
      if (/^\*\*[^*]+\*\*$/.test(part)) runs.push(T(part.slice(2, -2), { b: true }));
      else if (/^\?\?[^?]+\?\?$/.test(part)) runs.push(T('[' + part.slice(2, -2) + ']', { hl: true }));
      else runs.push(T(part));
    });
    return runs.length ? runs : [T('')];
  };
  S.mdToBlocks = (text) => {
    const out = [];
    let sec = 0, table = null;
    const flush = () => { if (table) { out.push({ t: 'table', rows: table, header: true, small: true }); table = null; } };
    String(text || '').split(/\r?\n/).forEach((raw) => {
      const line = raw.trim();
      if (/^\|.*\|$/.test(line)) {
        if (/^\|[\s:\-|]+\|$/.test(line)) return; // separator row
        table = table || [];
        table.push(line.slice(1, -1).split('|').map((c) => S.inlineRuns(c.trim())));
        return;
      }
      flush();
      if (!line) return;
      let m;
      if ((m = /^#{1,2}\s+(.*)$/.exec(line)) && !/^###/.test(line)) { sec++; out.push({ t: 'h1', runs: [T(sec + '. ' + m[1].replace(/^\d+[.)]\s*/, ''))] }); return; }
      if ((m = /^###\s+(.*)$/.exec(line))) { out.push({ t: 'h2', runs: S.inlineRuns(m[1]) }); return; }
      if ((m = /^(\d+)\.(\d+(?:\.\d+)*)\s+(.*)$/.exec(line))) { const num = (sec || +m[1]) + '.' + m[2]; out.push({ t: 'clause', num, depth: num.split('.').length - 1, runs: S.inlineRuns(m[3]) }); return; }
      if ((m = /^--\s+(.*)$/.exec(line))) { out.push({ t: 'bullet', level: 1, runs: S.inlineRuns(m[1]) }); return; }
      if ((m = /^[-*•]\s+(.*)$/.exec(line))) { out.push({ t: 'bullet', runs: S.inlineRuns(m[1]) }); return; }
      out.push({ t: 'p', runs: S.inlineRuns(line) });
    });
    flush();
    return out;
  };

  // ---------------------------------------------------------------- blocks -> HTML
  const runsHtml = (runs) => (runs || []).map((r) => {
    if (r.br) return '<br>';
    let h = esc(r.text);
    if (r.b) h = '<b>' + h + '</b>';
    if (r.i) h = '<i>' + h + '</i>';
    if (r.hl) h = '<mark>' + h + '</mark>';
    if (r.color) h = '<span style="color:#' + r.color + '">' + h + '</span>';
    return h;
  }).join('');
  S.blocksToHtml = (blocks) => blocks.map((b) => {
    switch (b.t) {
      case 'title': return '<div class="r-title">' + runsHtml(b.runs) + '</div>';
      case 'subtitle': return '<div class="r-subtitle">' + runsHtml(b.runs) + '</div>';
      case 'banner': return '<div class="r-banner">' + runsHtml(b.runs) + '</div>';
      case 'spacer': return '<div style="height:' + (b.big ? 120 : 12) + 'px"></div>';
      case 'h1': return '<div class="r-h1">' + runsHtml(b.runs) + '</div>';
      case 'h2': return '<div class="r-h2">' + runsHtml(b.runs) + '</div>';
      case 'h3': return '<div class="r-h3">' + runsHtml(b.runs) + '</div>';
      case 'bullet': return '<div class="r-bullet' + (b.level ? ' l2' : '') + '">' + runsHtml(b.runs) + '</div>';
      case 'clause': return '<div class="r-clause" style="padding-left:' + (Math.max(1, b.depth) * 34) + 'px"><span class="num">' + esc(b.num) + '</span>' + runsHtml(b.runs) + '</div>';
      case 'note': return '<div class="r-note">' + runsHtml(b.runs) + '</div>';
      case 'pagebreak': return '<div class="r-pagebreak"></div>';
      case 'table': return '<table class="r-table' + (b.small ? ' small' : '') + '">' + b.rows.map((row, i) => '<tr>' + row.map((c) => (i === 0 && b.header !== false ? '<th>' : '<td>') + runsHtml(c) + (i === 0 && b.header !== false ? '</th>' : '</td>')).join('') + '</tr>').join('') + '</table>';
      default: return '<p class="r-p" style="text-align:' + (b.align || 'justify') + '">' + runsHtml(b.runs) + '</p>';
    }
  }).join('\n');

  // ---------------------------------------------------------------- images
  S.loadImage = (src) => new Promise((res, rej) => {
    fetch(src).then((r) => r.arrayBuffer()).then((buf) => {
      const blob = new Blob([buf]);
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => { res({ data: new Uint8Array(buf), width: img.naturalWidth, height: img.naturalHeight, mime: /\.jpe?g$/i.test(src) ? 'image/jpeg' : 'image/png' }); URL.revokeObjectURL(url); };
      img.onerror = rej; img.src = url;
    }).catch(rej);
  });
  S.safeLetterhead = async (base) => {
    base = base || 'assets/img/';
    const head = await S.loadImage(base + 'letterhead.png');
    const foot = await S.loadImage(base + 'footer.png');
    return { kind: 'image', data: head.data, mime: head.mime, width: head.width, height: head.height, fullBleed: false, footer: { data: foot.data, mime: foot.mime, width: foot.width, height: foot.height } };
  };
  S.b64ToBytes = (b64) => { const bin = atob(b64); const u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return u; };
  S.bytesToB64 = (bytes) => { let s = ''; const u = new Uint8Array(bytes); for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000)); return btoa(s); };
  S.download = (blob, name) => { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000); };

  // ---------------------------------------------------------------- audit report
  S.METHOD_TEXT = [
    'The audit followed the guidelines for auditing management systems in ISO 19011. The audit criteria are the Digital Personal Data Protection Act, 2023 (the Act) and the Digital Personal Data Protection Rules, 2025 (the Rules). These are supplemented by applicable sector regulations and good practice drawn from ISO/IEC 27701 and ISO/IEC 27001.',
    'The organisation first described its environment in a structured questionnaire, from which SAFE Legal Solutions determined the organisation\'s role under the Act and the controls that apply to it. Each applicable control was then assessed through structured questions, follow-up enquiries and a review of documentary evidence against the requirement.',
    'Each control was assigned a status and a grade under SAFE\'s audit methodology. Under that methodology, a legal non-compliance is never graded below a minor nonconformity, and three or more minor nonconformities in one area are raised as a systemic major nonconformity. The findings and this report were reviewed and approved by an advocate of SAFE Legal Solutions.',
    'Corrective actions taken by the organisation were verified against the evidence it submitted before the related findings were closed.'
  ];
  S.RELIANCE_TEXT = 'This report is based on the information, documents and representations provided by the organisation during the audit period, and on the law as it stood on the report date. SAFE Legal Solutions has not independently tested the operation of every system, and an audit samples evidence rather than examining every record. The report and any certificate are not a guarantee against a personal data breach or regulatory action. They are not a substitute for the independent data audit or Data Protection Impact Assessment required of a Significant Data Fiduciary under section 10 of the Act and Rule 13. The report is confidential to the organisation and may be shared with its board, auditors, regulators and business partners for the purpose of demonstrating its data protection compliance.';

  S.composeReport = (ctx) => {
    const { client, audit, kind, summary, signer, today } = ctx;
    const env = audit.env || {};
    const flags = S.applicability(env);
    const sc = S.scores(audit);
    const k = S.counts(audit);
    const op = S.opinion(audit);
    const exp = S.exposure(audit);
    const all = S.allFindings(audit);
    const out = [];
    const date = today || S.today();
    const final = kind === 'final';
    const readiness = S.isReadinessPeriod(date);

    // cover
    out.push({ t: 'spacer', big: true });
    out.push({ t: 'title', size: 20, runs: [T('DPDPA ' + (readiness ? 'COMPLIANCE AND READINESS' : 'COMPLIANCE') + ' AUDIT REPORT')] });
    out.push({ t: 'subtitle', size: 13, runs: [T((final ? 'Final report' : 'Interim report') + ' — ' + (env.legalName || client.name))] });
    out.push({ t: 'spacer' });
    out.push({ t: 'p', align: 'center', runs: [T('Audit reference ' + audit.ref + '  |  ' + S.fmtDate(date))] });
    out.push({ t: 'p', align: 'center', runs: [T('Digital Personal Data Protection Act, 2023 and Digital Personal Data Protection Rules, 2025', { i: true })] });
    out.push({ t: 'spacer' });
    out.push({ t: 'p', align: 'center', runs: [T('Prepared by SAFE Legal Solutions, Bengaluru', { b: true })] });
    out.push({ t: 'banner', runs: [T('CONFIDENTIAL — PREPARED FOR ' + String(env.legalName || client.name).toUpperCase())] });
    out.push({ t: 'pagebreak' });

    // 1 engagement
    out.push({ t: 'h1', runs: [T('1. Engagement details')] });
    const lead = ctx.leadName || (audit.team && audit.team.lead) || '';
    out.push({ t: 'table', header: false, shadeFirstCol: true, widths: [0.32, 0.68], small: true, rows: [
      [cell('Organisation', { b: true }), cell(env.legalName || client.name)],
      [cell('Registration number', { b: true }), cell(env.cin || '—')],
      [cell('Registered office', { b: true }), cell(env.address || '—')],
      [cell('Audit reference', { b: true }), cell(audit.ref + ' (' + (audit.type === 'renewal' ? 'annual re-audit' : 'initial audit') + ')')],
      [cell('Audit period', { b: true }), cell(S.fmtDate(String(audit.createdAt).slice(0, 10)) + ' to ' + S.fmtDate(date))],
      [cell('Scope', { b: true }), cell(audit.scope || 'All processing of digital personal data by the organisation, including processing by its Data Processors, as described in section 5 of this report.')],
      [cell('Role under the Act', { b: true }), cell(S.ROLE_LABEL(flags))],
      [cell('Audit criteria', { b: true }), cell('DPDP Act, 2023; DPDP Rules, 2025 (G.S.R. 846(E), 13 November 2025); applicable sector regulations; ISO/IEC 27701 (reference)')],
      [cell('Methodology', { b: true }), cell('ISO 19011 audit practice; SAFE DPDPA audit methodology')],
      [cell('Lead auditor', { b: true }), cell(lead || 'SAFE Legal Solutions')],
      [cell('Report status', { b: true }), cell(final ? 'Final' : 'Interim — findings open for remediation')]
    ] });

    // 2 executive summary
    out.push({ t: 'h1', runs: [T('2. Executive summary')] });
    if (summary && summary.executiveSummary) String(summary.executiveSummary).split(/\n+/).forEach((p) => out.push({ t: 'p', runs: [T(p)] }));
    out.push({ t: 'table', header: true, small: true, widths: [0.5, 0.5], rows: [
      [cell('Measure'), cell('Result')],
      [cell('Overall compliance score'), cell(sc.overall + '%', { b: true })],
      [cell('Audit opinion'), cell(S.OPINIONS[op].label, { b: true })],
      [cell('Must have — major nonconformities'), cell(k.major + ' raised, ' + k.majorOpen + ' open')],
      [cell('Should have — minor nonconformities'), cell(k.minor + ' raised, ' + k.minorOpen + ' open')],
      [cell('Might have — opportunities for improvement'), cell(k.ofi + ' raised, ' + k.ofiOpen + ' open')],
      [cell('Controls assessed'), cell(sc.answered + ' of ' + sc.total + ' applicable controls')],
      [cell('Highest open penalty exposure'), cell(exp.top ? 'Up to ₹' + exp.top + ' crore (Schedule to the Act)' : 'No open Must-have finding carries a Schedule penalty')]
    ] });
    if (summary && summary.strengths && summary.strengths.length) { out.push({ t: 'h2', runs: [T('Strengths')] }); summary.strengths.forEach((s) => out.push({ t: 'bullet', runs: [T(s)] })); }
    if (summary && summary.keyRisks && summary.keyRisks.length) { out.push({ t: 'h2', runs: [T('Key risks')] }); summary.keyRisks.forEach((s) => out.push({ t: 'bullet', runs: [T(s)] })); }

    // 3 applicability
    out.push({ t: 'h1', runs: [T('3. Applicability and role')] });
    const memo = audit.roleMemo;
    if (memo && memo.summary) out.push({ t: 'p', runs: [T(memo.summary)] });
    out.push({ t: 'table', header: true, small: true, widths: [0.45, 0.55], rows: [
      [cell('Question'), cell('Determination')],
      [cell('Role'), cell(S.ROLE_LABEL(flags))],
      [cell('Significant Data Fiduciary'), cell(flags.sdf ? 'Notified — section 10 and Rule 13 apply' : flags.sdfLikely ? 'Not notified; designation is possible — readiness controls applied' : 'Not notified; designation unlikely on current facts')],
      [cell('Children\'s data (section 9)'), cell(flags.children ? 'Applies' : 'Not applicable on the facts given')],
      [cell('Third Schedule retention limits'), cell(flags.thirdSchedule ? 'Apply' : 'Do not apply')],
      [cell('Transfers outside India'), cell(flags.crossBorder ? 'Yes — ' + (env.countries || 'countries listed in the inventory') : 'None reported')],
      [cell('Sector overlays'), cell([flags.rbi && 'RBI', flags.sebi && 'SEBI', flags.irdai && 'IRDAI', 'CERT-In Directions 2022'].filter(Boolean).join(', '))]
    ] });
    if (memo && memo.sdfAssessment) out.push({ t: 'note', runs: [T('SDF assessment: ', { b: true }), T(memo.sdfAssessment)] });

    // 4 methodology
    out.push({ t: 'h1', runs: [T('4. Methodology and grading')] });
    S.METHOD_TEXT.forEach((p) => out.push({ t: 'p', runs: [T(p)] }));
    out.push({ t: 'table', header: true, small: true, widths: [0.2, 0.25, 0.55], rows: [
      [cell('Priority'), cell('Audit grade'), cell('Meaning')],
      [cell('Must have'), cell('Major nonconformity'), cell('A statutory requirement is not met, a critical requirement is only partly met, or several minor gaps in one area show a systemic failure. Must be fixed before certification.')],
      [cell('Should have'), cell('Minor nonconformity'), cell('An isolated or partial lapse against a requirement or expected practice. Needs a corrective action plan with owner and date.')],
      [cell('Might have'), cell('Opportunity for improvement'), cell('The requirement is met or is good practice only. The finding points to where practice could improve. No corrective action is mandatory.')],
      [cell('—'), cell('Conformity'), cell('The requirement is met and supported by evidence.')]
    ] });
    out.push({ t: 'p', runs: [T('Scoring: ', { b: true }), T('each control is weighted 3 (Must), 2 (Should) or 1 (Might). It scores 100% when met, 50% when partly met and 0% when not met; controls that do not apply are excluded. Maturity levels: 1 Initial (<40%), 2 Developing (40–59%), 3 Defined (60–74%), 4 Managed (75–89%), 5 Optimised (≥90%).')] });
    if (readiness) out.push({ t: 'note', runs: [T('Readiness: ', { b: true }), T('most substantive obligations under the Act and the Rules come into force on 13 May 2027. Until then, findings against those obligations are readiness gaps. They are graded on the same scale so that the organisation is compliant on the day they apply.')] });

    // 5 data landscape
    out.push({ t: 'h1', runs: [T('5. Personal data landscape')] });
    out.push({ t: 'table', header: false, shadeFirstCol: true, widths: [0.32, 0.68], small: true, rows: [
      [cell('Business', { b: true }), cell(env.businessDesc || '—')],
      [cell('Industry', { b: true }), cell(env.industry || '—')],
      [cell('Scale', { b: true }), cell((env.employees || '—') + ' employees; ' + (env.principals || '—') + ' Data Principals')],
      [cell('Data Principals', { b: true }), cell((env.principalTypes || []).join(', ') || '—')],
      [cell('Categories of data', { b: true }), cell((env.dataCategories || []).join(', ') || '—')],
      [cell('Collection channels', { b: true }), cell((env.channels || []).join(', ') || '—')],
      [cell('Systems', { b: true }), cell(env.systems || '—')],
      [cell('Data Processors', { b: true }), cell(env.usesProcessors === false ? 'None' : (env.vendors || 'Yes — see inventory'))],
      [cell('Regulators', { b: true }), cell((env.regulators || []).join(', ') || '—')],
      [cell('Certifications', { b: true }), cell((env.certifications || []).join(', ') || '—')]
    ] });

    // 6 domain scores
    out.push({ t: 'h1', runs: [T('6. Results by area')] });
    const drows = [[cell('Area'), cell('Score'), cell('Maturity'), cell('Major'), cell('Minor'), cell('OFI')]];
    sc.domains.forEach((d) => {
      const fx = all.filter((f) => (f.domain || (S.controlById(f.controlId) || {}).d) === d.id);
      const n = (g) => String(fx.filter((f) => f.grade === g).length);
      drows.push([cell(d.name), cell(d.pct + '%', { b: true }), cell(d.maturity + ' — ' + S.MATURITY[d.maturity - 1]), cell(n('major')), cell(n('minor')), cell(n('ofi'))]);
    });
    out.push({ t: 'table', header: true, small: true, widths: [0.4, 0.1, 0.2, 0.1, 0.1, 0.1], rows: drows });

    // 7 detailed findings
    out.push({ t: 'pagebreak' });
    out.push({ t: 'h1', runs: [T('7. Detailed findings')] });
    const order = ['major', 'minor', 'ofi'];
    let fno = 0;
    S.DOMAINS.forEach((d) => {
      const fx = all.filter((f) => order.includes(f.grade) && (f.domain || (S.controlById(f.controlId) || {}).d) === d.id)
        .sort((a, b) => order.indexOf(a.grade) - order.indexOf(b.grade));
      if (!fx.length) return;
      out.push({ t: 'h2', runs: [T(d.name)] });
      fx.forEach((f) => {
        fno++;
        const c = S.controlById(f.controlId) || {};
        const g = S.GRADES[f.grade];
        const evNames = (audit.evidence || []).filter((e) => !e.deleted && (e.controlIds || []).includes(f.controlId)).map((e) => e.name).join('; ');
        out.push({ t: 'table', header: false, shadeFirstCol: true, widths: [0.24, 0.76], small: true, rows: [
          [cell('Finding ' + fno, { b: true }), cell((f.controlId ? f.controlId + ' — ' : '') + (f.title || c.t), { b: true })],
          [cell('Grade', { b: true }), cell(g.short + ' — ' + g.label + (f.state === 'closed' ? ' (closed ' + S.fmtDate(String(f.closedAt || '').slice(0, 10)) + ')' : ''), { b: true, color: f.grade === 'major' ? 'B3261E' : f.grade === 'minor' ? '9A6400' : '1F5C99' })],
          [cell('Criteria', { b: true }), cell((c.ref ? c.ref + ': ' : '') + (c.req || 'See linked findings'))],
          [cell('Observation', { b: true }), cell(f.observation || '')],
          [cell('Evidence reviewed', { b: true }), cell(evNames || (f.systemic ? 'Linked findings' : 'No evidence provided'))],
          [cell('Risk', { b: true }), cell(f.risk || (c.pen && S.PENALTIES[c.pen] && c.pen !== 'none' ? S.PENALTIES[c.pen].label : ''))],
          [cell('Recommendation', { b: true }), cell(f.recommendation || '')],
          [cell('Owner and target date', { b: true }), cell((f.owner || 'To be assigned') + (f.dueDate ? ' — ' + S.fmtDate(f.dueDate) : ''))],
          [cell('Status', { b: true }), cell(f.state === 'closed' ? 'Closed — corrective action verified' : f.state === 'submitted' ? 'Fix submitted — under verification' : 'Open')]
        ] });
      });
    });
    if (!fno) out.push({ t: 'p', runs: [T('No nonconformities or opportunities for improvement were raised.')] });

    // 8 remediation plan
    out.push({ t: 'h1', runs: [T('8. Corrective action plan')] });
    const open = all.filter((f) => order.includes(f.grade) && f.state !== 'closed').sort((a, b) => order.indexOf(a.grade) - order.indexOf(b.grade) || String(a.dueDate || '9').localeCompare(String(b.dueDate || '9')));
    if (open.length) {
      out.push({ t: 'table', header: true, small: true, widths: [0.12, 0.14, 0.44, 0.15, 0.15], rows: [[cell('Ref'), cell('Priority'), cell('Action'), cell('Owner'), cell('Target')]].concat(open.map((f) => [cell(f.controlId || f.id), cell(S.GRADES[f.grade].short), cell(f.recommendation || ''), cell(f.owner || '—'), cell(f.dueDate ? S.fmtDate(f.dueDate) : '—')])) });
    } else out.push({ t: 'p', runs: [T('All findings have been closed.')] });

    // 9 documents
    const docs = (audit.docs || []).filter((d) => d.status === 'approved' || d.status === 'issued');
    out.push({ t: 'h1', runs: [T('9. Documents prepared during the engagement')] });
    if (docs.length) {
      out.push({ t: 'p', runs: [T('The following documents were prepared for the organisation and approved by SAFE Legal Solutions (SAFE Advisory) for adoption by the organisation. In line with SAFE\'s independence rule, the certificate is signed by an advocate who did not approve these documents.')] });
      out.push({ t: 'table', header: true, small: true, widths: [0.55, 0.25, 0.2], rows: [[cell('Document'), cell('Approved by'), cell('Date')]].concat(docs.map((d) => [cell(d.title), cell(d.approvedBy || '—'), cell(d.approvedAt ? S.fmtDate(d.approvedAt.slice(0, 10)) : '—')])) });
    } else out.push({ t: 'p', runs: [T('No documents were drafted by SAFE for the organisation during this engagement.')] });

    // 10 conclusion
    out.push({ t: 'h1', runs: [T('10. Conclusion and audit opinion')] });
    out.push({ t: 'p', runs: [T('Opinion: ', { b: true }), T(S.OPINIONS[op].label, { b: true })] });
    if (summary && summary.opinionText) out.push({ t: 'p', runs: [T(summary.opinionText)] });
    else out.push({ t: 'p', runs: [T(op === 'notyet' ? 'Based on the evidence examined, the organisation does not yet meet all Must-have requirements of the Act and the Rules. Certification can be considered once the open major nonconformities are closed and verified.' : op === 'observations' ? 'Based on the evidence examined, the organisation meets every Must-have requirement of the Act and the Rules within the scope of this audit, subject to the minor nonconformities and observations recorded in this report.' : 'Based on the evidence examined, the organisation meets the requirements of the Act and the Rules within the scope of this audit.')] });
    if (summary && summary.nextSteps && summary.nextSteps.length) { out.push({ t: 'h2', runs: [T('Next steps')] }); summary.nextSteps.forEach((s) => out.push({ t: 'bullet', runs: [T(s)] })); }
    out.push({ t: 'h2', runs: [T('Basis of this report')] });
    out.push({ t: 'p', runs: [T(S.RELIANCE_TEXT, { small: true })] });
    out.push({ t: 'spacer' });
    out.push({ t: 'p', align: 'left', runs: [T('For SAFE Legal Solutions', { b: true }), { br: true }, T(signer ? signer.name || signer.email : (final ? '' : 'Lead auditor')), { br: true }, T(signer && signer.enrolment ? 'Advocate, Enrolment No. ' + signer.enrolment : 'Advocate'), { br: true }, T('Bengaluru, ' + S.fmtDate(date))] });

    // annexures
    out.push({ t: 'pagebreak' });
    out.push({ t: 'h1', runs: [T('Annexure A — Evidence index')] });
    const evs = (audit.evidence || []).filter((e) => !e.deleted);
    out.push(evs.length ? { t: 'table', header: true, small: true, widths: [0.36, 0.2, 0.14, 0.3], rows: [[cell('File'), cell('Controls'), cell('Review outcome'), cell('Submitted')]].concat(evs.map((e) => [cell(e.name), cell((e.controlIds || []).join(', ')), cell(e.review ? ({ accepted: 'Accepted', partial: 'Partly sufficient', rejected: 'Not sufficient' })[e.review.verdict] || e.review.verdict : 'Not reviewed'), cell(S.fmtDate(String(e.uploadedAt).slice(0, 10)) + ' — ' + (e.by || ''))])) } : { t: 'p', runs: [T('No evidence files were submitted.')] });

    out.push({ t: 'h1', runs: [T('Annexure B — Control-by-control results')] });
    const ctrls = S.applicableControls(audit);
    out.push({ t: 'table', header: true, small: true, widths: [0.1, 0.42, 0.2, 0.12, 0.16], rows: [[cell('Ref'), cell('Control'), cell('Legal basis'), cell('Priority'), cell('Result')]].concat(ctrls.map((c) => {
      const st = S.effectiveStatus(audit, c);
      return [cell(c.id), cell(c.t), cell(c.ref), cell(S.PRI_LABEL[c.pri]), cell(st ? S.STATUS_LABEL[st] : 'Not answered')];
    })) });

    out.push({ t: 'h1', runs: [T('Annexure C — Glossary')] });
    [['Data Fiduciary', 'A person who alone or with others decides the purpose and means of processing personal data (section 2(i)).'], ['Data Processor', 'A person who processes personal data on behalf of a Data Fiduciary (section 2(k)).'], ['Data Principal', 'The individual to whom the personal data relates; for a child, includes the parent or lawful guardian (section 2(j)).'], ['Significant Data Fiduciary', 'A Data Fiduciary notified under section 10 on the basis of volume and sensitivity of data, risk to Data Principals and other factors.'], ['Board', 'The Data Protection Board of India.'], ['Major nonconformity', 'A failure that affects the ability to meet a legal requirement, or a systemic breakdown.'], ['Minor nonconformity', 'An isolated lapse that does not on its own defeat the requirement.'], ['Opportunity for improvement', 'An observation where the requirement is met but practice could be better.']].forEach(([a, b]) => out.push({ t: 'p', runs: [T(a + ': ', { b: true }), T(b)] }));
    return out;
  };

  S.reportCss = `
    @page { size: A4; margin: 18mm 16mm 20mm; }
    body { font-family: 'Inter', Calibri, Arial, sans-serif; font-size: 10.5pt; color: #1f1f1f; margin: 0; }
    .lh { width: 100%; display: block; margin-bottom: 10px; }
    .ft { width: 100%; display: block; margin-top: 18px; }
    .r-title { text-align: center; color: #821526; font-family: 'Source Serif 4', Georgia, serif; font-weight: 700; font-size: 22pt; margin: 8px 0; }
    .r-subtitle { text-align: center; color: #404040; font-size: 13pt; margin-bottom: 14px; }
    .r-banner { text-align: center; background: #fde9e7; color: #b3261e; font-weight: 700; font-size: 8.5pt; padding: 5px; margin: 14px 0; letter-spacing: .5px; }
    .r-h1 { color: #821526; font-weight: 700; font-size: 12.5pt; border-bottom: 1px solid #c9b6b9; padding-bottom: 3px; margin: 20px 0 8px; page-break-after: avoid; }
    .r-h2 { font-weight: 700; margin: 14px 0 6px; page-break-after: avoid; }
    .r-h3 { font-weight: 700; font-style: italic; margin: 10px 0 4px; }
    .r-p { margin: 0 0 8px; line-height: 1.45; }
    .r-note { margin: 0 0 8px 28px; color: #555; }
    .r-bullet { margin: 0 0 4px 22px; position: relative; } .r-bullet:before { content: '•'; position: absolute; left: -14px; }
    .r-bullet.l2 { margin-left: 44px; } .r-bullet.l2:before { content: '–'; }
    .r-clause { margin: 0 0 6px; position: relative; text-align: justify; } .r-clause .num { display: inline-block; width: 34px; margin-left: -34px; }
    .r-table { border-collapse: collapse; width: 100%; margin: 6px 0 12px; page-break-inside: auto; }
    .r-table td, .r-table th { border: 1px solid #a6a6a6; padding: 4px 6px; vertical-align: top; text-align: left; }
    .r-table th { background: #f3e5e7; } .r-table.small { font-size: 9pt; }
    .r-table tr { page-break-inside: avoid; }
    .r-table td:first-child { background: inherit; }
    .r-pagebreak { page-break-after: always; height: 0; }
    mark { background: #fff59d; }
    @media screen { body { background: #f4f3f2; } .page { background: #fff; max-width: 820px; margin: 20px auto; padding: 30px 40px; box-shadow: 0 2px 12px rgba(0,0,0,.08); } .r-pagebreak { border-top: 1px dashed #ccc; margin: 24px 0; } }`;

  /** Opens a print-ready window. head/foot are image URLs (absolute). */
  S.openPrintable = (title, bodyHtml, opts) => {
    opts = opts || {};
    const w = window.open('', '_blank');
    if (!w) { alert('Allow pop-ups for this site to open the printable document.'); return; }
    w.document.write('<!doctype html><html><head><meta charset="utf-8"><title>' + esc(title) + '</title>' +
      '<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Source+Serif+4:wght@600;700&display=swap" rel="stylesheet">' +
      '<style>' + S.reportCss + (opts.css || '') + '</style></head><body>' +
      (opts.raw ? bodyHtml : '<div class="page">' + (opts.head ? '<img class="lh" src="' + opts.head + '">' : '') + bodyHtml + (opts.foot ? '<img class="ft" src="' + opts.foot + '">' : '') + '</div>') +
      (opts.noPrint ? '' : '<script>window.addEventListener("load",()=>setTimeout(()=>window.print(),600))<\/script>') + '</body></html>');
    w.document.close();
  };
  S.absUrl = (rel) => new URL(rel, document.baseURI).href;

  // ---------------------------------------------------------------- client documents (on the client's letterhead)
  S.composeClientDoc = (client, audit, doc) => {
    const env = audit.env || {};
    const out = [];
    out.push({ t: 'title', runs: [T(String(doc.title).replace(/\s*\(Rule 3\)/, '').toUpperCase())] });
    out.push({ t: 'subtitle', runs: [T(env.legalName || client.name)] });
    if (doc.status !== 'issued' && doc.status !== 'approved') out.push({ t: 'banner', runs: [T('DRAFT — PENDING REVIEW BY SAFE LEGAL SOLUTIONS — NOT FOR CIRCULATION')] });
    out.push({ t: 'table', header: false, shadeFirstCol: true, widths: [0.3, 0.7], small: true, rows: [
      [cell('Document', { b: true }), cell(doc.title)],
      [cell('Version', { b: true }), cell(doc.version || '1.0')],
      [cell('Effective date', { b: true }), cell(doc.effectiveDate ? S.fmtDate(doc.effectiveDate) : '[to be filled on adoption]')],
      [cell('Approved by', { b: true }), cell('[Name and designation of the approving authority]')],
      [cell('Review', { b: true }), cell('At least once a year, and whenever the law or the processing changes')]
    ] });
    S.mdToBlocks(doc.content).forEach((b) => out.push(b));
    return out;
  };

  S.clientLetterhead = async (client, fetchFile) => {
    const lh = client.letterhead;
    if (!lh || !lh.fileId || !fetchFile) return null;
    const f = await fetchFile(lh.fileId);
    const bytes = S.b64ToBytes(f.data);
    if (lh.kind === 'docx') return { kind: 'docx', data: bytes };
    return { kind: 'image', data: bytes, mime: f.mime, width: lh.width || 2480, height: lh.height || 300, fullBleed: true };
  };

  // ---------------------------------------------------------------- certificate
  S.certificateHtml = (cert, opts) => {
    opts = opts || {};
    const verifyUrl = opts.verifyUrl || '';
    const st = S.CERT_STATUS[S.certStatus(cert)] || ['', ''];
    return `<div class="cert">
      <div class="cert-in">
        <div class="cert-top"><img src="${esc(opts.logo || '')}" alt=""><div><div class="firm">SAFE LEGAL SOLUTIONS</div><div class="firm2">Advocates · Legal Consultants · Bengaluru</div></div></div>
        <div class="cert-title">Certificate of DPDPA Compliance${cert.readiness ? ' Assessment' : ''}</div>
        <div class="cert-sub">Digital Personal Data Protection Act, 2023 · Digital Personal Data Protection Rules, 2025</div>
        <p class="cert-line">This is to certify that</p>
        <div class="cert-name">${esc(cert.clientName)}</div>
        <p class="cert-body">has been audited by SAFE Legal Solutions as a <b>${esc(cert.role || 'Data Fiduciary')}</b> for the scope<br><i>${esc(cert.scope)}</i><br>
        and, on the basis of the information and evidence examined, has been found <b>${esc(cert.opinion)}</b>
        ${cert.readiness ? 'with the provisions of the Act and the Rules, including the obligations that come into force on 13 May 2027' : 'with the provisions of the Act and the Rules'}, with an overall compliance score of <b>${esc(cert.score)}%</b>.</p>
        <table class="cert-facts"><tr><td>Certificate No.</td><td><b>${esc(cert.no)}</b></td><td>Audit reference</td><td>${esc(cert.auditRef || '')}</td></tr>
        <tr><td>Date of issue</td><td>${S.fmtDate(cert.issued)}</td><td>Valid until</td><td><b>${S.fmtDate(cert.validUntil)}</b></td></tr>
        <tr><td>Next audit due by</td><td>${S.fmtDate(cert.nextAuditDue || cert.validUntil)}</td><td>Status</td><td>${esc(st[0])}</td></tr></table>
        <div class="cert-foot">
          <div class="sig"><div class="sigline"></div><b>${esc(cert.signedBy)}</b><br>Advocate${cert.signerEnrolment ? ', Enrolment No. ' + esc(cert.signerEnrolment) : ''}<br>For SAFE Legal Solutions</div>
          <div class="qr"><div id="qrbox"></div><div class="small">Verify at<br>${esc(verifyUrl.replace(/^https?:\/\//, ''))}</div></div>
        </div>
        <p class="cert-small">Issued on the basis of the information and evidence provided by the organisation during the audit and valid only while the organisation maintains its controls. It is subject to quarterly surveillance and may be suspended on a personal data breach, a material change in processing or an unresolved finding. This certificate is not issued by the Data Protection Board of India and does not replace the independent data audit required of a Significant Data Fiduciary under section 10 of the Act.</p>
      </div></div>`;
  };
  S.certificateCss = `
    @page { size: A4 landscape; margin: 10mm; }
    body { margin: 0; background: #fff; font-family: 'Inter', Arial, sans-serif; color: #1f1f1f; }
    .cert { border: 6px double #821526; padding: 8px; max-width: 1060px; margin: 0 auto; }
    .cert-in { border: 1px solid #c9a2a8; padding: 22px 46px 16px; text-align: center; background: radial-gradient(circle at 50% 45%, #fff 60%, #fbf4f5 100%); }
    .cert-top { display: flex; align-items: center; justify-content: center; gap: 16px; }
    .cert-top img { height: 82px; }
    .firm { font-family: 'Source Serif 4', Georgia, serif; font-size: 26px; font-weight: 700; color: #821526; letter-spacing: 1px; text-align: left; }
    .firm2 { font-size: 11px; letter-spacing: 2px; text-transform: uppercase; text-align: left; }
    .cert-title { font-family: 'Source Serif 4', Georgia, serif; font-size: 30px; font-weight: 700; color: #1f1f1f; margin: 14px 0 2px; }
    .cert-sub { font-size: 12px; color: #555; letter-spacing: .5px; }
    .cert-line { margin: 14px 0 2px; font-style: italic; color: #555; }
    .cert-name { font-family: 'Source Serif 4', Georgia, serif; font-size: 28px; font-weight: 700; color: #821526; border-bottom: 1px solid #c9a2a8; display: inline-block; padding: 0 30px 4px; }
    .cert-body { font-size: 13px; line-height: 1.6; margin: 12px auto; max-width: 820px; }
    .cert-facts { margin: 8px auto; border-collapse: collapse; font-size: 12px; }
    .cert-facts td { padding: 3px 12px; text-align: left; border-bottom: 1px solid #eee; }
    .cert-foot { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 10px; text-align: left; }
    .sig { font-size: 12px; line-height: 1.5; } .sigline { width: 230px; border-bottom: 1px solid #333; height: 40px; margin-bottom: 4px; }
    .qr { text-align: center; font-size: 10px; } .qr #qrbox { display: inline-block; padding: 4px; background: #fff; }
    .cert-small { font-size: 9px; color: #666; margin: 10px 0 0; line-height: 1.4; }
    .small { font-size: 10px; }`;

  S.openCertificate = (cert, opts) => {
    const html = S.certificateHtml(cert, opts);
    const w = window.open('', '_blank');
    if (!w) { alert('Allow pop-ups for this site to open the certificate.'); return; }
    w.document.write('<!doctype html><html><head><meta charset="utf-8"><title>Certificate ' + esc(cert.no) + '</title><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Source+Serif+4:wght@600;700&display=swap" rel="stylesheet"><style>' + S.certificateCss + '</style>' +
      '<script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"><\/script></head><body>' + html +
      '<script>window.addEventListener("load",function(){try{new QRCode(document.getElementById("qrbox"),{text:' + JSON.stringify(opts.verifyUrl || '') + ',width:96,height:96,colorDark:"#1f1f1f"});}catch(e){}setTimeout(function(){window.print()},800)})<\/script></body></html>');
    w.document.close();
  };
})(typeof window !== 'undefined' ? window : globalThis);
