/**
 * Author: Yzrel Jade B. Eborde
 */

import { useState, useEffect, useRef } from "react";
import {
  DOST_REGION_12_ADDRESS,
  DOST_REGION_12_EMAIL,
  DOST_REGION_12_OFFICE,
  DOST_REGION_12_PHONE,
  DOST_REGION_12_WEBSITE,
  REGION_12_LABEL,
  REGION_12_NAME,
} from "../constants/region12";
import {
  DOST_REGION_12_CONTACTS,
  SETUP_4_BENEFITS,
  SETUP_4_DEFINITION,
  SETUP_4_INTRO,
  SETUP_4_PURPOSE,
  SETUP_4_TAGLINE,
  SETUP_DOCUMENTS_REQUIRED,
  SETUP_HOW_TO_APPLY,
  SETUP_PRIORITY_SECTORS,
  SETUP_SERVICES,
  SETUP_WHO_CAN_APPLY,
} from "../constants/setupBrochure";
import {
  ChevronRight,
  ChevronLeft,
  ArrowRight,
  CheckCircle,
  Building2,
  User,
  Phone,
  Mail,
  MapPin,
  FileText,
  TrendingUp,
  Shield,
  Clock,
  Award,
  ChevronDown,
  Menu,
  X,
  ExternalLink,
  Leaf,
  Utensils,
  Wrench,
  Gem,
  Fish,
  Ship,
  HeartPulse,
  Cpu,
  Tractor,
  Facebook,
  Globe,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────

interface LandingPageProps {
  onLogin: () => void;
  onStaffLogin: () => void;
  onRegister: (
    type: "single-proprietor" | "non-single-proprietor",
  ) => void;
}

function Counter({
  end,
  suffix = "",
  duration = 2000,
}: {
  end: number;
  suffix?: string;
  duration?: number;
}) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const startTime = performance.now();
          const tick = (now: number) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(eased * end));
            if (progress < 1) requestAnimationFrame(tick);
            else setCount(end);
          };
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.5 },
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [end, duration]);

  return (
    <span ref={ref}>
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}

// ── Floating particles background ─────────────────────────────────────────────

