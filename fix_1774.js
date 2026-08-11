const fs = require('fs');
const path = 'artifacts/smovie-admin/app/index.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  /poster_url: item\.posterUrl, slider_images: selectedPosters,/,
  "poster_url: item.posterUrl,"
);

fs.writeFileSync(path, content, 'utf8');
