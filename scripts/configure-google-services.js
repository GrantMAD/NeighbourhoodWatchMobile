const fs = require('fs');
const { config } = require('dotenv');

config();

const template = fs.readFileSync('google-services.json.template', 'utf8');
const result = template.replace(/\$\{GOOGLE_API_KEY\}/g, process.env.GOOGLE_API_KEY);

fs.writeFileSync('google-services.json', result, 'utf8');
