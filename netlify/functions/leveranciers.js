exports.handler = async function(event, context) {
  const FORM_ID = '240583394494365';
  const API_KEY = process.env.JOTFORM_API_KEY;
  if (!API_KEY) return { statusCode:500, body:'geen api key' };
  const hdrs = {'Content-Type':'application/json','Access-Control-Allow-Origin':'*'};
  const url = 'https://api.jotform.com/form/' + FORM_ID + '/submissions?apiKey=' + API_KEY + '&limit=2&offset=0';
  const res = await fetch(url);
  const data = await res.json();
  // Geef de eerste submission RAW terug zodat we de structuur zien
  const first = data.content && data.content[0];
  return { statusCode:200, headers:hdrs, body:JSON.stringify({
    total: data.resultSet && data.resultSet.count,
    first_keys: first ? Object.keys(first) : [],
    first_status: first && first.status,
    answers_keys: first && first.answers ? Object.keys(first.answers).slice(0,5) : [],
    first_answer_3: first && first.answers && first.answers['3'],
    raw_first: JSON.stringify(first).slice(0,800)
  }) };
};