function ParticleBg() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(18)].map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full opacity-10"
          style={{
            width: `${20 + ((i * 17) % 60)}px`,
            height: `${20 + ((i * 17) % 60)}px`,
            top: `${(i * 23) % 90}%`,
            left: `${(i * 31) % 95}%`,
            background:
              i % 3 === 0
                ? "#00AEEF"
                : i % 3 === 1
                  ? "#ffffff"
                  : "#0C2461",
            animation: `float ${4 + (i % 4)}s ease-in-out infinite`,
            animationDelay: `${(i * 0.4) % 3}s`,
          }}
        />
      ))}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-40px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(40px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(0, 174, 239, 0.4); }
          50% { box-shadow: 0 0 0 16px rgba(0, 174, 239, 0); }
        }
        .animate-slide-left { animation: slideInLeft 0.7s ease forwards; }
        .animate-slide-right { animation: slideInRight 0.7s ease forwards; }
        .animate-slide-up { animation: slideInUp 0.7s ease forwards; }
        .animate-fade { animation: fadeIn 1s ease forwards; }
        .delay-100 { animation-delay: 0.1s; opacity: 0; }
        .delay-200 { animation-delay: 0.2s; opacity: 0; }
        .delay-300 { animation-delay: 0.3s; opacity: 0; }
        .delay-400 { animation-delay: 0.4s; opacity: 0; }
        .delay-500 { animation-delay: 0.5s; opacity: 0; }
        .delay-600 { animation-delay: 0.6s; opacity: 0; }
        .card-hover {
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .card-hover:hover {
          transform: translateY(-8px);
          box-shadow: 0 24px 60px rgba(12, 36, 97, 0.18);
        }
        .pulse-glow { animation: pulse-glow 2s infinite; }
      `}</style>
    </div>
  );
}

import { DOSTHorizontalLogo, DOSTMark, DOSTNavBrand } from "./DOSTLogos";

function Navbar({
  onLogin,
  onStaffLogin,
  onRegister,
}: {
  onLogin: () => void;
  onStaffLogin: () => void;
  onRegister: (type: "single-proprietor" | "non-single-proprietor") => void;
}) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const scrollTo = (id: string) => {
    document
      .getElementById(id)
      ?.scrollIntoView({ behavior: "smooth" });
    setMenuOpen(false);
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-100"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <DOSTNavBrand variant={scrolled ? "dark" : "light"} />

        {/* Desktop Nav */}
        <div className="hidden lg:flex items-center gap-5">
          {[
            { label: "About", id: "about" },
            { label: "Sectors", id: "sectors" },
            { label: "Services", id: "services" },
            { label: "Apply", id: "apply" },
            { label: "Contact", id: "contact" },
            { label: "FAQ", id: "faq" },
          ].map((item) => (
              <button
                key={item.id}
                onClick={() => scrollTo(item.id)}
                className={`text-sm font-medium transition-colors hover:text-[#00AEEF] ${
                  scrolled ? "text-gray-600" : "text-white/80"
                }`}
              >
                {item.label}
              </button>
            ),
          )}
          <button
            onClick={onStaffLogin}
            className={`flex items-center gap-1.5 text-sm font-semibold px-3.5 py-1.5 rounded-lg border transition-colors ${
              scrolled
                ? "border-purple-200 text-purple-700 hover:bg-purple-50"
                : "border-white/30 text-white/90 hover:bg-white/10"
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            Staff Portal
          </button>
          <button
            onClick={onLogin}
            className={`text-sm font-semibold transition-colors hover:text-[#00AEEF] ${
              scrolled ? "text-gray-600" : "text-white/90"
            }`}
          >
            Applicant Sign In
          </button>
          <button
            onClick={() => onRegister("single-proprietor")}
            className="flex items-center gap-2 bg-[#00AEEF] hover:bg-sky-400 text-white text-sm font-bold px-5 py-2 rounded-xl transition-all hover:shadow-lg hover:shadow-[#00AEEF]/30"
          >
            Apply Now <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Mobile menu button */}
        <button
          className={`md:hidden ${scrolled ? "text-gray-700" : "text-white"}`}
          onClick={() => setMenuOpen((p) => !p)}
        >
          {menuOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <Menu className="w-6 h-6" />
          )}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 py-4 space-y-3">
          {[
            { label: "About", id: "about" },
            { label: "Sectors", id: "sectors" },
            { label: "Services", id: "services" },
            { label: "Apply", id: "apply" },
            { label: "Contact", id: "contact" },
            { label: "FAQ", id: "faq" },
          ].map((item) => (
              <button
                key={item.id}
                onClick={() => scrollTo(item.id)}
                className="block w-full text-left text-sm font-medium text-gray-700 py-2 hover:text-[#0C2461]"
              >
                {item.label}
              </button>
            ),
          )}
          <button
            onClick={onStaffLogin}
            className="w-full flex items-center justify-center gap-2 border border-purple-200 text-purple-700 text-sm font-semibold py-2.5 rounded-xl"
          >
            <Shield className="w-4 h-4" />
            DOST Staff Portal
          </button>
          <button
            onClick={onLogin}
            className="w-full text-[#0C2461] text-sm font-semibold py-2"
          >
            Applicant Sign In
          </button>
          <button
            onClick={() => onRegister("single-proprietor")}
            className="w-full bg-[#0C2461] text-white text-sm font-bold py-2.5 rounded-xl"
          >
            Apply Now
          </button>
        </div>
      )}
    </nav>
  );
}

// ── Hero Section ──────────────────────────────────────────────────────────────

