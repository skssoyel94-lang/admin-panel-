const fs = require('fs');
const path = 'artifacts/smovie-admin/app/index.tsx';
let content = fs.readFileSync(path, 'utf8');

if (!content.includes('react-native-svg')) {
  content = content.replace(
    "import { Feather } from '@expo/vector-icons';",
    "import { Feather } from '@expo/vector-icons';\nimport Svg, { Path, Circle, Rect } from 'react-native-svg';"
  );
  fs.writeFileSync(path, content, 'utf8');
}
