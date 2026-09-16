/**
 * Test ALL Land Surveying and Computer System & Architecture modules
 * 28 LSV + 17 CSA = 45 total modules
 */

const pdf = require('pdf-parse/lib/pdf-parse.js');
const fs = require('fs');
const path = require('path');
const parser = require('../lib/parseRQFCurriculum.ts');

const uploadDir = path.join(__dirname, '../public/uploads/projects');

async function testAll() {
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║   TESTING ALL 45 LSV & CSA MODULES                            ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');

  const allFiles = fs.readdirSync(uploadDir)
    .filter(f => f.endsWith('.pdf'))
    .filter(f => /LSV|CSA/i.test(f));

  console.log(`Found ${allFiles.length} PDF files\n`);

  let passed = 0;
  let failed = 0;
  const failures = [];

  for (const file of allFiles) {
    // Extract module code from filename
    const match = file.match(/(LSV|CSA)[A-Z]{2}\d{3}/i);
    const moduleCode = match ? match[0] : file.substring(0, 50);

    try {
      const filePath = path.join(uploadDir, file);
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdf(dataBuffer);
      
      const toc = parser.parseRQFCurriculum(data.text, moduleCode);
      
      if (!toc || toc.length === 0) {
        console.log(`❌ ${moduleCode}: No TOC generated`);
        failed++;
        failures.push({ code: moduleCode, reason: 'No TOC' });
        continue;
      }

      const outcomes = toc.filter(t => t.type === 'outcome');
      const topics = toc.filter(t => t.type === 'topic');
      const subtopics = toc.filter(t => t.type === 'subtopic');

      // Basic validation: must have LOs, topics, and subtopics
      const isValid = outcomes.length >= 2 && topics.length > 0 && subtopics.length > 0;

      if (isValid) {
        console.log(`✅ ${moduleCode.padEnd(10)} | LOs:${outcomes.length} Topics:${topics.length} Subtopics:${subtopics.length}`);
        passed++;
      } else {
        console.log(`⚠️  ${moduleCode.padEnd(10)} | LOs:${outcomes.length} Topics:${topics.length} Subtopics:${subtopics.length} - INCOMPLETE`);
        failed++;
        failures.push({ 
          code: moduleCode, 
          reason: `LOs:${outcomes.length} T:${topics.length} S:${subtopics.length}`
        });
      }

    } catch (err) {
      console.log(`❌ ${moduleCode}: ${err.message}`);
      failed++;
      failures.push({ code: moduleCode, reason: err.message });
    }
  }

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log(`RESULTS: ${passed}/${allFiles.length} passed (${Math.round(passed/allFiles.length*100)}%)`);
  
  if (failures.length > 0) {
    console.log(`\n❌ ${failures.length} FAILURES:`);
    failures.forEach(f => {
      console.log(`   ${f.code}: ${f.reason}`);
    });
  } else {
    console.log('\n🎉 ALL MODULES PASSED! Parser is production-ready for LSV & CSA.');
  }
  console.log('═══════════════════════════════════════════════════════════════\n');
}

testAll().catch(console.error);
