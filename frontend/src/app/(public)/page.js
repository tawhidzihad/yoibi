import {
    Users,
    Video,
    Radio,
    MessageCircle,
    ArrowRight,
    Play,
    Mic,
    Hash,
    Users2,
    Shield,
    Zap,
    Globe,
} from "lucide-react";
import Link from "next/link";
import { YoibiLogo } from "../../shared/ui/YoibiLogo";
import { AuroraText } from "../../shared/ui/AuroraText";
import { Marquee } from "../../shared/ui/Marquee";
import { NumberTicker } from "../../shared/ui/NumberTicker";

export const metadata = {
    title: "Yoibi — Be You, Be Yoibi",
    description:
        "One platform for everything social — videos, streams, tweets, and video calls. No algorithms, no manipulation, just people being real.",
};

const communityRules = [
    "Always be respectful. When asked a question give the person 20 seconds to answer before interrupting.",
    "No death threats.",
    "Free speech shall not be infringed.",
    "Deep fake videos will be removed.",
    "Fake news postings will be removed.",
    "Postings in which the victims of incest, sexual assault, pedophilia or criminal acts are bullied and made fun of will also be removed.",
    "Have fun and be you.",
];

const stats = [
    { icon: Users,          label: "Active Users",   value: 24853  },
    { icon: Video,          label: "Videos Shared",  value: 182400 },
    { icon: Radio,          label: "Live Streams",   value: 847    },
    { icon: MessageCircle,  label: "Daily Tweets",   value: 56290  },
];

const features = [
    { icon: Hash,   title: "Feed & Tweets",  description: "Share your thoughts, start threads, and engage with a community that actually listens." },
    { icon: Play,   title: "Videos",         description: "Upload, discover, and binge content across 8 categories — from politics to pure fun." },
    { icon: Mic,    title: "Live Streams",   description: "Go live in seconds. Build your audience in real-time with zero barriers to entry." },
    { icon: Users2, title: "Meet Up",        description: "Video rooms for real conversations. Join a room or create your own — no downloads needed." },
];

const values = [
    { icon: Shield, title: "Free Speech, Real Rules",    description: "Say what you think. No censorship — but no death threats, deepfakes, or bullying victims either." },
    { icon: Zap,    title: "Built for Speed",            description: "No algorithmic feed manipulation. Your content reaches people because it's good, not because you paid." },
    { icon: Globe,  title: "For Everyone, Everywhere",   description: "One platform for all your social needs. No switching between 5 apps to stay connected." },
];

const steps = [
    { step: "1", title: "Sign up free",      description: "Create your profile in 30 seconds. No credit card, no catch." },
    { step: "2", title: "Find your people",  description: "Follow topics and creators you care about. Your feed, your rules." },
    { step: "3", title: "Be you",            description: "Post, stream, tweet, or just vibe. There's no wrong way to use Yoibi." },
];

function RuleCard({ rule, index }) {
    return (
        <div className="mx-3 flex w-72 shrink-0 flex-col gap-2 rounded-xl border border-border/50 bg-card/50 p-4 backdrop-blur-sm">
            <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-cyan-500/20 text-xs font-bold text-cyan-400">
                    {index + 1}
                </span>
                <span className="text-xs font-medium text-muted-foreground">Community Rule</span>
            </div>
            <p className="text-sm leading-relaxed text-foreground/80">{rule}</p>
        </div>
    );
}

