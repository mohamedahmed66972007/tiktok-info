import { useState, useEffect } from "react";
import { useGetTikTokProfile, getGetTikTokProfileQueryKey } from "@workspace/api-client-react";
import { useQuery } from "@tanstack/react-query";
import { motion, useSpring, useTransform } from "framer-motion";
import { useTheme } from "@/hooks/use-theme";
import {
  Activity, ShieldAlert, Zap, LayoutGrid, ServerCrash, AlertTriangle,
  AlertCircle, Eye, Heart, MessageCircle, Share2, BarChart3, User,
  Calendar, ExternalLink, ShieldX, CheckCircle, SearchIcon, Moon, Sun,
  Radio, Link, PlaySquare, RefreshCw, Wifi,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";

const POLL_INTERVAL_MS = 30_000;
const VIDEO_POLL_INTERVAL_MS = 10_000;

function AnimatedNumber({ value }: { value: number | null | undefined }) {
  const spring = useSpring(value ?? 0, { stiffness: 60, damping: 14 });
  const display = useTransform(spring, (v) => Math.round(v).toLocaleString("en-US"));

  useEffect(() => {
    if (value !== null && value !== undefined) {
      spring.set(value);
    }
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

export default function Home() {
  const [searchInput, setSearchInput] = useState("");
  const [activeUsername, setActiveUsername] = useState<string | null>(null);
  const [videoUrlInput, setVideoUrlInput] = useState("");
  const [trackingVideoUrl, setTrackingVideoUrl] = useState<string | null>(null);

  const { theme, toggle: toggleTheme } = useTheme();

  const { data, isLoading, isError, error, dataUpdatedAt } = useGetTikTokProfile(
    { username: activeUsername || "" },
    {
      query: {
        enabled: !!activeUsername,
        queryKey: getGetTikTokProfileQueryKey({ username: activeUsername || "" }),
        refetchInterval: POLL_INTERVAL_MS,
      },
    }
  );

  const {
    data: videoData,
    isLoading: videoLoading,
    isError: videoError,
    error: videoErr,
  } = useQuery<VideoStats, Error>({
    queryKey: ["tiktok-video", trackingVideoUrl],
    queryFn: () => fetchVideoStats(trackingVideoUrl!),
    enabled: !!trackingVideoUrl,
    refetchInterval: VIDEO_POLL_INTERVAL_MS,
    retry: 1,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setActiveUsername(searchInput.trim().replace(/^@/, ""));
    }
  };

  const handleVideoTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (videoUrlInput.trim()) {
      setTrackingVideoUrl(videoUrlInput.trim());
    }
  };

  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" });
  };

  const formatTime = (iso: string) => new Date(iso).toLocaleTimeString("ar-EG");

  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex flex-col font-sans" dir="rtl">

      {/* ── Header ───────────────────────────────────────────────── */}
      <header className="border-b border-border/40 bg-card/80 backdrop-blur-xl sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between gap-4">

          {/* Logo */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#fe2c55] to-[#25f4ee] flex items-center justify-center shadow-md">
              <PlaySquare className="w-6 h-6 text-white" />
            </div>
            <div className="hidden sm:block">
              <h1 className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-[#fe2c55] to-[#25f4ee] bg-clip-text text-transparent select-none">
                تيك إنسبكتور
              </h1>
              <p className="text-xs text-muted-foreground">تحليل حسابات تيك توك</p>
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
                  className="h-10 px-5 font-bold rounded-full bg-gradient-to-r from-[#fe2c55] to-[#ff6b81] text-white border-0 hover:opacity-90"
                >
                  {isLoading ? "..." : "بحث"}
                </Button>
              </div>
            </div>
          </form>

          {/* Controls */}
          <div className="flex items-center gap-2 shrink-0">
            {activeUsername && data && (
              <Badge variant="outline" className="hidden md:flex items-center gap-2 px-3 py-1.5 text-xs">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                يتحدث تلقائياً
              </Badge>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full relative"
              onClick={toggleTheme}
              aria-label="تبديل الوضع الليلي"
            >
              {theme === "dark" ? (
                <Sun className="h-5 w-5 transition-all" />
              ) : (
                <Moon className="h-5 w-5 transition-all" />
              )}
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-10 max-w-7xl space-y-8">

        {/* Empty state */}
        {!activeUsername && !isLoading && (
          <div className="h-[55vh] flex flex-col items-center justify-center text-center animate-in fade-in zoom-in duration-500">
            <div className="w-24 h-24 rounded-full flex items-center justify-center mb-8 bg-gradient-to-br from-[#fe2c55]/10 to-[#25f4ee]/10 border border-[#fe2c55]/20">
              <BarChart3 className="w-12 h-12 text-[#fe2c55]" strokeWidth={1.5} />
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
              <Skeleton className="h-48 w-full rounded-2xl" />
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

        {/* ── Profile data ─────────────────────────────────────────── */}
        {data && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in slide-in-from-bottom-4 fade-in duration-500">

            {/* Left sidebar */}
            <div className="lg:col-span-4 space-y-6">

              {/* Profile card */}
              <Card className="border-border/40 shadow-md overflow-hidden bg-card rounded-2xl">
                <div className="h-28 bg-gradient-to-br from-[#fe2c55]/20 to-[#25f4ee]/20 relative">
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

              {/* Privacy flags */}
              {data.flags && data.flags.length > 0 && (
                <Card className="border-orange-500/20 bg-orange-50/50 dark:bg-orange-950/20 shadow-sm rounded-2xl">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-base flex items-center gap-2 text-orange-600 font-bold">
                      <ShieldX className="w-5 h-5" /> مؤشرات الخصوصية
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

              {/* Last updated indicator */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground/60 font-mono px-1">
                <RefreshCw className="w-3 h-3" />
                آخر تحديث: {formatTime(new Date(dataUpdatedAt).toISOString())}
              </div>
            </div>

            {/* Right content */}
            <div className="lg:col-span-8 space-y-6">

              {/* Primary stats — animated numbers */}
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

              {/* Detailed metrics */}
              {data.metrics && data.metrics.length > 0 && (
                <Card className="border-border/40 shadow-sm rounded-2xl">
                  <CardHeader className="pb-4 border-b border-border/40">
                    <CardTitle className="text-lg flex items-center gap-2 font-bold">
                      <Activity className="w-5 h-5 text-primary" /> المقاييس التفصيلية
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="grid grid-cols-1 md:grid-cols-2">
                      {data.metrics.map((metric, i) => (
                        <div key={i} className={`p-5 flex justify-between items-center border-border/40 ${i % 2 === 0 ? "md:border-l" : ""} border-b last:border-b-0`}>
                          <span className="text-sm font-medium text-muted-foreground">{metric.label}</span>
                          <span className={`font-mono font-bold text-lg ${!metric.available ? "text-muted-foreground/40" : ""}`}>
                            {metric.available
                              ? <AnimatedNumber value={typeof metric.value === "number" ? metric.value : null} />
                              : "—"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Stories section */}
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

        {/* ── Live Video Tracker ─────────────────────────────────── */}
        <div className="max-w-4xl mx-auto w-full">
          <Card className="border-border/40 rounded-2xl shadow-sm overflow-hidden">
            <CardHeader className="pb-4 border-b border-border/40 bg-gradient-to-r from-[#fe2c55]/5 to-[#25f4ee]/5">
              <CardTitle className="text-lg flex items-center gap-2 font-bold">
                <Radio className="w-5 h-5 text-[#fe2c55] animate-pulse" />
                بث مباشر لإحصائيات فيديو
              </CardTitle>
              <CardDescription>
                الصق رابط أي فيديو تيك توك لمتابعة مشاهداته وإعجاباته بشكل حي كل 10 ثوانٍ.
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
                  className="h-12 px-6 rounded-xl font-bold bg-gradient-to-r from-[#fe2c55] to-[#ff6b81] text-white border-0 hover:opacity-90 shrink-0"
                >
                  {videoLoading ? "..." : "تتبع"}
                </Button>
                {trackingVideoUrl && (
                  <Button
                    type="button"
                    variant="outline"
                    className="h-12 px-4 rounded-xl shrink-0"
                    onClick={() => { setTrackingVideoUrl(null); setVideoUrlInput(""); }}
                  >
                    إيقاف
                  </Button>
                )}
              </form>

              {videoLoading && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
                </div>
              )}

              {videoError && (
                <div className="p-5 bg-destructive/5 border border-destructive/20 rounded-xl text-center">
                  <p className="text-destructive font-medium">{videoErr?.message ?? "حدث خطأ أثناء جلب بيانات الفيديو"}</p>
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
                      <div className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400 font-mono shrink-0">
                        <Wifi className="w-3.5 h-3.5 animate-pulse" />
                        بث مباشر
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
                    آخر تحديث: {formatTime(videoData.fetchedAt)} · يتحدث كل 10 ثوانٍ
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
