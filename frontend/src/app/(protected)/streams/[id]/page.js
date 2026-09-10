import { StreamDetailView } from "@/features/streams/ui/StreamDetailView";

export const metadata = {
    title: "Live Stream Studio | YOIBI",
    description: "Realtime interactive broadcast on YOIBI",
};

export default async function StreamDetailPage({ params }) {
    const resolvedParams = await params;
    return <StreamDetailView streamId={resolvedParams.id} />;
}
