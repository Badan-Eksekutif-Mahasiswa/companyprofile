import { Button } from "@/components/ui";
import { Reveal } from "@/components/motion";
import { NEWS_CATEGORIES, type NewsArticle, type NewsCategory } from "@/lib/news";
import { ArticleCard } from "./article-card";

const INTRO: Record<NewsCategory, string> = {
  "kajian-strategis": "Kajian mendalam atas isu kampus dan kebijakan pendidikan, lengkap dengan data dan rekomendasi.",
  "siaran-pers": "Pernyataan sikap resmi BEM UI 2026 beserta tuntutan dan langkah tindak lanjutnya.",
  "opini-artikel": "Tulisan dan sudut pandang dari fungsionaris dan mahasiswa UI tentang isu yang sedang hangat.",
  "kabar-ui": "Informasi terbaru seputar layanan, fasilitas, dan kegiatan di lingkungan UI.",
};

/** Tampilan ala Wellcome Stories: tiap topik punya bagian sendiri dengan judul, pengantar, dan tiga kartu. */
export function TopicSections({ articles, onSeeAll }: { articles: NewsArticle[]; onSeeAll: (k: NewsCategory) => void }) {
  return (
    <div className="mt-12 space-y-16">
      {NEWS_CATEGORIES.map((c) => {
        const list = articles.filter((a) => a.kategori === c.value);
        if (list.length === 0) return null;
        return (
          <section key={c.value} aria-labelledby={`topik-${c.value}`}>
            <h2 id={`topik-${c.value}`} className="text-3xl font-extrabold text-navy">
              {c.label}
            </h2>
            <p className="mt-2 max-w-2xl text-secondary">{INTRO[c.value]}</p>
            <div className="mt-6 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
              {list.slice(0, 3).map((a, i) => (
                <Reveal key={a.slug} index={i}>
                  <ArticleCard article={a} size="large" className="h-full" />
                </Reveal>
              ))}
            </div>
            <div className="mt-6">
              <Button variant="outline" size="sm" onClick={() => onSeeAll(c.value)}>
                {list.length > 3 ? `Lihat semua ${c.label} (${list.length})` : `Filter ${c.label}`}
              </Button>
            </div>
          </section>
        );
      })}
    </div>
  );
}
