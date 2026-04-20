import { useState } from "react";
import { useGetTikTokProfile, getGetTikTokProfileQueryKey } from "@workspace/api-client-react";
import { Search, Activity, ShieldAlert, Zap, LayoutGrid, CheckCircle2, ServerCrash, Clock, AlertTriangle, AlertCircle, Eye, Heart, MessageCircle, Share2, BarChart3, User, Calendar, ExternalLink, ShieldX, CheckCircle, SearchIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

export default function Home() {
  const [searchInput, setSearchInput] = useState("");
  const [activeUsername, setActiveUsername] = useState<string | null>(null);

  const { data, isLoading, isError, error } = useGetTikTokProfile(
    { username: activeUsername || "" },
    { query: { enabled: !!activeUsername, queryKey: getGetTikTokProfileQueryKey({ username: activeUsername || "" }) } }
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      const cleanUsername = searchInput.trim().replace(/^@/, "");
      setActiveUsername(cleanUsername);
    }
  };

  const formatNumber = (num: number | undefined | null) => {
    if (num === undefined || num === null) return "—";
    return new Intl.NumberFormat('en-US').format(num);
  };

  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex flex-col font-sans" dir="rtl">
      {/* Premium Header */}
      <header className="border-b border-border/40 bg-card/80 backdrop-blur-xl sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between gap-6">
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
              <Activity className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="font-bold text-xl tracking-tight hidden sm:block text-card-foreground">مستكشف تيك توك</h1>
              <p className="text-xs text-muted-foreground hidden sm:block">تحليل البيانات الاحترافي</p>
            </div>
          </div>

          <form onSubmit={handleSearch} className="flex-1 max-w-2xl relative">
            <div className="relative flex items-center w-full group shadow-sm transition-shadow focus-within:shadow-md rounded-full">
              <div className="absolute right-4 text-muted-foreground group-focus-within:text-primary transition-colors">
                <SearchIcon className="w-5 h-5" />
              </div>
              <Input
                type="text"
                placeholder="ابحث عن حساب تيك توك (بدون @)..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pr-12 pl-32 bg-card border-border/60 focus-visible:ring-primary h-14 rounded-full text-base font-medium shadow-none"
                dir="rtl"
              />
              <div className="absolute left-2 flex items-center">
                <Button 
                  type="submit" 
                  className="h-10 px-6 font-bold bg-primary text-primary-foreground hover:bg-primary/90 rounded-full"
                  disabled={isLoading}
                >
                  {isLoading ? "جاري البحث..." : "بحث"}
                </Button>
              </div>
            </div>
          </form>

          <div className="flex items-center gap-3 shrink-0">
            <Badge variant="outline" className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-card text-muted-foreground font-mono text-xs border-border/50">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              النظام متصل
            </Badge>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-10 max-w-7xl">
        {!activeUsername && !isLoading && (
          <div className="h-[60vh] flex flex-col items-center justify-center text-center animate-in fade-in zoom-in duration-500">
            <div className="w-24 h-24 bg-primary/5 rounded-full flex items-center justify-center mb-8 border border-primary/10">
              <BarChart3 className="w-12 h-12 text-primary" strokeWidth={1.5} />
            </div>
            <h2 className="text-3xl font-bold mb-4 text-card-foreground">منصة تحليل حسابات تيك توك</h2>
            <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed">
              احصل على تحليلات دقيقة وشاملة للحسابات. راقب مقاييس الأداء، واكتشف المؤشرات الخفية، وقم بتحليل تفاعل المتابعين مع القصص والمحتوى بكل سهولة.
            </p>
          </div>
        )}

        {isLoading && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-300">
            <div className="lg:col-span-4 space-y-6">
              <Card className="border-border/40 shadow-sm">
                <CardContent className="p-8">
                  <div className="flex flex-col items-center space-y-6 text-center">
                    <Skeleton className="w-32 h-32 rounded-full" />
                    <Skeleton className="h-8 w-3/4" />
                    <Skeleton className="h-5 w-1/2" />
                    <div className="flex gap-4 w-full justify-center mt-6">
                      <Skeleton className="h-10 w-20 rounded-full" />
                      <Skeleton className="h-10 w-20 rounded-full" />
                      <Skeleton className="h-10 w-20 rounded-full" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Skeleton className="h-64 w-full rounded-2xl" />
            </div>
            <div className="lg:col-span-8 space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Skeleton className="h-32 rounded-2xl" />
                <Skeleton className="h-32 rounded-2xl" />
                <Skeleton className="h-32 rounded-2xl" />
                <Skeleton className="h-32 rounded-2xl" />
              </div>
              <Skeleton className="h-80 w-full rounded-2xl" />
              <Skeleton className="h-96 w-full rounded-2xl" />
            </div>
          </div>
        )}

        {isError && (
          <div className="p-10 border border-destructive/20 bg-destructive/5 rounded-3xl flex flex-col items-center text-center max-w-3xl mx-auto shadow-sm">
            <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mb-6">
              <ServerCrash className="w-10 h-10 text-destructive" />
            </div>
            <h3 className="text-2xl font-bold text-destructive mb-3">تعذر جلب بيانات الحساب</h3>
            <p className="text-lg text-muted-foreground mb-6 max-w-lg">
              {error?.message || "حدث خطأ غير متوقع أثناء محاولة الاتصال بمزود البيانات. يرجى التحقق من صحة اسم المستخدم والمحاولة مرة أخرى."}
            </p>
            <Button onClick={() => setActiveUsername(null)} variant="outline" className="min-w-[120px]">
              العودة
            </Button>
          </div>
        )}

        {data && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in slide-in-from-bottom-4 fade-in duration-500">
            
            {/* Left Sidebar - Profile Overview */}
            <div className="lg:col-span-4 space-y-6">
              <Card className="border-border/40 shadow-md overflow-hidden bg-card rounded-2xl">
                <div className="h-32 bg-primary/10 relative">
                  <div className="absolute inset-0 bg-gradient-to-t from-background/40 to-transparent"></div>
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
                  
                  <div className="mt-20 space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold flex items-center justify-center gap-2 text-card-foreground">
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
                      <div className="bg-muted/30 p-4 rounded-xl text-sm leading-relaxed whitespace-pre-wrap text-card-foreground border border-border/40">
                        {data.profile.bio}
                      </div>
                    )}
                    
                    <div className="flex flex-wrap justify-center gap-2 pt-2">
                      {data.profile.region && (
                        <Badge variant="secondary" className="bg-secondary text-secondary-foreground hover:bg-secondary/80 px-3 py-1 text-xs">
                          المنطقة: {data.profile.region}
                        </Badge>
                      )}
                      {data.profile.language && (
                        <Badge variant="secondary" className="bg-secondary text-secondary-foreground hover:bg-secondary/80 px-3 py-1 text-xs">
                          اللغة: {data.profile.language}
                        </Badge>
                      )}
                      {data.profile.accountLevel && (
                        <Badge variant="secondary" className="bg-secondary text-secondary-foreground hover:bg-secondary/80 px-3 py-1 text-xs">
                          الفئة: {data.profile.accountLevel}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Flags & Warnings */}
              {data.flags && data.flags.length > 0 && (
                <Card className="border-orange-500/20 bg-orange-50/50 shadow-sm rounded-2xl">
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
                          <span className={`font-mono font-bold px-2 py-1 rounded ${flag.value === true ? 'bg-orange-100 text-orange-700' : 'bg-green-50 text-green-700'}`}>
                            {typeof flag.value === 'boolean' ? (flag.value ? 'نعم' : 'لا') : String(flag.value)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Missing Fields */}
              {data.missingFields && data.missingFields.length > 0 && (
                <Card className="border-border/40 shadow-sm rounded-2xl bg-card">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-base flex items-center gap-2 text-muted-foreground">
                      <AlertCircle className="w-5 h-5" /> بيانات غير متوفرة للملف
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {data.missingFields.map((field, i) => (
                        <Badge key={i} variant="outline" className="text-xs bg-muted/20 border-border/50 text-muted-foreground font-mono">
                          {field}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* API Meta */}
              <div className="text-xs text-muted-foreground/60 space-y-2 font-mono text-left bg-card p-4 rounded-2xl border border-border/40" dir="ltr">
                <div className="flex items-center justify-between">
                  <span>Source:</span>
                  <span className="font-semibold text-muted-foreground">{data.source}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Generated:</span>
                  <span>{new Date(data.generatedAt).toLocaleString('en-US')}</span>
                </div>
              </div>
            </div>

            {/* Right Main Content */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* Primary Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "المتابعون", value: data.profile.followers, icon: User, color: "text-blue-500", bg: "bg-blue-500/10" },
                  { label: "يتابع", value: data.profile.following, icon: ExternalLink, color: "text-indigo-500", bg: "bg-indigo-500/10" },
                  { label: "تسجيلات الإعجاب", value: data.profile.likes, icon: Heart, color: "text-rose-500", bg: "bg-rose-500/10" },
                  { label: "المقاطع", value: data.profile.videos, icon: LayoutGrid, color: "text-emerald-500", bg: "bg-emerald-500/10" }
                ].map((stat, i) => (
                  <Card key={i} className="bg-card border-border/40 shadow-sm rounded-2xl hover:shadow-md transition-shadow">
                    <CardContent className="p-6 flex flex-col items-center justify-center text-center">
                      <div className={`w-12 h-12 rounded-full ${stat.bg} flex items-center justify-center mb-4`}>
                        <stat.icon className={`w-6 h-6 ${stat.color}`} />
                      </div>
                      <p className="text-3xl font-bold font-mono tracking-tight text-card-foreground mb-1">
                        {formatNumber(stat.value)}
                      </p>
                      <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Detailed Metrics */}
              {data.metrics && data.metrics.length > 0 && (
                <Card className="border-border/40 shadow-sm rounded-2xl">
                  <CardHeader className="pb-4 border-b border-border/40">
                    <CardTitle className="text-lg flex items-center gap-2 text-card-foreground font-bold">
                      <Activity className="w-5 h-5 text-primary" /> المقاييس التفصيلية للحساب
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="grid grid-cols-1 md:grid-cols-2">
                      {data.metrics.map((metric, i) => (
                        <div key={i} className={`p-5 flex justify-between items-center border-border/40 ${i % 2 === 0 ? 'md:border-l' : ''} border-b last:border-b-0 md:[&:nth-last-child(-n+2)]:border-b-0`}>
                          <span className="text-sm font-medium text-muted-foreground">{metric.label}</span>
                          <span className={`font-mono font-bold text-lg ${!metric.available ? 'text-muted-foreground/40 line-through' : 'text-card-foreground'}`}>
                            {metric.available ? String(metric.value) : 'غير متاح'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Stories / Videos Analysis */}
              <Card className="border-border/40 shadow-sm rounded-2xl overflow-hidden flex flex-col h-[700px]">
                <CardHeader className="pb-5 border-b border-border/40 bg-card shrink-0">
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2 text-card-foreground font-bold mb-1">
                        <Zap className="w-5 h-5 text-amber-500" /> تحليل المحتوى المستخرج
                      </CardTitle>
                      <CardDescription className="text-sm">
                        يعرض أحدث المقاطع المنشورة وأداء التفاعل الخاص بها.
                      </CardDescription>
                    </div>
                    <Badge className="font-mono text-sm px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 font-bold border-0">
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
                            <div className="w-full md:w-40 h-56 md:h-40 bg-muted rounded-lg overflow-hidden shrink-0 relative group">
                              {story.thumbnailUrl ? (
                                <img src={story.thumbnailUrl} alt="صورة المقطع" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground text-sm font-medium bg-muted">
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
                                <p className="text-base font-medium leading-relaxed text-card-foreground mb-4">
                                  {story.caption || "مقطع بدون وصف"}
                                </p>
                              </div>
                              
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-auto">
                                <div className="bg-muted/40 p-3 rounded-lg flex flex-col items-center justify-center gap-1 border border-border/30">
                                  <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                                    <Eye className="w-4 h-4" />
                                    <span className="text-xs">المشاهدات</span>
                                  </div>
                                  <span className="font-mono font-bold text-card-foreground">{formatNumber(story.views)}</span>
                                </div>
                                <div className="bg-muted/40 p-3 rounded-lg flex flex-col items-center justify-center gap-1 border border-border/30">
                                  <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                                    <Heart className="w-4 h-4 text-rose-500" />
                                    <span className="text-xs">الإعجابات</span>
                                  </div>
                                  <span className="font-mono font-bold text-card-foreground">{formatNumber(story.likes)}</span>
                                </div>
                                <div className="bg-muted/40 p-3 rounded-lg flex flex-col items-center justify-center gap-1 border border-border/30">
                                  <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                                    <MessageCircle className="w-4 h-4 text-blue-500" />
                                    <span className="text-xs">التعليقات</span>
                                  </div>
                                  <span className="font-mono font-bold text-card-foreground">{formatNumber(story.comments)}</span>
                                </div>
                                <div className="bg-muted/40 p-3 rounded-lg flex flex-col items-center justify-center gap-1 border border-border/30">
                                  <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                                    <Share2 className="w-4 h-4 text-emerald-500" />
                                    <span className="text-xs">المشاركات</span>
                                  </div>
                                  <span className="font-mono font-bold text-card-foreground">{formatNumber(story.shares)}</span>
                                </div>
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
                      <h4 className="text-lg font-bold text-card-foreground mb-2">لا يوجد محتوى</h4>
                      <p className="max-w-md">لم يتم العثور على أي مقاطع فيديو أو قصص متاحة لهذا الحساب في الوقت الحالي.</p>
                    </div>
                  )}
                </CardContent>
              </Card>

            </div>
          </div>
        )}
      </main>
    </div>
  );
}
