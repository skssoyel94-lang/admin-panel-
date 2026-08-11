const fs = require('fs');
const path = 'artifacts/smovie-admin/app/index.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  '✓ Reset link sent! Check your inbox & spam folder.',
  '✓ If registered, a reset link was sent. Check spam.'
);

fs.writeFileSync(path, content, 'utf8');
