import { FeedView } from "../../../features/feed/ui/FeedView";

export const metadata = {
    title: "Feed",
    description: "Your Yoibi social feed — posts, tweets, and more from people you follow.",
};

export default function FeedPage() {
    return <FeedView />;
}
