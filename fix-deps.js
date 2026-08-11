const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('artifacts/smovie-admin/package.json', 'utf8'));

const depsToMove = [
  'react', 'react-dom', 'react-native', 
  'expo-router', 'firebase', 'react-native-gesture-handler', 
  'react-native-safe-area-context', 'react-native-screens', 'react-native-svg',
  'react-native-web', 'expo-status-bar', 'expo-splash-screen', 'expo-linking',
  'expo-constants', '@react-native-async-storage/async-storage'
];

for (const dep of depsToMove) {
  if (pkg.devDependencies[dep]) {
    pkg.dependencies[dep] = pkg.devDependencies[dep];
    delete pkg.devDependencies[dep];
  }
}

fs.writeFileSync('artifacts/smovie-admin/package.json', JSON.stringify(pkg, null, 2));
