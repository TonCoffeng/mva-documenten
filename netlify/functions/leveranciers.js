exports.handler = async function(event, context) {
  const FORM_ID = '240583394494365';
  const API_KEY = process.env.JOTFORM_API_KEY;
  if (!API_KEY) return { statusCode:500, body:'geen api key' };
  const hdrs = {'Content-Type':'application/json','Access-Control-Allow-Origin':'*'};
  try {
    const url = 'https://api.jotform.com/form/' + FORM_ID + '/submissions?apiKey=' + API_KEY + '&limit=2&offset=0';
    const res = await fetch(url);
    const data = await res.json();
    const first = data && data.content && data.content[0];
    return { statusCode:200, headers:hdrs, body:JSON.stringify({
      data_keys: data ? Object.keys(data) : 'geen data',
      content_length: data && data.content ? data.content.length : 0,
      first_keys: first ? Object.keys(first) : [],
      first_status: first ? first.status : null,
      answers_type: first ? typeof first.answers : null,
      answers_sample: first && first.answers ? JSON.stringify(first.answers).slice(0,400) : null
    }) };
  } catch(e) {
    return { statusCode:500, headers:hdrs, body:JSON.stringify({error:e.message, stack:e.stack}) };
  }
};