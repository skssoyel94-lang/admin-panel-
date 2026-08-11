const fs = require('fs');
const path = 'artifacts/smovie-admin/app/index.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Define SVGs
const svgs = `
const GoogleSvg = ({ size }: { size: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <Path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <Path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <Path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </Svg>
);
const GithubSvg = ({ size }: { size: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" fill="#FFF"/>
  </Svg>
);
const FacebookSvg = ({ size }: { size: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path d="M22.675 0H1.325C.593 0 0 .593 0 1.325v21.351C0 23.407.593 24 1.325 24H12.82v-9.294H9.692v-3.622h3.128V8.413c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12V24h6.116c.73 0 1.323-.593 1.323-1.325V1.325C24 .593 23.407 0 22.675 0z" fill="#1877F2"/>
  </Svg>
);
`;

if (!content.includes('const GoogleSvg')) {
  content = content.replace(
    '// ─── Constants & Types ────────────────────────────────────────────────────────',
    svgs + '\n// ─── Constants & Types ────────────────────────────────────────────────────────'
  );
}

// 2. Modify SocialBtn component
const oldSocialBtn = /function SocialBtn\(\{ icon, label, color, bg, loading, disabled, onPress \}:\n\s*\{ icon:string;label:string;color:string;bg:string;loading:boolean;disabled:boolean;onPress:\(\)=>void \}\) \{\n\s*return \(\n\s*<TouchableOpacity style=\{\[ls\.socialBtn,\{backgroundColor:bg,borderColor:color\+'33'\},disabled&&ls\.disabled\]\}\n\s*onPress=\{onPress\} disabled=\{disabled\} activeOpacity=\{0\.75\}>\n\s*\{loading \? <ActivityIndicator color=\{color\} size="small" style=\{\{width:28,marginRight:10\}\}\/>\n\s*: <Text style=\{\[ls\.socialIcon,\{color\}\]\}>\{icon\}<\/Text>\}\n\s*<Text style=\{\[ls\.socialLabel,\{color\}\]\}>\{label\}<\/Text>\n\s*<\/TouchableOpacity>\n\s*\);\n\}/;

const newSocialBtn = `function SocialBtn({ provider, label, loading, disabled, onPress }:
  { provider:'google'|'github'|'facebook';label:string;loading:boolean;disabled:boolean;onPress:()=>void }) {
  return (
    <TouchableOpacity style={[ls.socialBtn, disabled&&ls.disabled]}
      onPress={onPress} disabled={disabled} activeOpacity={0.75}>
      <View style={ls.socialIconWrap}>
        {loading ? <ActivityIndicator color={WHITE} size="small" />
          : provider === 'google' ? <GoogleSvg size={20} />
          : provider === 'github' ? <GithubSvg size={20} />
          : <FacebookSvg size={20} />}
      </View>
      <Text style={ls.socialLabel}>{label}</Text>
    </TouchableOpacity>
  );
}`;

content = content.replace(oldSocialBtn, newSocialBtn);

// 3. Update SocialBtn usages in LoginScreen
const oldSocialButtons = /<SocialBtn icon="G" label="Continue with Google"   color="#4285F4" bg="#0d1f3c"\n\s*loading=\{loading==='google'\}   disabled=\{busy\} onPress=\{\(\)=>socialSignIn\('google'\)\} \/>\n\s*<SocialBtn icon="◇" label="Continue with GitHub"  color="#c9d1d9" bg="#161b22"\n\s*loading=\{loading==='github'\}   disabled=\{busy\} onPress=\{\(\)=>socialSignIn\('github'\)\} \/>\n\s*<SocialBtn icon="f" label="Continue with Facebook" color="#1877F2" bg="#0d1e3d"\n\s*loading=\{loading==='facebook'\} disabled=\{busy\} onPress=\{\(\)=>socialSignIn\('facebook'\)\} \/>/;

const newSocialButtons = `<SocialBtn provider="google" label="Continue with Google"
                loading={loading==='google'} disabled={busy} onPress={()=>socialSignIn('google')} />
              <SocialBtn provider="github" label="Continue with GitHub"
                loading={loading==='github'} disabled={busy} onPress={()=>socialSignIn('github')} />
              <SocialBtn provider="facebook" label="Continue with Facebook"
                loading={loading==='facebook'} disabled={busy} onPress={()=>socialSignIn('facebook')} />`;

content = content.replace(oldSocialButtons, newSocialButtons);

// 4. Update ls.socialBtn styles
content = content.replace(
  /socialBtn:      \{ flexDirection:'row', alignItems:'center', borderWidth:1, borderRadius:16,\n\s*paddingVertical:14, paddingHorizontal:18, marginBottom:12 \},/,
  "socialBtn:      { flexDirection:'row', alignItems:'center', backgroundColor:'rgba(255,255,255,0.06)', borderWidth:1, borderColor:'rgba(255,255,255,0.1)', borderRadius:16,\n    paddingVertical:14, paddingHorizontal:18, marginBottom:12 },\n  socialIconWrap: { width: 28, alignItems: 'center', marginRight: 12 },"
);

content = content.replace(
  /socialLabel:    \{ fontSize:14, fontWeight:'700' \},/,
  "socialLabel:    { fontSize:15, fontWeight:'600', color: WHITE },"
);

// 5. Update ls.toggle style
content = content.replace(
  /toggle:         \{ flexDirection:'row', backgroundColor:'rgba\(0,0,0,0\.4\)', borderRadius:16,\n\s*padding:6, marginBottom:28, borderWidth: 1, borderColor: 'rgba\(255,255,255,0\.05\)' \},/,
  "toggle:         { flexDirection:'row', backgroundColor:'rgba(0,0,0,0.4)', borderRadius:16,\n    padding:6, marginBottom:32, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },"
);

// 6. Fix "or Backup Login (Email)" styling
content = content.replace(
  /divTxt:         \{ color: MUTED, fontSize:11, marginHorizontal:12, fontWeight:'600' \},/,
  "divTxt:         { color: '#888', fontSize:12, marginHorizontal:16, fontWeight:'600', textTransform: 'uppercase', letterSpacing: 1 },"
);

content = content.replace(
  /divider:        \{ flexDirection:'row', alignItems:'center', marginVertical:18 \},/,
  "divider:        { flexDirection:'row', alignItems:'center', marginVertical:24 },"
);

fs.writeFileSync(path, content, 'utf8');
