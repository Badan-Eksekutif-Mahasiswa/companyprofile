import { HeroOrbit } from "@/components/home/HeroOrbit";
import { KabinetPreview } from "@/components/home/KabinetPreview";
import { NewsPreview } from "@/components/home/NewsPreview";
import { StatsSection } from "@/components/home/StatsSection";
import { TaglineSection } from "@/components/home/TaglineSection";
import { VideoSection } from "@/components/home/VideoSection";
import { CustomCursor } from "@/components/layout/CustomCursor";
import { SiteFooter, SiteNav } from "@/components/ui";
import { getDivisiSummaries, getHeroProker, getLatestNews, getStats } from "@/lib/data";
import { getAllDivisi, getKabinet } from "@/lib/kabinet";

export default async function HomePage() {
  const [proker, summaries, stats, news] = await Promise.all([
    getHeroProker(),
    getDivisiSummaries(),
    getStats(),
    getLatestNews(3),
  ]);
  const kabinet = getKabinet();
  const divisi = getAllDivisi();

  return (
    <>
      <a
        href="#konten"
        className="sr-only z-[80] rounded-full bg-accent px-4 py-2 font-bold text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Lewati ke konten
      </a>
      <SiteNav />
      <main>
        <HeroOrbit items={proker} divisi={summaries} />
        <div id="konten">
          <StatsSection stats={stats} />
          <TaglineSection kabinet={kabinet} />
          <KabinetPreview divisi={divisi} />
          <NewsPreview articles={news} />
          <VideoSection />
        </div>
      </main>
      <SiteFooter />
      <CustomCursor />
    </>
  );
}
