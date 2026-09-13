/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    eslint: {
        ignoreDuringBuilds: true,
    },
    images: {
        remotePatterns: [
            // Cloudinary — all YOIBI media (avatars, banners, thumbnails, videos)
            { protocol: "https", hostname: "res.cloudinary.com" },
            // Google OAuth avatars (provider-derived profile pictures)
            { protocol: "https", hostname: "lh3.googleusercontent.com" },
        ],
    },
    async headers() {
        return [
            {
                source: "/(.*)",
                headers: [
                    {
                        key: "X-Frame-Options",
                        value: "DENY",
                    },
                    {
                        key: "X-Content-Type-Options",
                        value: "nosniff",
                    },
                    {
                        key: "Referrer-Policy",
                        value: "strict-origin-when-cross-origin",
                    },
                    {
                        key: "Strict-Transport-Security",
                        value: "max-age=31536000; includeSubDomains",
                    },
                    {
                        key: "Permissions-Policy",
                        value: "camera=(self), microphone=(self), geolocation=(), interest-cohort=()",
                    },
                ],
            },
        ];
    },
};

export default nextConfig;
