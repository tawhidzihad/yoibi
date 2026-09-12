import { ProfileView } from "@/features/profile/ui/ProfileView";

/**
 * Dynamic profile route — /profile/[username]
 * The profile is always loaded from the backend by the handle in the URL.
 */
export default function ProfilePage() {
    return <ProfileView />;
}