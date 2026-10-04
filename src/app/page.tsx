import { Feed } from "@/components/Feed";
import { isCategory } from "@/lib/categories";
import { getSettings } from "@/lib/settings";
import { getFeedPage, getSponsoredStories } from "@/lib/stories";

export const dynamic = "force-dynamic";

export default async function Home({ searchParams }: PageProps<"/">) {
  const { kategori } = await searchParams;
  const category = isCategory(kategori) ? kategori : null;
  const [page, sponsored, settings] = await Promise.all([getFeedPage({ category }), getSponsoredStories(), getSettings()]);

  return (
    <Feed
      key={category ?? "all"}
      initialStories={page.stories}
      initialCursor={page.nextCursor}
      sponsored={sponsored}
      category={category}
      supportUrl={settings.support_url}
    />
  );
}
