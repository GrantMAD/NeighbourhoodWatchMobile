const fs = require('fs');
const path = require('path');

const googleServicesBase64 = process.env.GOOGLE_SERVICES_BASE64;

if (!googleServicesBase64) {
  console.log('GOOGLE_SERVICES_BASE64 environment variable not found. Skipping google-services.json creation.');
  return;
}

const decodedJson = Buffer.from(googleServicesBase64, 'base64').toString('utf8');
const outputPath = path.join(process.cwd(), 'google-services.json');

fs.writeFileSync(outputPath, decodedJson, 'utf8');
console.log('Successfully created google-services.json');
