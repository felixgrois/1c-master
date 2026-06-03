const fs = require('fs');

const data = JSON.parse(fs.readFileSync('./migrated_prompt_history/prompt_2026-02-11T13:08:31.953Z.json', 'utf8'));

const keywords = ['splash', 'слушать', 'sound_enabled', 'started', 'startapp', 'handlestartapp', 'выход'];

function search(obj, path = '') {
  if (typeof obj === 'string') {
    const lower = obj.toLowerCase();
    keywords.forEach(kw => {
      if (lower.includes(kw)) {
        console.log(`FOUND kw [${kw}] at string path: ${path}`);
        console.log(`Snippet: ${obj.substring(Math.max(0, lower.indexOf(kw) - 100), Math.min(obj.length, lower.indexOf(kw) + 300))}\n`);
      }
    });
  } else if (Array.isArray(obj)) {
    obj.forEach((item, idx) => search(item, `${path}[${idx}]`));
  } else if (obj !== null && typeof obj === 'object') {
    Object.keys(obj).forEach(key => {
      search(obj[key], `${path}.${key}`);
    });
  }
}

console.log("Starting recursive search...");
data.forEach((entry, i) => {
  search(entry, `entry_${i}(id=${entry.id || i})`);
});
console.log("Search finished.");




