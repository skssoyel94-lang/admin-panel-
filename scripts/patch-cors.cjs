const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('CorsMiddleware.js')) {
      results.push(file);
    }
  });
  return results;
}

try {
  const files = walk('node_modules');
  let patchedCount = 0;
  files.forEach(f => {
    let content = fs.readFileSync(f, 'utf8');
    if (content.includes('!isSameOrigin && !isAllowedHost')) {
      content = content.replace('!isSameOrigin && !isAllowedHost', 'false /* patched cors */');
      fs.writeFileSync(f, content, 'utf8');
      patchedCount++;
    }
  });
  console.log(`[patch-cors] Successfully patched ${patchedCount} CorsMiddleware files.`);
} catch (err) {
  console.error('[patch-cors] Error patching CorsMiddleware:', err);
}
