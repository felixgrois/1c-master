const fs = require('fs');

const keyword = process.argv[2];
if (!keyword) {
  console.error("Please provide a keyword!");
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync('./migrated_prompt_history/prompt_2026-02-11T13:08:31.953Z.json', 'utf8'));

console.log(`Searching for '${keyword}' globally in JSON...`);
const matches = [];
data.forEach((entry) => {
  if (entry.payload && entry.payload.entries) {
    entry.payload.entries.forEach(sub => {
      if (sub.diffs) {
        sub.diffs.forEach((diff, dIndex) => {
          if (diff.replacement.includes(keyword) || (diff.target && diff.target.includes(keyword))) {
            matches.push({
              entryId: entry.id,
              path: sub.path,
              diff: dIndex
            });
          }
        });
      }
    });
  }
});

console.log("Found matches:", matches);
