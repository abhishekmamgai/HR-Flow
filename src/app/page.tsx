"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { motion, useScroll, useSpring } from "framer-motion";
import Link from "next/link";

export default function LandingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState<{
    ok?: boolean;
    error?: string;
    login?: { admin?: { email: string; password: string }; employee?: { email: string; password: string; code?: string } };
  } | null>(null);

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  useEffect(() => {
    // Only set loading to false to show the landing page
    setLoading(false);
  }, []);

  async function runSeed() {
    setSeeding(true);
    setSeedResult(null);
    try {
      const res = await fetch("/api/seed", { method: "POST" });
      const data = await res.json();
      if (res.ok) setSeedResult(data);
      else setSeedResult({ error: data.error ?? "Seed failed" });
    } catch (err) {
      setSeedResult({ error: err instanceof Error ? err.message : "Seed failed" });
    } finally {
      setSeeding(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F6F3]">
        <div className="w-8 h-8 border-4 border-[#2558D9] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F6F3] text-[#1A1A1A] font-body selection:bg-[#2558D9] selection:text-white overflow-x-hidden">
      {/* Progress Bar */}
      <motion.div className="fixed top-0 left-0 right-0 h-1 bg-[#2558D9] origin-left z-50" style={{ scaleX }} />

      {/* SECTION 1 — NAVBAR */}
      <nav className="fixed top-0 w-full bg-[#F7F6F3]/80 backdrop-blur-md z-40 border-b border-[#E2DED6]">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="font-display text-2xl font-black text-[#2558D9] leading-none">HRFlow</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#8C8881] mt-1">by ASK Tech</span>
          </div>
          <Link 
            href="/login" 
            className="px-6 py-2.5 bg-[#2558D9] text-white rounded-full font-bold text-sm transition-all hover:bg-[#1E46B3] hover:shadow-lg active:scale-95"
          >
            Login →
          </Link>
        </div>
      </nav>

      {/* SECTION 2 — HERO */}
      <header className="pt-40 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-[#E2DED6] rounded-full shadow-sm mb-8"
          >
            <span className="text-sm">🚀</span>
            <span className="text-xs font-bold uppercase tracking-wider text-[#8C8881]">Trusted by ASK Tech</span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-display text-5xl md:text-7xl font-black leading-[1.1] mb-8"
          >
            Smart HR Management <br />
            <span className="text-[#2558D9]">for Modern Teams</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg md:text-xl text-[#5C5851] max-w-2xl mx-auto mb-12 leading-relaxed"
          >
            HRFlow by ASK Tech automates your attendance, payroll, and leave management — 
            with powerful face recognition technology.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link 
              href="/login" 
              className="w-full sm:w-auto px-8 py-4 bg-[#2558D9] text-white rounded-2xl font-black text-lg shadow-xl shadow-[#2558D9]/20 hover:bg-[#1E46B3] transition-all"
            >
              Get Started →
            </Link>
            <Link 
              href="/login" 
              className="w-full sm:w-auto px-8 py-4 bg-white border-2 border-[#E2DED6] text-[#1A1A1A] rounded-2xl font-black text-lg hover:border-[#1A1A1A] transition-all"
            >
              Login to Dashboard
            </Link>
          </motion.div>
        </div>
      </header>

      {/* SECTION 3 — FEATURES */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: "📸", title: "Face Recognition", desc: "Mark attendance automatically with AI-powered face recognition. No more proxy attendance.", color: "bg-blue-50" },
              { icon: "💰", title: "Automated Payroll", desc: "Calculate salaries with LOP, bonuses, PF, ESI — generate payslips in one click.", color: "bg-green-50" },
              { icon: "🏖️", title: "Leave Management", desc: "Apply, approve and track leaves with real-time balance updates and notifications.", color: "bg-orange-50" },
              { icon: "📊", title: "Live Dashboard", desc: "Real-time insights on attendance, payroll costs, and workforce analytics.", color: "bg-purple-50" }
            ].map((f, i) => (
              <motion.div 
                key={i}
                whileInView={{ opacity: 1, y: 0 }}
                initial={{ opacity: 0, y: 20 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-8 rounded-[32px] border border-[#E2DED6] hover:border-[#2558D9]/30 hover:shadow-2xl transition-all group"
              >
                <div className={`w-14 h-14 ${f.color} rounded-2xl flex items-center justify-center text-2xl mb-6 group-hover:scale-110 transition-transform`}>
                  {f.icon}
                </div>
                <h3 className="text-xl font-bold mb-4">{f.title}</h3>
                <p className="text-[#5C5851] text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 4 — HOW IT WORKS */}
      <section className="py-32 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <h2 className="font-display text-4xl font-black text-center mb-20 px-8">How it works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
            <div className="hidden md:block absolute top-[60px] left-[20%] right-[20%] h-0.5 border-t-2 border-dashed border-[#E2DED6]" />
            {[
              { step: "01", title: "Admin adds employee", desc: "Admin registers employee with auto-generated ID" },
              { step: "02", title: "Face registered once", desc: "HR registers employee face in 10 seconds" },
              { step: "03", title: "Attendance marks itself", desc: "Employee shows face → attendance done ✅" }
            ].map((s, i) => (
              <motion.div 
                key={i}
                whileInView={{ opacity: 1, x: 0 }}
                initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
                viewport={{ once: true }}
                className="text-center relative z-10"
              >
                <div className="w-16 h-16 bg-[#2558D9] text-white rounded-full flex items-center justify-center font-black text-xl mx-auto mb-8 shadow-lg shadow-[#2558D9]/40">
                  {s.step}
                </div>
                <h4 className="text-xl font-bold mb-4">{s.title}</h4>
                <p className="text-[#5C5851]">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 5 — STATS BAR */}
      <div className="bg-[#1A1A1A] py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-wrap justify-between gap-8">
          {["100% Accurate", "Face Recognition", "Auto Payroll", "Real-time Reports"].map((s, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="text-[#2558D9]">✦</span>
              <span className="text-white font-black uppercase tracking-[0.2em] text-[10px]">{s}</span>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 6 — CTA BANNER */}
      <section className="py-24 px-6">
        <motion.div 
          whileInView={{ scale: 1, opacity: 1 }}
          initial={{ scale: 0.95, opacity: 0 }}
          viewport={{ once: true }}
          className="max-w-7xl mx-auto bg-[#1A3A6E] rounded-[48px] p-12 md:p-20 text-center relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#2558D9]/30 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl" />
          
          <h2 className="font-display text-4xl md:text-5xl font-black text-white mb-8 relative z-10">
            Ready to modernize your HR?
          </h2>
          <p className="text-white/60 text-lg mb-12 relative z-10">Join ASK Tech's HRFlow platform today.</p>
          <Link 
            href="/login" 
            className="inline-block px-10 py-5 bg-white text-[#1A3A6E] rounded-2xl font-black text-lg hover:bg-white/90 transition-all relative z-10"
          >
            Login to Dashboard →
          </Link>
        </motion.div>
      </section>

      {/* SECTION 7 — FOOTER */}
      <footer className="bg-[#111111] text-white pt-16 pb-8 px-6">
        <div className="max-w-7xl mx-auto">

          {/* Top grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">

            {/* Brand */}
            <div className="sm:col-span-2 lg:col-span-1">
              <div className="flex flex-col mb-4">
                <span className="font-display text-3xl font-black text-[#2558D9] leading-none">HRFlow</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/40 mt-1">by ASK Tech</span>
              </div>
              <p className="text-sm text-white/50 leading-relaxed">
                AI-powered HRMS built for modern Indian businesses. Automate attendance, payroll &amp; leaves — all in one place.
              </p>
              {/* Social icons */}
              <div className="flex gap-3 mt-6">
                <a href="https://instagram.com/infoasktech" target="_blank" rel="noopener noreferrer"
                  className="w-9 h-9 rounded-xl bg-white/10 hover:bg-pink-500 flex items-center justify-center text-sm transition-all">
                  📸
                </a>
                <a href="https://ask-phi-five.vercel.app" target="_blank" rel="noopener noreferrer"
                  className="w-9 h-9 rounded-xl bg-white/10 hover:bg-[#2558D9] flex items-center justify-center text-sm transition-all">
                  🌐
                </a>
                <a href="mailto:info@asktech.in"
                  className="w-9 h-9 rounded-xl bg-white/10 hover:bg-green-500 flex items-center justify-center text-sm transition-all">
                  ✉️
                </a>
              </div>
            </div>

            {/* Product links */}
            <div>
              <h4 className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-5">Product</h4>
              <ul className="space-y-3">
                {["Face Attendance", "Payroll Engine", "Leave Management", "Analytics Dashboard"].map((item) => (
                  <li key={item}>
                    <a href="/login" className="text-sm text-white/60 hover:text-white transition-colors font-medium">{item}</a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company links */}
            <div>
              <h4 className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-5">Company</h4>
              <ul className="space-y-3">
                {[
                  { label: "Website", href: "https://ask-phi-five.vercel.app" },
                  { label: "Instagram", href: "https://instagram.com/infoasktech" },
                  { label: "Contact Us", href: "mailto:info@asktech.in" },
                  { label: "Login Portal", href: "/login" },
                ].map((item) => (
                  <li key={item.label}>
                    <a href={item.href} target={item.href.startsWith("http") ? "_blank" : "_self"} rel="noopener noreferrer"
                      className="text-sm text-white/60 hover:text-white transition-colors font-medium">
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact info */}
            <div>
              <h4 className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-5">Contact</h4>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <span className="text-base mt-0.5">📍</span>
                  <span className="text-sm text-white/60 leading-relaxed">New Delhi &amp; Gurgaon,<br />India</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-base">✉️</span>
                  <a href="mailto:info@asktech.in" className="text-sm text-white/60 hover:text-white transition-colors">info@asktech.in</a>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-base">📸</span>
                  <a href="https://instagram.com/infoasktech" target="_blank" rel="noopener noreferrer"
                    className="text-sm text-white/60 hover:text-white transition-colors">@infoasktech</a>
                </li>
              </ul>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-[11px] text-white/30 font-medium text-center sm:text-left">
              © {new Date().getFullYear()} ASK Tech Pvt Ltd · HRFlow HRMS · All rights reserved
            </p>
            <div className="flex items-center gap-2">
              <span className="text-[#2558D9]">✦</span>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Made with ❤️ in India</span>
            </div>
          </div>

        </div>
      </footer>
    </div>
  );
}
