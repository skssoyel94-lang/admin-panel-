const fs = require('fs');
let content = fs.readFileSync('artifacts/smovie-admin/app/index.tsx', 'utf8');

const startIdx = content.indexOf('function ItemDetails');
const endIdx = content.indexOf('// ─── Inline Video Preview (web only)');

const replacement = `function ItemDetails({ item, onClose }: { item: TMDBItem | null; onClose: () => void }) {
  if (!item) return null;
  const date = item.release_date ?? item.first_air_date ?? 'Release date unavailable';
  const providers = getOttProviders(item);

  return (
    <Modal visible={!!item} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={wm.backdrop} onPress={onClose}>
        <Pressable style={wm.sheet} onPress={e => e.stopPropagation()}>
          <View style={wm.handle} />
          <View style={wm.header}>
            <View>
              <Text style={wm.title}>{item.title ?? item.name}</Text>
              <Text style={wm.sub}>TMDB ID {item.id}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={wm.closeBtn}>
              <Text style={wm.closeTxt}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={wm.body} showsVerticalScrollIndicator={false}>
            <View style={nd.hero}>
              {item.poster_path ? <Image source={{ uri: \`\${POSTER_BASE}\${item.poster_path}\` }} style={nd.poster} /> : <View style={[nd.poster, nd.posterFb]}><Text style={{ color: MUTED }}>▣</Text></View>}
              <View style={{ flex: 1 }}>
                <Text style={nd.type}>{item.media_type === 'tv' ? 'TV SERIES' : 'MOVIE'}</Text>
                <Text style={nd.date}>Release date · {date}</Text>
                <Text style={nd.rating}>{item.vote_average ? \`★ \${item.vote_average.toFixed(1)} / 10\` : 'Rating unavailable'}</Text>
              </View>
            </View>
            <Text style={nd.label}>STREAMING PLATFORM</Text>
            <View style={nd.providerBox}>
              {providers.length ? providers.map(provider => (
                <View key={\`\${provider.provider_id}-\${provider.provider_name}\`} style={nd.providerRow}>
                  {provider.logo_path
                    ? <Image source={{ uri: \`\${PROVIDER_BASE}\${provider.logo_path}\` }} style={nd.providerLogo} />
                    : <View style={nd.providerLogoFallback}><Feather name="play" size={10} color={WHITE} /></View>}
                  <Text style={nd.provider}>{provider.provider_name}</Text>
                </View>
              )) : <Text style={nd.muted}>Platform data unavailable for India.</Text>}
            </View>
            <Text style={nd.label}>OVERVIEW</Text>
            <Text style={nd.overview}>{item.overview || 'No overview available.'}</Text>
            <View style={nd.idBox}><Text style={nd.idLabel}>TMDB ID</Text><Text style={nd.idValue}>{item.id}</Text></View>
            <TouchableOpacity style={wm.addBtn} onPress={onClose}><Text style={wm.addTxt}>Close</Text></TouchableOpacity>
            <View style={{ height: 28 }} />
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ─── File picker row ─────────────────────────────────────────────────────────
function FilePickerRow({
  icon, label, subLabel, fileName, selected, onPress, onClear,
}: {
  icon: string; label: string; subLabel?: string; fileName?: string;
  selected?: boolean; onPress: () => void; onClear?: () => void;
}) {
  return (
    <View style={{ marginBottom: 8 }}>
      <TouchableOpacity
        style={[fp.row, selected && fp.rowSelected]}
        onPress={onPress} activeOpacity={0.8}>
        <View style={[fp.iconWrap, selected && fp.iconWrapSelected]}>
          <Text style={[fp.icon, selected && fp.iconSelected]}>{icon}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={fp.label}>{label}</Text>
          {fileName
            ? <Text style={fp.fileName} numberOfLines={1}>{shortenName(fileName)}</Text>
            : subLabel ? <Text style={fp.subLabel}>{subLabel}</Text> : null
          }
        </View>
        {selected
          ? <View style={fp.check}><Text style={{ color: WHITE, fontSize: 11, fontWeight: '900' }}>✓</Text></View>
          : <Text style={fp.plus}>+</Text>
        }
      </TouchableOpacity>
      {selected && onClear && (
        <TouchableOpacity onPress={onClear} style={fp.clearRow}>
          <Text style={fp.clearTxt}>× Remove</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Bottom Nav ───────────────────────────────────────────────────────────────
type Tab = 'home' | 'library' | 'settings';
function BottomNav({ active, onPress }: { active: Tab; onPress: (t: Tab) => void }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[nav.dock, { bottom: Math.max(16, insets.bottom + 10) }]}>
      <BlurView intensity={68} tint="dark" style={nav.blur}>
        <View style={nav.tabs}>
          <TouchableOpacity
            style={nav.tab}
            onPress={() => onPress('home')}
            activeOpacity={0.78}
          >
            <View style={[nav.tabInner, active === 'home' && nav.tabInnerActive]}>
              <Text style={[nav.icon, active === 'home' && nav.iconActive]}>▲</Text>
              <Text style={[nav.label, active === 'home' && nav.labelActive]}>Upload</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={nav.tab}
            onPress={() => onPress('library')}
            activeOpacity={0.78}
          >
            <View style={[nav.tabInner, active === 'library' && nav.tabInnerActive]}>
              <Text style={[nav.icon, active === 'library' && nav.iconActive]}>▦</Text>
              <Text style={[nav.label, active === 'library' && nav.labelActive]}>Library</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={nav.tab}
            onPress={() => onPress('settings')}
            activeOpacity={0.78}
          >
            <View style={[nav.tabInner, active === 'settings' && nav.tabInnerActive]}>
              <Text style={[nav.icon, active === 'settings' && nav.iconActive]}>◉</Text>
              <Text style={[nav.label, active === 'settings' && nav.labelActive]}>Settings</Text>
            </View>
          </TouchableOpacity>
        </View>
      </BlurView>
    </View>
  );
}

`;

content = content.substring(0, startIdx) + replacement + content.substring(endIdx);
fs.writeFileSync('artifacts/smovie-admin/app/index.tsx', content);
