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
      <nav className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-2">
          <span className="gradient-text" style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '-0.02em' }}>ReFind</span>
        </div>
        <div className="flex items-center gap-3">
          <a href={signInUrl} className="interactive" style={{ fontSize: '14px', color: '#7878a0' }}>
            Sign In
          </a>
          <a
            href={signUpUrl}
            className="interactive focus-ring"
            style={{ borderRadius: '999px', background: '#6366f1', padding: '8px 20px', fontSize: '14px', fontWeight: 500, color: '#fff', boxShadow: '0 4px 16px rgba(99,102,241,0.4)' }}
          >
            Get Started
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex flex-col items-center gap-6 px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2" style={{ borderRadius: '999px', border: '1px solid rgba(99,102,241,0.25)', background: 'rgba(99,102,241,0.08)', padding: '6px 16px', fontSize: '12px', fontWeight: 500, color: '#6366f1' }}>
          <Zap className="h-3 w-3" /> AI-Powered Secondhand Shopping
        </div>
        <h1 style={{ maxWidth: '700px', fontSize: '52px', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: '1.1', color: '#e2e2f0' }}>
          Stop scrolling.
          <br />
          <span className="gradient-text">Let AI find the deal.</span>
        </h1>
        <p style={{ maxWidth: '520px', fontSize: '16px', color: '#7878a0', lineHeight: '1.6' }}>
          ReFind is an AI shopping agent that searches Craigslist, Facebook Marketplace,
          and OfferUp in parallel — comparing prices, scoring deals, and drafting seller
          messages — all from a single chat.
        </p>
        <div className="flex gap-4 pt-2">
          <a href={signUpUrl} className="interactive focus-ring flex items-center gap-2" style={{ borderRadius: '999px', background: '#6366f1', padding: '12px 28px', fontSize: '14px', fontWeight: 600, color: '#fff', boxShadow: '0 4px 20px rgba(99,102,241,0.5)' }}>
            Start Shopping <ArrowRight className="h-4 w-4" />
          </a>
          <a href="#how-it-works" className="interactive focus-ring" style={{ borderRadius: '999px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', padding: '12px 28px', fontSize: '14px', fontWeight: 500, color: '#e2e2f0' }}>
            See How It Works
          </a>
        </div>
      </section>

      {/* Demo preview */}
      <section className="flex justify-center px-6 pb-16">
        <div className="glass w-full overflow-hidden" style={{ maxWidth: '700px', borderRadius: '18px' }}>
          <div className="flex items-center gap-2 px-4 py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444', opacity: 0.6 }} />
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b', opacity: 0.6 }} />
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981', opacity: 0.6 }} />
            <span style={{ marginLeft: '8px', fontSize: '12px', color: '#3a3a55' }}>ReFind Chat</span>
          </div>
          <div className="space-y-3 p-6" style={{ fontSize: '14px' }}>
            <div className="flex justify-end">
              <div style={{ borderRadius: '18px 18px 4px 18px', background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.2)', padding: '10px 16px', color: '#e2e2f0' }}>
                Find me a used couch under $200
              </div>
            </div>
            <div className="flex gap-2">
              {[{name:'Craigslist',dot:'#f97316'},{name:'Facebook',dot:'#8b5cf6'},{name:'OfferUp',dot:'#38bdf8'}].map(s => (
                <span key={s.name} className="inline-flex items-center gap-1.5" style={{ borderRadius: '999px', padding: '5px 11px', fontSize: '12px', fontWeight: 500, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', color: '#10b981' }}>
                  <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: s.dot, display: 'inline-block' }} />
                  <CheckCircle2 className="h-3 w-3" /> {s.name} ✓
                </span>
              ))}
            </div>
            <div style={{ borderLeft: '2px solid rgba(99,102,241,0.25)', paddingLeft: '14px', color: '#e2e2f0', lineHeight: '1.7' }}>
              <p style={{ fontWeight: 600 }}>🏆 Top Deal: IKEA Sectional — <span style={{ color: '#f59e0b' }}>$120</span> (Fair)</p>
              <p style={{ color: '#7878a0' }}>📍 Hoboken, NJ | ⭐ 3.8 | Deal Score: <strong style={{ color: '#10b981' }}>78/100</strong></p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="px-6 py-16" style={{ background: 'rgba(255,255,255,0.02)' }}>
        <h2 className="mb-12 text-center" style={{ fontSize: '30px', fontWeight: 700, color: '#e2e2f0' }}>How It Works</h2>
        <div className="mx-auto grid max-w-4xl grid-cols-1 gap-8 sm:grid-cols-3">
          <Step number={1} icon={<MessageSquare />} title="Describe It" desc="Type or speak what you're looking for — item, budget, location, condition." />
          <Step number={2} icon={<Globe />} title="Agents Search" desc="Multiple AI agents search Craigslist, Facebook Marketplace, and OfferUp in parallel." />
          <Step number={3} icon={<TrendingUp />} title="Ranked Results" desc="Deals are scored on price, condition, seller rating, and proximity. You pick the best." />
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-16">
        <h2 className="mb-12 text-center" style={{ fontSize: '30px', fontWeight: 700, color: '#e2e2f0' }}>Built Different</h2>
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
      <section className="px-6 py-10" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
        <p className="mb-6 text-center" style={{ fontSize: '11px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#3a3a55' }}>
          Powered By
        </p>
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-center gap-x-10 gap-y-4" style={{ fontSize: '14px', fontWeight: 500, color: '#7878a0' }}>
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
        <h2 style={{ fontSize: '30px', fontWeight: 700, color: '#e2e2f0' }}>Ready to find your next deal?</h2>
        <p style={{ color: '#7878a0' }}>No credit card. No sign-up required in demo mode.</p>
        <a href={signUpUrl} className="interactive focus-ring flex items-center gap-2" style={{ borderRadius: '999px', background: '#6366f1', padding: '12px 32px', fontSize: '14px', fontWeight: 600, color: '#fff', boxShadow: '0 4px 20px rgba(99,102,241,0.5)' }}>
          Launch ReFind <ArrowRight className="h-4 w-4" />
        </a>
      </section>
    </div>
  );
}

function Step({ number, icon, title, desc }: { number: number; icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full" style={{ background: 'rgba(99,102,241,0.1)', color: '#6366f1' }}>
        {icon}
      </div>
      <div className="flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-full" style={{ background: '#6366f1', fontSize: '11px', fontWeight: 700, color: '#fff' }}>
          {number}
        </span>
        <h3 style={{ fontWeight: 600, color: '#e2e2f0' }}>{title}</h3>
      </div>
      <p style={{ fontSize: '14px', color: '#7878a0' }}>{desc}</p>
    </div>
  );
}

function Feature({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="glass interactive" style={{ borderRadius: '14px', padding: '20px' }}>
      <div className="mb-2" style={{ color: '#6366f1' }}>{icon}</div>
      <h3 className="mb-1" style={{ fontSize: '14px', fontWeight: 600, color: '#e2e2f0' }}>{title}</h3>
      <p style={{ fontSize: '12px', color: '#7878a0' }}>{desc}</p>
    </div>
  );
}
