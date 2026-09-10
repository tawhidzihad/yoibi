import { NotificationList } from "@/features/notifications";

export const metadata = {
    title: "Notifications",
    description: "Activity alerts and notifications on Yoibi.",
};

export default function NotificationsPage() {
    return <NotificationList />;
}
