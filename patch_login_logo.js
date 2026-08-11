const fs = require('fs');
const path = 'artifacts/smovie-admin/app/index.tsx';
let content = fs.readFileSync(path, 'utf8');

const replacement = `
        <View style={ls.logoWrap}>
          <AppLogo size={72} />
          <View style={{ marginTop: 12, alignItems: 'center' }}>
            <Text style={s.brandName}><Text style={{ color: RED }}>s</Text>movie.</Text>
            <Text style={s.brandSub}>ADMIN PANEL</Text>
          </View>
        </View>
`;

content = content.replace(
  /<View style=\{ls\.logoWrap\}>\n\s*<AppLogo size=\{96\} \/>\n\s*<\/View>/g,
  replacement.trim()
);

fs.writeFileSync(path, content, 'utf8');
