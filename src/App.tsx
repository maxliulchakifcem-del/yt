import { useState, useEffect, useRef } from "react";
import { 
  Youtube, 
  Download, 
  Music, 
  FolderArchive, 
  Check, 
  CheckSquare, 
  Square, 
  AlertTriangle, 
  RefreshCw, 
  X, 
  ChevronDown, 
  Volume2,
  ListMusic,
  Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

// Bilingual Translations dictionary
const translations = {
  ua: {
    title: "Музика з YouTube в",
    titleAccent: "MP3 ZIP",
    subtitle: "Вставте посилання на плейлист або відео, і ми автоматично зберемо всі треки в один зручний архів.",
    inputPlaceholder: "https://youtube.com/playlist?list=...",
    detectPlaylist: "Ви вставили посилання на плейлист. Бажаєте перейти на вкладку Плейлист?",
    detectSingle: "Ви вставили посилання на окреме відео. Бажаєте перейти на вкладку Окремий трек?",
    switchTab: "Переключити вкладку",
    tabSingle: "Окремий трек",
    tabPlaylist: "Завантажити плейлист",
    btnFetch: "Аналізувати",
    btnFetching: "Аналізуємо...",
    errInvalidUrl: "Будь ласка, введіть коректне посилання на YouTube",
    errFetchFailed: "Не вдалося отримати інформацію. Перевірте, чи це посилання є публічним, та спробуйте ще раз.",
    trackSelected: "трек вибрано",
    tracksSelected: "треків вибрано",
    selectAll: "Вибрати всі",
    deselectAll: "Зняти виділення",
    btnDownloadMp3: "Завантажити MP3",
    btnDownloading: "Конвертація...",
    btnZipping: "Пакування в ZIP...",
    btnDownloadZip: "Скачати Архів",
    btnDownloadSelectedZip: "Скачати Архів",
    statusPending: "Підготовка до завантаження...",
    statusDownloading: "Конвертація та завантаження треків...",
    statusZipping: "Створення ZIP-архіву...",
    statusCompleted: "Завершено! Завантаження ZIP розпочнеться автоматично.",
    statusFailed: "Помилка завантаження плейлиста",
    howItWorks: "Як це працює?",
    step1Title: "1. Скопіюйте лінк",
    step1Desc: "Знайдіть відео чи плейлист на YouTube та скопіюйте посилання з адресного рядка.",
    step2Title: "2. Вставте тут",
    step2Desc: "Вставте посилання у поле вводу вище. Наша система автоматично виявить вміст.",
    step3Title: "3. Завантажте в MP3",
    step3Desc: "Отримайте один MP3 файл або позначте потрібні пісні в списку та завантажте весь плейлист в одному архіві.",
    faqTitle: "Популярні запитання",
    faqQ1: "Чи безкоштовний цей сервіс?",
    faqA1: "Так, наш сервіс повністю безкоштовний, не потребує реєстрації та не містить реклами.",
    faqQ2: "Яка якість звуку в завантажених файлах?",
    faqA2: "Сервіс автоматично вибирає найкращий доступний оригінальний аудіопотік і конвертує його в високоякісний MP3 формат (до 320 kbps).",
    faqQ3: "Чи є обмеження на кількість треків?",
    faqA3: "Ви можете завантажувати будь-які плейлисти. Для надто великих плейлистів (понад 100 треків) пакування в ZIP може зайняти до хвилини.",
    failedTracksNotice: "Якщо деякі треки пропущені, інформацію про них ви знайдете у файлі errors.txt всередині архіву.",
    backToSearch: "Очистити",
    copied: "Скопійовано!",
    copyLink: "Копіювати посилання",
    totalTracks: "Всього знайдено треків",
    estimatedTime: "Очікуваний час",
    secPerTrack: "сек на трек",
    activeDownload: "Активний процес",
    cancel: "Скасувати",
    loadingText: "Завантаження інформації з YouTube...",
    serverStatus: "Сервер: Онлайн",
    speed: "Швидкість: 48 MB/s"
  },
  en: {
    title: "YouTube Music in",
    titleAccent: "MP3 ZIP",
    subtitle: "Paste a playlist or video link, and we'll automatically bundle all tracks into one convenient archive.",
    inputPlaceholder: "https://youtube.com/playlist?list=...",
    detectPlaylist: "You pasted a playlist link. Would you like to switch to the Playlist tab?",
    detectSingle: "You pasted a single video link. Would you like to switch to the Single Track tab?",
    switchTab: "Switch Tab",
    tabSingle: "Single Track",
    tabPlaylist: "Download Playlist",
    btnFetch: "Analyze",
    btnFetching: "Analyzing...",
    errInvalidUrl: "Please enter a valid YouTube URL",
    errFetchFailed: "Failed to fetch details. Please verify the URL is public and try again.",
    trackSelected: "track selected",
    tracksSelected: "tracks selected",
    selectAll: "Select All",
    deselectAll: "Deselect All",
    btnDownloadMp3: "Download MP3",
    btnDownloading: "Converting...",
    btnZipping: "Packaging ZIP...",
    btnDownloadZip: "Download Archive",
    btnDownloadSelectedZip: "Download Archive",
    statusPending: "Preparing download queue...",
    statusDownloading: "Downloading and converting tracks...",
    statusZipping: "Creating ZIP archive...",
    statusCompleted: "Finished! ZIP download will trigger automatically.",
    statusFailed: "Failed to download playlist",
    howItWorks: "How It Works",
    step1Title: "1. Copy YouTube Link",
    step1Desc: "Find your video or playlist on YouTube, then copy the URL from your browser address bar.",
    step2Title: "2. Paste the Link",
    step2Desc: "Paste it in the field above. Our engine will auto-detect the content and load metadata.",
    step3Title: "3. Fast Download",
    step3Desc: "Download a single MP3 or check the songs you want from the playlist list to pull them together in a ZIP.",
    faqTitle: "Frequently Asked Questions",
    faqQ1: "Is this tool completely free?",
    faqA1: "Yes! The service is 100% free, requires no sign-ups, and contains no intrusive ads.",
    faqQ2: "What audio quality will I get?",
    faqA2: "The converter grabs the best available original audio stream and converts it to high-quality MP3 format (up to 320 kbps).",
    faqQ3: "Are there playlist size limitations?",
    faqA3: "You can download any public playlist. For very large ones (100+ items), packing the ZIP can take up to a minute.",
    failedTracksNotice: "If some items were blocked or skipped, they'll be listed in errors.txt inside the ZIP file.",
    backToSearch: "Reset",
    copied: "Copied!",
    copyLink: "Copy Link",
    totalTracks: "Total tracks found",
    estimatedTime: "Estimated time",
    secPerTrack: "sec per track",
    activeDownload: "Active Download",
    cancel: "Cancel",
    loadingText: "Fetching details from YouTube...",
    serverStatus: "Server: Online",
    speed: "Speed: 48 MB/s"
  }
};

interface YoutubeTrack {
  id: string;
  title: string;
  duration: string;
  thumbnail: string;
  url: string;
}

function parseHtmlError(text: string, lang: "ua" | "en"): string {
  const titleMatch = text.match(/<title>([\s\S]*?)<\/title>/i);
  const pageTitle = titleMatch ? titleMatch[1].trim() : "";
  
  // Extract clean text
  let bodyText = text
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .substring(0, 180);

  if (pageTitle.toLowerCase().includes("cookie check") || bodyText.toLowerCase().includes("cookie")) {
    return lang === "ua"
      ? "🔒 Браузер блокує cookie у вбудованому фреймі. Будь ласка, натисніть значок стрілочки (Open in new tab) у правому верхньому кутку вікна прев'ю, щоб відкрити сервіс у окремій вкладці. Якщо ви вже відкрили його у новій вкладці, просто оновіть цю сторінку (клавіша F5 або Ctrl+R)."
      : "🔒 Browser blocks cookies inside the iframe. Please click the arrow icon (Open in new tab) in the top-right corner of the preview to run the app in a separate tab. If you are already there, just refresh this page (F5 or Ctrl+R).";
  }

  return lang === "ua"
    ? `⚠️ Отримано сторінку замість даних (Заголовок: "${pageTitle || "Без назви"}"). Текст: "${bodyText}...". Спробуйте перезавантажити сторінку (F5) або відкрити у новій вкладці.`
    : `⚠️ Received page instead of data (Title: "${pageTitle || "Untitled"}"). Content: "${bodyText}...". Please try refreshing the page (F5) or opening in a new tab.`;
}

export default function App() {
  const [lang, setLang] = useState<"ua" | "en">("ua");
  const t = translations[lang];

  const [isIframe, setIsIframe] = useState(false);
  useEffect(() => {
    try {
      setIsIframe(window.self !== window.top);
    } catch (e) {
      setIsIframe(true);
    }
  }, []);

  // Tab state
  const [activeTab, setActiveTab] = useState<"single" | "playlist">("playlist"); // Playlist is default because user wanted to download playlists

  // Input state
  const [inputUrl, setInputUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Suggestions for misaligned tabs
  const [urlSuggestion, setUrlSuggestion] = useState<"single" | "playlist" | null>(null);

  // Fetched single track metadata
  const [singleTrack, setSingleTrack] = useState<YoutubeTrack | null>(null);
  const [singleDownloading, setSingleDownloading] = useState(false);

  // Fetched playlist metadata
  const [playlistTitle, setPlaylistTitle] = useState("");
  const [playlistTracks, setPlaylistTracks] = useState<YoutubeTrack[]>([]);
  const [selectedTrackIds, setSelectedTrackIds] = useState<Set<string>>(new Set());

  // Playlist progress job states
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<"pending" | "downloading" | "zipping" | "completed" | "failed" | null>(null);
  const [jobProgress, setJobProgress] = useState(0);
  const [currentDownloadTrack, setCurrentDownloadTrack] = useState("");
  const [tracksCompleted, setTracksCompleted] = useState(0);
  const [tracksTotal, setTracksTotal] = useState(0);
  const [jobError, setJobError] = useState<string | null>(null);

  // Accordion active state for FAQs
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const sseRef = useRef<EventSource | null>(null);

  // Detect URL patterns and offer suggestions
  useEffect(() => {
    if (!inputUrl) {
      setUrlSuggestion(null);
      return;
    }

    const isPlaylist = inputUrl.includes("list=") || inputUrl.includes("playlist");
    const isVideo = inputUrl.includes("watch?v=") || inputUrl.includes("youtu.be/") || inputUrl.includes("v/");

    if (isPlaylist && activeTab === "single") {
      setUrlSuggestion("playlist");
    } else if (isVideo && !isPlaylist && activeTab === "playlist") {
      setUrlSuggestion("single");
    } else {
      setUrlSuggestion(null);
    }
  }, [inputUrl, activeTab]);

  // Handle Fetching details
  const handleFetchDetails = async () => {
    if (!inputUrl.trim()) return;

    setLoading(true);
    setError(null);
    setSingleTrack(null);
    setPlaylistTracks([]);
    setSelectedTrackIds(new Set());

    const isPlaylistUrl = inputUrl.includes("list=") || inputUrl.includes("playlist");

    try {
      if (activeTab === "single" && !isPlaylistUrl) {
        const response = await fetch(`/api/video-info?url=${encodeURIComponent(inputUrl.trim())}`);
        if (!response.ok) {
          throw new Error(t.errFetchFailed);
        }
        const text = await response.text();
        if (text.trim().startsWith("<")) {
          throw new Error(parseHtmlError(text, lang));
        }
        const data = JSON.parse(text);
        setSingleTrack(data);
      } else {
        // Fetch playlist info (or force playlist parsing)
        const response = await fetch(`/api/playlist-info?url=${encodeURIComponent(inputUrl.trim())}`);
        if (!response.ok) {
          throw new Error(t.errFetchFailed);
        }
        const text = await response.text();
        if (text.trim().startsWith("<")) {
          throw new Error(parseHtmlError(text, lang));
        }
        const data = JSON.parse(text);
        setPlaylistTitle(data.title);
        setPlaylistTracks(data.videos);
        // Select all tracks by default
        const ids = new Set<string>(data.videos.map((v: any) => v.id));
        setSelectedTrackIds(ids);
      }
    } catch (err: any) {
      setError(err.message || t.errFetchFailed);
    } finally {
      setLoading(false);
    }
  };

  // Convert and download single track
  const handleDownloadSingle = async () => {
    if (!singleTrack) return;
    setSingleDownloading(true);
    setError(null);

    try {
      const response = await fetch("/api/download-single", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: singleTrack.url })
      });

      if (!response.ok) {
        throw new Error("Failed to convert video");
      }

      const text = await response.text();
      if (text.trim().startsWith("<")) {
        throw new Error(parseHtmlError(text, lang));
      }
      const { downloadUrl } = JSON.parse(text);
      
      // Use proxy to download with beautiful original filename
      const safeFilename = `${singleTrack.title.replace(/[\\/:*?"<>|]/g, "_")}.mp3`;
      window.location.href = `/api/stream-audio?url=${encodeURIComponent(downloadUrl)}&filename=${encodeURIComponent(safeFilename)}`;
    } catch (err: any) {
      setError(err.message || "Failed to download file");
    } finally {
      setSingleDownloading(false);
    }
  };

  // Start background playlist download and setup SSE listener
  const handleDownloadPlaylist = async () => {
    if (playlistTracks.length === 0 || selectedTrackIds.size === 0) return;

    // Filter selected tracks
    const selected = playlistTracks.filter(track => selectedTrackIds.has(track.id));
    
    setJobError(null);
    setJobProgress(0);
    setTracksCompleted(0);
    setTracksTotal(selected.length);
    setJobStatus("pending");

    try {
      const response = await fetch("/api/create-playlist-job", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: playlistTitle,
          tracks: selected
        })
      });

      if (!response.ok) {
        throw new Error("Could not start background package job");
      }

      const text = await response.text();
      if (text.trim().startsWith("<")) {
        throw new Error(parseHtmlError(text, lang));
      }
      const { jobId: id } = JSON.parse(text);
      setJobId(id);

      // Connect to Server Sent Events for progress stream
      if (sseRef.current) sseRef.current.close();
      
      const sse = new EventSource(`/api/playlist-progress?jobId=${id}`);
      sseRef.current = sse;

      sse.onmessage = (event) => {
        const update = JSON.parse(event.data);
        setJobStatus(update.status);
        setJobProgress(update.progress);
        setCurrentDownloadTrack(update.currentTrack);
        setTracksCompleted(update.tracksCompleted);
        setTracksTotal(update.tracksTotal);

        if (update.status === "completed") {
          sse.close();
          // Trigger file download
          window.location.href = `/api/retrieve-zip?jobId=${id}`;
        } else if (update.status === "failed") {
          sse.close();
          setJobError(update.error || "Zip packing failure");
        }
      };

      sse.onerror = () => {
        setJobStatus("failed");
        setJobError("Lost connection to server compiler");
        sse.close();
      };

    } catch (err: any) {
      setJobStatus("failed");
      setJobError(err.message || "Could not queue download");
    }
  };

  // Track selection helpers
  const toggleTrackSelection = (id: string) => {
    const updated = new Set(selectedTrackIds);
    if (updated.has(id)) {
      updated.delete(id);
    } else {
      updated.add(id);
    }
    setSelectedTrackIds(updated);
  };

  const handleSelectAll = () => {
    setSelectedTrackIds(new Set(playlistTracks.map(t => t.id)));
  };

  const handleDeselectAll = () => {
    setSelectedTrackIds(new Set());
  };

  const cancelActiveJob = () => {
    if (sseRef.current) sseRef.current.close();
    setJobId(null);
    setJobStatus(null);
  };

  const handleReset = () => {
    setInputUrl("");
    setSingleTrack(null);
    setPlaylistTracks([]);
    setSelectedTrackIds(new Set());
    setError(null);
    setUrlSuggestion(null);
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-gray-100 font-sans selection:bg-[#8b5cf6] selection:text-white pb-16 relative overflow-hidden">
      
      {isIframe && (
        <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-b border-amber-500/20 text-amber-200 text-xs sm:text-sm py-3.5 px-6 text-center relative z-50 flex flex-col sm:flex-row items-center justify-center gap-2 backdrop-blur-md">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            {lang === "ua" 
              ? "Браузер може блокувати сторонні cookie у вбудованому фреймі, що викличе помилку аналізу."
              : "Browser may block third-party cookies inside the iframe, causing analysis failure."}
          </span>
          <a 
            href={window.location.href} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="font-bold underline text-amber-300 hover:text-amber-200 ml-1 inline-flex items-center gap-1 cursor-pointer transition-colors"
          >
            {lang === "ua" ? "👉 Відкрити у новій вкладці" : "👉 Open in new tab"}
          </a>
        </div>
      )}

      {/* Absolute Blurred Background Orbs (Frosted Glass Theme) */}
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-[radial-gradient(circle,rgba(139,92,246,0.25)_0%,transparent_70%)] filter blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[50%] h-[50%] bg-[radial-gradient(circle,rgba(236,72,153,0.18)_0%,transparent_70%)] filter blur-[100px] pointer-events-none" />

      {/* Navigation Header */}
      <header className="relative border-b border-white/10 bg-[#0f172a]/70 backdrop-blur-md z-10">
        <div className="max-w-6xl mx-auto px-6 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="width: 40px; height: 40px; w-10 h-10 bg-gradient-to-br from-[#8b5cf6] to-[#ec4899] rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(139,92,246,0.4)]">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
              </svg>
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
                YTMixer
              </span>
              <span className="hidden sm:inline-block ml-3.5 text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-white/5 border border-white/10 text-white/50 tracking-wider">
                Downloader
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Language Selection */}
            <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10 text-xs">
              <button 
                onClick={() => setLang("ua")}
                className={`px-3 py-1.5 rounded-lg transition-all duration-200 ${lang === "ua" ? "bg-[#8b5cf6] text-white font-semibold shadow-md shadow-[#8b5cf6]/20" : "text-white/60 hover:text-white"}`}
              >
                UA
              </button>
              <button 
                onClick={() => setLang("en")}
                className={`px-3 py-1.5 rounded-lg transition-all duration-200 ${lang === "en" ? "bg-[#8b5cf6] text-white font-semibold shadow-md shadow-[#8b5cf6]/20" : "text-white/60 hover:text-white"}`}
              >
                EN
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="relative max-w-4xl mx-auto px-6 pt-16 text-center z-10">
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#8b5cf6]/10 border border-[#8b5cf6]/20 text-xs text-[#a78bfa] font-semibold mb-5 tracking-wide">
            <Volume2 className="w-3.5 h-3.5 text-[#f472b6]" /> MP3 320kbps Quality &bull; Fast ZIP packing
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white mb-5 leading-tight">
            {t.title} <span className="bg-gradient-to-r from-[#a78bfa] to-[#f472b6] bg-clip-text text-transparent">{t.titleAccent}</span>
          </h1>
          <p className="text-white/50 max-w-2xl mx-auto text-base sm:text-lg">
            {t.subtitle}
          </p>
        </motion.div>
      </div>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-6 mt-10 relative z-10">
        
        {/* Main interactive Box with glassmorphism */}
        <div className="background: rgba(255, 255, 255, 0.05); bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 sm:p-10 shadow-2xl shadow-black/50">
          
          {/* Tab Selector */}
          <div className="flex p-1 bg-black/30 rounded-2xl border border-white/10 max-w-md mx-auto mb-8">
            <button
              onClick={() => {
                setActiveTab("single");
                setError(null);
                setSingleTrack(null);
                setPlaylistTracks([]);
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${activeTab === "single" ? "bg-[#8b5cf6] text-white shadow-lg shadow-[#8b5cf6]/25" : "text-white/60 hover:text-white hover:bg-white/5"}`}
            >
              <Music className="w-4 h-4" />
              {t.tabSingle}
            </button>
            <button
              onClick={() => {
                setActiveTab("playlist");
                setError(null);
                setSingleTrack(null);
                setPlaylistTracks([]);
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${activeTab === "playlist" ? "bg-[#8b5cf6] text-white shadow-lg shadow-[#8b5cf6]/25" : "text-white/60 hover:text-white hover:bg-white/5"}`}
            >
              <ListMusic className="w-4 h-4" />
              {t.tabPlaylist}
            </button>
          </div>

          {/* Search/URL Form */}
          <div className="space-y-4">
            <div className="relative">
              <input
                type="text"
                placeholder={t.inputPlaceholder}
                value={inputUrl}
                onChange={(e) => {
                  setInputUrl(e.target.value);
                  setError(null);
                }}
                disabled={loading}
                className="w-full h-15 pl-6 pr-14 rounded-2xl bg-white/5 border border-white/10 focus:border-[#8b5cf6]/50 focus:ring-4 focus:ring-[#8b5cf6]/10 outline-none text-white text-base placeholder-white/20 transition-all duration-250 disabled:opacity-50 disabled:cursor-not-allowed"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleFetchDetails();
                }}
              />
              {inputUrl && (
                <button
                  onClick={handleReset}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full text-white/40 hover:text-white hover:bg-white/10 transition"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              )}
            </div>

            {/* Smart Tab Suggestion Alert */}
            <AnimatePresence>
              {urlSuggestion && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm text-amber-200">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4.5 h-4.5 text-amber-400 shrink-0" />
                      <span>
                        {urlSuggestion === "playlist" ? t.detectPlaylist : t.detectSingle}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        setActiveTab(urlSuggestion);
                        setUrlSuggestion(null);
                      }}
                      className="px-4 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/20 text-xs font-semibold whitespace-nowrap transition cursor-pointer self-start sm:self-auto"
                    >
                      {t.switchTab}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error Message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-200 text-sm flex items-center gap-2"
                >
                  <AlertTriangle className="w-4.5 h-4.5 text-rose-400 shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit Action Button */}
            {playlistTracks.length === 0 && !singleTrack && (
              <button
                onClick={handleFetchDetails}
                disabled={loading || !inputUrl.trim()}
                className="w-full h-14 rounded-2xl bg-[#8b5cf6] hover:bg-[#7c3aed] disabled:bg-white/5 disabled:text-white/20 text-white font-bold transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed shadow-lg shadow-[#8b5cf6]/20 disabled:shadow-none"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {t.btnFetching}
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4.5 h-4.5" />
                    {t.btnFetch}
                  </>
                )}
              </button>
            )}
          </div>

          {/* Results Block */}
          <div className="mt-8">
            
            {/* 1. Single Track Meta Display */}
            {singleTrack && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-5 sm:p-6 rounded-2xl bg-white/3 border border-white/5 backdrop-blur-md"
              >
                <div className="flex flex-col sm:flex-row gap-6">
                  <div className="relative w-full sm:w-48 h-32 rounded-xl overflow-hidden bg-black/40 border border-white/5 shrink-0">
                    <img
                      src={singleTrack.thumbnail}
                      alt={singleTrack.title}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <span className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-md bg-black/85 backdrop-blur-sm text-[11px] font-mono text-white">
                      {singleTrack.duration || "Audio"}
                    </span>
                  </div>
                  <div className="flex flex-col justify-between py-1 flex-1">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-[#a78bfa]">
                        {t.tabSingle}
                      </span>
                      <h3 className="font-bold text-lg sm:text-xl text-white mt-1.5 line-clamp-2">
                        {singleTrack.title}
                      </h3>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 mt-5 sm:mt-0">
                      <button
                        onClick={handleDownloadSingle}
                        disabled={singleDownloading}
                        className="flex-1 h-12 bg-[#8b5cf6] hover:bg-[#7c3aed] disabled:bg-white/5 disabled:text-white/25 text-white font-semibold rounded-xl text-sm flex items-center justify-center gap-2 cursor-pointer transition shadow-lg shadow-[#8b5cf6]/15 disabled:shadow-none"
                      >
                        {singleDownloading ? (
                          <>
                            <Loader2 className="w-4.5 h-4.5 animate-spin" />
                            {t.btnDownloading}
                          </>
                        ) : (
                          <>
                            <Download className="w-4.5 h-4.5" />
                            {t.btnDownloadMp3}
                          </>
                        )}
                      </button>

                      <button
                        onClick={handleReset}
                        className="h-12 px-5 border border-white/10 hover:bg-white/5 text-white/70 hover:text-white rounded-xl text-sm transition font-medium"
                      >
                        {t.backToSearch}
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* 2. Playlist Display & Selection Table */}
            {playlistTracks.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Playlist Summary */}
                <div className="p-5 rounded-2xl bg-white/3 border border-white/5 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 backdrop-blur-md">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#a78bfa] flex items-center gap-1.5">
                      <ListMusic className="w-3.5 h-3.5 text-[#f472b6]" />
                      {t.tabPlaylist}
                    </span>
                    <h3 className="font-bold text-xl text-white mt-1.5 line-clamp-1">
                      {playlistTitle}
                    </h3>
                    <p className="text-xs text-white/40 mt-1">
                      {playlistTracks.length} tracks found &bull; {selectedTrackIds.size} selected
                    </p>
                  </div>

                  <div className="flex items-center gap-2 w-full md:w-auto">
                    <button
                      onClick={handleSelectAll}
                      className="flex-1 md:flex-none text-xs px-3.5 py-2 rounded-xl border border-white/10 hover:bg-white/5 text-white/80 hover:text-white transition"
                    >
                      {t.selectAll}
                    </button>
                    <button
                      onClick={handleDeselectAll}
                      className="flex-1 md:flex-none text-xs px-3.5 py-2 rounded-xl border border-white/10 hover:bg-white/5 text-white/80 hover:text-white transition"
                    >
                      {t.deselectAll}
                    </button>
                  </div>
                </div>

                {/* Scrollable track selection list with fine glass details */}
                <div className="border border-white/5 rounded-2xl overflow-hidden bg-black/20 max-h-[350px] overflow-y-auto shadow-inner">
                  <div className="divide-y divide-white/5">
                    {playlistTracks.map((track, idx) => {
                      const isSelected = selectedTrackIds.has(track.id);
                      return (
                        <div
                          key={track.id}
                          onClick={() => toggleTrackSelection(track.id)}
                          className={`flex items-center gap-4 p-3.5 hover:bg-white/5 cursor-pointer transition ${isSelected ? "bg-[#8b5cf6]/5" : ""}`}
                        >
                          <div className="shrink-0 pl-1">
                            {isSelected ? (
                              <CheckSquare className="w-5 h-5 text-[#8b5cf6]" />
                            ) : (
                              <Square className="w-5 h-5 text-white/25" />
                            )}
                          </div>
                          
                          <span className="font-mono text-xs text-white/30 w-5">
                            {idx + 1}
                          </span>

                          <img
                            src={track.thumbnail}
                            alt={track.title}
                            className="w-14 h-10 object-cover rounded-lg bg-black shrink-0 border border-white/5"
                            referrerPolicy="no-referrer"
                          />

                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium line-clamp-1 transition ${isSelected ? "text-white" : "text-white/70"}`}>
                              {track.title}
                            </p>
                          </div>

                          <span className="font-mono text-xs text-white/40 whitespace-nowrap">
                            {track.duration}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Playlist Action Button */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={handleDownloadPlaylist}
                    disabled={selectedTrackIds.size === 0 || jobStatus === "downloading"}
                    className="flex-1 h-14 bg-[#8b5cf6] hover:bg-[#7c3aed] disabled:bg-white/5 disabled:text-white/20 text-white font-bold rounded-2xl text-base flex items-center justify-center gap-2 cursor-pointer transition shadow-lg shadow-[#8b5cf6]/20 disabled:shadow-none"
                  >
                    <FolderArchive className="w-5 h-5" />
                    {t.btnDownloadSelectedZip} ({selectedTrackIds.size})
                  </button>

                  <button
                    onClick={handleReset}
                    className="h-14 px-6 border border-white/10 hover:bg-white/5 text-white/70 hover:text-white rounded-2xl text-base transition font-semibold"
                  >
                    {t.backToSearch}
                  </button>
                </div>
              </motion.div>
            )}

          </div>

        </div>

        {/* Packing ZIP Progress Overlay Card */}
        <AnimatePresence>
          {jobStatus && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-5 bg-black/80 backdrop-blur-md"
            >
              <motion.div
                initial={{ scale: 0.95, y: 12 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 12 }}
                className="bg-[#0f172a]/95 border border-white/10 rounded-3xl p-6 sm:p-9 max-w-lg w-full shadow-2xl relative overflow-hidden backdrop-blur-xl"
              >
                {/* Vinyl record animated decoration */}
                <div className="absolute -right-16 -top-16 w-36 h-36 rounded-full border border-white/5 bg-gradient-to-tr from-transparent via-[#8b5cf6]/10 to-transparent animate-spin duration-[10s] pointer-events-none" />

                <div className="flex justify-between items-start mb-6">
                  <div>
                    <span className="text-[10px] font-bold text-[#a78bfa] uppercase tracking-widest">
                      {t.activeDownload}
                    </span>
                    <h3 className="font-bold text-xl text-white mt-1.5">
                      {playlistTitle || "Archive Pack"}
                    </h3>
                  </div>
                  
                  {jobStatus !== "completed" && jobStatus !== "failed" && (
                    <button 
                      onClick={cancelActiveJob}
                      className="p-1.5 rounded-full text-white/40 hover:text-white hover:bg-white/10 transition"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>

                <div className="space-y-6">
                  {/* Rotating Vinyl Record / Disk Widget */}
                  <div className="flex justify-center my-4">
                    <div className="relative w-24 h-24 rounded-full bg-black/60 flex items-center justify-center shadow-inner border border-white/10">
                      <div className="absolute inset-2 border border-dashed border-white/10 rounded-full animate-spin duration-[20s]" />
                      <div className="absolute inset-5 border border-white/5 rounded-full" />
                      
                      {/* Spinning core */}
                      <motion.div 
                        animate={jobStatus === "downloading" ? { rotate: 360 } : {}}
                        transition={{ repeat: Infinity, ease: "linear", duration: 2.5 }}
                        className="w-9 h-9 rounded-full bg-[#8b5cf6] border border-white/20 flex items-center justify-center shadow-lg"
                      >
                        <div className="w-2.5 h-2.5 rounded-full bg-slate-950" />
                      </motion.div>
                    </div>
                  </div>

                  {/* Text Information Status */}
                  <div className="text-center space-y-2">
                    <p className="text-sm font-semibold text-white/95">
                      {jobStatus === "pending" && t.statusPending}
                      {jobStatus === "downloading" && t.statusDownloading}
                      {jobStatus === "zipping" && t.statusZipping}
                      {jobStatus === "completed" && t.statusCompleted}
                      {jobStatus === "failed" && t.statusFailed}
                    </p>

                    {jobStatus === "downloading" && currentDownloadTrack && (
                      <p className="text-xs text-[#a78bfa] font-mono font-medium line-clamp-1 animate-pulse px-4">
                        &raquo; {currentDownloadTrack}
                      </p>
                    )}

                    {jobStatus === "downloading" && (
                      <p className="text-[11px] text-white/40 font-mono">
                        {tracksCompleted} / {tracksTotal} {t.tracksSelected}
                      </p>
                    )}
                  </div>

                  {/* Progress Slider Bar */}
                  <div className="space-y-2.5">
                    <div className="h-2 w-full rounded-full bg-black/40 overflow-hidden border border-white/5">
                      <motion.div
                        className="h-full bg-gradient-to-r from-[#8b5cf6] to-[#ec4899] rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${jobProgress}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                    <div className="flex justify-between items-center text-xs font-mono text-white/40">
                      <span>{jobProgress}%</span>
                      <span>100%</span>
                    </div>
                  </div>

                  {/* Failure notice */}
                  {jobStatus === "failed" && (
                    <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/15 text-rose-300 text-xs flex flex-col gap-2">
                      <p className="font-bold flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-rose-400" /> {t.statusFailed}
                      </p>
                      <p className="font-mono text-[11px] leading-relaxed opacity-90">{jobError}</p>
                    </div>
                  )}

                  {/* Success notice */}
                  {jobStatus === "completed" && (
                    <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/15 text-emerald-300 text-xs text-center space-y-1.5">
                      <p className="font-bold flex items-center justify-center gap-1.5 text-sm text-emerald-400">
                        <Check className="w-4.5 h-4.5" /> 100% Complete!
                      </p>
                      <p className="opacity-80">{t.failedTracksNotice}</p>
                    </div>
                  )}

                  {/* Control actions */}
                  <div className="pt-2">
                    {(jobStatus === "completed" || jobStatus === "failed") ? (
                      <button
                        onClick={cancelActiveJob}
                        className="w-full h-11 bg-[#8b5cf6] hover:bg-[#7c3aed] text-white font-semibold rounded-xl text-sm transition"
                      >
                        {t.backToSearch}
                      </button>
                    ) : (
                      <button
                        onClick={cancelActiveJob}
                        className="w-full h-11 border border-white/10 hover:bg-white/5 text-white/60 hover:text-white font-medium rounded-xl text-sm transition"
                      >
                        {t.cancel}
                      </button>
                    )}
                  </div>

                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* How it works Visual flow */}
        <section className="mt-20 space-y-8">
          <h2 className="text-2xl font-extrabold tracking-tight text-white text-center">
            {t.howItWorks}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-white/3 border border-white/5 backdrop-blur-md shadow-lg space-y-3.5">
              <div className="w-9 h-9 rounded-xl bg-[#8b5cf6]/10 border border-[#8b5cf6]/20 text-[#a78bfa] flex items-center justify-center font-bold text-sm">
                1
              </div>
              <h3 className="font-bold text-white text-base">{t.step1Title}</h3>
              <p className="text-sm text-white/50 leading-relaxed">{t.step1Desc}</p>
            </div>

            <div className="p-6 rounded-2xl bg-white/3 border border-white/5 backdrop-blur-md shadow-lg space-y-3.5">
              <div className="w-9 h-9 rounded-xl bg-[#8b5cf6]/10 border border-[#8b5cf6]/20 text-[#a78bfa] flex items-center justify-center font-bold text-sm">
                2
              </div>
              <h3 className="font-bold text-white text-base">{t.step2Title}</h3>
              <p className="text-sm text-white/50 leading-relaxed">{t.step2Desc}</p>
            </div>

            <div className="p-6 rounded-2xl bg-white/3 border border-white/5 backdrop-blur-md shadow-lg space-y-3.5">
              <div className="w-9 h-9 rounded-xl bg-[#8b5cf6]/10 border border-[#8b5cf6]/20 text-[#a78bfa] flex items-center justify-center font-bold text-sm">
                3
              </div>
              <h3 className="font-bold text-white text-base">{t.step3Title}</h3>
              <p className="text-sm text-white/50 leading-relaxed">{t.step3Desc}</p>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="mt-20 space-y-8">
          <h2 className="text-2xl font-extrabold tracking-tight text-white text-center">
            {t.faqTitle}
          </h2>

          <div className="space-y-4.5 max-w-2xl mx-auto">
            {[
              { q: t.faqQ1, a: t.faqA1 },
              { q: t.faqQ2, a: t.faqA2 },
              { q: t.faqQ3, a: t.faqA3 },
            ].map((faq, idx) => (
              <div 
                key={idx}
                className="border border-white/5 rounded-2xl overflow-hidden bg-black/20"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-base text-white/90 hover:text-white transition"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-4.5 h-4.5 text-white/40 shrink-0 transition-transform ${openFaq === idx ? "rotate-180" : ""}`} />
                </button>
                <AnimatePresence>
                  {openFaq === idx && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="p-5 pt-0 text-sm text-white/60 leading-relaxed border-t border-white/5">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </section>

      </main>

      {/* Modern Footer with Server Status indicators */}
      <footer className="max-w-4xl mx-auto px-6 mt-24 text-center border-t border-white/10 pt-8 text-white/30 text-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>&copy; {new Date().getFullYear()} YTMixer. All rights reserved.</p>
          
          <div className="flex items-center gap-5">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-white/50">{t.serverStatus}</span>
            </div>
            <span className="text-white/30">&bull;</span>
            <span className="text-white/50">{t.speed}</span>
          </div>
        </div>
        <p className="text-white/20 pt-1 leading-normal">YT MP3 Studio is created for fast, simple personal music archiving. Not affiliated with YouTube LLC or Google LLC.</p>
      </footer>

    </div>
  );
}
