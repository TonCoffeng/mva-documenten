exports.handler = async function(event, context) {
  const FORM_ID = '240583394494365';
  const API_KEY = process.env.JOTFORM_API_KEY;
  if (!API_KEY) return { statusCode: 500, body: JSON.stringify({ error: 'JOTFORM_API_KEY niet ingesteld' }) };
  const hdrs = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };
  try {
    let all = [], offset = 0;
    while (true) {
      const url = `https://api.jotform.com/form/${FORM_ID}/submissions?apiKey=${API_KEY}&limit=100&offset=${offset}&orderby=created_at&direction=ASC`;
      const res = await fetch(url);
      const data = await res.json();
      if (!data.content || !data.content.length) break;
      // Filter gearchiveerde en verwijderde submissions eruit
      const active = data.content.filter(s => s.status !== 'DELETED' && s.status !== 'ARCHIVED');
      all = all.concat(active);
      if (data.content.length < 100) break;
      offset += 100;
    }
    const SKIP = ['geen@geen.nl','geen','n.v.t.','nee','niet van toepassing','niet bekend','(000) 000-0000'];
    function clean(v) {
      if (!v) return '';
      if (typeof v === 'object') {
        if (v.prettyFormat) { const p=v.prettyFormat; return SKIP.some(s=>p.toLowerCase().trim()===s)?'':p; }
        if (v.full) { return SKIP.some(s=>v.full.toLowerCase().trim()===s)?'':v.full; }
        if (v.first||v.last) { const p=[v.first,v.middle,v.last].filter(Boolean).join(' ').trim(); const pr=(v.prefix||'').toLowerCase(); return (!p||['geen','n.v.t.','niet bekend','nee'].includes(pr))?'':p; }
        return '';
      }
      const s=String(v).trim(); return SKIP.some(x=>s.toLowerCase()===x)?'':s;
    }
    function gn(a,k) { const v=a[k]&&a[k].answer; if(!v||typeof v!=='object')return''; const p=[v.first,v.middle,v.last].filter(Boolean).join(' ').trim(); const pr=(v.prefix||'').toLowerCase(); return(!p||['geen','n.v.t.','niet bekend','nee'].includes(pr))?'':p; }
    const parsed = all
      .filter(s=>{ const n=clean(s.answers&&s.answers['3']&&s.answers['3'].answer); return n&&n.length>1; })
      .map(sub=>{ const a=sub.answers||{}; const g=k=>clean(a[k]&&a[k].answer); return { id:sub.id, naam:g('3'), omschrijving:g('35'), website:g('85'), cat:g('71'), kantoor:g('151'), algEmail:g('80'), algTel:g('81'), eindverantw:gn(a,'29'), eindEmail:g('38'), eindTel:g('39'), eindFunctie:g('135'), amNaam:gn(a,'147'), amEmail:g('149'), amTel:g('148'), supportContact:g('99'), duur:g('56'), opzegtermijn:g('58'), einddatum:g('100'), opzeggen:g('101'), onboarding:g('138')||g('145'), betalingsstructuur:g('123') }; })
      .sort((a,b)=>a.naam.localeCompare(b.naam,'nl'));
    return { statusCode:200, headers:hdrs, body:JSON.stringify(parsed) };
  } catch(e) {
    return { statusCode:500, headers:hdrs, body:JSON.stringify({ error:e.message }) };
  }
};