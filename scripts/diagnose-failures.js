const pdf = require('pdf-parse/lib/pdf-parse.js');
const fs = require('fs');
const path = require('path');

const uploadDir = path.join(__dirname, '../public/uploads/projects');
const allFiles = fs.readdirSync(uploadDir).filter(f => f.endsWith('.pdf'));

const failures = ['LSVTE302', 'LSVBS302', 'LSVCL302', 'CSAPD301', 'LSVHS302'];

async function diagnose() {
  for (const code of failures) {
    const file = allFiles.find(f => f.includes(code));
    if (!file) {
      console.log(`=== ${code}: FILE NOT FOUND ===\n`);
      continue;
    }
    
    console.log(`=== ${code} ===`);
    const dataBuffer = fs.readFileSync(path.join(uploadDir, file));
    const data = await pdf(dataBuffer);
    const text = data.text;
    
    const hasLO = /Learning outcome \d+:/i.test(text);
    const hasIndicative = /Indicative content/i.test(text);
    
    console.log(`  Has "Learning outcome N:"`, hasLO);
    console.log(`  Has "Indicative content:"`, hasIndicative);
    
    if (!hasLO) {
      console.log(`  ❌ MALFORMED PDF: No learning outcome markers found`);
    }
    
    console.log('');
  }
}

diagnose().catch(console.error);
