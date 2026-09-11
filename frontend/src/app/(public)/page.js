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
import { cn } from "../../shared/utils/cn";
import { YoibiLogo } from "../../shared/ui/YoibiLogo";
import { AuroraText } from "../../shared/ui/AuroraText";
import { Marquee } from "../../shared/ui/Marquee";
import { NumberTicker } from "../../shared/ui/NumberTicker";
import { Reveal } from "./Reveal";

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

/* ── Homepage design tokens ────────────────────────────────
   One container, one spacing rhythm, three button levels. */
const container = "mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8";
const sectionPad = "py-16 sm:py-20 lg:py-24";

const focusRing =
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-600 focus-visible:ring-offset-2";

const primaryBtn = cn(
    "inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-600 px-7 py-3 text-sm font-semibold text-white shadow-sm shadow-cyan-600/25 transition-colors hover:bg-cyan-700",
    focusRing
);

const secondaryBtn = cn(
    "inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-7 py-3 text-sm font-semibold text-foreground transition-colors hover:border-cyan-500/40 hover:bg-secondary/60",
    focusRing
);

function HeroEntrance({ delay = 0, className = "", children }) {
    return (
        <div
            className={cn("animate-fade-up motion-reduce:animate-none", className)}
            style={{ animationDelay: `${delay}ms` }}
        >
            {children}
        </div>
    );
}

function SectionHeading({ eyebrow, title, className = "" }) {
    return (
        <div className={className}>
            <p className="mb-3 text-center text-xs font-semibold uppercase tracking-[0.2em] text-cyan-700 sm:text-sm">
                {eyebrow}
            </p>
            <h2 className="text-center text-2xl font-bold tracking-tight text-foreground sm:text-3xl lg:text-4xl">
                {title}
            </h2>
        </div>
    );
}

function RuleCard({ rule, index }) {
    return (
        <div className="mx-2 flex w-72 shrink-0 flex-col gap-3 rounded-2xl border border-border/60 bg-card/60 p-5 backdrop-blur-sm sm:w-80 sm:p-6">
            <div className="flex items-center justify-between gap-4">
                <span
                    aria-hidden="true"
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cyan-500/10 text-sm font-bold text-cyan-700"
                >
                    {index + 1}
                </span>
                <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                    Community rule
                </span>
            </div>
            <p className="text-sm leading-relaxed text-foreground/80">{rule}</p>
        </div>
    );
}

