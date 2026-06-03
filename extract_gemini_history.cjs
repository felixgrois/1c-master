const fs = require('fs');

const data = JSON.parse(fs.readFileSync('./migrated_prompt_history/prompt_2026-02-11T13:08:31.953Z.json', 'utf8'));

data.forEach((entry, i) => {
  if (entry.payload && entry.payload.entries) {
    entry.payload.entries.forEach(sub => {
      if (sub.path === 'services/geminiService.ts') {
        console.log(`=== Entry ${entry.id} (Author: ${entry.author}) ===`);
        if (sub.diffs) {
          sub.diffs.forEach((diff, dIndex) => {
            console.log(`Diff ${dIndex}: target has length ${diff.target.length}, replacement has length ${diff.replacement.length}`);
            // If the replacement contains some of the missing function names:
            const keywords = ['generateBusinessSituation', 'searchKnowledgeBase', 'chatWithMax'];
            keywords.forEach(kw => {
              if (diff.replacement.includes(kw)) {
                console.log(`-> Contains keyword: ${kw}`);
                // Print a portion of the file around the keyword
                const lines = diff.replacement.split('\n');
                lines.forEach((line, lineNo) => {
                  if (line.includes(kw)) {
                    console.log(`   L${lineNo}: ${line}`);
                  }
                });
              }
            });
          });
        }
      }
    });
  }
});
