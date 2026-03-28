"use client";

import {
  Search,
  MessageSquare,
  Zap,
  Shield,
  Mic,
  Globe,
  TrendingUp,
  Users,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

interface LandingPageProps {
  signInUrl: string;
  signUpUrl: string;
}

export function LandingPage({ signInUrl, signUpUrl }: LandingPageProps) {
  return (
    <div className="flex min-h-full flex-col overflow-y-auto">
      {/* Nav */}
      <nav className="flex items-center justify-between border-b border-border px-6 py-4">
        <div className="flex items-center gap-2">
          <Search className="h-6 w-6 text-accent" />
          <span className="text-xl font-bold tracking-tight">ReFind</span>
        </div>
        <div className="flex items-center gap-3">
          <a href={signInUrl} className="text-sm text-muted-foreground hover:text-foreground">
            Sign In
          </a>
          <a
            href={signUpUrl}
            className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:opacity-90"
          >
            Get Started
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex flex-col items-center gap-6 px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-1.5 text-xs font-medium text-accent">
          <Zap className="h-3 w-3" /> AI-Powered Secondhand Shopping
        </div>
        <h1 className="max-w-3xl text-5xl font-extrabold leading-tight tracking-tight sm:text-6xl">
          Stop scrolling.
          <br />
          <span className="text-accent">Let AI find the deal.</span>
        </h1>
        <p className="max-w-xl text-lg text-muted-foreground">
          ReFind is an AI shopping agent that searches Craigslist, Facebook Marketplace,
          and OfferUp in parallel — comparing prices, scoring deals, and drafting seller
          messages — all from a single chat.
        </p>
        <div className="flex gap-4 pt-2">
          <a
            href={signUpUrl}
            className="flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground hover:opacity-90"
          >
            Start Shopping <ArrowRight className="h-4 w-4" />
          </a>
          <a
            href="#how-it-works"
            className="rounded-full border border-border px-6 py-3 text-sm font-medium hover:bg-muted"
          >
            See How It Works
          </a>
        </div>
      </section>

      {/* Demo preview */}
      <section className="flex justify-center px-6 pb-16">
        <div className="w-full max-w-3xl overflow-hidden rounded-2xl border border-border bg-card shadow-lg">
          <div className="flex items-center gap-2 border-b border-border bg-muted/50 px-4 py-2">
            <div className="h-3 w-3 rounded-full bg-red-400" />
            <div className="h-3 w-3 rounded-full bg-yellow-400" />
            <div className="h-3 w-3 rounded-full bg-green-400" />
            <span className="ml-2 text-xs text-muted-foreground">ReFind Chat</span>
          </div>
          <div className="space-y-3 p-6 text-sm">
            <div className="flex justify-end">
              <div className="rounded-2xl rounded-br-md bg-accent px-4 py-2 text-accent-foreground">
                Find me a used couch under $200
              </div>
            </div>
            <div className="flex gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2.5 py-1 text-xs text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                <CheckCircle2 className="h-3 w-3" /> Craigslist ✓
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-1 text-xs text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                <CheckCircle2 className="h-3 w-3" /> Facebook ✓
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-xs text-green-700 dark:bg-green-900/30 dark:text-green-300">
                <CheckCircle2 className="h-3 w-3" /> OfferUp ✓
              </span>
            </div>
            <div className="rounded-2xl rounded-bl-md bg-muted px-4 py-3">
              <p className="font-semibold">🏆 Top Deal: IKEA Sectional — $120 (Fair)</p>
              <p className="text-muted-foreground">📍 Hoboken, NJ | ⭐ 3.8 | Deal Score: <strong>78/100</strong></p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="bg-muted/30 px-6 py-16">
        <h2 className="mb-12 text-center text-3xl font-bold">How It Works</h2>
        <div className="mx-auto grid max-w-4xl grid-cols-1 gap-8 sm:grid-cols-3">
          <Step number={1} icon={<MessageSquare />} title="Describe It" desc="Type or speak what you're looking for — item, budget, location, condition." />
          <Step number={2} icon={<Globe />} title="Agents Search" desc="Multiple AI agents search Craigslist, Facebook Marketplace, and OfferUp in parallel." />
          <Step number={3} icon={<TrendingUp />} title="Ranked Results" desc="Deals are scored on price, condition, seller rating, and proximity. You pick the best." />
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-16">
        <h2 className="mb-12 text-center text-3xl font-bold">Built Different</h2>
        <div className="mx-auto grid max-w-4xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Feature icon={<Mic />} title="Voice & Text" desc="Speak or type — switch anytime with a single tap." />
          <Feature icon={<Zap />} title="Parallel Search" desc="Agents hit 3+ marketplaces simultaneously." />
          <Feature icon={<Shield />} title="You Approve" desc="No messages sent to sellers without your explicit OK." />
          <Feature icon={<TrendingUp />} title="Deal Scoring" desc="Objective 0-100 scores based on price, condition, seller, proximity." />
          <Feature icon={<Users />} title="Contact Agent" desc="Auto-drafts polite seller messages with your offer." />
          <Feature icon={<Search />} title="Smart Filtering" desc="Budget, condition, location — the agent understands natural language." />
        </div>
      </section>

      {/* Sponsor strip */}
      <section className="border-t border-border bg-muted/20 px-6 py-10">
        <p className="mb-6 text-center text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Powered By
        </p>
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-center gap-x-10 gap-y-4 text-sm font-medium text-muted-foreground">
          <span>Assistant UI</span>
          <span>DigitalOcean</span>
          <span>Railtracks</span>
          <span>WorkOS</span>
          <span>Unkey</span>
          <span>Augment Code</span>
        </div>
      </section>

      {/* CTA */}
      <section className="flex flex-col items-center gap-4 px-6 py-16 text-center">
        <h2 className="text-3xl font-bold">Ready to find your next deal?</h2>
        <p className="text-muted-foreground">No credit card. No sign-up required in demo mode.</p>
        <a
          href={signUpUrl}
          className="flex items-center gap-2 rounded-full bg-accent px-8 py-3 text-sm font-semibold text-accent-foreground hover:opacity-90"
        >
          Launch ReFind <ArrowRight className="h-4 w-4" />
        </a>
      </section>
    </div>
  );
}

function Step({ number, icon, title, desc }: { number: number; icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-accent">
        {icon}
      </div>
      <div className="flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-foreground">
          {number}
        </span>
        <h3 className="font-semibold">{title}</h3>
      </div>
      <p className="text-sm text-muted-foreground">{desc}</p>
    </div>
  );
}

function Feature({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-2 text-accent">{icon}</div>
      <h3 className="mb-1 text-sm font-semibold">{title}</h3>
      <p className="text-xs text-muted-foreground">{desc}</p>
    </div>
  );
}
