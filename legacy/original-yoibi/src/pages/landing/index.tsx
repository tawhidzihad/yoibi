import { useNavigate } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import { AuroraText } from "@/shared/ui";
import { BlurFade } from "@/shared/ui";
import { ShimmerButton } from "@/shared/ui";
import { Particles } from "@/shared/ui";
import { NumberTicker } from "@/shared/ui";
import { Marquee } from "@/shared/ui";
import { MagicCard } from "@/shared/ui";
import { communityRules } from "@/shared/api";
import { YoibiLogo } from "@/shared/ui";
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

interface RuleCardProps {
  rule: string;
  index: number;
}

interface Stat {
  icon: LucideIcon;
  label: string;
  value: number;
}

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
}

interface Value {
  icon: LucideIcon;
  title: string;
  description: string;
}

interface Step {
  step: string;
  title: string;
  description: string;
}

function RuleCard({ rule, index }: RuleCardProps) {
  return (
    <div className="mx-3 flex w-72 flex-col gap-2 rounded-xl border border-border/50 bg-card/50 p-4 backdrop-blur-sm">
      <div className="flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-cyan-500/20 text-xs font-bold text-cyan-400">
          {index + 1}
        </span>
        <span className="text-xs font-medium text-muted-foreground">
          Community Rule
        </span>
      </div>
      <p className="text-sm leading-relaxed text-foreground/80">{rule}</p>
    </div>
  );
}

const stats: Stat[] = [
  { icon: Users, label: "Active Users", value: 24853 },
  { icon: Video, label: "Videos Shared", value: 182400 },
  { icon: Radio, label: "Live Streams", value: 847 },
  { icon: MessageCircle, label: "Daily Tweets", value: 56290 },
];

const features: Feature[] = [
  {
    icon: Hash,
    title: "Feed & Tweets",
    description: "Share your thoughts, start threads, and engage with a community that actually listens.",
  },
  {
    icon: Play,
    title: "Videos",
    description: "Upload, discover, and binge content across 8 categories — from politics to pure fun.",
  },
  {
    icon: Mic,
    title: "Live Streams",
    description: "Go live in seconds. Build your audience in real-time with zero barriers to entry.",
  },
  {
    icon: Users2,
    title: "Meet Up",
    description: "Video rooms for real conversations. Join a room or create your own — no downloads needed.",
  },
];

const values: Value[] = [
  {
    icon: Shield,
    title: "Free Speech, Real Rules",
    description: "Say what you think. No censorship — but no death threats, deepfakes, or bullying victims either.",
  },
  {
    icon: Zap,
    title: "Built for Speed",
    description: "No algorithmic feed manipulation. Your content reaches people because it's good, not because you paid.",
  },
  {
    icon: Globe,
    title: "For Everyone, Everywhere",
    description: "One platform for all your social needs. No switching between 5 apps to stay connected.",
  },
];