export default function HomePage() {
    return (
        <div id="community-rules" className="relative min-h-screen overflow-hidden bg-background">
            {/* ─── HERO ─── */}
            <section className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 text-center">
                <YoibiLogo className="mx-auto mb-6 h-20 w-20 text-cyan-500 sm:h-24 sm:w-24" />

                <h1 className="mb-2 text-5xl font-bold tracking-tight sm:text-7xl">
                    BE YOU, BE{" "}
                    <AuroraText colors={["#06b6d4", "#22d3ee", "#0891b2", "#67e8f9"]} speed={1.5}>
                        YOIBI
                    </AuroraText>
                </h1>

                <p className="mx-auto mb-3 max-w-md text-center text-xl font-medium text-muted-foreground sm:text-2xl">
                    FREEDOM IS FREE
                </p>

                <p className="mx-auto mb-10 max-w-lg text-center text-base leading-relaxed text-muted-foreground/80">
                    One platform for everything social — videos, streams, tweets, and video calls.
                    No algorithms, no manipulation, just people being real.
                </p>

                <div className="flex flex-col items-center gap-4 sm:flex-row">
                    {/* Shimmer-style primary CTA */}
                    <Link
                        href="/signup"
                        id="hero-signup-cta"
                        className="relative inline-flex items-center gap-2 overflow-hidden rounded-xl bg-cyan-600 px-8 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-cyan-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
                    >
                        Create Free Account <ArrowRight size={16} aria-hidden="true" />
                    </Link>

                    <Link
                        href="/feed"
                        className="cursor-pointer rounded-xl border border-border/50 bg-secondary/50 px-8 py-3 text-sm font-medium text-foreground backdrop-blur-sm transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
                    >
                        Explore the Feed
                    </Link>
                </div>

                {/* Social proof stats */}
                <div className="mt-16 grid grid-cols-2 gap-8 sm:grid-cols-4">
                    {stats.map(({ icon: Icon, label, value }) => (
                        <div key={label} className="flex flex-col items-center gap-1">
                            <Icon size={20} className="text-cyan-400" aria-hidden="true" />
                            <span className="text-2xl font-bold text-foreground">
                                <NumberTicker value={value} />
                            </span>
                            <span className="text-xs text-muted-foreground">{label}</span>
                        </div>
                    ))}
                </div>
            </section>

            {/* ─── FEATURES ─── */}
            <section className="relative z-10 mx-auto max-w-5xl px-4 py-20">
                <p className="mb-2 text-center text-sm font-medium uppercase tracking-wider text-cyan-400">
                    Everything in one place
                </p>
                <h2 className="mb-12 text-center text-3xl font-bold text-foreground sm:text-4xl">
                    Four ways to connect
                </h2>

                <div className="grid gap-6 sm:grid-cols-2">
                    {features.map(({ icon: Icon, title, description }) => (
                        <div
                            key={title}
                            className="rounded-xl border border-border/50 bg-card/60 p-6 backdrop-blur-sm transition-colors hover:border-cyan-500/30 hover:bg-card/80"
                        >
                            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/10">
                                <Icon size={20} className="text-cyan-400" aria-hidden="true" />
                            </div>
                            <h3 className="mb-2 text-lg font-semibold text-foreground">{title}</h3>
                            <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ─── VALUES ─── */}
            <section className="relative z-10 mx-auto max-w-5xl px-4 py-20">
                <p className="mb-2 text-center text-sm font-medium uppercase tracking-wider text-cyan-400">
                    Why Yoibi
                </p>
                <h2 className="mb-12 text-center text-3xl font-bold text-foreground sm:text-4xl">
                    Social media that respects you
                </h2>

                <div className="grid gap-8 sm:grid-cols-3">
                    {values.map(({ icon: Icon, title, description }) => (
                        <div key={title} className="text-center">
                            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-cyan-500/10">
                                <Icon size={22} className="text-cyan-400" aria-hidden="true" />
                            </div>
                            <h3 className="mb-2 font-semibold text-foreground">{title}</h3>
                            <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ─── HOW IT WORKS ─── */}
            <section className="relative z-10 mx-auto max-w-3xl px-4 py-20">
                <p className="mb-2 text-center text-sm font-medium uppercase tracking-wider text-cyan-400">
                    Get started
                </p>
                <h2 className="mb-12 text-center text-3xl font-bold text-foreground sm:text-4xl">
                    Three steps, zero friction
                </h2>

                <div className="flex flex-col gap-8 sm:flex-row sm:gap-6">
                    {steps.map(({ step, title, description }) => (
                        <div key={step} className="flex-1 text-center">
                            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500 text-lg font-bold text-white">
                                {step}
                            </div>
                            <h3 className="mb-1 font-semibold text-foreground">{title}</h3>
                            <p className="text-sm text-muted-foreground">{description}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ─── COMMUNITY RULES (marquee) ─── */}
            <section className="relative z-10 py-20" aria-label="Community rules">
                <p className="mb-2 text-center text-sm font-medium uppercase tracking-wider text-cyan-400">
                    7 simple rules
                </p>
                <h2 className="mb-8 text-center text-3xl font-bold text-foreground sm:text-4xl">
                    Community Values
                </h2>
                <Marquee pauseOnHover className="[--duration:40s]">
                    {communityRules.map((rule, i) => (
                        <RuleCard key={i} rule={rule} index={i} />
                    ))}
                </Marquee>
            </section>

            {/* ─── FINAL CTA ─── */}
            <section className="relative z-10 mx-auto max-w-2xl px-4 py-20">
                <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-10 text-center backdrop-blur-sm">
                    <YoibiLogo className="mx-auto mb-4 h-12 w-12 text-cyan-500" />
                    <h2 className="mb-3 text-2xl font-bold text-foreground sm:text-3xl">
                        Ready to be yourself?
                    </h2>
                    <p className="mb-8 text-muted-foreground">
                        Join thousands who chose a platform that puts people first. Free forever.
                    </p>
                    <Link
                        href="/signup"
                        id="footer-signup-cta"
                        className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-10 py-3 text-sm font-medium text-white transition-colors hover:bg-cyan-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
                    >
                        Create Free Account <ArrowRight size={16} aria-hidden="true" />
                    </Link>
                </div>
            </section>

            {/* ─── FOOTER ─── */}
            <footer className="relative z-10 border-t border-border/30 py-8 text-center text-sm text-muted-foreground">
                Must be at least 16 years old to sign up for free
            </footer>
        </div>
    );
}
