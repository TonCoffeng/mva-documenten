exports.handler = async function(event) {
  if(event.httpMethod !== 'POST') return {statusCode:405, body:'Method not allowed'};
  const {leverancier, bericht} = JSON.parse(event.body);
  if(!leverancier || !bericht) return {statusCode:400, body:'Ontbrekende velden'};
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {'Authorization': 'Bearer ' + process.env.RESEND_API_KEY, 'Content-Type': 'application/json'},
    body: JSON.stringify({
      from: 'MvA Leveranciers <noreply@makelaarsvan.nl>',
      to: ['toncoffeng@makelaarsvan.nl'],
      subject: 'Correctie leverancier: ' + leverancier,
      html: '<p><b>Leverancier:</b> ' + leverancier + '</p><p><b>Bericht:</b></p><p>' + bericht.replace(/\n/g,'<br>') + '</p>'
    })
  });
  if(r.ok) return {statusCode:200, headers:{'Content-Type':'application/json'}, body:JSON.stringify({ok:true})};
  return {statusCode:500, body: await r.text()};
};