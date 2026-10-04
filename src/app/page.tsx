import { Feed } from "@/components/Feed";
import { isCategory } from "@/lib/categories";
import { getFeedPage, getSponsoredStories } from "@/lib/stories";

export const dynamic = "force-dynamic";

export default async function Home({ searchParams }: PageProps<"/">) {
  const { kategori } = await searchParams;
  const category = isCategory(kategori) ? kategori : null;
  const [page, sponsored] = await Promise.all([getFeedPage({ category }), getSponsoredStories()]);

  return (
    <Feed
      key={category ?? "all"}
      initialStories={page.stories}
      initialCursor={page.nextCursor}
      sponsored={sponsored}
      category={category}
    />
  );
}
