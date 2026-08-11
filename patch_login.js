const fs = require('fs');
const path = 'artifacts/smovie-admin/app/index.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Background Mesh Gradient
const newBg = `
      {/* Aesthetic Mesh Gradient Background */}
      <View style={StyleSheet.absoluteFill}>
        <LinearGradient colors={['#050505', '#120303', '#050505']} style={StyleSheet.absoluteFill} />
        <View style={{ position: 'absolute', top: -Dimensions.get('window').height * 0.2, left: -Dimensions.get('window').width * 0.2, width: Dimensions.get('window').width * 0.8, height: Dimensions.get('window').width * 0.8, borderRadius: 1000, backgroundColor: '#E50914', opacity: 0.25 }} />
        <View style={{ position: 'absolute', bottom: -Dimensions.get('window').height * 0.2, right: -Dimensions.get('window').width * 0.2, width: Dimensions.get('window').width * 0.8, height: Dimensions.get('window').width * 0.8, borderRadius: 1000, backgroundColor: '#4285F4', opacity: 0.2 }} />
        <View style={{ position: 'absolute', top: Dimensions.get('window').height * 0.3, left: Dimensions.get('window').width * 0.3, width: Dimensions.get('window').width * 0.5, height: Dimensions.get('window').width * 0.5, borderRadius: 1000, backgroundColor: '#7a00ff', opacity: 0.15 }} />
        <BlurView intensity={100} tint="dark" style={StyleSheet.absoluteFill} />
        <BlurView intensity={100} tint="dark" style={StyleSheet.absoluteFill} />
      </View>
`;

content = content.replace(
  /\{\/\* Background with glowing orbs for glass effect \*\/\}\n\s*<View style=\{StyleSheet\.absoluteFill\}>\n[\s\S]*?<\/View>/,
  newBg.trim()
);

// 2. Adjusting ls styles
content = content.replace(
  /scroll:         \{ flexGrow:1, alignItems:'center', padding:24, paddingVertical:48, zIndex: 10 \},/,
  "scroll:         { flexGrow:1, alignItems:'center', justifyContent: 'center', padding:24, paddingVertical:48, zIndex: 10 },"
);

content = content.replace(
  /logoWrap:       \{ marginBottom:28 \},/,
  "logoWrap:       { marginBottom:40, alignItems: 'center' },"
);

content = content.replace(
  /card:           \{ width:'100%', backgroundColor: 'rgba\(20, 20, 20, 0\.45\)', borderRadius:20, padding:24,\n\s*borderWidth:1, borderColor: 'rgba\(255, 255, 255, 0\.1\)', overflow: 'hidden' \},/,
  "card:           { width:'100%', maxWidth: 440, backgroundColor: 'rgba(15, 15, 15, 0.45)', borderRadius:32, padding:32,\n    borderWidth:1, borderColor: 'rgba(255, 255, 255, 0.08)', overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.5, shadowRadius: 30 },"
);

content = content.replace(
  /cardTitle:      \{ color: WHITE, fontSize:20, fontWeight:'800', marginBottom:6 \},/,
  "cardTitle:      { color: WHITE, fontSize:26, fontWeight:'900', marginBottom:8, letterSpacing: -0.5 },"
);

content = content.replace(
  /cardSub:        \{ color: MUTED2, fontSize:13, marginBottom:20, lineHeight:20 \},/,
  "cardSub:        { color: '#999', fontSize:14, marginBottom:28, lineHeight:22 },"
);

content = content.replace(
  /toggle:         \{ flexDirection:'row', backgroundColor:'#080808', borderRadius:12,\n\s*padding:4, marginBottom:20 \},/,
  "toggle:         { flexDirection:'row', backgroundColor:'rgba(0,0,0,0.4)', borderRadius:16,\n    padding:6, marginBottom:28, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },"
);

content = content.replace(
  /toggleBtn:      \{ flex:1, paddingVertical:11, borderRadius:9, alignItems:'center' \},/,
  "toggleBtn:      { flex:1, paddingVertical:12, borderRadius:12, alignItems:'center' },"
);

content = content.replace(
  /toggleTxt:      \{ color: MUTED2, fontSize:13, fontWeight:'700' \},/,
  "toggleTxt:      { color: '#666', fontSize:14, fontWeight:'700' },"
);

content = content.replace(
  /socialBtn:      \{ flexDirection:'row', alignItems:'center', borderWidth:1, borderRadius:12,\n\s*paddingVertical:13, paddingHorizontal:16, marginBottom:10 \},/,
  "socialBtn:      { flexDirection:'row', alignItems:'center', borderWidth:1, borderRadius:16,\n    paddingVertical:14, paddingHorizontal:18, marginBottom:12 },"
);

content = content.replace(
  /input:          \{ backgroundColor: INPUT, borderWidth:1, borderColor: BORDER2, borderRadius:11,\n\s*color: WHITE, padding:13, marginBottom:10, fontSize:14 \},/,
  "input:          { backgroundColor: 'rgba(0,0,0,0.3)', borderWidth:1, borderColor: 'rgba(255,255,255,0.1)', borderRadius:14,\n    color: WHITE, padding:16, marginBottom:14, fontSize:15 },"
);

content = content.replace(
  /btn:            \{ backgroundColor: RED, padding:15, borderRadius:12, alignItems:'center', marginTop:4 \},/,
  "btn:            { backgroundColor: RED, padding:16, borderRadius:14, alignItems:'center', marginTop:10, shadowColor: RED, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10 },"
);

content = content.replace(
  /footer:         \{ color:'#1a1a1a', fontSize:11, textAlign:'center', marginTop:28 \},/,
  "footer:         { color:'#444', fontSize:12, textAlign:'center', marginTop:40, letterSpacing: 1 },"
);

fs.writeFileSync(path, content, 'utf8');
