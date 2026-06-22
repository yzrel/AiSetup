/**
 * Author: Yzrel Jade B. Eborde
 */

import {
  useState,
  useRef,
  useEffect,
  useCallback,
} from "react";
import {
  MessageCircle,
  X,
  Send,
  Bot,
  User,
  Loader2,
  ChevronDown,
  FileText,
  Download,
  Sparkles,
  RotateCcw,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Globe,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  reportData?: GeneratedReport;
  isVoice?: boolean;
}

interface GeneratedReport {
  title: string;
  type: "tna" | "proposal" | "checklist" | "summary";
  sections: { heading: string; content: string }[];
}

type Lang = "en-PH" | "fil-PH";

// ── System prompt ─────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are the DOST aiSETUP Assistant — a friendly, knowledgeable AI chatbot for DOST Region XII (SOCCSKSARGEN) Small Enterprise Technology Upgrading Program (SETUP) in the Philippines.

You serve MSMEs and DOST staff in Region XII only: South Cotabato, Cotabato, Sultan Kudarat, Sarangani, and General Santos City. The regional office is in Koronadal City.

You can:
1. Answer questions about DOST SETUP — eligibility, requirements, process, funding.
2. Point users to alternative DOST programs (MPEX, CAPE, Food Safety, RSTL, SGF, BIST, etc.) shown on the Pre-Screening page when they are not SETUP-qualified — recommendations are filtered by priority sector.
3. Generate structured reports when asked.
4. Respond in English OR Filipino/Tagalog — match the language the user uses.

Key Facts:
- SETUP provides up to ₱5 million in financial assistance to MSMEs
- Eligible: Filipino-owned (≥60%), registered DTI/SEC/CDA, operating ≥1 year
- Enterprise sizes: Micro (≤₱3M assets), Small (₱3M–₱15M), Medium (₱15M–₱100M)
- Modules: (1) Pre-Screening (2) Registration (3) LOI (4) Requirements (5) TNA1 (6) TNA2 (7) Project Proposal (8) RTEC (9) Approval Letter (10) MOA (11) LandBank Account (12) Withdrawal Request (13) Authority Letter (14) Procurement (15) Liquidation (16) Untagging (17) Delinquent Management

When asked to generate a report/checklist/summary/proposal outline, respond ONLY with this JSON (no extra text):
{"type":"report","report":{"title":"Title Here","type":"checklist","sections":[{"heading":"Section","content":"Content"}]},"message":"Short friendly intro"}

Report type must be one of: tna, proposal, checklist, summary

