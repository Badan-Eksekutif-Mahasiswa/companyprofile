import { HeroOrbit } from "@/components/home/HeroOrbit";
import { KabinetPreview } from "@/components/home/KabinetPreview";
import { NewsPreview } from "@/components/home/NewsPreview";
import { StatsSection } from "@/components/home/StatsSection";
import { TaglineSection } from "@/components/home/TaglineSection";
import { VideoSection } from "@/components/home/VideoSection";
import { SmoothScroll } from "@/components/home/SmoothScroll";
import { Cursor } from "@/components/kabinet/Cursor";
import { SiteFooter, SiteNav } from "@/components/ui";
import { HERO } from "@/config/site";
import { getHeroProker, getLatestNews, getStats, pickFeaturedProker } from "@/lib/data";
import { getAllDivisi, getKabinet } from "@/lib/kabinet";

export default async function HomePage() {
  const [proker, stats, news] = await Promise.all([
    getHeroProker(),
    getStats(),
    getLatestNews(3),
  ]);
  const [kabinet, divisi] = await Promise.all([getKabinet(), getAllDivisi()]);

  return (
    <>
      <a
        href="#konten"
        className="sr-only z-[80] rounded-full bg-accent px-4 py-2 font-bold text-white focus-visible:not-sr-only focus-visible:fixed focus-visible:left-4 focus-visible:top-4"
      >
        Lewati ke konten
      </a>
      <SiteNav />
      <main>
        <HeroOrbit items={pickFeaturedProker(proker, HERO.featured)} allItems={proker} />
        <div id="konten">
          <StatsSection stats={stats} />
          <TaglineSection kabinet={kabinet} />
          <KabinetPreview divisi={divisi} />
          <NewsPreview articles={news} />
          <VideoSection />
        </div>
      </main>
      <SiteFooter />
      <SmoothScroll />
      <Cursor />
    </>
  );
}
