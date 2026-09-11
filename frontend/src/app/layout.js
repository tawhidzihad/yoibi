import "./globals.css";
import "@fontsource-variable/geist";
import { AuthProvider } from "@/features/auth/context/AuthContext";

export const metadata = {
    title: {
        default: "Yoibi — Be You, Be Yoibi",
        template: "%s | Yoibi",
    },
    description:
        "One platform for everything social — videos, streams, tweets, and video calls. No algorithms, no manipulation, just people being real.",
    keywords: ["social media", "free speech", "live streams", "videos", "tweets", "meet up"],
    icons: {
        icon: "/favicon.svg",
    },
    openGraph: {
        title: "Yoibi — Be You, Be Yoibi",
        description:
            "One platform for everything social — videos, streams, tweets, and video calls.",
        type: "website",
    },
};

export const viewport = {
    width: "device-width",
    initialScale: 1,
};

export default function RootLayout({ children }) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body>
                <AuthProvider>{children}</AuthProvider>
            </body>
        </html>
    );
}