For normal answers: plain text, bullet points where helpful, warm and professional tone.
If user writes in Filipino/Tagalog, respond in Filipino. If English, respond in English.`;

const QUICK_QUESTIONS_EN = [
  "Am I eligible for SETUP?",
  "What documents do I need?",
  "How much funding can I get?",
  "Generate a requirements checklist",
  "Explain the application steps",
];

const QUICK_QUESTIONS_FIL = [
  "Kwalipikado ba ako sa SETUP?",
  "Anong mga dokumento ang kailangan?",
  "Magkano ang maaring maibigay?",
  "Gumawa ng checklist ng requirements",
  "Ipaliwanag ang mga hakbang sa aplikasyon",
];

// ── Report Card ───────────────────────────────────────────────────────────────

function ReportCard({
  report,
  onDownload,
}: {
  report: GeneratedReport;
  onDownload: (r: GeneratedReport) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const colors = {
    tna: "bg-blue-600",
    proposal: "bg-green-600",
    checklist: "bg-purple-600",
    summary: "bg-amber-600",
  };
  const labels = {
    tna: "TNA Report",
    proposal: "Project Proposal",
    checklist: "Checklist",
    summary: "Summary",
  };
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden mt-2 w-full">
      <div
        className={`${colors[report.type]} px-3 py-2 flex items-center justify-between`}
      >
        <div className="flex items-center gap-2">
          <FileText className="w-3.5 h-3.5 text-white" />
          <span className="text-white text-xs font-bold uppercase tracking-wide">
            {labels[report.type]}
          </span>
        </div>
        <button
          onClick={() => setExpanded((p) => !p)}
          className="text-white/80 hover:text-white"
        >
          <ChevronDown
            className={`w-4 h-4 transition-transform ${expanded ? "" : "-rotate-90"}`}
          />
        </button>
      </div>
      {expanded && (
        <div className="p-3">
          <h3 className="font-bold text-gray-800 text-sm mb-3">
            {report.title}
          </h3>
          <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
            {report.sections.map((s, i) => (
              <div key={i}>
                <p className="text-[11px] font-bold text-blue-700 uppercase tracking-wide mb-1">
                  {s.heading}
                </p>
                <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap">
                  {s.content}
                </p>
              </div>
            ))}
          </div>
          <button
            onClick={() => onDownload(report)}
            className="mt-3 w-full flex items-center justify-center gap-1.5 bg-[#0C2461] hover:bg-blue-800 text-white text-xs font-semibold py-2 rounded-lg transition-colors"
          >
            <Download className="w-3.5 h-3.5" /> Download Report
            (TXT)
          </button>
        </div>
      )}
    </div>
  );
}

// ── Voice Waveform Animation ──────────────────────────────────────────────────

function VoiceWave({ active }: { active: boolean }) {
  return (
    <div className="flex items-center gap-0.5 h-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className={`w-0.5 rounded-full bg-[#00AEEF] transition-all ${active ? "animate-pulse" : ""}`}
          style={{
            height: active
              ? `${8 + Math.sin(i * 1.2) * 6}px`
              : "4px",
            animationDelay: `${i * 80}ms`,
            animationDuration: "600ms",
          }}
        />
      ))}
    </div>
  );
}

// ── Mock Response Generators ──────────────────────────────────────────────────

function generateMockResponse(userText: string): string {
  const responses: Record<string, string> = {
    eligibility: "To be eligible for the SETUP program, your enterprise must be:\n• A registered MSME (DTI/SEC/CDA)\n• In operation for at least 1 year\n• Have a valid TIN and business permits\n• Located in the Philippines\n\nWould you like me to guide you through the pre-screening process?",
    requirements: "For the SETUP program application, you'll need:\n\n**Required Documents:**\n• DTI/SEC/CDA Registration Certificate\n• Business Permit & Mayor's Permit\n• TIN Certificate\n• Project Proposal\n• Latest Financial Statements\n• Company Profile\n\n**Optional Documents:**\n• Product/Service Catalog\n• Market Study/Analysis\n• Quality Certifications\n\nWould you like help preparing any of these documents?",
    application: "The SETUP application process has 4 main stages:\n\n1. **Pre-screening** - Check eligibility\n2. **Registration** - Create account & submit enterprise info\n3. **Letter of Intent** - State your project goals\n4. **Requirements Submission** - Upload all documents\n\nAfter submission, your application will be assessed within 15-30 business days. Which stage would you like to know more about?",
    timeline: "The typical SETUP program timeline is:\n\n• **Pre-screening:** 1-2 days\n• **Document submission:** 3-5 days\n• **Initial assessment:** 15-20 days\n• **Technical evaluation:** 10-15 days\n• **Approval decision:** 5-10 days\n• **Fund release:** 7-14 days after approval\n\nTotal estimated time: 2-3 months from application to fund release.",
    funding: "SETUP provides financial assistance of:\n\n• **Micro Enterprises:** Up to ₱200,000\n• **Small Enterprises:** Up to ₱1,000,000\n• **Medium Enterprises:** Up to ₱3,000,000\n\nFunds can be used for:\n✓ Equipment and machinery\n✓ Technology upgrades\n✓ Product development\n✓ Quality certifications\n✓ Market expansion\n\nInterest rates are subsidized at 2-5% annually.",
    status: "To check your application status:\n\n1. Log in to your account\n2. Navigate to the Dashboard\n3. View your current stage in the pipeline\n\nYou'll receive email notifications at each stage. Current processing times are displayed on your dashboard. Would you like me to explain what each status means?",
  };

  // Match keywords
  if (userText.includes("eligib") || userText.includes("qualify")) return responses.eligibility;
  if (userText.includes("requirement") || userText.includes("document")) return responses.requirements;
  if (userText.includes("apply") || userText.includes("process") || userText.includes("how")) return responses.application;
  if (userText.includes("timeline") || userText.includes("long") || userText.includes("when")) return responses.timeline;
  if (userText.includes("fund") || userText.includes("money") || userText.includes("amount")) return responses.funding;
  if (userText.includes("status") || userText.includes("track") || userText.includes("check")) return responses.status;

  // Default helpful response
  return "I'm the SETUP Program AI Assistant. I can help you with:\n\n• Eligibility requirements\n• Application process and timeline\n• Required documents\n• Funding amounts and terms\n• Application status tracking\n• Technical assistance programs\n\nWhat would you like to know more about?";
}

