import { MeetupDetailView } from "@/features/meet-up/ui/MeetupDetailView";

export const metadata = {
    title: "Meet-Up Room",
    description: "Collaborative multi-peer audio, video, and screen sharing room on YOIBI",
};

export default async function MeetupDetailPage({ params }) {
    const resolvedParams = await params;
    return <MeetupDetailView roomId={resolvedParams.id} />;
}
