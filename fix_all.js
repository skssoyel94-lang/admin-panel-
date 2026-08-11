const fs = require('fs');
const path = 'artifacts/smovie-admin/app/index.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Import Dimensions
if (!content.includes('Dimensions } from \'react-native\'')) {
  content = content.replace(
    /,\s*Pressable,?\n\} from 'react-native';/,
    ",\n  Pressable,\n  Dimensions,\n} from 'react-native';"
  );
}

// 2. Import SVG components
const svgComponents = `
const BellSvg = ({ size, color }: { size: number, color: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <Path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </Svg>
);
const CalendarSvg = ({ size, color }: { size: number, color: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M3 6h18M8 2v4M16 2v4M3 10h18M5 6h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z" />
  </Svg>
);
const TrendingSvg = ({ size, color }: { size: number, color: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M23 6l-9.5 9.5-5-5L1 18" />
    <Path d="M17 6h6v6" />
  </Svg>
);
const XSvg = ({ size, color }: { size: number, color: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M18 6L6 18M6 6l12 12" />
  </Svg>
);
`;

if (!content.includes('const BellSvg')) {
  content = content.replace(
    '// ─── Constants & Types ────────────────────────────────────────────────────────',
    svgComponents + '\n// ─── Constants & Types ────────────────────────────────────────────────────────'
  );
}

// 3. Add posterUrl state
if (!content.includes('const [posterUrl, setPosterUrl]')) {
  content = content.replace(
    /const \[trailerUrl, setTrailerUrl\] = useState\(''\);/,
    "const [trailerUrl, setTrailerUrl] = useState('');\n  const [posterUrl, setPosterUrl] = useState('');"
  );
}

// 4. Fix sldr.posterImg and sldr.dimmer
if (!content.includes('posterImg:')) {
  content = content.replace(
    /thumb:        \{ width:72, height:100, borderRadius:8, backgroundColor: CARD2 \},/,
    "thumb:        { width:72, height:100, borderRadius:8, backgroundColor: CARD2 },\n  posterImg: { width:72, height:100, borderRadius:8 },\n  dimmer: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius:8 },"
  );
}

// 5. Fix TS1117: An object literal cannot have multiple properties with the same name.
// line 1774
// Let's see what's on line 1774:
// I'll grep for it in another call.

fs.writeFileSync(path, content, 'utf8');
