/* SAFE Legal Workplace Compliance Audits — connection to the backend (or the in-browser demo). */
(function (root) {
  const S = (root.SAFE = root.SAFE || {});
  const CFG = root.SAFE_CONFIG || {};
  // AUDITS_API_URL is the new name; DPDPA_API_URL (set earlier) keeps working.
  S.API_URL = CFG.AUDITS_API_URL || CFG.DPDPA_API_URL || '';
  S.DEMO = !S.API_URL;
  const pub = CFG.STUDIOS && (CFG.STUDIOS.auditsPublic || (CFG.STUDIOS.dpdpaPublic && CFG.STUDIOS.dpdpaPublic.replace(/\/dpdpa\/?$/, '/audits/')));
  S.STUDIO_URL = (!S.DEMO && pub) || new URL('./', document.baseURI).href;

  S.call = async (action, payload) => {
    if (S.DEMO) {
      await new Promise((r) => setTimeout(r, /ai/i.test(action) ? 650 : 90));
      const out = S.MOCK(action, JSON.parse(JSON.stringify(payload || {})));
      return JSON.parse(JSON.stringify(out));
    }
    const res = await fetch(S.API_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(Object.assign({ action }, payload || {})) });
    const j = await res.json();
    if (!j.ok) throw new Error(j.error || 'Something went wrong.');
    return j.data;
  };

  S.verifyRemote = async (no) => {
    if (S.DEMO) return S.MOCK('verify', { no });
    const res = await fetch(S.API_URL + '?verify=' + encodeURIComponent(no));
    return res.json();
  };

  /** Reads a chosen file as base64, plus plain text when it is a Word, text or CSV file. */
  S.readUpload = async (file) => {
    const buf = await file.arrayBuffer();
    const bytes = new Uint8Array(buf);
    let text = '';
    const mime = file.type || (/\.docx$/i.test(file.name) ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' : /\.pdf$/i.test(file.name) ? 'application/pdf' : 'application/octet-stream');
    try {
      if (/wordprocessingml/.test(mime) && root.JSZip) {
        const zip = await root.JSZip.loadAsync(buf);
        const xml = await zip.file('word/document.xml').async('string');
        text = xml.replace(/<\/w:p>/g, '\n').replace(/<w:tab\/>/g, '\t').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
      } else if (/^text\/|csv|json|markdown/.test(mime) || /\.(txt|csv|md)$/i.test(file.name)) {
        text = new TextDecoder().decode(bytes);
      } else if (/spreadsheetml/.test(mime) && root.JSZip) {
        const zip = await root.JSZip.loadAsync(buf);
        const ss = zip.file('xl/sharedStrings.xml');
        text = ss ? (await ss.async('string')).replace(/<\/si>/g, '\n').replace(/<[^>]+>/g, '') : '';
      }
    } catch (e) { console.warn('Text extraction failed', e); }
    let width = 0, height = 0;
    if (/^image\//.test(mime)) {
      await new Promise((res) => { const img = new Image(); img.onload = () => { width = img.naturalWidth; height = img.naturalHeight; res(); }; img.onerror = res; img.src = URL.createObjectURL(file); });
    }
    return { name: file.name, mime, size: file.size, data: S.bytesToB64(bytes), text: text.slice(0, 60000), width, height };
  };
})(typeof window !== 'undefined' ? window : globalThis);
