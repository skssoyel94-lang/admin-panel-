const fs = require('fs');
const path = 'artifacts/smovie-admin/app/index.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add SVG imports if not present
if (!content.includes('import Svg')) {
  content = content.replace(
    `import { Platform, View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, KeyboardAvoidingView, ActivityIndicator, Image, Dimensions } from 'react-native';`,
    `import { Platform, View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, KeyboardAvoidingView, ActivityIndicator, Image, Dimensions } from 'react-native';\nimport Svg, { Path, Circle } from 'react-native-svg';`
  );
}

// 2. Add SVG components
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
`;
if (!content.includes('const BellSvg')) {
  content = content.replace('// ─── Constants & Types ────────────────────────────────────────────────────────', svgComponents + '\n// ─── Constants & Types ────────────────────────────────────────────────────────');
}

// 3. Update Tab type
content = content.replace(
  `type Tab = 'home' | 'library' | 'settings';`,
  `type Tab = 'home' | 'library' | 'settings' | 'notifications';`
);

// 4. Update Header Bell Icon to set activeTab
content = content.replace(
  `setShowNotifications(v => !v);\n              if (!showNotifications) { fetchNotifications(); }`,
  `setActiveTab('notifications');\n              fetchNotifications();`
);

content = content.replace(
  `<Feather name="bell" size={20} color={WHITE} />`,
  `<BellSvg size={20} color={WHITE} />`
);

// 5. Replace other Feather icons in Notification panel
content = content.replace(
  /<Feather name="bell" size=\{13\} color=\{RED\} \/>/g,
  `<BellSvg size={13} color={RED} />`
);
content = content.replace(
  /<Feather name="calendar" size=\{15\} color=\{notifTab === 'coming' \? BG : MUTED3\} \/>/g,
  `<CalendarSvg size={15} color={notifTab === 'coming' ? BG : MUTED3} />`
);
content = content.replace(
  /<Feather name="trending-up" size=\{15\} color=\{notifTab === 'watching' \? BG : MUTED3\} \/>/g,
  `<TrendingSvg size={15} color={notifTab === 'watching' ? BG : MUTED3} />`
);

// 6. Fix "showNotifications && (" to "activeTab === 'notifications' && ("
content = content.replace(
  /\{showNotifications && \(/g,
  `{activeTab === 'notifications' && (`
);

// 7. Remove panel max height and make it flex
content = content.replace(
  `panel:      { backgroundColor:'#0e0e0e', borderBottomWidth:1, borderBottomColor: BORDER,\n    maxHeight:720 },`,
  `panel:      { backgroundColor:'#0e0e0e', flex: 1 },`
);

// 8. Fix close btn to go home
content = content.replace(
  `setShowNotifications(false)`,
  `setActiveTab('home')`
);

fs.writeFileSync(path, content, 'utf8');
