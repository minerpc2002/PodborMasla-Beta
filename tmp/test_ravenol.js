const https = require('https');

https.get('https://podbor.ravenol.ru/api/search?q=WBA21DT00N9K76655', (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => console.log(data));
}).on('error', (err) => console.log(err.message));
