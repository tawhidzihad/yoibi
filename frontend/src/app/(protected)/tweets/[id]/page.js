import { TweetDetailView } from "@/features/tweets/ui/TweetDetailView";

export const metadata = {
    title: "Tweet",
    description: "An individual Yoibi tweet and its threaded conversation.",
};

/**
 * Dynamic individual tweet route — /tweets/[tweetId]
 * The tweet (and its threaded comments) is always loaded from the backend by
 * the ID in the URL. Follows the same dynamic-route convention as
 * /profile/[username].
 */
export default async function TweetDetailPage({ params }) {
    const resolvedParams = await params;
    return <TweetDetailView tweetId={resolvedParams.id} />;
}
