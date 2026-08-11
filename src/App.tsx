import React, { useEffect, useState, useMemo } from 'react';
import {
  Film,
  Tv,
  Play,
  Search,
  Bell,
  Sparkles,
  Info,
  X,
  Volume2,
  Subtitles,
  CheckCircle2,
  Clock,
  Star,
  RefreshCw,
  Server,
  Layers,
  Send,
  Trash2,
  PlusCircle,
  Video,
  Database
} from 'lucide-react';

const API_BASE = '/api';
const FIREBASE_DB_URL = 'https://v-cloud-storage-default-rtdb.asia-southeast1.firebasedatabase.app';

interface EpisodeItem {
  id?: string;
  title: string;
  epNo?: string;
  airDate?: string;
  videoUrl?: string;
  subtitles?: string[];
}

interface SeasonItem {
  seasonNo?: number;
  name?: string;
  episodes?: EpisodeItem[];
}

interface LibraryItem {
  id: string;
  title: string;
  year?: string;
  contentType?: string;
  media_type?: string;
  language?: string;
  categories?: string[];
  nav_chips?: string[];
  tmdb_id?: string | number;
  poster_url?: string;
  poster_paths?: string[];
  backdrop_url?: string;
  backdrop_paths?: string[];
  video_url?: string;
  teaser_url?: string;
  quality?: string;
  audio?: string[];
  subtitles?: string[];
  overview?: string;
  rating?: number;
  vote_average?: number;
  seasons?: SeasonItem[];
  owner?: string;
  status?: string;
  addedAt?: number;
  updatedAt?: number;
}

interface NotificationItem {
  id: string;
  title: string;
  message?: string;
  item_id?: string;
  poster_url?: string;
  timestamp?: number;
}