const steps: Step[] = [
  { step: "1", title: "Sign up free", description: "Create your profile in 30 seconds. No credit card, no catch." },
  { step: "2", title: "Find your people", description: "Follow topics and creators you care about. Your feed, your rules." },
  { step: "3", title: "Be you", description: "Post, stream, tweet, or just vibe. There's no wrong way to use Yoibi." },
];

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <Particles
        className="absolute inset-0"
        quantity={150}
        color="#06b6d4"
        ease={80}
        refresh
      />

      {/* ─── HERO ─── */}
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4">
        <BlurFade delay={0.1}>
          <YoibiLogo className="mx-auto mb-6 h-20 w-20 text-cyan-500 sm:h-24 sm:w-24" />
        </BlurFade>

        <BlurFade delay={0.2}>
          <h1 className="mb-2 text-center text-5xl font-bold tracking-tight sm:text-7xl">
            BE YOU, BE{" "}
            <AuroraText
              colors={["#06b6d4", "#22d3ee", "#0891b2", "#67e8f9"]}
              speed={1.5}
            >
              YOIBI
            </AuroraText>
          </h1>
        </BlurFade>

        <BlurFade delay={0.5}>
          <p className="mx-auto mb-3 max-w-md text-center text-xl font-medium text-muted-foreground sm:text-2xl">
            FREEDOM IS FREE
          </p>
        </BlurFade>

        <BlurFade delay={0.6}>
          <p className="mx-auto mb-10 max-w-lg text-center text-base leading-relaxed text-muted-foreground/80">
            One platform for everything social — videos, streams, tweets, and
            video calls. No algorithms, no manipulation, just people being real.
          </p>
        </BlurFade>

        <BlurFade delay={0.7}>
          <div className="flex flex-col items-center gap-4 sm:flex-row">
            <ShimmerButton
              onClick={() => navigate("/signup")}
              className="px-8 py-3"
              shimmerColor="#06b6d4"
            >
              <span className="flex items-center gap-2 text-sm font-medium text-white">
                Create Free Account <ArrowRight size={16} />
              </span>
            </ShimmerButton>
            <button
              onClick={() => navigate("/feed")}
              className="cursor-pointer rounded-xl border border-border/50 bg-secondary/50 px-8 py-3 text-sm font-medium text-foreground backdrop-blur-sm transition-colors hover:bg-secondary"
            >
              Explore the Feed
            </button>
          </div>
        </BlurFade>

        {/* Social proof */}
        <BlurFade delay={0.9}>
          <div className="mt-16 grid grid-cols-2 gap-8 sm:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="flex flex-col items-center gap-1">
                <stat.icon size={20} className="text-cyan-400" />
                <span className="text-2xl font-bold text-foreground">
                  <NumberTicker value={stat.value} />
                </span>
                <span className="text-xs text-muted-foreground">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </BlurFade>
      </div>

      {/* ─── FEATURES ─── */}
      <section className="relative z-10 mx-auto max-w-5xl px-4 py-20">
        <BlurFade delay={0.1}>
          <p className="mb-2 text-center text-sm font-medium tracking-wider text-cyan-400 uppercase">
            Everything in one place
          </p>
          <h2 className="mb-12 text-center text-3xl font-bold text-foreground sm:text-4xl">
            Four ways to connect
          </h2>
        </BlurFade>

        <div className="grid gap-6 sm:grid-cols-2">
          {features.map((f, i) => (
            <BlurFade key={f.title} delay={0.15 + i * 0.1}>
              <MagicCard className="p-6" gradientColor="#06b6d410">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/10">
                  <f.icon size={20} className="text-cyan-400" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-foreground">{f.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{f.description}</p>
              </MagicCard>
            </BlurFade>
          ))}
        </div>
      </section>

      {/* ─── VALUES ─── */}
      <section className="relative z-10 mx-auto max-w-5xl px-4 py-20">
        <BlurFade delay={0.1}>
          <p className="mb-2 text-center text-sm font-medium tracking-wider text-cyan-400 uppercase">
            Why Yoibi
          </p>
          <h2 className="mb-12 text-center text-3xl font-bold text-foreground sm:text-4xl">
            Social media that respects you
          </h2>
        </BlurFade>

        <div className="grid gap-8 sm:grid-cols-3">
          {values.map((v, i) => (
            <BlurFade key={v.title} delay={0.15 + i * 0.1}>
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-cyan-500/10">
                  <v.icon size={22} className="text-cyan-400" />
                </div>
                <h3 className="mb-2 font-semibold text-foreground">{v.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{v.description}</p>
              </div>
            </BlurFade>
          ))}
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section className="relative z-10 mx-auto max-w-3xl px-4 py-20">
        <BlurFade delay={0.1}>
          <p className="mb-2 text-center text-sm font-medium tracking-wider text-cyan-400 uppercase">
            Get started
          </p>
          <h2 className="mb-12 text-center text-3xl font-bold text-foreground sm:text-4xl">
            Three steps, zero friction
          </h2>
        </BlurFade>

        <div className="flex flex-col gap-8 sm:flex-row sm:gap-6">
          {steps.map((s, i) => (
            <BlurFade key={s.step} delay={0.15 + i * 0.1} className="flex-1">
              <div className="text-center">
                <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500 text-lg font-bold text-white">
                  {s.step}
                </div>
                <h3 className="mb-1 font-semibold text-foreground">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.description}</p>
              </div>
            </BlurFade>
          ))}
        </div>
      </section>

      {/* ─── COMMUNITY RULES (marquee) ─── */}
      <section className="relative z-10 py-20">
        <BlurFade delay={0.1}>
          <p className="mb-2 text-center text-sm font-medium tracking-wider text-cyan-400 uppercase">
            7 simple rules
          </p>
          <h2 className="mb-8 text-center text-3xl font-bold text-foreground sm:text-4xl">
            Community Values
          </h2>
        </BlurFade>
        <Marquee pauseOnHover className="[--duration:40s]">
          {communityRules.map((rule, i) => (
            <RuleCard key={i} rule={rule} index={i} />
          ))}
        </Marquee>
      </section>

      {/* ─── FINAL CTA ─── */}
      <section className="relative z-10 mx-auto max-w-2xl px-4 py-20">
        <BlurFade delay={0.1}>
          <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-10 text-center backdrop-blur-sm">
            <YoibiLogo className="mx-auto mb-4 h-12 w-12 text-cyan-500" />
            <h2 className="mb-3 text-2xl font-bold text-foreground sm:text-3xl">
              Ready to be yourself?
            </h2>
            <p className="mb-8 text-muted-foreground">
              Join thousands who chose a platform that puts people first. Free forever.
            </p>
            <ShimmerButton
              onClick={() => navigate("/signup")}
              className="mx-auto px-10 py-3"
              shimmerColor="#06b6d4"
            >
              <span className="flex items-center gap-2 text-sm font-medium text-white">
                Create Free Account <ArrowRight size={16} />
              </span>
            </ShimmerButton>
          </div>
        </BlurFade>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="relative z-10 border-t border-border/30 py-8 text-center text-sm text-muted-foreground">
        Must be at least 16 years old to sign up for free
      </footer>
    </div>
  );
}