function HeroSection({
  onRegister,
}: {
  onRegister: (
    type: "single-proprietor" | "non-single-proprietor",
  ) => void;
}) {
  const scrollToAbout = () =>
    document.getElementById("about")?.scrollIntoView({ behavior: "smooth" });

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background image layer — replace src with actual photo */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url(/assets/hero-bg.jpg)",
          backgroundPosition: "center 30%",
        }}
      />
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0C2461]/90 via-[#0C2461]/75 to-[#00AEEF]/40" />
      {/* Diagonal accent */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent" />

      <ParticleBg />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-24 pb-16 text-center">
        <div className="flex flex-col items-center gap-2 mb-8 animate-slide-up">
          <DOSTHorizontalLogo height={80} />
          <p className="text-sm font-bold text-[#00AEEF] tracking-wide">
            Regional Office No. XII
          </p>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-tight mb-4 animate-slide-up delay-100">
          <span className="text-[#00AEEF]">ai</span>SETUP
          <span className="block text-2xl sm:text-3xl font-bold text-white/90 mt-2">
            Small Enterprise Technology Upgrading Program
          </span>
        </h1>

        <p className="text-sm sm:text-base text-white/70 max-w-2xl mx-auto mb-3 animate-slide-up delay-200 italic">
          {SETUP_4_TAGLINE}
        </p>
        <p className="text-sm sm:text-base text-white/60 max-w-xl mx-auto mb-10 animate-slide-up delay-300">
          {SETUP_4_INTRO} Serving MSMEs in {REGION_12_LABEL}.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up delay-400">
          <button
            onClick={() => onRegister("single-proprietor")}
            className="group flex items-center gap-3 bg-white text-[#0C2461] font-black text-sm px-8 py-4 rounded-2xl hover:bg-[#00AEEF] hover:text-white transition-all shadow-2xl pulse-glow"
          >
            Register &amp; Apply
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
          <button
            onClick={scrollToAbout}
            className="flex items-center gap-2 text-white/80 border border-white/30 hover:border-white hover:text-white text-sm font-semibold px-6 py-4 rounded-2xl transition-all backdrop-blur-sm"
          >
            Learn More <ChevronDown className="w-4 h-4" />
          </button>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto mt-16 animate-slide-up delay-500">
          {[
            {
              label: "MSMEs Assisted",
              value: 12400,
              suffix: "+",
            },
            {
              label: "Funds Released",
              value: 2.8,
              suffix: "B₱",
            },
            { label: "Provinces Served", value: 5, suffix: "" },
            { label: "Approval Rate", value: 78, suffix: "%" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-4"
            >
              <p className="text-2xl sm:text-3xl font-black text-white">
                <Counter
                  end={stat.value}
                  suffix={stat.suffix}
                />
              </p>
              <p className="text-xs text-white/60 mt-0.5">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── About Section ─────────────────────────────────────────────────────────────

function AboutSection() {
  return (
    <section id="about" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col items-center gap-2 mb-10">
          <DOSTHorizontalLogo height={80} surface="light" />
          <p className="text-sm font-bold text-[#0C2461] tracking-wide">
            Regional Office No. XII
          </p>
        </div>

        <div className="text-center mb-14 max-w-2xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-widest text-[#00AEEF] mb-2 block">
            SETUP 4.0
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-3">
            What is SETUP?
          </h2>
          <p className="text-gray-600 leading-relaxed">{SETUP_4_DEFINITION}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
          <div className="card-hover bg-gradient-to-br from-[#0C2461] to-[#1a3a7a] rounded-3xl p-7 text-white">
            <TrendingUp className="w-8 h-8 text-[#00AEEF] mb-4" />
            <h3 className="text-lg font-bold mb-2">Purpose</h3>
            <p className="text-white/80 text-sm leading-relaxed">{SETUP_4_PURPOSE}</p>
          </div>
          <div className="card-hover bg-white border border-gray-100 rounded-3xl p-7 shadow-sm">
            <Award className="w-8 h-8 text-emerald-500 mb-4" />
            <h3 className="text-lg font-bold text-gray-800 mb-2">Benefits</h3>
            <p className="text-gray-500 text-sm leading-relaxed">{SETUP_4_BENEFITS}</p>
          </div>
          <div className="card-hover bg-[#EEF2F7] border border-blue-100 rounded-3xl p-7">
            <Shield className="w-8 h-8 text-[#0C2461] mb-4" />
            <h3 className="text-lg font-bold text-gray-800 mb-2">Region XII Coverage</h3>
            <p className="text-gray-500 text-sm leading-relaxed">
              This aiSETUP portal serves MSMEs in South Cotabato, Cotabato, Sultan Kudarat,
              Sarangani, and General Santos City — with provincial S&amp;T centers across
              SOCCSKSARGEN.
            </p>
          </div>
        </div>

        <p className="text-center text-sm font-semibold text-[#0C2461] italic max-w-3xl mx-auto">
          &ldquo;{SETUP_4_TAGLINE}&rdquo;
        </p>
      </div>
    </section>
  );
}

const SECTOR_ICONS = [Leaf, Utensils, Wrench, Gem, Fish, Ship, HeartPulse, Cpu, Tractor];

function PrioritySectorsSection() {
  return (
    <section id="sectors" className="py-20 bg-[#EEF2F7]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <span className="text-xs font-bold uppercase tracking-widest text-[#00AEEF] mb-2 block">
            Priority Industries
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-3">
            Priority Sectors
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto text-sm">
            MSMEs classified under these sectors may avail of SETUP 4.0 assistance through DOST Region XII.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {SETUP_PRIORITY_SECTORS.map((sector, i) => {
            const Icon = SECTOR_ICONS[i] ?? Building2;
            return (
              <div
                key={sector}
                className="card-hover flex items-start gap-3 bg-white border border-gray-100 rounded-2xl p-5 shadow-sm"
              >
                <div className="w-10 h-10 rounded-xl bg-[#0C2461]/10 flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-[#0C2461]" />
                </div>
                <p className="text-sm font-semibold text-gray-700 leading-snug">{sector}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function ServicesSection() {
  return (
    <section id="services" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <span className="text-xs font-bold uppercase tracking-widest text-[#00AEEF] mb-2 block">
            DOST Assistance
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-3">
            SETUP Services
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto text-sm">
            Technology transfer, training, and consultancy services available to assisted enterprises.
          </p>
        </div>
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-w-5xl mx-auto">
          {SETUP_SERVICES.map((service) => (
            <li
              key={service}
              className="flex items-start gap-2.5 bg-[#EEF2F7] rounded-xl px-4 py-3.5 text-sm text-gray-700"
            >
              <CheckCircle className="w-4 h-4 text-[#00AEEF] shrink-0 mt-0.5" />
              {service}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function EligibilitySection() {
  return (
    <section className="py-20 bg-gradient-to-br from-[#0C2461] to-[#1a3a7a] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div>
            <h2 className="text-2xl font-black mb-4 flex items-center gap-2">
              <User className="w-6 h-6 text-[#00AEEF]" />
              Who can apply?
            </h2>
            <ul className="space-y-3">
              {SETUP_WHO_CAN_APPLY.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-white/85">
                  <CheckCircle className="w-4 h-4 text-[#00AEEF] shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="text-2xl font-black mb-4 flex items-center gap-2">
              <FileText className="w-6 h-6 text-[#00AEEF]" />
              How to apply
            </h2>
            <ol className="space-y-3 list-none">
              {SETUP_HOW_TO_APPLY.map((item, i) => (
                <li key={item} className="flex items-start gap-2 text-sm text-white/85">
                  <span className="w-5 h-5 rounded-full bg-[#00AEEF] text-[#0C2461] text-xs font-black flex items-center justify-center shrink-0">
                    {i + 1}
                  </span>
                  {item}
                </li>
              ))}
            </ol>
          </div>
          <div>
            <h2 className="text-2xl font-black mb-4 flex items-center gap-2">
              <Clock className="w-6 h-6 text-[#00AEEF]" />
              Documents required
            </h2>
            <p className="text-xs text-white/60 mb-3">
              Prepare these before submitting your Letter of Intent through aiSETUP:
            </p>
            <ul className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {SETUP_DOCUMENTS_REQUIRED.map((doc) => (
                <li key={doc} className="flex items-start gap-2 text-xs text-white/80">
                  <CheckCircle className="w-3.5 h-3.5 text-[#00AEEF] shrink-0 mt-0.5" />
                  {doc}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

function ContactOfficesSection() {
  return (
    <section id="contact" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <DOSTMark size={56} />
          </div>
          <span className="text-xs font-bold uppercase tracking-widest text-[#00AEEF] mb-2 block">
            Get in Touch
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-3">
            DOST Region XII Offices
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto text-sm">
            Contact the Provincial S&amp;T Center where your enterprise is based, or the Regional Office in Koronadal City.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {DOST_REGION_12_CONTACTS.map((office) => (
            <div
              key={office.id}
              className={`card-hover rounded-3xl border p-6 ${
                office.id === "regional"
                  ? "border-[#0C2461]/30 bg-gradient-to-br from-blue-50 to-white shadow-md"
                  : "border-gray-100 bg-white shadow-sm"
              }`}
            >
              <h3 className="font-bold text-[#0C2461] text-base mb-1">{office.name}</h3>
              <p className="text-xs text-gray-500 mb-3">{office.director}</p>
              <div className="space-y-2 text-sm text-gray-600">
                <p className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-[#00AEEF] shrink-0 mt-0.5" />
                  {office.address}
                </p>
                <p className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-[#00AEEF] shrink-0" />
                  {office.phone}
                </p>
                <p className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-[#00AEEF] shrink-0" />
                  <a href={`mailto:${office.email}`} className="hover:text-[#0C2461] hover:underline">
                    {office.email}
                  </a>
                </p>
                {office.website && (
                  <p className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-[#00AEEF] shrink-0" />
                    <a
                      href={office.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-[#0C2461] hover:underline"
                    >
                      {office.website.replace("https://", "")}
                    </a>
                  </p>
                )}
                {office.facebook && (
                  <p className="flex items-center gap-2">
                    <Facebook className="w-4 h-4 text-[#00AEEF] shrink-0" />
                    <a
                      href={office.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-[#0C2461] hover:underline text-xs"
                    >
                      Facebook Page
                    </a>
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Application Type Section ──────────────────────────────────────────────────

function ApplicationTypeSection({
  onRegister,
  onLogin,
}: {
  onRegister: (
    type: "single-proprietor" | "non-single-proprietor",
  ) => void;
  onLogin: () => void;
}) {
  return (
    <section id="apply" className="py-20 bg-[#EEF2F7]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-14">
          <span className="text-xs font-bold uppercase tracking-widest text-[#00AEEF] mb-2 block">
            Get Started
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-4">
            Choose Your Application Type
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto">
            Select the registration type that matches your
            enterprise structure to begin your SETUP
            application.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Single Proprietor */}
          <div className="card-hover group relative bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100">
            {/* Top accent bar */}
            <div className="h-2 bg-gradient-to-r from-[#0C2461] to-[#00AEEF]" />

            <div className="p-8">
              {/* Icon */}
              <div className="w-16 h-16 bg-gradient-to-br from-[#0C2461] to-[#1a3a7a] rounded-2xl flex items-center justify-center mb-5 shadow-lg">
                <User className="w-8 h-8 text-white" />
              </div>

              <div className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 text-xs font-bold px-3 py-1 rounded-full mb-3">
                <span>DTI Registered</span>
              </div>

              <h3 className="text-2xl font-black text-gray-900 mb-2">
                Single Proprietor
              </h3>
              <p className="text-gray-500 text-sm mb-6 leading-relaxed">
                For individual business owners registered with
                the Department of Trade and Industry (DTI).
                Ideal for micro and small enterprises operating
                as sole proprietorships.
              </p>

              {/* Requirements */}
              <ul className="space-y-2 mb-7">
                {[
                  "DTI Business Name Registration",
                  "Mayor's Permit / Business License",
                  "BIR Certificate of Registration",
                  "Valid Government-issued ID",
                  "Selfie for Identity Verification",
                ].map((req) => (
                  <li
                    key={req}
                    className="flex items-start gap-2 text-sm text-gray-600"
                  >
                    <CheckCircle className="w-4 h-4 text-[#00AEEF] shrink-0 mt-0.5" />
                    {req}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => onRegister("single-proprietor")}
                className="w-full flex items-center justify-center gap-2 bg-[#0C2461] hover:bg-blue-800 text-white font-bold py-3.5 rounded-2xl transition-all group-hover:shadow-lg group-hover:shadow-[#0C2461]/20 text-sm"
              >
                Apply as Single Proprietor
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              <p className="text-center text-xs text-gray-400 mt-3">
                Processing time:{" "}
                <span className="font-semibold text-gray-600">
                  5–10 business days
                </span>
              </p>
            </div>
          </div>

          {/* Non-Single Proprietor */}
          <div className="card-hover group relative bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100">
            {/* Top accent bar */}
            <div className="h-2 bg-gradient-to-r from-[#00AEEF] to-emerald-400" />

            <div className="p-8">
              {/* Icon */}
              <div className="w-16 h-16 bg-gradient-to-br from-[#00AEEF] to-sky-600 rounded-2xl flex items-center justify-center mb-5 shadow-lg">
                <Building2 className="w-8 h-8 text-white" />
              </div>

              <div className="inline-flex items-center gap-1.5 bg-sky-50 text-sky-700 text-xs font-bold px-3 py-1 rounded-full mb-3">
                <span>SEC / CDA Registered</span>
              </div>

              <h3 className="text-2xl font-black text-gray-900 mb-2">
                Non-Single Proprietor
              </h3>
              <p className="text-gray-500 text-sm mb-6 leading-relaxed">
                For corporations, partnerships, and cooperatives
                registered with SEC or CDA. Suitable for medium
                enterprises with multiple stakeholders.
              </p>

              {/* Requirements */}
              <ul className="space-y-2 mb-7">
                {[
                  "SEC / CDA Certificate of Registration",
                  "Articles of Incorporation or Cooperation",
                  "Board Resolution / Secretary's Certificate",
                  "Audited Financial Statements",
                  "List of Officers with Valid IDs",
                ].map((req) => (
                  <li
                    key={req}
                    className="flex items-start gap-2 text-sm text-gray-600"
                  >
                    <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    {req}
                  </li>
                ))}
              </ul>

              <button
                onClick={() =>
                  onRegister("non-single-proprietor")
                }
                className="w-full flex items-center justify-center gap-2 bg-[#00AEEF] hover:bg-sky-400 text-white font-bold py-3.5 rounded-2xl transition-all group-hover:shadow-lg group-hover:shadow-[#00AEEF]/20 text-sm"
              >
                Apply as Corporation / Cooperative
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              <p className="text-center text-xs text-gray-400 mt-3">
                Processing time:{" "}
                <span className="font-semibold text-gray-600">
                  10–15 business days
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Already have account */}
        <p className="text-center text-sm text-gray-500 mt-8">
          Already registered?{" "}
          <button
            type="button"
            onClick={onLogin}
            className="text-[#0C2461] font-bold hover:underline"
          >
            Sign in to continue your application →
          </button>
        </p>
      </div>
    </section>
  );
}

// ── Process Steps Section ─────────────────────────────────────────────────────

function ProcessSection({ onLogin }: { onLogin: () => void }) {
  const steps = [
    {
      n: "01",
      label: "Create Account",
      desc: "Register with your personal and enterprise information. Submit your selfie for identity verification.",
    },
    {
      n: "02",
      label: "Sign In",
      desc: "Sign in with your registered email and password to access the aiSETUP application portal.",
    },
    {
      n: "03",
      label: "Pre-Screening",
      desc: "Complete the eligibility pre-screening to check if your enterprise qualifies for SETUP assistance.",
    },
    {
      n: "04",
      label: "Submit Documents",
      desc: "Upload your Letter of Intent, business registration documents, and financial statements.",
    },
    {
      n: "05",
      label: "TNA Assessment",
      desc: "DOST conducts a Technology Needs Assessment to identify the right technology for your enterprise.",
    },
    {
      n: "06",
      label: "RTEC Evaluation",
      desc: "The Regional Technical Evaluation Committee reviews your project proposal and budget.",
    },
    {
      n: "07",
      label: "Fund Release",
      desc: "Upon approval, funds are released to your dedicated LandBank account for procurement.",
    },
  ];

  return (
    <section
      id="process"
      className="py-20 bg-white overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-14">
          <span className="text-xs font-bold uppercase tracking-widest text-[#00AEEF] mb-2 block">
            How It Works
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-4">
            Application Process
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto">
            From registration to fund release — a guided
            step-by-step journey.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {steps.map((step, i) => (
            <div
              key={step.n}
              className="card-hover relative bg-white border border-gray-100 rounded-3xl p-6 shadow-sm overflow-hidden"
            >
              {/* Step number watermark */}
              <span className="absolute -top-2 -right-2 text-8xl font-black text-gray-50 select-none leading-none">
                {step.n}
              </span>
              <div className="relative">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-black mb-4 ${
                    i < 2
                      ? "bg-[#0C2461]"
                      : i < 4
                        ? "bg-[#00AEEF]"
                        : "bg-emerald-500"
                  }`}
                >
                  {step.n}
                </div>
                <h3 className="text-base font-bold text-gray-800 mb-2">
                  {step.label}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  {step.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        <p className="text-center text-sm text-gray-500 mt-10">
          Completed registration?{" "}
          <button
            type="button"
            onClick={onLogin}
            className="text-[#0C2461] font-bold hover:underline"
          >
            Sign in to open aiSETUP →
          </button>
        </p>
      </div>
    </section>
  );
}

function FAQSection() {
  const [open, setOpen] = useState<number | null>(null);

  const faqs = [
    {
      q: "Who can apply for SETUP?",
      a: "Filipino-owned MSMEs (at least 60% Filipino equity) registered with DTI, SEC, or CDA that have been operating for at least 3 years are eligible.",
    },
    {
      q: "How much financial assistance can I get?",
      a: `Eligible enterprises in ${REGION_12_LABEL} can receive up to ₱5,000,000 in soft loan financing, depending on the approved project proposal and available regional allocation.`,
    },
    {
      q: "What is the interest rate and repayment period?",
      a: "SETUP loans carry a low annual interest rate with a 1-year grace period on principal. Repayment periods vary based on the loan amount and project type.",
    },
    {
      q: "How long does the application process take?",
      a: "The entire process typically takes 2–4 months from submission to fund release, depending on completeness of documents and evaluation scheduling.",
    },
    {
      q: "Can I apply if I am a Person with Disability (PWD)?",
      a: "Yes! PWD entrepreneurs are encouraged to apply. The system accommodates PWD status during registration and there may be priority processing available.",
    },
    {
      q: "What technologies are eligible under SETUP?",
      a: "Equipment, machinery, software systems, quality certification costs, product development, and training for manufacturing, agri-processing, and services sectors.",
    },
  ];

  return (
    <section id="faq" className="py-20 bg-[#EEF2F7]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-14">
          <span className="text-xs font-bold uppercase tracking-widest text-[#00AEEF] mb-2 block">
            FAQ
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-4">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100"
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between px-6 py-4 text-left"
              >
                <span className="font-semibold text-gray-800 text-sm pr-4">
                  {faq.q}
                </span>
                <ChevronDown
                  className={`w-5 h-5 text-gray-400 shrink-0 transition-transform ${open === i ? "rotate-180" : ""}`}
                />
              </button>
              {open === i && (
                <div className="px-6 pb-5 text-sm text-gray-500 leading-relaxed border-t border-gray-50 pt-3">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── CTA Banner ────────────────────────────────────────────────────────────────

function CTASection({
  onRegister,
}: {
  onRegister: (
    type: "single-proprietor" | "non-single-proprietor",
  ) => void;
}) {
  return (
    <section className="py-20 bg-gradient-to-br from-[#0C2461] to-[#1a3a7a] relative overflow-hidden">
      <ParticleBg />
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 text-center">
        <div className="flex flex-col items-center gap-2 mb-5">
          <DOSTHorizontalLogo height={64} />
          <p className="text-sm font-bold text-[#00AEEF] tracking-wide">
            Regional Office No. XII
          </p>
        </div>
        <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">
          Ready to upgrade your enterprise?
        </h2>
        <p className="text-white/60 mb-8 max-w-xl mx-auto">
          Join MSMEs across SOCCSKSARGEN that have already
          benefited from DOST Region XII&apos;s SETUP Program. Start your
          application today.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={() => onRegister("single-proprietor")}
            className="flex items-center gap-2 bg-white text-[#0C2461] font-bold px-7 py-3.5 rounded-2xl hover:bg-[#00AEEF] hover:text-white transition-all shadow-xl text-sm"
          >
            <User className="w-4 h-4" /> Single Proprietor
          </button>
          <button
            onClick={() => onRegister("non-single-proprietor")}
            className="flex items-center gap-2 bg-[#00AEEF] text-white font-bold px-7 py-3.5 rounded-2xl hover:bg-sky-400 transition-all shadow-xl text-sm"
          >
            <Building2 className="w-4 h-4" /> Corporation /
            Cooperative
          </button>
        </div>
      </div>
    </section>
  );
}

// ── Footer ────────────────────────────────────────────────────────────────────

function Footer({ onStaffLogin }: { onStaffLogin: () => void }) {
  return (
    <footer className="bg-gradient-to-br from-[#0C2461] to-[#1a3a7a] text-white py-12 border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex flex-col items-start gap-2 mb-4">
              <DOSTHorizontalLogo height={52} />
              <p className="text-sm font-bold text-[#00AEEF] tracking-wide">
                Regional Office No. XII
              </p>
            </div>
            <div className="flex items-center gap-1 mb-2">
              <span className="font-black text-base text-white">ai</span>
              <span className="font-black text-base text-[#00AEEF]">SETUP</span>
              <span className="text-xs text-white/50 ml-2">SETUP 4.0 Portal</span>
            </div>
            <p className="text-white/70 text-sm leading-relaxed max-w-sm">
              {DOST_REGION_12_OFFICE} — Small Enterprise Technology Upgrading Program
              serving MSMEs in {REGION_12_NAME}.
            </p>
            <p className="text-xs text-white/50 mt-3">
              © {new Date().getFullYear()} Department of
              Science and Technology
              <br />
              Republic of the Philippines
            </p>
          </div>

          {/* Address */}
          <div>
            <p className="font-bold text-sm mb-3 text-white/90">
              Address
            </p>
            <div className="space-y-2 text-xs text-white/70">
              <div className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[#00AEEF]" />
                <span>
                  {DOST_REGION_12_OFFICE}
                  <br />
                  {DOST_REGION_12_ADDRESS}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-[#00AEEF]" />
                <span>{DOST_REGION_12_PHONE}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-[#00AEEF]" />
                <span>{DOST_REGION_12_EMAIL}</span>
              </div>
            </div>
          </div>

          {/* Links */}
          <div>
            <p className="font-bold text-sm mb-3 text-white/90">
              Links
            </p>
            <ul className="space-y-2">
              <li>
                <button
                  type="button"
                  onClick={onStaffLogin}
                  className="flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300 transition-colors font-semibold"
                >
                  <Shield className="w-3 h-3" />
                  DOST Staff Portal
                </button>
              </li>
              {[
                {
                  label: "DOST Region XII Website",
                  href: DOST_REGION_12_WEBSITE,
                },
                {
                  label: "DOST Official Website",
                  href: "https://www.dost.gov.ph",
                },
                {
                  label: "DTI Philippines",
                  href: "https://www.dti.gov.ph",
                },
                {
                  label: "LandBank of the Philippines",
                  href: "https://www.landbank.com",
                },
                {
                  label: "National Privacy Commission",
                  href: "https://www.privacy.gov.ph",
                },
              ].map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-white/60 hover:text-[#00AEEF] transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" />{" "}
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-white/15 pt-5 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-white/50">
            Powered by aiSETUP Platform — Built with ❤️ for
            Filipino MSMEs
          </p>
          <div className="flex gap-4 text-xs text-white/50">
            <button className="hover:text-white/80">
              Privacy Policy
            </button>
            <button className="hover:text-white/80">
              Terms of Use
            </button>
            <button className="hover:text-white/80">
              Accessibility
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ── Main Landing Page ─────────────────────────────────────────────────────────

export function LandingPage({
  onLogin,
  onStaffLogin,
  onRegister,
}: LandingPageProps) {
  return (
    <div
      className="min-h-screen font-sans"
      style={{
        fontFamily: "'Segoe UI', system-ui, sans-serif",
      }}
    >
      <Navbar onLogin={onLogin} onStaffLogin={onStaffLogin} onRegister={onRegister} />
      <HeroSection onRegister={onRegister} />
      <AboutSection />
      <PrioritySectorsSection />
      <ServicesSection />
      <EligibilitySection />
      <ApplicationTypeSection onRegister={onRegister} onLogin={onLogin} />
      <ProcessSection onLogin={onLogin} />
      <ContactOfficesSection />
      <FAQSection />
      <CTASection onRegister={onRegister} />
      <Footer onStaffLogin={onStaffLogin} />
    </div>
  );
}