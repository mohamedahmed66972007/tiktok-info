import { useState, useEffect } from "react";
import { useGetTikTokProfile, getGetTikTokProfileQueryKey } from "@workspace/api-client-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, useSpring, useTransform } from "framer-motion";
import { useTheme } from "@/hooks/use-theme";
import {
  Activity, ShieldAlert, Zap, LayoutGrid, ServerCrash, AlertTriangle,
  AlertCircle, Eye, Heart, MessageCircle, Share2, BarChart3, User,
  Calendar, ExternalLink, ShieldX, CheckCircle, SearchIcon, Moon, Sun,
  Link, RefreshCw, Palette,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";

function AnimatedNumber({ value }: { value: number | null | undefined }) {
  const spring = useSpring(value ?? 0, { stiffness: 60, damping: 14 });
  const display = useTransform(spring, (v) => Math.round(v).toLocaleString("en-US"));

  useEffect(() => {
    if (value !== null && value !== undefined) spring.set(value);
  }, [value, spring]);

  if (value === null || value === undefined) return <span>—</span>;
  return <motion.span>{display}</motion.span>;
}

interface VideoStats {
  videoId?: string;
  caption?: string;
  author?: string;
  cover?: string;
  views: number | null;
  likes: number | null;
  comments: number | null;
  shares: number | null;
  fetchedAt: string;
}

async function fetchVideoStats(url: string): Promise<VideoStats> {
  const res = await fetch(`/api/tiktok/video?url=${encodeURIComponent(url)}`);
  const json = await res.json();
  if (!res.ok) throw new Error((json as { error?: string }).error ?? "حدث خطأ");
  return json as VideoStats;
}

const VIDEO_QUERY_KEY = (url: string) => ["tiktok-video", url];

export default function Home() {
  const [searchInput, setSearchInput] = useState("");
  const [activeUsername, setActiveUsername] = useState<string | null>(null);
  const [videoUrlInput, setVideoUrlInput] = useState("");
  const [trackingVideoUrl, setTrackingVideoUrl] = useState<string | null>(null);
  const [showThemePicker, setShowThemePicker] = useState(false);

  const { theme, toggle: toggleDark, color, setColor, activeColor, COLOR_THEMES } = useTheme();

  const queryClient = useQueryClient();

  const { data, isLoading, isError, error, dataUpdatedAt } = useGetTikTokProfile(
    { username: activeUsername || "" },
    {
      query: {
        enabled: !!activeUsername,
        queryKey: getGetTikTokProfileQueryKey({ username: activeUsername || "" }),
      },
    }
  );

  const {
    data: videoData,
    isLoading: videoLoading,
    isError: videoError,
    error: videoErr,
  } = useQuery<VideoStats, Error>({
    queryKey: VIDEO_QUERY_KEY(trackingVideoUrl ?? ""),
    queryFn: () => fetchVideoStats(trackingVideoUrl!),
    enabled: !!trackingVideoUrl,
    staleTime: Infinity,
    retry: 1,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setActiveUsername(searchInput.trim().replace(/^@/, ""));
    }
  };

  const handleProfileRefresh = () => {
    if (activeUsername) {
      queryClient.invalidateQueries({ queryKey: getGetTikTokProfileQueryKey({ username: activeUsername }) });
    }
  };

  const handleVideoTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (videoUrlInput.trim()) {
      setTrackingVideoUrl(videoUrlInput.trim());
    }
  };

  const handleVideoRefresh = () => {
    if (trackingVideoUrl) {
      queryClient.invalidateQueries({ queryKey: VIDEO_QUERY_KEY(trackingVideoUrl) });
    }
  };

  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" });
  };

  const formatTime = (iso: string) => new Date(iso).toLocaleTimeString("ar-EG");

  const brandStyle = {
    background: `linear-gradient(135deg, var(--brand-from), var(--brand-to))`,
  };

  const brandTextStyle = {
    backgroundImage: `linear-gradient(to right, var(--brand-from), var(--brand-to))`,
    WebkitBackgroundClip: "text" as const,
    WebkitTextFillColor: "transparent" as const,
    backgroundClip: "text" as const,
  };

  const brandBorderStyle = `1px solid color-mix(in srgb, var(--brand-from) 30%, transparent)`;

  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex flex-col font-sans" dir="rtl">

      {/* ── Header ── */}
      <header className="border-b border-border/40 bg-card/80 backdrop-blur-xl sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between gap-4">

          {/* Logo */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="relative w-11 h-11 shrink-0">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center shadow-lg overflow-hidden" style={brandStyle}>
                <span className="text-white font-extrabold text-base tracking-tighter leading-none select-none">MO</span>
              </div>
              <div className="absolute -bottom-1 -left-1 w-5 h-5 rounded-md flex items-center justify-center bg-foreground shadow-sm">
                <span className="text-background font-extrabold text-[8px]">TIK</span>
              </div>
            </div>
            <div className="hidden sm:block">
              <h1 className="font-extrabold text-xl tracking-tight select-none leading-none" style={brandTextStyle}>
                MO TIK INFO
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">تحليل حسابات تيك توك</p>
            </div>
          </div>

          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1 max-w-2xl">
            <div className="relative flex items-center w-full group shadow-sm focus-within:shadow-md rounded-full transition-shadow">
              <div className="absolute right-4 text-muted-foreground group-focus-within:text-primary transition-colors">
                <SearchIcon className="w-5 h-5" />
              </div>
              <Input
                type="text"
                placeholder="ابحث عن حساب تيك توك (بدون @)..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pr-12 pl-28 bg-card border-border/60 focus-visible:ring-primary h-14 rounded-full text-base font-medium shadow-none"
                dir="rtl"
              />
              <div className="absolute left-2">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="h-10 px-5 font-bold rounded-full text-white border-0 hover:opacity-90"
                  style={brandStyle}
                >
                  {isLoading ? "..." : "بحث"}
                </Button>
              </div>
            </div>
          </form>

          {/* Controls */}
          <div className="flex items-center gap-1 shrink-0 relative">
            {/* Theme picker toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
              onClick={() => setShowThemePicker((v) => !v)}
              aria-label="اختيار الثيم"
            >
              <Palette className="h-5 w-5" />
            </Button>

            {/* Dark mode toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
              onClick={toggleDark}
              aria-label="تبديل الوضع الليلي"
            >
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>

            {/* Color theme picker dropdown */}
            {showThemePicker && (
              <div className="absolute top-full left-0 mt-2 p-3 bg-card border border-border/60 rounded-2xl shadow-xl z-50 min-w-[220px]">
                <p className="text-xs text-muted-foreground font-medium mb-2 px-1">اختر لون الثيم</p>
                <div className="grid grid-cols-3 gap-2">
                  {COLOR_THEMES.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => { setColor(t.id); setShowThemePicker(false); }}
                      className={`flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all hover:bg-muted/60 ${color === t.id ? "bg-muted ring-2 ring-primary" : ""}`}
                    >
                      <span
                        className="w-7 h-7 rounded-full shadow-sm"
                        style={{ background: `linear-gradient(135deg, ${t.from}, ${t.to})` }}
                      />
                      <span className="text-xs font-medium text-muted-foreground">{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Click outside to close theme picker */}
      {showThemePicker && (
        <div className="fixed inset-0 z-30" onClick={() => setShowThemePicker(false)} />
      )}

      <main className="flex-1 container mx-auto px-4 py-10 max-w-7xl space-y-8">

        {/* Empty state */}
        {!activeUsername && !isLoading && (
          <div className="h-[55vh] flex flex-col items-center justify-center text-center animate-in fade-in zoom-in duration-500">
            <div className="w-24 h-24 rounded-full flex items-center justify-center mb-8" style={{ background: "color-mix(in srgb, var(--brand-from) 10%, transparent)", border: brandBorderStyle }}>
              <BarChart3 className="w-12 h-12" style={{ color: "var(--brand-from)" }} strokeWidth={1.5} />
            </div>
            <h2 className="text-3xl font-bold mb-4">منصة تحليل حسابات تيك توك</h2>
            <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed">
              احصل على تحليلات دقيقة وشاملة للحسابات. راقب مقاييس الأداء، واكتشف المؤشرات الخفية، وتتبع إحصائيات الفيديوهات بشكل مباشر وفوري.
            </p>
          </div>
        )}

        {/* Loading skeleton */}
        {isLoading && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-300">
            <div className="lg:col-span-4 space-y-6">
              <Card className="border-border/40 shadow-sm">
                <CardContent className="p-8">
                  <div className="flex flex-col items-center space-y-6 text-center">
                    <Skeleton className="w-32 h-32 rounded-full" />
                    <Skeleton className="h-8 w-3/4" />
                    <Skeleton className="h-5 w-1/2" />
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="lg:col-span-8 space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}
              </div>
              <Skeleton className="h-80 w-full rounded-2xl" />
              <Skeleton className="h-96 w-full rounded-2xl" />
            </div>
          </div>
        )}

        {/* Error */}
        {isError && (
          <div className="p-10 border border-destructive/20 bg-destructive/5 rounded-3xl flex flex-col items-center text-center max-w-3xl mx-auto shadow-sm">
            <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mb-6">
              <ServerCrash className="w-10 h-10 text-destructive" />
            </div>
            <h3 className="text-2xl font-bold text-destructive mb-3">تعذر جلب بيانات الحساب</h3>
            <p className="text-lg text-muted-foreground mb-6 max-w-lg">
              {error?.message || "حدث خطأ غير متوقع، يرجى التحقق من اسم المستخدم والمحاولة مرة أخرى."}
            </p>
            <Button onClick={() => setActiveUsername(null)} variant="outline">العودة</Button>
          </div>
        )}

        {/* ── Profile data ── */}
        {data && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in slide-in-from-bottom-4 fade-in duration-500">

            {/* Left sidebar */}
            <div className="lg:col-span-4 space-y-6">

              {/* Profile card */}
              <Card className="border-border/40 shadow-md overflow-hidden bg-card rounded-2xl">
                <div className="h-28 relative" style={brandStyle}>
                  <div className="absolute inset-0 bg-gradient-to-t from-background/40 to-transparent" />
                </div>
                <CardContent className="p-8 pt-0 relative text-center">
                  <div className="flex justify-center">
                    <Avatar className="w-32 h-32 border-4 border-card absolute -top-16 shadow-lg bg-card">
                      <AvatarImage src={data.profile.avatarUrl} alt={data.profile.username} className="object-cover" />
                      <AvatarFallback className="bg-primary/5 text-primary text-3xl font-bold">
                        {data.profile.username.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="mt-20 space-y-5">
                    <div>
                      <h2 className="text-2xl font-bold flex items-center justify-center gap-2">
                        {data.profile.displayName || data.profile.username}
                        {data.profile.verified && <CheckCircle className="w-5 h-5 text-blue-500" />}
                      </h2>
                      <p className="text-muted-foreground font-mono text-lg mt-1" dir="ltr">@{data.profile.username}</p>
                    </div>

                    {data.profile.privateAccount && (
                      <div className="inline-flex items-center gap-2 bg-destructive/10 text-destructive px-4 py-2 rounded-full text-sm font-semibold">
                        <ShieldAlert className="w-4 h-4" />
                        حساب خاص
                      </div>
                    )}

                    {data.profile.bio && (
                      <div className="bg-muted/30 p-4 rounded-xl text-sm leading-relaxed whitespace-pre-wrap border border-border/40">
                        {data.profile.bio}
                      </div>
                    )}

                    <div className="flex flex-wrap justify-center gap-2">
                      {data.profile.region && (
                        <Badge variant="secondary" className="px-3 py-1 text-xs">المنطقة: {data.profile.region}</Badge>
                      )}
                      {data.profile.language && (
                        <Badge variant="secondary" className="px-3 py-1 text-xs">اللغة: {data.profile.language}</Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Missing fields */}
              {data.missingFields && data.missingFields.length > 0 && (
                <Card className="border-border/40 shadow-sm rounded-2xl bg-card">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-base flex items-center gap-2 text-muted-foreground">
                      <AlertCircle className="w-5 h-5" /> بيانات غير متوفرة
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {data.missingFields.map((field, i) => (
                        <Badge key={i} variant="outline" className="text-xs font-mono">{field}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Last updated + refresh */}
              <div className="flex items-center justify-between text-xs text-muted-foreground/70 font-mono px-1">
                <span>آخر تحديث: {formatTime(new Date(dataUpdatedAt).toISOString())}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 gap-1.5 text-xs rounded-lg"
                  onClick={handleProfileRefresh}
                  disabled={isLoading}
                >
                  <RefreshCw className={`w-3 h-3 ${isLoading ? "animate-spin" : ""}`} />
                  تحديث
                </Button>
              </div>
            </div>

            {/* Right content */}
            <div className="lg:col-span-8 space-y-6">

              {/* 1. Primary stats — animated numbers */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {([
                  { label: "المتابعون", value: data.profile.followers, icon: User, color: "text-blue-500", bg: "bg-blue-500/10" },
                  { label: "يتابع", value: data.profile.following, icon: ExternalLink, color: "text-indigo-500", bg: "bg-indigo-500/10" },
                  { label: "الإعجابات", value: data.profile.likes, icon: Heart, color: "text-rose-500", bg: "bg-rose-500/10" },
                  { label: "المقاطع", value: data.profile.videos, icon: LayoutGrid, color: "text-emerald-500", bg: "bg-emerald-500/10" },
                ] as const).map((stat, i) => (
                  <Card key={i} className="bg-card border-border/40 shadow-sm rounded-2xl hover:shadow-md transition-shadow">
                    <CardContent className="p-6 flex flex-col items-center justify-center text-center">
                      <div className={`w-12 h-12 rounded-full ${stat.bg} flex items-center justify-center mb-4`}>
                        <stat.icon className={`w-6 h-6 ${stat.color}`} />
                      </div>
                      <p className="text-3xl font-bold font-mono tracking-tight mb-1">
                        <AnimatedNumber value={stat.value} />
                      </p>
                      <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* 2. Privacy flags */}
              {data.flags && data.flags.length > 0 && (
                <Card className="border-orange-500/20 bg-orange-50/50 dark:bg-orange-950/20 shadow-sm rounded-2xl">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-base flex items-center gap-2 text-orange-600 font-bold">
                      <ShieldX className="w-5 h-5" /> مؤشرات الخصوصية والمخاطر
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-4">
                      {data.flags.map((flag, i) => (
                        <li key={i} className="flex justify-between items-center text-sm border-b border-orange-500/10 pb-3 last:border-0 last:pb-0">
                          <span className="text-muted-foreground font-medium">{flag.label}</span>
                          <span className={`font-mono font-bold px-2 py-1 rounded text-xs ${flag.value === true ? "bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-400" : "bg-green-50 dark:bg-green-900/40 text-green-700 dark:text-green-400"}`}>
                            {typeof flag.value === "boolean" ? (flag.value ? "نعم" : "لا") : String(flag.value)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* 3. Stories section */}
              <Card className="border-border/40 shadow-sm rounded-2xl overflow-hidden flex flex-col h-[700px]">
                <CardHeader className="pb-5 border-b border-border/40 bg-card shrink-0">
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2 font-bold mb-1">
                        <Zap className="w-5 h-5 text-amber-500" /> الستوري
                      </CardTitle>
                      <CardDescription className="text-sm">
                        القصص والمقاطع المنشورة مع بيانات التفاعل الكاملة لكل منشور.
                      </CardDescription>
                    </div>
                    <Badge className="font-mono text-sm px-3 py-1.5 bg-primary/10 text-primary border-0 font-bold">
                      الإجمالي: {data.stories?.length || 0}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-0 flex-1 overflow-hidden bg-muted/10">
                  {data.stories && data.stories.length > 0 ? (
                    <ScrollArea className="h-full w-full">
                      <div className="p-4 space-y-4">
                        {data.stories.map((story) => (
                          <div key={story.id} className="bg-card rounded-xl p-5 border border-border/40 shadow-sm flex flex-col md:flex-row gap-6 hover:border-primary/30 transition-colors">
                            <div className="w-full md:w-40 h-56 md:h-40 bg-muted rounded-lg overflow-hidden shrink-0">
                              {story.thumbnailUrl ? (
                                <img src={story.thumbnailUrl} alt="صورة المقطع" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground text-sm">
                                  <LayoutGrid className="w-8 h-8 mb-2 opacity-20" />
                                  لا توجد صورة
                                </div>
                              )}
                            </div>
                            <div className="flex-1 flex flex-col min-w-0">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono mb-3">
                                  <Calendar className="w-4 h-4" />
                                  {formatDate(story.createdAt)}
                                </div>
                                <p className="text-base font-medium leading-relaxed mb-4">
                                  {story.caption || "مقطع بدون وصف"}
                                </p>
                              </div>
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-auto">
                                {([
                                  { icon: Eye, label: "المشاهدات", value: story.views, color: "" },
                                  { icon: Heart, label: "الإعجابات", value: story.likes, color: "text-rose-500" },
                                  { icon: MessageCircle, label: "التعليقات", value: story.comments, color: "text-blue-500" },
                                  { icon: Share2, label: "المشاركات", value: story.shares, color: "text-emerald-500" },
                                ] as const).map(({ icon: Icon, label, value, color }) => (
                                  <div key={label} className="bg-muted/40 p-3 rounded-lg flex flex-col items-center gap-1 border border-border/30">
                                    <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                                      <Icon className={`w-4 h-4 ${color}`} />
                                      <span className="text-xs">{label}</span>
                                    </div>
                                    <span className="font-mono font-bold text-sm">
                                      {value != null ? value.toLocaleString("en-US") : "—"}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-10 text-center">
                      <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-4">
                        <AlertTriangle className="w-10 h-10 opacity-50" />
                      </div>
                      <h4 className="text-lg font-bold mb-2">لا يوجد محتوى</h4>
                      <p className="max-w-md">لم يتم العثور على أي مقاطع أو قصص متاحة لهذا الحساب.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* ── Video Stats Tracker ── */}
        <div className="max-w-4xl mx-auto w-full">
          <Card className="border-border/40 rounded-2xl shadow-sm overflow-hidden">
            <CardHeader className="pb-4 border-b border-border/40" style={{ background: "linear-gradient(to right, color-mix(in srgb, var(--brand-from) 8%, transparent), color-mix(in srgb, var(--brand-to) 8%, transparent))" }}>
              <CardTitle className="text-lg flex items-center gap-2 font-bold">
                <Activity className="w-5 h-5" style={{ color: "var(--brand-from)" }} />
                متتبع إحصائيات الفيديو
              </CardTitle>
              <CardDescription>
                الصق رابط أي فيديو تيك توك لجلب مشاهداته وإعجاباته. اضغط تحديث متى أردت رؤية أحدث الأرقام.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-5">
              <form onSubmit={handleVideoTrack} className="flex gap-3">
                <div className="flex-1 relative">
                  <Link className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="url"
                    placeholder="https://www.tiktok.com/@user/video/..."
                    value={videoUrlInput}
                    onChange={(e) => setVideoUrlInput(e.target.value)}
                    className="pr-9 font-mono text-sm h-12 rounded-xl"
                    dir="ltr"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={videoLoading}
                  className="h-12 px-6 rounded-xl font-bold text-white border-0 hover:opacity-90 shrink-0"
                  style={brandStyle}
                >
                  {videoLoading ? "..." : "جلب"}
                </Button>
                {trackingVideoUrl && (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-12 px-4 rounded-xl shrink-0 gap-2"
                      onClick={handleVideoRefresh}
                      disabled={videoLoading}
                    >
                      <RefreshCw className={`w-4 h-4 ${videoLoading ? "animate-spin" : ""}`} />
                      تحديث
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-12 px-4 rounded-xl shrink-0"
                      onClick={() => { setTrackingVideoUrl(null); setVideoUrlInput(""); }}
                    >
                      إيقاف
                    </Button>
                  </>
                )}
              </form>

              {videoLoading && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
                </div>
              )}

              {videoError && (
                <div className="p-5 bg-destructive/5 border border-destructive/20 rounded-xl text-right space-y-2">
                  <p className="text-destructive font-semibold">
                    {videoErr?.message ?? "حدث خطأ أثناء جلب بيانات الفيديو"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    استخدم الرابط الكامل مثل:<br />
                    <span className="font-mono text-xs" dir="ltr">tiktok.com/@اسم_الحساب/video/رقم_الفيديو</span>
                  </p>
                </div>
              )}

              {videoData && !videoLoading && (
                <div className="space-y-4">
                  {(videoData.caption || videoData.author) && (
                    <div className="flex flex-wrap items-start gap-3 p-4 bg-muted/30 rounded-xl border border-border/40">
                      {videoData.cover && (
                        <img src={videoData.cover} alt="غلاف الفيديو" className="w-14 h-14 rounded-lg object-cover shrink-0" />
                      )}
                      <div className="min-w-0 flex-1">
                        {videoData.author && (
                          <p className="text-sm text-muted-foreground font-mono mb-1" dir="ltr">@{videoData.author}</p>
                        )}
                        {videoData.caption && (
                          <p className="text-sm font-medium leading-relaxed line-clamp-2">{videoData.caption}</p>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {([
                      { icon: Eye, label: "المشاهدات", value: videoData.views, color: "text-violet-500", bg: "bg-violet-500/10" },
                      { icon: Heart, label: "الإعجابات", value: videoData.likes, color: "text-rose-500", bg: "bg-rose-500/10" },
                      { icon: MessageCircle, label: "التعليقات", value: videoData.comments, color: "text-blue-500", bg: "bg-blue-500/10" },
                      { icon: Share2, label: "المشاركات", value: videoData.shares, color: "text-emerald-500", bg: "bg-emerald-500/10" },
                    ] as const).map(({ icon: Icon, label, value, color, bg }) => (
                      <Card key={label} className="border-border/40 rounded-xl shadow-sm">
                        <CardContent className="p-5 flex flex-col items-center justify-center text-center">
                          <div className={`w-10 h-10 rounded-full ${bg} flex items-center justify-center mb-3`}>
                            <Icon className={`w-5 h-5 ${color}`} />
                          </div>
                          <p className="text-2xl font-bold font-mono tracking-tight mb-1">
                            <AnimatedNumber value={value} />
                          </p>
                          <p className="text-xs font-medium text-muted-foreground">{label}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  <p className="text-xs text-muted-foreground/60 font-mono text-left" dir="ltr">
                    آخر تحديث: {formatTime(videoData.fetchedAt)}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

      </main>
    </div>
  );
}
