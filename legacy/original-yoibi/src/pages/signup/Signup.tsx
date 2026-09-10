import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { BlurFade, MagicCard, ShimmerButton, Confetti } from "@/shared/ui";
import type { ConfettiRef } from "@/shared/ui";
import { communityRules, countries, languages } from "@/shared/api";
import { ArrowLeft, Upload, Check, PartyPopper } from "lucide-react";

interface SignupForm {
  name: string;
  email: string;
  phone: string;
  positiveMessage: string;
  favoriteColor: string;
  country: string;
  age: string;
  language: string;
  theme: string;
}

export default function Signup() {
  const navigate = useNavigate();
  const confettiRef = useRef<ConfettiRef>(null);
  const [submitted, setSubmitted] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [form, setForm] = useState<SignupForm>({
    name: "",
    email: "",
    phone: "",
    positiveMessage: "",
    favoriteColor: "#06b6d4",
    country: "",
    age: "",
    language: "en",
    theme: "light",
  });

  const update = (field: keyof SignupForm, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPhotoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (parseInt(form.age) < 16) {
      alert("You must be at least 16 years old to sign up.");
      return;
    }
    if (!agreed) {
      alert("Please agree to the community rules.");
      return;
    }
    localStorage.setItem("yoibi_user", JSON.stringify({ ...form, photoPreview }));
    setSubmitted(true);
    confettiRef.current?.fire();
    setTimeout(() => navigate("/feed"), 2500);
  };

  const inputClass =
    "w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-colors";

  if (submitted) {
    return (
      <div className="relative flex min-h-screen items-center justify-center bg-background">
        <Confetti
          ref={confettiRef}
          className="absolute left-0 top-0 z-0 h-full w-full"
        />
        <BlurFade delay={0.1}>
          <div className="relative z-10 text-center">
            <PartyPopper size={64} className="mx-auto mb-4 text-cyan-400" />
            <h1 className="mb-2 text-4xl font-bold text-foreground">
              Welcome to Yoibi!
            </h1>
            <p className="text-muted-foreground">
              Redirecting you to the feed...
            </p>
          </div>
        </BlurFade>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto max-w-2xl">
        <BlurFade delay={0.1}>
          <button
            onClick={() => navigate("/")}
            className="mb-6 flex cursor-pointer items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft size={16} /> Back to home
          </button>
        </BlurFade>

        <BlurFade delay={0.2}>
          <h1 className="mb-2 bg-gradient-to-r from-cyan-400 to-pink-400 bg-clip-text text-3xl font-bold text-transparent">
            Join Yoibi
          </h1>
          <p className="mb-8 text-muted-foreground">
            BE YOU, BE YOIBI — Create your free account
          </p>
        </BlurFade>

        <form onSubmit={handleSubmit} className="space-y-6">
          <BlurFade delay={0.3}>
            <MagicCard className="p-6" gradientColor="#06b6d420">
              <h2 className="mb-4 text-lg font-semibold text-foreground">
                Profile Photo
              </h2>
              <div className="flex items-center gap-4">
                <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-border bg-secondary">
                  {photoPreview ? (
                    <img
                      src={photoPreview}
                      alt="Preview"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Upload size={24} className="text-muted-foreground" />
                  )}
                </div>
                <label className="cursor-pointer rounded-lg border border-border bg-secondary px-4 py-2 text-sm text-foreground transition-colors hover:bg-accent">
                  Choose Photo
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhoto}
                    className="hidden"
                  />
                </label>
              </div>
            </MagicCard>
          </BlurFade>

          <BlurFade delay={0.4}>
            <MagicCard className="p-6" gradientColor="#06b6d420">
              <h2 className="mb-4 text-lg font-semibold text-foreground">
                Personal Info
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm text-muted-foreground">
                    Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Your full name"
                    value={form.name}
                    onChange={(e) => update("name", e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-muted-foreground">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={(e) => update("email", e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-muted-foreground">
                    Telephone Number
                  </label>
                  <input
                    type="tel"
                    placeholder="+1 234 567 890"
                    value={form.phone}
                    onChange={(e) => update("phone", e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-muted-foreground">
                    Age *
                  </label>
                  <input
                    type="number"
                    required
                    min="16"
                    placeholder="Must be 16 or older"
                    value={form.age}
                    onChange={(e) => update("age", e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
            </MagicCard>
          </BlurFade>

          <BlurFade delay={0.5}>
            <MagicCard className="p-6" gradientColor="#06b6d420">
              <h2 className="mb-4 text-lg font-semibold text-foreground">
                About You
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm text-muted-foreground">
                    Say something positive ✨
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Share something that makes you smile..."
                    value={form.positiveMessage}
                    onChange={(e) => update("positiveMessage", e.target.value)}
                    className={inputClass + " resize-none"}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-muted-foreground">
                    Favorite Color
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={form.favoriteColor}
                      onChange={(e) => update("favoriteColor", e.target.value)}
                      className="h-10 w-10 cursor-pointer rounded-lg border border-border"
                    />
                    <span className="text-sm text-muted-foreground">
                      {form.favoriteColor}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-sm text-muted-foreground">
                    Nation you represent or country of birth
                  </label>
                  <select
                    value={form.country}
                    onChange={(e) => update("country", e.target.value)}
                    className={inputClass}
                  >
                    <option value="">Select a country</option>
                    {countries.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </MagicCard>
          </BlurFade>

          <BlurFade delay={0.6}>
            <MagicCard className="p-6" gradientColor="#06b6d420">
              <h2 className="mb-4 text-lg font-semibold text-foreground">
                Preferences
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm text-muted-foreground">
                    Language
                  </label>
                  <select
                    value={form.language}
                    onChange={(e) => update("language", e.target.value)}
                    className={inputClass}
                  >
                    {languages.map((l) => (
                      <option key={l.code} value={l.code}>
                        {l.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm text-muted-foreground">
                    Color Scheme
                  </label>
                  <div className="flex gap-3">
                    {["dark", "light", "system"].map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => update("theme", t)}
                        className={`cursor-pointer rounded-lg border px-4 py-2 text-sm capitalize transition-colors ${
                          form.theme === t
                            ? "border-cyan-500 bg-cyan-500/10 text-cyan-400"
                            : "border-border bg-secondary text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </MagicCard>
          </BlurFade>

          <BlurFade delay={0.7}>
            <MagicCard className="p-6" gradientColor="#06b6d420">
              <h2 className="mb-4 text-lg font-semibold text-foreground">
                Shared Values
              </h2>
              <ol className="mb-4 space-y-3">
                {communityRules.map((rule, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-3 text-sm text-foreground/80"
                  >
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cyan-500/20 text-xs font-bold text-cyan-400">
                      {i + 1}
                    </span>
                    {rule}
                  </li>
                ))}
              </ol>
              <label className="flex cursor-pointer items-center gap-3">
                <div
                  className={`flex h-5 w-5 items-center justify-center rounded border transition-colors ${
                    agreed
                      ? "border-cyan-500 bg-cyan-500"
                      : "border-border bg-secondary"
                  }`}
                  onClick={() => setAgreed(!agreed)}
                >
                  {agreed && <Check size={14} className="text-white" />}
                </div>
                <span className="text-sm text-foreground">
                  I agree to the community values
                </span>
              </label>
            </MagicCard>
          </BlurFade>

          <BlurFade delay={0.8}>
            <ShimmerButton
              type="submit"
              className="w-full py-3"
              shimmerColor="#06b6d4"
            >
              <span className="text-sm font-medium text-white">
                Create My Account
              </span>
            </ShimmerButton>
          </BlurFade>
        </form>
      </div>
    </div>
  );
}
