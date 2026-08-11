const fs = require('fs');
const path = 'artifacts/smovie-admin/app/index.tsx';
let content = fs.readFileSync(path, 'utf8');

const xSvg = `
const XSvg = ({ size, color }: { size: number, color: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M18 6L6 18M6 6l12 12" />
  </Svg>
);
`;

if (!content.includes('const XSvg')) {
  content = content.replace('// ─── Constants & Types ────────────────────────────────────────────────────────', xSvg + '\n// ─── Constants & Types ────────────────────────────────────────────────────────');
}

content = content.replace(
  /<Feather name="x" size=\{15\} color=\{MUTED3\} \/>/g,
  `<XSvg size={15} color={MUTED3} />`
);

fs.writeFileSync(path, content, 'utf8');
