exports.handler = async function(event, context) {
  const FORM_ID = '240583394494365';
  const API_KEY = process.env.JOTFORM_API_KEY;
  if (!API_KEY) return { statusCode:500, body:JSON.stringify({error:'JOTFORM_API_KEY niet ingesteld'}) };
  const hdrs = {'Content-Type':'application/json','Access-Control-Allow-Origin':'*'};
  try {
    let all = [], offset = 0;
    while (true) {
      const url = 'https://eu-api.jotform.com/form/' + FORM_ID + '/submissions?apiKey=' + API_KEY + '&limit=100&offset=' + offset + '&orderby=created_at&direction=ASC';
      const res = await fetch(url);
      const data = await res.json();
      if (!data.content || !data.content.length) break;
      // Alleen DELETED eruit — ACTIVE en ARCHIVED allebei tonen
      all = all.concat(data.content.filter(s => s.status !== 'DELETED' && s.status !== 'ARCHIVED'));
      if (data.content.length < 100) break;
      offset += 100;
    }
    const SKIP = ['geen@geen.nl','geen','n.v.t.','nee','niet van toepassing','niet bekend','(000) 000-0000'];
    function getVal(answers, key) {
      const field = answers && answers[key];
      if (!field) return '';
      // Jotform geeft soms answer als string, soms als object
      const v = field.answer;
      if (!v) return '';
      if (typeof v === 'string') {
        const s = v.trim();
        return SKIP.some(x => s.toLowerCase() === x) ? '' : s;
      }
      if (typeof v === 'object') {
        // Naam veld: {first, middle, last}
        if (v.first !== undefined || v.last !== undefined) {
          const p = [v.first, v.middle, v.last].filter(Boolean).join(' ').trim();
          const pr = (v.prefix || '').toLowerCase();
          return (!p || ['geen','n.v.t.','niet bekend','nee'].includes(pr)) ? '' : p;
        }
        // Telefoon veld: {full}
        if (v.full !== undefined) {
          const t = v.full.trim();
          return SKIP.some(x => t.toLowerCase() === x) ? '' : t;
        }
        // prettyFormat
        if (v.prettyFormat !== undefined) {
          const pf = v.prettyFormat;
          return SKIP.some(x => pf.toLowerCase().trim() === x) ? '' : pf;
        }
        // Array (checkboxes)
        if (Array.isArray(v)) return v.join(', ');
      }
      return '';
    }
    const parsed = all
      .filter(sub => getVal(sub.answers, '3').length > 1)
      .map(sub => {
        const a = sub.answers;
        const g = k => getVal(a, k);
        return {
          id: sub.id,
          naam: g('3'),
          omschrijving: g('35'),
          website: g('85'),
          cat: g('71'),
          kantoor: g('151'),
          algEmail: g('80'),
          algTel: g('81'),
          eindverantw: g('29'),
          eindEmail: g('38'),
          eindTel: g('39'),
          eindFunctie: g('135'),
          amNaam: g('147'),
          amEmail: g('149'),
          amTel: g('148'),
          supportContact: g('99'),
          duur: g('56'),
          opzegtermijn: g('58'),
          einddatum: g('100'),
          opzeggen: g('101'),
          onboarding: g('138') || g('145'),
          betalingsstructuur: g('123')
        };
      })
      .sort((a, b) => a.naam.localeCompare(b.naam, 'nl'));
    return { statusCode:200, headers:hdrs, body:JSON.stringify(parsed) };
  } catch(e) {
    return { statusCode:500, headers:hdrs, body:JSON.stringify({error:e.message}) };
  }
};