export default function HomePage() {
    return (
        <>
            <a
                href="#main-content"
                className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-background focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-foreground focus:shadow-lg"
            >
                Skip to content
            </a>

            {/* ─── HEADER ─── */}
            <header className="sticky top-0 z-50 border-b border-border/60 bg-background/85 backdrop-blur-md">
                <div className={cn(container, "flex h-16 items-center justify-between")}>
                    <Link
                        href="/"
                        aria-label="Yoibi home"
                        className={cn("flex items-center gap-2.5 rounded-lg", focusRing)}
                    >
                        <YoibiLogo className="h-8 w-8 text-cyan-500" />
                        <span className="text-lg font-bold tracking-tight text-foreground">Yoibi</span>
                    </Link>
                    <nav aria-label="Primary" className="flex items-center gap-1 sm:gap-2">
                        <Link
                            href="/login"
                            className={cn(
                                "rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
                                focusRing
                            )}
                        >
                            Sign in
                        </Link>
                        <Link
                            href="/signup"
                            className={cn(
                                "inline-flex items-center rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-cyan-700",
                                focusRing
                            )}
                        >
                            Join Yoibi
                        </Link>
                    </nav>
                </div>
            </header>

            <main id="main-content">
                {/* ─── HERO ─── */}
                <div className="relative overflow-x-clip">
                    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
                        <div className="absolute left-1/2 top-[-16rem] h-[30rem] w-[46rem] max-w-none -translate-x-1/2 rounded-full bg-cyan-500/10 blur-3xl" />
                        <div className="absolute -right-32 top-1/2 h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />
                        <div className="absolute -left-32 bottom-0 h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />
                    </div>

                    <section
                        aria-labelledby="hero-title"
                        className="relative z-10 mx-auto flex min-h-[calc(100svh-4rem)] w-full max-w-6xl flex-col items-center justify-center px-4 pb-16 pt-14 text-center sm:px-6 sm:pb-24 sm:pt-20 lg:pt-24"
                    >
                        <HeroEntrance delay={0}>
                            <YoibiLogo className="h-16 w-16 text-cyan-500 sm:h-20 sm:w-20" />
                        </HeroEntrance>

                        <HeroEntrance delay={100} className="mt-8">
                            <span className="inline-flex items-center rounded-full border border-cyan-500/25 bg-cyan-500/10 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-800 sm:text-xs">
                                Freedom is free
                            </span>
                        </HeroEntrance>

                        <HeroEntrance delay={180}>
                            <h1
                                id="hero-title"
                                className="mt-5 text-4xl font-bold leading-[1.05] tracking-tight text-foreground sm:text-6xl lg:text-7xl"
                            >
                                BE YOU, BE{" "}
                                <AuroraText colors={["#06b6d4", "#22d3ee", "#0891b2", "#67e8f9"]} speed={1.5}>
                                    YOIBI
                                </AuroraText>
                            </h1>
                        </HeroEntrance>

                        <HeroEntrance delay={260} className="mt-5">
                            <p className="mx-auto max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg">
                                One platform for everything social — videos, streams, tweets, and video calls.
                                No algorithms, no manipulation, just people being real.
                            </p>
                        </HeroEntrance>

                        <HeroEntrance delay={340} className="mt-8">
                            <div className="flex flex-col items-center gap-3 sm:flex-row sm:gap-4">
                                <Link href="/signup" id="hero-signup-cta" className={primaryBtn}>
                                    Create Free Account <ArrowRight size={16} aria-hidden="true" />
                                </Link>
                                <Link href="/feed" className={secondaryBtn}>
                                    Explore the Feed
                                </Link>
                            </div>
                        </HeroEntrance>

                        <HeroEntrance delay={440} className="mt-14 w-full sm:mt-16">
                            <div className="mx-auto grid w-full max-w-3xl grid-cols-2 gap-x-4 gap-y-6 rounded-2xl border border-border/60 bg-card/60 px-6 py-6 backdrop-blur-sm sm:grid-cols-4 sm:px-8 sm:py-7">
                                {stats.map(({ icon: Icon, label, value }) => (
                                    <div key={label} className="flex flex-col items-center gap-1.5">
                                        <Icon size={18} className="text-cyan-600" aria-hidden="true" />
                                        <span className="text-xl font-bold tabular-nums text-foreground sm:text-2xl">
                                            <NumberTicker value={value} />
                                        </span>
                                        <span className="text-xs text-muted-foreground">{label}</span>
                                    </div>
                                ))}
                            </div>
                        </HeroEntrance>
                    </section>
                </div>

                {/* ─── FEATURES ─── */}
                <section className={cn(container, sectionPad)}>
                    <Reveal>
                        <SectionHeading eyebrow="Everything in one place" title="Four ways to connect" />
                    </Reveal>
                    <div className="mt-10 grid gap-4 sm:mt-12 sm:grid-cols-2 sm:gap-6">
                        {features.map(({ icon: Icon, title, description }, i) => (
                            <Reveal key={title} delay={i * 80}>
                                <div className="h-full rounded-2xl border border-border/60 bg-card/60 p-6 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-cyan-500/40 hover:shadow-lg hover:shadow-cyan-500/5 sm:p-8">
                                    <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-500/10">
                                        <Icon size={20} className="text-cyan-600" aria-hidden="true" />
                                    </div>
                                    <h3 className="mb-2 text-lg font-semibold text-foreground">{title}</h3>
                                    <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
                                </div>
                            </Reveal>
                        ))}
                    </div>
                </section>

                {/* ─── VALUES ─── */}
                <section className={cn(container, sectionPad)}>
                    <Reveal>
                        <SectionHeading eyebrow="Why Yoibi" title="Social media that respects you" />
                    </Reveal>
                    <div className="mt-10 grid gap-10 sm:mt-12 sm:grid-cols-3 sm:gap-8">
                        {values.map(({ icon: Icon, title, description }, i) => (
                            <Reveal key={title} delay={i * 100}>
                                <div className="flex flex-col items-center text-center">
                                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-cyan-500/10">
                                        <Icon size={22} className="text-cyan-600" aria-hidden="true" />
                                    </div>
                                    <h3 className="mb-2 font-semibold text-foreground">{title}</h3>
                                    <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
                                        {description}
                                    </p>
                                </div>
                            </Reveal>
                        ))}
                    </div>
                </section>

                {/* ─── HOW IT WORKS ─── */}
                <section className={cn(container, sectionPad)}>
                    <Reveal>
                        <SectionHeading eyebrow="Get started" title="Three steps, zero friction" />
                    </Reveal>
                    <div className="relative mt-10 sm:mt-12">
                        <div
                            aria-hidden="true"
                            className="absolute left-[16%] right-[16%] top-5 hidden border-t border-dashed border-cyan-500/30 sm:block"
                        />
                        <div className="relative grid gap-10 sm:grid-cols-3 sm:gap-6">
                            {steps.map(({ step, title, description }, i) => (
                                <Reveal key={step} delay={i * 100}>
                                    <div className="flex flex-col items-center text-center">
                                        <div className="relative mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-cyan-600 text-base font-bold text-white">
                                            {step}
                                        </div>
                                        <h3 className="mb-1 font-semibold text-foreground">{title}</h3>
                                        <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
                                            {description}
                                        </p>
                                    </div>
                                </Reveal>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ─── COMMUNITY VALUES (marquee, right → left) ─── */}
                <section aria-label="Community values" className={sectionPad}>
                    <Reveal className={container}>
                        <SectionHeading eyebrow="7 simple rules" title="Community Values" />
                        <p className="mx-auto mt-4 max-w-md text-center text-sm leading-relaxed text-muted-foreground sm:text-base">
                            The principles that keep Yoibi open, honest, and fun — for everyone.
                        </p>
                    </Reveal>

                    <div className="mt-10 sm:mt-12">
                        {/* Static, screen-reader-only copy of the marquee content */}
                        <ul className="sr-only">
                            {communityRules.map((rule, i) => (
                                <li key={i}>{`Rule ${i + 1}: ${rule}`}</li>
                            ))}
                        </ul>
                        {/* Duplicated animated copies are hidden from assistive tech */}
                        <div aria-hidden="true">
                            <Marquee pauseOnHover className="marquee-fade-x [--duration:45s]">
                                {communityRules.map((rule, i) => (
                                    <RuleCard key={i} rule={rule} index={i} />
                                ))}
                            </Marquee>
                        </div>
                    </div>
                </section>

                {/* ─── FINAL CTA ─── */}
                <section className={cn(container, sectionPad)}>
                    <Reveal>
                        <div className="relative overflow-hidden rounded-3xl border border-cyan-500/20 bg-cyan-500/5 px-6 py-12 text-center backdrop-blur-sm sm:px-10 sm:py-16">
                            <div
                                aria-hidden="true"
                                className="pointer-events-none absolute left-1/2 top-[-8rem] h-64 w-[36rem] max-w-none -translate-x-1/2 rounded-full bg-cyan-500/10 blur-3xl"
                            />
                            <YoibiLogo className="relative mx-auto mb-6 h-12 w-12 text-cyan-600" />
                            <h2 className="relative mb-3 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                                Ready to be yourself?
                            </h2>
                            <p className="relative mx-auto mb-8 max-w-md text-muted-foreground">
                                Join thousands who chose a platform that puts people first. Free forever.
                            </p>
                            <Link href="/signup" id="footer-signup-cta" className={cn(primaryBtn, "relative px-10")}>
                                Create Free Account <ArrowRight size={16} aria-hidden="true" />
                            </Link>
                        </div>
                    </Reveal>
                </section>
            </main>

            {/* ─── FOOTER ─── */}
            <footer className="border-t border-border/60 bg-card/40">
                <div className={cn(container, "flex flex-col items-center gap-4 py-10 text-center")}>
                    <div className="flex items-center gap-2">
                        <YoibiLogo className="h-6 w-6 text-cyan-500" />
                        <span className="text-base font-bold tracking-tight text-foreground">Yoibi</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Be you, be Yoibi. No algorithms. No manipulation. Just people.
                    </p>
                    <p className="text-xs text-muted-foreground/80">
                        Must be at least 16 years old to sign up for free
                    </p>
                </div>
            </footer>
        </>
    );
}
