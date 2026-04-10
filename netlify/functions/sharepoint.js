const TENANT_ID = 'c4393f59-4976-4909-a870-23e86e9843a2';
const CLIENT_ID = 'e03d7975-665f-4a3e-ad14-06d3830bfda8';

async function getToken() {
  const res = await fetch(
    `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: CLIENT_ID,
        client_secret: process.env.AZURE_CLIENT_SECRET,
        scope: 'https://graph.microsoft.com/.default'
      })
    }
  );
  const data = await res.json();
  if (!data.access_token) throw new Error('Token fout: ' + JSON.stringify(data));
  return data.access_token;
}

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  };
  try {
    const token = await getToken();
    const action = event.queryStringParameters && event.queryStringParameters.action || 'sites';

    if (action === 'token-check') {
      return { statusCode: 200, headers, body: JSON.stringify({ ok: true, message: 'Token succesvol opgehaald' }) };
    }

    if (action === 'sites') {
      const res = await fetch('https://graph.microsoft.com/v1.0/sites?search=*', {
        headers: { Authorization: 'Bearer ' + token }
      });
      const data = await res.json();
      return { statusCode: 200, headers, body: JSON.stringify(data) };
    }

    if (action === 'drives') {
      const siteId = event.queryStringParameters.siteId;
      const res = await fetch(`https://graph.microsoft.com/v1.0/sites/${siteId}/drives`,
        { headers: { Authorization: 'Bearer ' + token } });
      const data = await res.json();
      return { statusCode: 200, headers, body: JSON.stringify(data) };
    }

    if (action === 'files') {
      const driveId = event.queryStringParameters.driveId;
      const path = event.queryStringParameters.path || '';
      const url = path
        ? `https://graph.microsoft.com/v1.0/drives/${driveId}/root:/${path}:/children`
        : `https://graph.microsoft.com/v1.0/drives/${driveId}/root/children`;
      const res = await fetch(url, { headers: { Authorization: 'Bearer ' + token } });
      const data = await res.json();
      return { statusCode: 200, headers, body: JSON.stringify(data) };
    }

    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Onbekende actie' }) };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};