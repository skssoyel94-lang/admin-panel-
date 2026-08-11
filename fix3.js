const fs = require('fs');
let content = fs.readFileSync('artifacts/smovie-admin/app/index.tsx', 'utf8');
content = content.replace("type Tab = 'home' | 'library' | 'settings';", "");
fs.writeFileSync('artifacts/smovie-admin/app/index.tsx', content);
