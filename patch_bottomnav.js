const fs = require('fs');
const path = 'artifacts/smovie-admin/app/index.tsx';
let content = fs.readFileSync(path, 'utf8');

const notifTab = `
          <TouchableOpacity
            style={nav.tab}
            onPress={() => onPress('notifications')}
            activeOpacity={0.78}
          >
            <View style={[nav.tabInner, active === 'notifications' && nav.tabInnerActive]}>
              <Text style={[nav.icon, active === 'notifications' && nav.iconActive]}>🔔</Text>
              <Text style={[nav.label, active === 'notifications' && nav.labelActive]}>Alerts</Text>
            </View>
          </TouchableOpacity>
`;

if (!content.includes("onPress('notifications')")) {
  content = content.replace(
    /          <TouchableOpacity\n            style=\{nav\.tab\}\n            onPress=\{\(\) => onPress\('settings'\)\}/,
    notifTab + "          <TouchableOpacity\n            style={nav.tab}\n            onPress={() => onPress('settings')}"
  );
  fs.writeFileSync(path, content, 'utf8');
}
