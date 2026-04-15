exports.handler = async function(event, context) {
  const FORM_ID = '240583394494365';
  const API_KEY = process.env.JOTFORM_API_KEY;
  if (!API_KEY) return { statusCode:500, body:JSON.stringify({error:'geen api key'}) };
  const hdrs = {'Content-Type':'application/json','Access-Control-Allow-Origin':'*'};
  try {
    const url = 'https://eu-api.jotform.com/form/' + FORM_ID + '/submissions?apiKey=' + API_KEY + '&limit=2';
    const res = await fetch(url);
    const text = await res.text();
    return { statusCode:200, headers:hdrs, body:JSON.stringify({
      http_status: res.status,
      api_key_length: API_KEY.length,
      raw: text.slice(0,600)
    }) };
  } catch(e) {
    return { statusCode:500, headers:hdrs, body:JSON.stringify({error:e.message}) };
  }
};