function generateMockReport(type: string): GeneratedReport {
  const baseReport: GeneratedReport = {
    title: "",
    summary: "",
    sections: [],
    metadata: {
      generatedAt: new Date().toISOString(),
      dataSource: "SETUP Program Database",
      period: "May 2026",
    },
  };

  if (type === "prescreening") {
    return {
      ...baseReport,
      title: "Pre-Screening Activity Report",
      summary: "Overview of pre-screening activities and conversion rates for May 2026",
      sections: [
        {
          heading: "Key Metrics",
          content: "Total inquiries: 156 | Qualified: 124 (79.5%) | Proceeded to registration: 98 (79.0%)",
        },
        {
          heading: "Top Disqualification Reasons",
          content: "1. Incomplete business registration (32%)\n2. Less than 1 year in operation (24%)\n3. Outside eligible sectors (18%)\n4. Missing tax compliance (15%)",
        },
        {
          heading: "Sector Distribution",
          content: "Manufacturing: 45% | Services: 28% | Agriculture: 18% | Technology: 9%",
        },
      ],
    };
  } else if (type === "assessment") {
    return {
      ...baseReport,
      title: "Assessment Pipeline Report",
      summary: "Current status of applications under technical and financial assessment",
      sections: [
        {
          heading: "Applications Under Review",
          content: "Total: 67 applications | Technical review: 34 | Financial review: 23 | Final approval: 10",
        },
        {
          heading: "Average Processing Time",
          content: "Technical assessment: 12.3 days | Financial assessment: 8.7 days | Overall: 21.5 days (below 25-day target)",
        },
        {
          heading: "Approval Trends",
          content: "Approved this month: 42 | Pending revisions: 15 | Declined: 3 | Approval rate: 93.3%",
        },
      ],
    };
  } else if (type === "compliance") {
    return {
      ...baseReport,
      title: "Compliance & Documentation Report",
      summary: "Analysis of document submission quality and compliance rates",
      sections: [
        {
          heading: "Document Completeness",
          content: "Complete on first submission: 68% | Required revisions: 28% | Multiple revisions: 4%",
        },
        {
          heading: "Common Issues",
          content: "1. Expired business permits (34%)\n2. Incomplete financial statements (22%)\n3. Unclear project proposals (18%)\n4. Missing signatures/notarization (12%)",
        },
        {
          heading: "Recommendations",
          content: "• Implement automated document validation\n• Provide clearer submission guidelines\n• Offer pre-submission consultation sessions",
        },
      ],
    };
  }

  // General report
  return {
    ...baseReport,
    title: "SETUP Program Overview Report",
    summary: "Comprehensive overview of SETUP program activities and performance",
    sections: [
      {
        heading: "Overall Performance",
        content: "Applications received: 234 | Approved: 156 | In progress: 67 | Success rate: 88.2%",
      },
      {
        heading: "Provincial Distribution (Region XII)",
        content: "South Cotabato: 32% | General Santos City: 24% | Sultan Kudarat: 18% | Cotabato: 16% | Sarangani: 10%",
      },
      {
        heading: "Fund Utilization",
        content: "Total allocated: ₱187.5M | Disbursed: ₱156.2M | Pending: ₱31.3M | Utilization rate: 83.3%",
      },
    ],
  };
}

