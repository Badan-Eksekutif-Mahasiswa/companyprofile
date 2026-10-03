import { HeroOrbit } from "@/components/home/HeroOrbit";
import { KabinetPreview } from "@/components/home/KabinetPreview";
import { NewsPreview } from "@/components/home/NewsPreview";
import { StatsSection } from "@/components/home/StatsSection";
import { TaglineSection } from "@/components/home/TaglineSection";
import { VideoSection } from "@/components/home/VideoSection";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { getHeroProker, getKabinet, getLatestNews, getStats, getStruktur } from "@/lib/data";

export default async function HomePage() {
  const [proker, struktur, stats, kabinet, news] = await Promise.all([
    getHeroProker(),
    getStruktur(),
    getStats(),
    getKabinet(),
    getLatestNews(3),
  ]);

  return (
    <>
      <main>
        <HeroOrbit items={proker} />
        <div id="konten">
          <StatsSection stats={stats} />
          <TaglineSection kabinet={kabinet} />
          <KabinetPreview struktur={struktur} />
          <NewsPreview articles={news} />
          <VideoSection />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
