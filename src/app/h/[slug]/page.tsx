import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Feed } from "@/components/Feed";
import { getSettings } from "@/lib/settings";
import { getFeedPage, getSponsoredStories, getStoryBySlug } from "@/lib/stories";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/h/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const story = await getStoryBySlug(slug);
  if (!story) return { title: "Haber bulunamadı" };
  const image = story.mediaType === "image" ? story.mediaUrl : null;
  return {
    title: story.title,
    description: story.summary,
    openGraph: {
      title: story.title,
      description: story.summary,
      type: "article",
      images: image ? [{ url: image }] : undefined,
    },
    twitter: { card: image ? "summary_large_image" : "summary", title: story.title, description: story.summary },
  };
}

/** Paylaşılan bağlantı: önce o hikâye, ardından normal akış devam eder. */
export default async function StoryPage({ params }: PageProps<"/h/[slug]">) {
  const { slug } = await params;
  const story = await getStoryBySlug(slug);
  if (!story) notFound();
  const [page, sponsored, settings] = await Promise.all([getFeedPage({}), getSponsoredStories(), getSettings()]);
  const rest = story.isSponsored ? page.stories : page.stories.filter((s) => s.id !== story.id);

  return (
    <Feed
      initialStories={[story, ...rest]}
      initialCursor={page.nextCursor}
      sponsored={sponsored}
      category={null}
      supportUrl={settings.support_url}
    />
  );
}