// ── Main Chatbot ──────────────────────────────────────────────────────────────

export function DOSTChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [lang, setLang] = useState<Lang>("en-PH");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "0",
      role: "assistant",
      timestamp: new Date(),
      content:
        "Magandang araw! 👋 I'm your DOST aiSETUP Assistant. I can answer your questions in English or Filipino, and I can also generate reports and checklists for you. You can also speak to me using the mic button!\n\nAno ang maari kong itulungan sa inyo ngayon?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Voice states
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [transcript, setTranscript] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  // Speech synthesis ref
  useEffect(() => {
    if ("speechSynthesis" in window)
      synthRef.current = window.speechSynthesis;
  }, []);

  useEffect(() => {
    if (isOpen && !isMinimized)
      messagesEndRef.current?.scrollIntoView({
        behavior: "smooth",
      });
  }, [messages, isOpen, isMinimized]);

  useEffect(() => {
    if (isOpen && !isMinimized)
      setTimeout(() => inputRef.current?.focus(), 100);
  }, [isOpen, isMinimized]);

  // ── Text to Speech ────────────────────────────────────────────────────────

  const speak = useCallback(
    (text: string) => {
      if (!voiceEnabled || !synthRef.current) return;
      synthRef.current.cancel();
      const plainText = text
        .replace(/[*_#`]/g, "")
        .substring(0, 500);
      const utt = new SpeechSynthesisUtterance(plainText);
      utt.lang = lang;
      utt.rate = 0.95;
      utt.pitch = 1.0;
      utt.volume = 1;

      // Pick a voice matching the language
      const voices = synthRef.current.getVoices();
      const match =
        voices.find((v) => v.lang === lang) ||
        voices.find((v) => v.lang.startsWith("en"));
      if (match) utt.voice = match;

      utt.onstart = () => setIsSpeaking(true);
      utt.onend = () => setIsSpeaking(false);
      utt.onerror = () => setIsSpeaking(false);
      synthRef.current.speak(utt);
    },
    [voiceEnabled, lang],
  );

  const stopSpeaking = () => {
    synthRef.current?.cancel();
    setIsSpeaking(false);
  };

  // ── Speech Recognition ────────────────────────────────────────────────────

  const startListening = useCallback(() => {
    const SR =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SR) {
      alert(
        "Speech recognition is not supported in your browser. Please use Chrome.",
      );
      return;
    }

    if (recognitionRef.current) recognitionRef.current.abort();

    const rec = new SR();
    rec.lang = lang;
    rec.continuous = false;
    rec.interimResults = true;
    rec.maxAlternatives = 1;
    recognitionRef.current = rec;

    rec.onstart = () => {
      setIsListening(true);
      setTranscript("");
    };
    rec.onresult = (e: SpeechRecognitionEvent) => {
      const result = Array.from(e.results)
        .map((r) => r[0].transcript)
        .join("");
      setTranscript(result);
      if (e.results[e.results.length - 1].isFinal) {
        setInput(result);
      }
    };
    rec.onerror = () => {
      setIsListening(false);
      setTranscript("");
    };
    rec.onend = () => {
      setIsListening(false);
    };
    rec.start();
  }, [lang]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  const toggleListening = () => {
    if (isListening) stopListening();
    else startListening();
  };

  // ── Download report ───────────────────────────────────────────────────────

  const downloadReport = (report: GeneratedReport) => {
    const lines = [
      report.title,
      "=".repeat(report.title.length),
      "",
      ...report.sections.flatMap((s) => [
        s.heading,
        "-".repeat(s.heading.length),
        s.content,
        "",
      ]),
      `Generated by DOST aiSETUP Assistant — ${new Date().toLocaleDateString("en-PH")}`,
    ];
    const blob = new Blob([lines.join("\n")], {
      type: "text/plain",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${report.title.replace(/\s+/g, "_")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Send message ──────────────────────────────────────────────────────────

  const sendMessage = async (
    text: string,
    fromVoice = false,
  ) => {
    if (!text.trim() || isLoading) return;
    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text.trim(),
      timestamp: new Date(),
      isVoice: fromVoice,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setTranscript("");
    setIsLoading(true);

    try {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 800));

      const userText = text.toLowerCase();
      let content = "";
      let reportData: GeneratedReport | undefined;

      // Check if user is asking for a report
      if (isReport(text)) {
        const reportType = userText.includes("prescreening")
          ? "prescreening"
          : userText.includes("assessment")
            ? "assessment"
            : userText.includes("compliance")
              ? "compliance"
              : "general";

        reportData = generateMockReport(reportType);
        content = "I've generated the requested report based on current data from the SETUP program database.";
      } else {
        // Generate contextual response based on keywords
        content = generateMockResponse(userText);
      }

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content,
        timestamp: new Date(),
        reportData,
      };
      setMessages((prev) => [...prev, assistantMsg]);

      // Speak the response if voice was used or voice is enabled
      if (fromVoice || voiceEnabled) speak(content);
    } catch {
      const errMsg =
        lang === "fil-PH"
          ? "Nagkaroon ng problema sa koneksyon. Pakisubukan muli."
          : "I'm having trouble connecting. Please try again or contact DOST Region XII in Koronadal City.";
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: errMsg,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoiceSend = () => {
    if (transcript || input)
      sendMessage(transcript || input, true);
  };

  const clearChat = () => {
    stopSpeaking();
    setMessages([
      {
        id: Date.now().toString(),
        role: "assistant",
        timestamp: new Date(),
        content:
          lang === "fil-PH"
            ? "Kumusta! Ako ang inyong DOST aiSETUP Assistant. Paano kita matutulungan ngayon?"
            : "Hello! I'm your DOST aiSETUP Assistant. How can I help you today?",
      },
    ]);
  };

  const switchLang = () => {
    stopSpeaking();
    stopListening();
    const next: Lang = lang === "en-PH" ? "fil-PH" : "en-PH";
    setLang(next);
  };

  const fmt = (d: Date) =>
    d.toLocaleTimeString("en-PH", {
      hour: "2-digit",
      minute: "2-digit",
    });
  const quickQs =
    lang === "fil-PH"
      ? QUICK_QUESTIONS_FIL
      : QUICK_QUESTIONS_EN;
  const isReport = (q: string) =>
    q.toLowerCase().includes("generat") ||
    q.toLowerCase().includes("gumawa") ||
    q.toLowerCase().includes("checklist");

  return (
    <>
      {/* ── Bubble button ── */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-5 right-5 z-50 w-14 h-14 bg-[#0C2461] text-white rounded-full shadow-2xl flex items-center justify-center hover:bg-blue-800 transition-all hover:scale-110 group"
        >
          <MessageCircle className="w-6 h-6" />
          <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-green-400 rounded-full border-2 border-white animate-pulse" />
          <div className="absolute right-full mr-3 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-lg pointer-events-none">
            AI Assistant · Voice &amp; Text
          </div>
        </button>
      )}

      {/* ── Chat window ── */}
      {isOpen && (
        <div
          className={`fixed z-50 bg-white rounded-2xl shadow-2xl flex flex-col border border-gray-200 transition-all duration-200
            /* Mobile: full-width near bottom */
            bottom-4 right-4 left-4
            sm:left-auto sm:w-[380px] sm:bottom-5 sm:right-5
            ${isMinimized ? "h-14" : "h-[580px] sm:h-[600px]"}`}
          style={{ maxHeight: "calc(100vh - 32px)" }}
        >
          {/* Header */}
          <div className="bg-[#0C2461] text-white px-4 py-3 rounded-t-2xl flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow shrink-0">
                <Bot className="w-4 h-4 text-[#0C2461]" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="font-bold text-sm truncate">
                    DOST aiSETUP Assistant
                  </p>
                  <Sparkles className="w-3 h-3 text-yellow-300 shrink-0" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full shrink-0" />
                  <span className="text-[10px] text-white/60">
                    {lang === "fil-PH"
                      ? "Filipino · Naka-enable ang boses"
                      : "English · Voice enabled"}
                  </span>
                  {isSpeaking && <VoiceWave active />}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {/* Language toggle */}
              <button
                onClick={switchLang}
                title="Switch language"
                className="flex items-center gap-1 w-auto px-2 h-7 rounded-full hover:bg-white/20 text-[10px] font-bold transition-colors"
              >
                <Globe className="w-3 h-3" />
                {lang === "en-PH" ? "EN" : "FIL"}
              </button>
              {/* Mute/unmute TTS */}
              <button
                onClick={() => {
                  voiceEnabled ? stopSpeaking() : null;
                  setVoiceEnabled((p) => !p);
                }}
                title={
                  voiceEnabled ? "Mute voice" : "Unmute voice"
                }
                className="w-7 h-7 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                {voiceEnabled ? (
                  <Volume2 className="w-3.5 h-3.5" />
                ) : (
                  <VolumeX className="w-3.5 h-3.5" />
                )}
              </button>
              <button
                onClick={clearChat}
                title="Clear chat"
                className="w-7 h-7 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsMinimized((p) => !p)}
                className="w-7 h-7 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${isMinimized ? "rotate-180" : ""}`}
                />
              </button>
              <button
                onClick={() => {
                  setIsOpen(false);
                  setIsMinimized(false);
                  stopSpeaking();
                  stopListening();
                }}
                className="w-7 h-7 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/80">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                  >
                    <div
                      className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center ${
                        msg.role === "user"
                          ? "bg-[#0C2461]"
                          : "bg-white border border-gray-200 shadow-sm"
                      }`}
                    >
                      {msg.role === "user" ? (
                        msg.isVoice ? (
                          <Mic className="w-3.5 h-3.5 text-white" />
                        ) : (
                          <User className="w-4 h-4 text-white" />
                        )
                      ) : (
                        <Bot className="w-4 h-4 text-blue-700" />
                      )}
                    </div>
                    <div
                      className={`max-w-[82%] flex flex-col gap-1 ${msg.role === "user" ? "items-end" : "items-start"}`}
                    >
                      <div
                        className={`px-3 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                          msg.role === "user"
                            ? "bg-[#0C2461] text-white rounded-tr-sm"
                            : "bg-white text-gray-800 shadow-sm border border-gray-100 rounded-tl-sm"
                        }`}
                      >
                        {msg.content}
                      </div>
                      {msg.reportData && (
                        <ReportCard
                          report={msg.reportData}
                          onDownload={downloadReport}
                        />
                      )}
                      <div className="flex items-center gap-1.5 px-1">
                        <span className="text-[10px] text-gray-400">
                          {fmt(msg.timestamp)}
                        </span>
                        {msg.isVoice && (
                          <span className="text-[9px] text-blue-400 font-medium">
                            🎙 voice
                          </span>
                        )}
                        {msg.role === "assistant" && (
                          <button
                            onClick={() => speak(msg.content)}
                            title="Read aloud"
                            className="text-gray-300 hover:text-blue-400 transition-colors"
                          >
                            <Volume2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Listening indicator */}
                {isListening && (
                  <div className="flex gap-2 items-center">
                    <div className="w-7 h-7 rounded-full bg-red-500 flex items-center justify-center animate-pulse shrink-0">
                      <Mic className="w-4 h-4 text-white" />
                    </div>
                    <div className="bg-white border border-red-100 shadow-sm px-4 py-2.5 rounded-2xl rounded-tl-sm">
                      <div className="flex items-center gap-2">
                        <VoiceWave active={isListening} />
                        <span className="text-xs text-gray-500 italic">
                          {transcript ||
                            (lang === "fil-PH"
                              ? "Nakikinig..."
                              : "Listening...")}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {isLoading && (
                  <div className="flex gap-2">
                    <div className="w-7 h-7 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-blue-700" />
                    </div>
                    <div className="bg-white border border-gray-100 shadow-sm px-4 py-3 rounded-2xl rounded-tl-sm">
                      <div className="flex gap-1 items-center">
                        {[0, 150, 300].map((d) => (
                          <span
                            key={d}
                            className="w-2 h-2 bg-[#0C2461] rounded-full animate-bounce"
                            style={{ animationDelay: `${d}ms` }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick questions */}
              {messages.length <= 1 && (
                <div className="px-4 py-3 bg-white border-t border-gray-100 flex-shrink-0">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">
                    {lang === "fil-PH"
                      ? "Mabilis na mga tanong"
                      : "Quick actions"}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {quickQs.map((q) => (
                      <button
                        key={q}
                        onClick={() => sendMessage(q)}
                        disabled={isLoading}
                        className={`text-xs rounded-full px-2.5 py-1 border transition-colors disabled:opacity-50 ${
                          isReport(q)
                            ? "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                            : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                        }`}
                      >
                        {isReport(q) ? "📄 " : ""}
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Input area */}
              <div className="px-4 py-3 border-t border-gray-200 bg-white rounded-b-2xl flex-shrink-0">
                <div className="flex gap-2 items-end">
                  {/* Mic button */}
                  <button
                    onClick={
                      isListening
                        ? () => {
                            stopListening();
                            handleVoiceSend();
                          }
                        : toggleListening
                    }
                    disabled={isLoading}
                    title={
                      isListening
                        ? lang === "fil-PH"
                          ? "Itigil at ipadala"
                          : "Stop & send"
                        : lang === "fil-PH"
                          ? "Magsalita"
                          : "Speak"
                    }
                    className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all shrink-0 disabled:opacity-40 ${
                      isListening
                        ? "bg-red-500 hover:bg-red-600 text-white animate-pulse"
                        : "bg-gray-100 hover:bg-gray-200 text-gray-600"
                    }`}
                  >
                    {isListening ? (
                      <MicOff className="w-4 h-4" />
                    ) : (
                      <Mic className="w-4 h-4" />
                    )}
                  </button>

                  <textarea
                    ref={inputRef}
                    value={transcript || input}
                    onChange={(e) => {
                      setInput(e.target.value);
                      setTranscript("");
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage(transcript || input);
                      }
                    }}
                    disabled={isLoading || isListening}
                    placeholder={
                      lang === "fil-PH"
                        ? "Magtanong o magsalita..."
                        : "Ask a question or use the mic..."
                    }
                    rows={1}
                    className="flex-1 resize-none border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0C2461]/20 focus:border-[#0C2461]/40 disabled:bg-gray-50 max-h-24"
                    style={{ overflowY: "auto" }}
                  />

                  <button
                    onClick={() =>
                      sendMessage(transcript || input)
                    }
                    disabled={
                      isLoading ||
                      (!input.trim() && !transcript.trim())
                    }
                    className="w-9 h-9 bg-[#0C2461] text-white rounded-xl flex items-center justify-center hover:bg-blue-800 transition-colors disabled:opacity-40 shrink-0"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </button>
                </div>

                <div className="flex items-center justify-between mt-1.5">
                  <p className="text-[10px] text-gray-400">
                    {isListening
                      ? lang === "fil-PH"
                        ? "🔴 Nakikinig — pindutin ang mic para itigil"
                        : "🔴 Listening — tap mic to stop & send"
                      : lang === "fil-PH"
                        ? "Pindutin ang mic o mag-type"
                        : "Tap mic to speak or type a message"}
                  </p>
                  {isSpeaking && (
                    <button
                      onClick={stopSpeaking}
                      className="text-[10px] text-blue-500 hover:text-blue-700 font-medium flex items-center gap-1"
                    >
                      <VolumeX className="w-3 h-3" /> Stop
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}