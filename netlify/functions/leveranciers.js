// netlify/functions/leveranciers.js
// Haalt actieve submissions op uit Jotform formulier 240583394494365
// Gearchiveerde submissions worden automatisch uitgefilterd door Jotform

exports.handler = async function(event, context) {
  const FORM_ID = '240583394494365';
  const API_KEY = process.env.JOTFORM_API_KEY;

  if (!API_KEY) {
    return { statusCode: 500, body: JSON.stringify({ error: 'JOTFORM_API_KEY niet ingesteld' }) };
  }

  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
  };

  try {
    // Haal alle actieve submissions op (gearchiveerde staan er automatisch niet in)
    let allSubmissions = [];
    let offset = 0;
    const limit = 100;

    while (true) {
      const url = `https://api.jotform.com/form/${FORM_ID}/submissions?apiKey=${API_KEY}&limit=${limit}&offset=${offset}&orderby=created_at&direction=ASC`;
      const res = await fetch(url);
      const data = await res.json();

      if (!data.content || data.content.length === 0) break;

      // Filter alleen actieve submissions (niet DELETED, niet ARCHIVED)
      const active = data.content.filter(s => s.status === 'ACTIVE');
      allSubmissions = allSubmissions.concat(active);

      if (data.content.length < limit) break;
      offset += limit;
    }

    // Parse elke submission naar bruikbare data
    const SKIP = ['geen@geen.nl', 'geen', 'n.v.t.', 'nee', 'niet van toepassing',
                  'niet bekend', '(000) 000-0000', '0000000000'];

    function clean(v) {
      if (!v) return '';
      if (typeof v === 'object') {
        if (v.prettyFormat) {
          const pf = v.prettyFormat;
          if (SKIP.some(s => pf.toLowerCase().trim() === s)) return '';
          return pf;
        }
        if (v.full) {
          if (SKIP.some(s => v.full.toLowerCase().trim() === s)) return '';
          return v.full;
        }
        if (v.first || v.last) {
          const parts = [v.first, v.middle, v.last].filter(Boolean).join(' ').trim();
          const pref = (v.prefix || '').toLowerCase();
          if (!parts || ['geen', 'n.v.t.', 'niet bekend', 'nee'].includes(pref)) return '';
          return parts;
        }
        return '';
      }
      const s = String(v).trim();
      return SKIP.some(x => s.toLowerCase() === x) ? '' : s;
    }

    function getName(a, k) {
      const v = a[k] && a[k].answer;
      if (!v || typeof v !== 'object') return '';
      const parts = [v.first, v.middle, v.last].filter(Boolean).join(' ').trim();
      const pref = (v.prefix || '').toLowerCase();
      if (!parts || ['geen', 'n.v.t.', 'niet bekend', 'nee'].includes(pref)) return '';
      return parts;
    }

    const parsed = allSubmissions
      .filter(sub => {
        const naam = clean(sub.answers && sub.answers['3'] && sub.answers['3'].answer);
        return naam && naam.length > 1; // skip lege entries
      })
      .map(sub => {
        const a = sub.answers || {};
        const g = k => clean(a[k] && a[k].answer);
        const onboarding = g('138') || g('145');

        return {
          id: sub.id,
          naam: g('3'),
          omschrijving: g('35'),
          website: g('85'),
          cat: g('71'),
          kantoor: g('151'),
          algEmail: g('80'),
          algTel: g('81'),
          eindverantw: getName(a, '29'),
          eindEmail: g('38'),
          eindTel: g('39'),
          eindFunctie: g('135'),
          amNaam: getName(a, '147'),
          amEmail: g('149'),
          amTel: g('148'),
          heeftSupport: g('75'),
          supportContact: g('99'),
          supportTel: g('77'),
          duur: g('56'),
          opzegtermijn: g('58'),
          einddatum: g('100'),
          opzeggen: g('101'),
          onboarding: onboarding,
          betalingsstructuur: g('123'),
        };
      })
      .sort((a, b) => a.naam.localeCompare(b.naam, 'nl'));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(parsed)
    };

  } catch (err) {
    console.error('Leveranciers API fout:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Fout bij ophalen data', details: err.message })
    };
  }
};
