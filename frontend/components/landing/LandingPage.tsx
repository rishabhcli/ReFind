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
import { ScrollingImages } from "./ScrollingImages";

interface LandingPageProps {
  signInUrl: string;
  signUpUrl: string;
}

export function LandingPage({ signInUrl, signUpUrl }: LandingPageProps) {
  return (
    <div className="flex min-h-full flex-col overflow-y-auto bg-background text-foreground">
      <nav className="flex items-center justify-between border-b border-border px-6 py-4">
        <div className="flex items-center gap-3">
          <span className="brand-mark flex h-9 w-9 items-center justify-center rounded-[14px]">
            <Search className="h-4 w-4" />
          </span>
          <span className="text-xl font-extrabold tracking-tight">ReFind</span>
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

      <section className="relative overflow-hidden border-b border-border">
        <ScrollingImages />
        <div className="absolute inset-0 z-[1] bg-background/76" />

        <div className="relative z-10 flex flex-col items-center gap-6 px-6 pt-20 pb-16 text-center">
          <div className="rounded-full border border-[var(--border-strong)] bg-[var(--card)] px-4 py-1.5 text-xs font-medium text-accent shadow-sm">
            <span className="inline-flex items-center gap-2">
              <Zap className="h-3 w-3" /> AI-Powered Secondhand Shopping
            </span>
          </div>
          <h1 className="max-w-3xl text-5xl font-extrabold leading-tight tracking-tight sm:text-6xl">
            Stop scrolling.
            <br />
            <span className="text-accent">Let AI find the deal.</span>
          </h1>
          <p className="max-w-xl text-lg text-muted-foreground">
            ReFind searches Craigslist, Facebook Marketplace, and OfferUp in parallel,
            compares price and condition, and drafts seller messages from one chat interface.
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
              className="rounded-full border border-[var(--border-strong)] bg-card px-6 py-3 text-sm font-medium text-foreground hover:bg-[var(--card-strong)]"
            >
              See How It Works
            </a>
          </div>
        </div>
      </section>

      <section className="flex justify-center px-6 py-16">
        <div className="w-full max-w-3xl overflow-hidden rounded-2xl border border-border bg-card shadow-lg">
          <div className="flex items-center gap-2 border-b border-border bg-[var(--background-elevated)] px-4 py-2">
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
              {[
                { name: "Craigslist", dot: "#f97316" },
                { name: "Facebook", dot: "#8b5cf6" },
                { name: "OfferUp", dot: "#38bdf8" },
              ].map((source) => (
                <span
                  key={source.name}
                  className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/8 px-2.5 py-1 text-xs text-emerald-500"
                >
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ background: source.dot }}
                  />
                  <CheckCircle2 className="h-3 w-3" />
                  {source.name}
                </span>
              ))}
            </div>
            <div className="rounded-2xl rounded-bl-md bg-[var(--background-elevated)] px-4 py-3">
              <p className="font-semibold">
                Top Deal: IKEA Sectional — <span className="text-amber-500">$120</span> (Fair)
              </p>
              <p className="text-muted-foreground">
                Hoboken, NJ | 3.8 seller rating | Deal Score: <strong>78/100</strong>
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="bg-[var(--background-elevated)] px-6 py-16">
        <h2 className="mb-12 text-center text-3xl font-bold">How It Works</h2>
        <div className="mx-auto grid max-w-4xl grid-cols-1 gap-8 sm:grid-cols-3">
          <Step
            number={1}
            icon={<MessageSquare />}
            title="Describe It"
            desc="Type or speak what you want, including price, condition, and location."
          />
          <Step
            number={2}
            icon={<Globe />}
            title="Agents Search"
            desc="Marketplace searches run in parallel so you get a broad secondhand snapshot fast."
          />
          <Step
            number={3}
            icon={<TrendingUp />}
            title="Ranked Results"
            desc="Deals are scored on value, condition, seller quality, and proximity before you decide."
          />
        </div>
      </section>

      <section className="px-6 py-16">
        <h2 className="mb-12 text-center text-3xl font-bold">Built Different</h2>
        <div className="mx-auto grid max-w-4xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Feature icon={<Mic />} title="Voice & Text" desc="Switch between speaking and typing without changing the workflow." />
          <Feature icon={<Zap />} title="Parallel Search" desc="Multiple agents search multiple marketplaces at the same time." />
          <Feature icon={<Shield />} title="You Approve" desc="Nothing gets sent to sellers unless you explicitly approve it." />
          <Feature icon={<TrendingUp />} title="Deal Scoring" desc="0-100 scoring combines pricing, condition, seller, and distance." />
          <Feature icon={<Users />} title="Contact Agent" desc="Draft negotiation messages and outreach without starting from scratch." />
          <Feature icon={<Search />} title="Smart Filtering" desc="Use natural language instead of filling out rigid marketplace forms." />
        </div>
      </section>

      <section className="border-t border-border bg-[var(--background-elevated)] px-6 py-10">
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

function Step({
  number,
  icon,
  title,
  desc,
}: {
  number: number;
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
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

function Feature({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-2 text-accent">{icon}</div>
      <h3 className="mb-1 text-sm font-semibold">{title}</h3>
      <p className="text-xs text-muted-foreground">{desc}</p>
    </div>
  );
}