export default function App() {
  const [library, setLibrary] = useState<LibraryItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [appVersion, setAppVersion] = useState<string>('1.0.0');
  const [loading, setLoading] = useState<boolean>(true);
  const [apiStatus, setApiStatus] = useState<'connected' | 'error' | 'syncing'>('syncing');

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedContentType, setSelectedContentType] = useState<'all' | 'movie' | 'series'>('all');

  // Selected item modal & video player
  const [selectedItem, setSelectedItem] = useState<LibraryItem | null>(null);
  const [activeSeason, setActiveSeason] = useState<number>(1);
  const [activeEpisode, setActiveEpisode] = useState<EpisodeItem | null>(null);
  const [isPlayingVideo, setIsPlayingVideo] = useState<boolean>(false);

  // UI Drawers & Modals
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [showApiInspector, setShowApiInspector] = useState<boolean>(false);
  const [showNewItemModal, setShowNewItemModal] = useState<boolean>(false);

  // Form state for creating/editing from second app
  const [newTitle, setNewTitle] = useState<string>('');
  const [newType, setNewType] = useState<'movie' | 'series'>('movie');
  const [newCategory, setNewCategory] = useState<string>('Action');
  const [newVideoUrl, setNewVideoUrl] = useState<string>('');
  const [newPosterUrl, setNewPosterUrl] = useState<string>('');
  const [newOverview, setNewOverview] = useState<string>('');

  // 1. Fetch data from Central API
  const fetchApiData = async () => {
    setApiStatus('syncing');
    try {
      // Health check
      const healthRes = await fetch(`${API_BASE}/healthz`);
      if (!healthRes.ok) throw new Error('API Health Check failed');

      // Library items
      const libRes = await fetch(`${API_BASE}/library`);
      if (libRes.ok) {
        const data: LibraryItem[] = await libRes.json();
        setLibrary(data);
      }

      // Categories
      const catRes = await fetch(`${API_BASE}/categories`);
      if (catRes.ok) {
        const cats: string[] = await catRes.json();
        setCategories(cats);
      }

      // Notifications
      const notifRes = await fetch(`${API_BASE}/notifications`);
      if (notifRes.ok) {
        const notifs: NotificationItem[] = await notifRes.json();
        setNotifications(notifs);
      }

      // Version
      const verRes = await fetch(`${API_BASE}/version`);
      if (verRes.ok) {
        const verObj = await verRes.json();
        setAppVersion(verObj.version || '1.0.0');
      }

      setApiStatus('connected');
    } catch (err) {
      console.error('[SecondApp] Central API sync error:', err);
      setApiStatus('error');
    } finally {
      setLoading(false);
    }
  };

  // 2. Poll & Direct Firebase RTDB subscription for instant real-time sync
  useEffect(() => {
    void fetchApiData();

    // Setup polling every 5 seconds for background sync
    const pollInterval = setInterval(() => {
      void fetchApiData();
    }, 5000);

    return () => clearInterval(pollInterval);
  }, []);

  // Filtered Library Items
  const filteredLibrary = useMemo(() => {
    return library.filter((item) => {
      // Category filter
      if (selectedCategory !== 'All') {
        const itemCats = item.categories || [];
        const itemChips = item.nav_chips || [];
        const hasCat =
          itemCats.some((c) => c.toLowerCase() === selectedCategory.toLowerCase()) ||
          itemChips.some((c) => c.toLowerCase() === selectedCategory.toLowerCase());
        if (!hasCat) return false;
      }

      // Content type filter
      if (selectedContentType !== 'all') {
        const type = (item.contentType || item.media_type || '').toLowerCase();
        if (selectedContentType === 'movie') {
          if (type !== 'movie' && type !== 'film') return false;
        }
        if (selectedContentType === 'series') {
          if (type !== 'series' && type !== 'tv' && type !== 'show') return false;
        }
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const titleMatch = (item.title || '').toLowerCase().includes(q);
        const descMatch = (item.overview || '').toLowerCase().includes(q);
        const tmdbMatch = String(item.tmdb_id || '').includes(q);
        if (!titleMatch && !descMatch && !tmdbMatch) return false;
      }

      return true;
    });
  }, [library, selectedCategory, selectedContentType, searchQuery]);

  // Featured Hero Item
  const featuredItem = library[0] || null;

  // Handle create item from Second App (synced to Admin via Central API)
  const handleCreateItemFromApp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newItem: Partial<LibraryItem> = {
      id: Date.now().toString(),
      title: newTitle.trim(),
      contentType: newType,
      media_type: newType,
      categories: [newCategory],
      video_url: newVideoUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
      poster_url: newPosterUrl || 'https://image.tmdb.org/t/p/w500/rgMfhcrVZjuy5b7Pn0KzCRCEnMX.jpg',
      overview: newOverview || 'Published from sMovie Streaming Web Client.',
      quality: '4K Ultra HD',
      audio: ['Hindi', 'English'],
      subtitles: ['English'],
      rating: 8.5,
      owner: 'smovie_user',
      addedAt: Date.now(),
      status: 'published'
    };

    try {
      const res = await fetch(`${API_BASE}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newItem)
      });

      if (res.ok) {
        setShowNewItemModal(false);
        setNewTitle('');
        setNewVideoUrl('');
        setNewPosterUrl('');
        setNewOverview('');
        await fetchApiData();
      }
    } catch (err) {
      alert('Failed to publish item via Central API');
    }
  };

  // Handle delete item from Second App
  const handleDeleteItem = async (id: string) => {
    if (!confirm('Delete this title from central database? This will update Admin Panel too.')) return;
    try {
      const res = await fetch(`${API_BASE}/library/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setSelectedItem(null);
        await fetchApiData();
      }
    } catch (err) {
      alert('Delete failed');
    }
  };

  return (
    <div className="min-h-screen bg-[#0d0d0f] text-gray-100 font-sans selection:bg-red-600 selection:text-white">
      {/* ── HEADER / NAVIGATION BAR ── */}
      <header className="sticky top-0 z-40 bg-[#0d0d0f]/90 backdrop-blur-md border-b border-gray-800/80 px-4 md:px-8 py-3.5 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => setSelectedCategory('All')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-red-700 to-red-500 flex items-center justify-center shadow-lg shadow-red-950/40">
              <Film className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-white">sMovie</span>
              <span className="text-xs font-bold text-red-500 ml-1.5 px-1.5 py-0.5 bg-red-950/60 border border-red-800/50 rounded">
                STREAMING
              </span>
            </div>
          </div>

          {/* Central API Badge */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-gray-900 border border-gray-800 text-xs text-gray-300">
            <span
              className={`w-2 h-2 rounded-full ${
                apiStatus === 'connected'
                  ? 'bg-emerald-500 animate-pulse'
                  : apiStatus === 'syncing'
                  ? 'bg-amber-500 animate-spin'
                  : 'bg-red-500'
              }`}
            />
            <span className="font-medium">
              API Status: {apiStatus === 'connected' ? 'Central Server Live' : apiStatus}
            </span>
            <span className="text-gray-500">|</span>
            <span className="text-gray-400 font-mono">{library.length} titles synced</span>
          </div>
        </div>

        {/* Content Filters */}
        <div className="hidden md:flex items-center bg-gray-900/90 border border-gray-800 p-1 rounded-xl">
          <button
            onClick={() => setSelectedContentType('all')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              selectedContentType === 'all'
                ? 'bg-red-600 text-white shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            All Content
          </button>
          <button
            onClick={() => setSelectedContentType('movie')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              selectedContentType === 'movie'
                ? 'bg-red-600 text-white shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Film className="w-3.5 h-3.5" /> Movies
          </button>
          <button
            onClick={() => setSelectedContentType('series')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              selectedContentType === 'series'
                ? 'bg-red-600 text-white shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Tv className="w-3.5 h-3.5" /> Web Series
          </button>
        </div>

        {/* Search & Actions */}
        <div className="flex items-center gap-3">
          <div className="relative w-40 sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search movies, TMDB..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-900/90 border border-gray-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-red-500/80 transition-all"
            />
          </div>

          {/* New Content Action */}
          <button
            onClick={() => setShowNewItemModal(true)}
            className="flex items-center gap-1.5 bg-red-600/90 hover:bg-red-600 text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-lg shadow-red-950/50 transition-all"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Add Title</span>
          </button>

          {/* Notifications button */}
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-xl bg-gray-900 border border-gray-800 text-gray-300 hover:text-white transition-all"
          >
            <Bell className="w-4 h-4" />
            {notifications.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 text-[10px] font-extrabold text-white rounded-full flex items-center justify-center">
                {notifications.length}
              </span>
            )}
          </button>

          {/* API Inspector toggle */}
          <button
            onClick={() => setShowApiInspector(!showApiInspector)}
            className="p-2 rounded-xl bg-gray-900 border border-gray-800 text-gray-300 hover:text-white transition-all"
            title="Inspect Central API Response"
          >
            <Server className="w-4 h-4 text-emerald-400" />
          </button>
        </div>
      </header>

      {/* ── NOTIFICATIONS DRAWER ── */}
      {showNotifications && (
        <div className="absolute top-16 right-4 z-50 w-80 bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl p-4">
          <div className="flex items-center justify-between border-b border-gray-800 pb-2 mb-3">
            <h3 className="text-xs font-bold text-gray-200 flex items-center gap-2">
              <Bell className="w-3.5 h-3.5 text-red-500" /> Central Notifications
            </h3>
            <button onClick={() => setShowNotifications(false)} className="text-gray-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {notifications.length === 0 ? (
              <p className="text-xs text-gray-500 py-4 text-center">No active announcements</p>
            ) : (
              notifications.map((n) => (
                <div key={n.id} className="p-2.5 bg-gray-950/60 rounded-xl border border-gray-800/80 text-xs">
                  <p className="font-bold text-red-400">{n.title}</p>
                  {n.message && <p className="text-gray-300 mt-1">{n.message}</p>}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ── API INSPECTOR MODAL ── */}
      {showApiInspector && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-4 border-b border-gray-800 flex items-center justify-between bg-gray-950">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-400" />
                <h2 className="text-sm font-bold text-white">Central API Endpoint Inspector</h2>
              </div>
              <button onClick={() => setShowApiInspector(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto space-y-4 font-mono text-xs">
              <div className="bg-black/80 p-3 rounded-xl border border-gray-800">
                <p className="text-emerald-400 font-bold mb-1">GET /api/library ({library.length} items)</p>
                <pre className="text-gray-300 max-h-40 overflow-y-auto">
                  {JSON.stringify(library.slice(0, 3), null, 2)}
                </pre>
              </div>
              <div className="bg-black/80 p-3 rounded-xl border border-gray-800">
                <p className="text-emerald-400 font-bold mb-1">GET /api/categories</p>
                <pre className="text-gray-300">{JSON.stringify(categories, null, 2)}</pre>
              </div>
              <div className="bg-black/80 p-3 rounded-xl border border-gray-800">
                <p className="text-emerald-400 font-bold mb-1">GET /api/version</p>
                <p className="text-gray-300">Version: {appVersion}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MAIN CONTENT AREA ── */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-6 space-y-8">
        {/* ── HERO FEATURED ITEM ── */}
        {featuredItem && !searchQuery && selectedCategory === 'All' && (
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-gray-950 via-gray-900 to-gray-950 border border-gray-800/80 shadow-2xl min-h-[360px] md:min-h-[420px] flex items-center">
            {/* Backdrop image */}
            <div
              className="absolute inset-0 bg-cover bg-center opacity-30 mix-blend-overlay"
              style={{
                backgroundImage: `url(${featuredItem.backdrop_url || featuredItem.poster_url || 'https://image.tmdb.org/t/p/w1280/xpba0Dxz3sxV3QgYLR8UIe1LAAX.jpg'})`
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d0f] via-transparent to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0d0d0f] via-[#0d0d0f]/80 to-transparent" />

            <div className="relative z-10 p-6 md:p-12 max-w-2xl space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-red-600/90 text-white text-[11px] font-black uppercase tracking-wider">
                  FEATURED RELEASE
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-gray-800/90 border border-gray-700 text-gray-300 text-[11px] font-bold">
                  {featuredItem.quality || '4K Ultra HD'}
                </span>
                {featuredItem.year && (
                  <span className="text-xs text-gray-400 font-bold">{featuredItem.year}</span>
                )}
              </div>

              <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white leading-none">
                {featuredItem.title}
              </h1>

              <p className="text-xs md:text-sm text-gray-300 line-clamp-3 leading-relaxed">
                {featuredItem.overview ||
                  'Stream this top-rated title directly from the central sMovie API library.'}
              </p>

              {/* Badges & Info */}
              <div className="flex flex-wrap items-center gap-3 text-xs text-gray-300 pt-1">
                {featuredItem.audio && featuredItem.audio.length > 0 && (
                  <span className="flex items-center gap-1 text-gray-400">
                    <Volume2 className="w-3.5 h-3.5 text-red-500" />
                    {featuredItem.audio.join(', ')}
                  </span>
                )}
                {featuredItem.subtitles && featuredItem.subtitles.length > 0 && (
                  <span className="flex items-center gap-1 text-gray-400">
                    <Subtitles className="w-3.5 h-3.5 text-red-500" />
                    {featuredItem.subtitles.join(', ')}
                  </span>
                )}
                {featuredItem.tmdb_id && (
                  <span className="px-2 py-0.5 bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 rounded text-[10px] font-mono">
                    TMDB #{featuredItem.tmdb_id}
                  </span>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => {
                    setSelectedItem(featuredItem);
                    setIsPlayingVideo(true);
                  }}
                  className="flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white px-6 py-3 rounded-2xl font-black text-xs md:text-sm shadow-xl shadow-red-950/80 transition-all hover:scale-105"
                >
                  <Play className="w-4 h-4 fill-current" /> Watch Stream
                </button>
                <button
                  onClick={() => setSelectedItem(featuredItem)}
                  className="flex items-center gap-2 bg-gray-900/90 hover:bg-gray-800 text-gray-200 border border-gray-700 px-5 py-3 rounded-2xl font-bold text-xs md:text-sm transition-all"
                >
                  <Info className="w-4 h-4" /> Details & Episodes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── CATEGORY CHIPS ── */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('All')}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              selectedCategory === 'All'
                ? 'bg-red-600 text-white shadow-lg shadow-red-950/50'
                : 'bg-gray-900/80 text-gray-400 hover:text-white border border-gray-800'
            }`}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-red-600 text-white shadow-lg shadow-red-950/50'
                  : 'bg-gray-900/80 text-gray-400 hover:text-white border border-gray-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* ── CATALOG MEDIA GRID ── */}
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-gray-800 pb-3">
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-red-500" />
                {selectedCategory === 'All' ? 'All Shared API Media' : selectedCategory}
              </h2>
              <p className="text-xs text-gray-400">
                Synchronized directly with sMovie Admin and Central API Database.
              </p>
            </div>
            <button
              onClick={() => void fetchApiData()}
              className="p-2 bg-gray-900 hover:bg-gray-800 text-gray-300 rounded-xl border border-gray-800 text-xs flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 py-12">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="aspect-[2/3] bg-gray-900/80 rounded-2xl animate-pulse border border-gray-800" />
              ))}
            </div>
          ) : filteredLibrary.length === 0 ? (
            <div className="text-center py-16 bg-gray-900/40 rounded-3xl border border-gray-800/80 p-8 space-y-3">
              <Film className="w-12 h-12 text-gray-600 mx-auto" />
              <h3 className="text-base font-bold text-gray-200">No content matches your filters</h3>
              <p className="text-xs text-gray-400 max-w-sm mx-auto">
                Publish a movie or series from the sMovie Admin panel or click "Add Title" above to transfer real media items into the database.
              </p>
              <button
                onClick={() => setShowNewItemModal(true)}
                className="mt-2 inline-flex items-center gap-1.5 bg-red-600 text-white px-4 py-2 rounded-xl text-xs font-bold"
              >
                <PlusCircle className="w-4 h-4" /> Add New Title Now
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {filteredLibrary.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  className="group relative bg-gray-900/90 rounded-2xl overflow-hidden border border-gray-800/80 hover:border-red-500/50 transition-all hover:scale-[1.02] cursor-pointer shadow-lg"
                >
                  {/* Poster Image */}
                  <div className="aspect-[2/3] bg-gray-950 relative overflow-hidden">
                    <img
                      src={
                        item.poster_url ||
                        'https://image.tmdb.org/t/p/w500/rgMfhcrVZjuy5b7Pn0KzCRCEnMX.jpg'
                      }
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-transparent to-transparent opacity-80" />

                    {/* Top Badges */}
                    <div className="absolute top-2 left-2 right-2 flex items-center justify-between gap-1">
                      <span className="px-2 py-0.5 rounded-md bg-black/80 backdrop-blur border border-white/10 text-[10px] font-black text-white uppercase">
                        {item.contentType || item.media_type || 'MOVIE'}
                      </span>
                      {item.quality && (
                        <span className="px-1.5 py-0.5 rounded bg-red-600 text-[9px] font-black text-white">
                          {item.quality}
                        </span>
                      )}
                    </div>

                    {/* Play hover button */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-xs">
                      <div className="w-12 h-12 rounded-full bg-red-600 text-white flex items-center justify-center shadow-xl transform scale-90 group-hover:scale-100 transition-transform">
                        <Play className="w-5 h-5 fill-current ml-0.5" />
                      </div>
                    </div>
                  </div>

                  {/* Info Footer */}
                  <div className="p-3 space-y-1">
                    <h3 className="text-xs font-bold text-white truncate group-hover:text-red-400 transition-colors">
                      {item.title}
                    </h3>
                    <div className="flex items-center justify-between text-[10px] text-gray-400">
                      <span>{item.year || '2024'}</span>
                      {item.rating && (
                        <span className="flex items-center gap-0.5 text-amber-400 font-bold">
                          <Star className="w-3 h-3 fill-current" /> {item.rating}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* ── CREATE / PUBLISH MODAL FROM SECOND APP ── */}
      {showNewItemModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <PlusCircle className="w-4 h-4 text-red-500" /> Publish Title to Central API
              </h2>
              <button onClick={() => setShowNewItemModal(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateItemFromApp} className="space-y-3 text-xs">
              <div>
                <label className="block text-gray-400 mb-1 font-bold">Title Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Stranger Things"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-400 mb-1 font-bold">Content Type</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as any)}
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-red-500"
                  >
                    <option value="movie">Movie</option>
                    <option value="series">Web Series</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-400 mb-1 font-bold">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-red-500"
                  >
                    <option value="Action">Action</option>
                    <option value="Drama">Drama</option>
                    <option value="Sci-Fi">Sci-Fi</option>
                    <option value="Comedy">Comedy</option>
                    <option value="Thriller">Thriller</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-gray-400 mb-1 font-bold">Video Stream URL</label>
                <input
                  type="text"
                  placeholder="https://commondatastorage.googleapis.com/.../video.mp4"
                  value={newVideoUrl}
                  onChange={(e) => setNewVideoUrl(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-red-500 font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-1 font-bold">Poster URL</label>
                <input
                  type="text"
                  placeholder="https://image.tmdb.org/t/p/w500/..."
                  value={newPosterUrl}
                  onChange={(e) => setNewPosterUrl(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-red-500 font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-1 font-bold">Overview / Synopsis</label>
                <textarea
                  rows={2}
                  placeholder="Brief synopsis..."
                  value={newOverview}
                  onChange={(e) => setNewOverview(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewItemModal(false)}
                  className="px-4 py-2 bg-gray-800 text-gray-300 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-lg shadow-red-950"
                >
                  <Send className="w-3.5 h-3.5" /> Publish Now
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MEDIA DETAILS & VIDEO PLAYER MODAL ── */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-gray-900 border border-gray-800 w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl space-y-0 my-8">
            {/* Modal Header / Video Player Container */}
            <div className="relative aspect-video bg-black flex items-center justify-center">
              {isPlayingVideo ? (
                <video
                  src={
                    activeEpisode?.videoUrl ||
                    selectedItem.video_url ||
                    selectedItem.teaser_url ||
                    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4'
                  }
                  controls
                  autoPlay
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="relative w-full h-full flex items-center justify-center">
                  <img
                    src={
                      selectedItem.backdrop_url ||
                      selectedItem.poster_url ||
                      'https://image.tmdb.org/t/p/w1280/xpba0Dxz3sxV3QgYLR8UIe1LAAX.jpg'
                    }
                    alt={selectedItem.title}
                    className="w-full h-full object-cover opacity-60"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-black/40 to-black/60" />

                  <button
                    onClick={() => setIsPlayingVideo(true)}
                    className="relative z-10 w-16 h-16 rounded-full bg-red-600 text-white flex items-center justify-center shadow-2xl hover:scale-110 transition-transform"
                  >
                    <Play className="w-8 h-8 fill-current ml-1" />
                  </button>
                </div>
              )}

              {/* Close Button */}
              <button
                onClick={() => {
                  setSelectedItem(null);
                  setIsPlayingVideo(false);
                  setActiveEpisode(null);
                }}
                className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-black/70 text-gray-300 hover:text-white flex items-center justify-center backdrop-blur border border-white/20"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Info & Episode Guide */}
            <div className="p-6 md:p-8 space-y-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 bg-red-600 text-white rounded font-extrabold text-[10px] uppercase">
                      {selectedItem.contentType || selectedItem.media_type || 'MOVIE'}
                    </span>
                    <span className="text-xs text-gray-400 font-bold">{selectedItem.year || '2024'}</span>
                    <span className="px-2 py-0.5 bg-gray-800 text-gray-300 rounded text-[10px] font-bold">
                      {selectedItem.quality || '4K'}
                    </span>
                  </div>
                  <h2 className="text-2xl md:text-3xl font-black text-white">{selectedItem.title}</h2>
                </div>

                <button
                  onClick={() => handleDeleteItem(selectedItem.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-950/60 hover:bg-red-900 text-red-400 rounded-xl border border-red-800/50 text-xs font-bold"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Remove Title
                </button>
              </div>

              <p className="text-xs md:text-sm text-gray-300 leading-relaxed">
                {selectedItem.overview || 'No synopsis provided for this title in the central API store.'}
              </p>

              {/* Series Episodes Browser */}
              {selectedItem.seasons && selectedItem.seasons.length > 0 && (
                <div className="space-y-4 border-t border-gray-800 pt-4">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Tv className="w-4 h-4 text-red-500" /> Seasons & Episodes
                  </h3>

                  {/* Season selector */}
                  <div className="flex items-center gap-2 overflow-x-auto">
                    {selectedItem.seasons.map((s, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveSeason(s.seasonNo || idx + 1)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                          activeSeason === (s.seasonNo || idx + 1)
                            ? 'bg-red-600 text-white'
                            : 'bg-gray-800 text-gray-400'
                        }`}
                      >
                        Season {s.seasonNo || idx + 1}
                      </button>
                    ))}
                  </div>

                  {/* Episode List */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-56 overflow-y-auto pr-1">
                    {selectedItem.seasons
                      .find((s) => (s.seasonNo || 1) === activeSeason)
                      ?.episodes?.map((ep, eIdx) => (
                        <div
                          key={eIdx}
                          onClick={() => {
                            setActiveEpisode(ep);
                            setIsPlayingVideo(true);
                          }}
                          className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                            activeEpisode?.title === ep.title
                              ? 'bg-red-950/50 border-red-500/80 text-white'
                              : 'bg-gray-950 border-gray-800 hover:border-gray-700 text-gray-300'
                          }`}
                        >
                          <div className="space-y-0.5">
                            <p className="text-xs font-bold truncate">
                              Ep {ep.epNo || eIdx + 1}: {ep.title}
                            </p>
                            {ep.airDate && <p className="text-[10px] text-gray-500">{ep.airDate}</p>}
                          </div>
                          <Play className="w-4 h-4 text-red-500 shrink-0" />
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
