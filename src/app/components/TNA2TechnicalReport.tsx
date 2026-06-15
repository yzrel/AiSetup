import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  FileText,
  Download,
  CheckCircle,
  Mic,
  Globe,
  ClipboardList,
  Wrench,
  BarChart2,
  Lightbulb,
  TrendingUp,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

interface Section {
  id: string;
  title: string;
  icon: React.ReactNode;
  content: React.ReactNode;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function CollapsibleSection({
  title,
  icon,
  children,
  defaultOpen = true,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden mb-4">
      <button
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-gray-50 transition-colors text-left"
      >
        <div className="flex items-center gap-2 text-blue-700 font-semibold text-sm">
          {icon}
          {title}
        </div>
        {open ? (
          <ChevronUp className="w-4 h-4 text-gray-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400" />
        )}
      </button>

      {open && (
        <div className="px-4 pb-4 pt-2 bg-white text-sm text-gray-700 space-y-2 border-t border-gray-100">
          {children}
        </div>
      )}
    </div>
  );
}

function InfoRow({
  label,
  value,
  badge,
}: {
  label: string;
  value: string;
  badge?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between py-1 border-b border-gray-50 last:border-0">
      <span className="text-gray-500 w-40 shrink-0">
        {label}
      </span>
      <span className="flex-1 font-medium text-gray-800">
        {value}
      </span>
      {badge && <span>{badge}</span>}
    </div>
  );
}

function StatusBadge({
  label,
  color,
}: {
  label: string;
  color: "green" | "yellow" | "blue" | "gray";
}) {
  const colors = {
    green: "bg-green-100 text-green-700 border-green-200",
    yellow: "bg-yellow-100 text-yellow-700 border-yellow-200",
    blue: "bg-blue-100 text-blue-700 border-blue-200",
    gray: "bg-gray-100 text-gray-600 border-gray-200",
  };
  return (
    <span
      className={`text-xs font-medium px-2 py-0.5 rounded-full border ${colors[color]}`}
    >
      {label}
    </span>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ol className="list-decimal list-inside space-y-1 pl-1">
      {items.map((item, i) => (
        <li key={i} className="text-gray-700">
          {item}
        </li>
      ))}
    </ol>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

interface TNA2TechnicalReportProps {
  onSubmitSuccess?: () => void;
}

export function TNA2TechnicalReport({ onSubmitSuccess }: TNA2TechnicalReportProps = {}) {
  const [language, setLanguage] = useState<
    "English" | "Filipino"
  >("English");

  // ── Fake data matching the screenshot ──────────────────────────────────────
  const applicantName = "Juan Dela Cruz";
  const applicationId = "LOI-2024-000145";
  const docRef = "TNA2-2024-000045";
  const date = "April 27, 2024";

  const reportIncludes = [
    "Technical Analysis",
    "Technology Gap Identification",
    "Recommended Equipment List",
    "Equipment Recommendation",
    "Expected Productivity Improvement",
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* ── Page Header ── */}
      <div className="max-w-6xl mx-auto">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              TNA 2 Technical Report
            </h1>
            <p className="text-gray-500 text-sm mt-1 max-w-2xl">
              This auto-generated TNA 2 report provides a
              comprehensive technical analysis of the current
              operational conditions of the enterprise,
              identifies technology gaps, and proposes science
              and technology interventions for productivity
              improvement.
            </p>
          </div>
        </div>

        {/* ── Meta bar ── */}
        <div className="flex flex-wrap items-center gap-4 mb-6 text-sm text-gray-600">
          <span>
            <span className="text-gray-400">
              Applicant Name
            </span>{" "}
            &nbsp;{" "}
            <span className="font-semibold text-gray-800">
              {applicantName}
            </span>
          </span>
          <span>
            <span className="text-gray-400">
              Application ID:
            </span>{" "}
            &nbsp;{" "}
            <span className="font-semibold text-gray-800">
              {applicationId}
            </span>
          </span>
          <span className="font-semibold text-gray-800">
            {docRef}
          </span>
          <button className="ml-auto flex items-center gap-1.5 bg-blue-600 text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            <Download className="w-3.5 h-3.5" />
            Download PDF
          </button>
        </div>

        {/* ── Two-column layout ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ── LEFT: Report body ── */}
          <div className="lg:col-span-2 space-y-1">
            {/* Report header card */}
            <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2 text-blue-700 font-semibold mb-4">
                <ClipboardList className="w-5 h-5" />
                TNA 2 Technical Report
              </div>

              {/* DOST branding strip */}
              <div className="flex items-center gap-3 border border-gray-200 rounded-lg p-3 mb-4">
                <div className="w-10 h-10 bg-blue-600 rounded flex items-center justify-center shrink-0">
                  <span className="text-white font-bold text-xs">
                    ai
                  </span>
                </div>
                <div>
                  <p className="font-bold text-blue-700 text-sm">
                    DOST &nbsp; TNA 2
                  </p>
                  <p className="text-xs text-gray-400">
                    Technology Needs Assessment Report
                  </p>
                </div>
                <span className="ml-auto text-xs bg-gray-100 border border-gray-200 text-gray-500 px-2 py-0.5 rounded">
                  STAGE
                </span>
              </div>

              <p className="text-center text-blue-600 font-semibold text-sm mb-3">
                TNA 2 Technical No: {docRef}
              </p>

              <div className="flex justify-between text-xs text-gray-500">
                <span>Document Reference Number: {docRef}</span>
                <span>{date}</span>
              </div>
            </div>

            {/* Enterprise Profile */}
            <CollapsibleSection
              title="Enterprise Profile"
              icon={<FileText className="w-4 h-4" />}
            >
              <InfoRow
                label="Business Name:"
                value="ABC Food Processing"
                badge={
                  <StatusBadge
                    label="Completed"
                    color="green"
                  />
                }
              />
              <InfoRow
                label="Business Address:"
                value="123 Mabini St., Cotabato, SOCCSKSARGEN"
                badge={
                  <StatusBadge
                    label="TNA Pregree"
                    color="blue"
                  />
                }
              />
              <InfoRow
                label="Business Type:"
                value="Food Processing"
                badge={
                  <StatusBadge label="Pending" color="yellow" />
                }
              />
              <InfoRow
                label="Location:"
                value="Warehouse food preserves, jams, producing fruit preserves and jams."
              />
              <InfoRow
                label="Employees:"
                value="23 (at least 35 years)"
              />
            </CollapsibleSection>

            {/* Production Process Analysis */}
            <CollapsibleSection
              title="Production Process Analysis"
              icon={<Wrench className="w-4 h-4" />}
            >
              <p className="text-gray-600 text-xs mb-2">
                Current production setup including the
                dexeletafied process
              </p>
              <BulletList
                items={[
                  "Outdated equipment such as cooking prolca-divetated technology",
                  "Inefficient manual packing operations, un it tisa kbrem-pointnoles scansa",
                  "High product spoilage rates for the fliewed sstor-stanvices",
                ]}
              />
            </CollapsibleSection>

            {/* Technology Gap Analysis */}
            <CollapsibleSection
              title="Technology Gap Analysis"
              icon={<BarChart2 className="w-4 h-4" />}
            >
              <p className="text-gray-600 text-xs mb-2">
                Hiedwank, or outdated technologies by tatretiss
                ine eagreptitary technology.
              </p>
              <BulletList
                items={[
                  "Outdated cooking and sterilization equipment",
                  "Manual packing leading to bottlenecks and pred espolciing statebly onippody",
                  "Lack of automatiom and rapid cooking, cappotalizes for product quanly rates",
                ]}
              />
            </CollapsibleSection>

            {/* Proposed Technology Intervention */}
            <CollapsibleSection
              title="Proposed Technology Intervention"
              icon={<Lightbulb className="w-4 h-4" />}
            >
              <BulletList
                items={[
                  "Upgreds to upgraeite to newer, automated cooking and sterilizatiom equipment. Erinsures consistent, reliable processing.",
                  "Automating packing process with sani automatic filing and sealing machines.",
                  "Installing temperature-controlled storage to reduce spoilage and extend shelf life.",
                ]}
              />
            </CollapsibleSection>

            {/* Recommended Equipment List */}
            <CollapsibleSection
              title="Recommended Equipment List"
              icon={<ClipboardList className="w-4 h-4" />}
              defaultOpen={false}
            >
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-blue-50">
                      <th className="text-left p-2 border border-gray-200 text-blue-700">
                        #
                      </th>
                      <th className="text-left p-2 border border-gray-200 text-blue-700">
                        Equipment
                      </th>
                      <th className="text-left p-2 border border-gray-200 text-blue-700">
                        Qty
                      </th>
                      <th className="text-left p-2 border border-gray-200 text-blue-700">
                        Est. Cost (₱)
                      </th>
                      <th className="text-left p-2 border border-gray-200 text-blue-700">
                        Priority
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      {
                        name: "Automated Cooking Retort",
                        qty: 1,
                        cost: "1,200,000",
                        priority: "High",
                      },
                      {
                        name: "Automatic Sealing Machine",
                        qty: 2,
                        cost: "450,000",
                        priority: "High",
                      },
                      {
                        name: "Cold Storage Unit (5-ton)",
                        qty: 1,
                        cost: "850,000",
                        priority: "Medium",
                      },
                      {
                        name: "pH & Brix Testing Kit",
                        qty: 3,
                        cost: "75,000",
                        priority: "Medium",
                      },
                      {
                        name: "Industrial Food Dehydrator",
                        qty: 1,
                        cost: "320,000",
                        priority: "Low",
                      },
                    ].map((row, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="p-2 border border-gray-200">
                          {i + 1}
                        </td>
                        <td className="p-2 border border-gray-200 font-medium">
                          {row.name}
                        </td>
                        <td className="p-2 border border-gray-200">
                          {row.qty}
                        </td>
                        <td className="p-2 border border-gray-200">
                          {row.cost}
                        </td>
                        <td className="p-2 border border-gray-200">
                          <StatusBadge
                            label={row.priority}
                            color={
                              row.priority === "High"
                                ? "green"
                                : row.priority === "Medium"
                                  ? "yellow"
                                  : "gray"
                            }
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CollapsibleSection>

            {/* Expected Productivity Improvement */}
            <CollapsibleSection
              title="Expected Productivity Improvement"
              icon={<TrendingUp className="w-4 h-4" />}
              defaultOpen={false}
            >
              <div className="grid grid-cols-3 gap-3 mb-3">
                {[
                  {
                    label: "Production Volume",
                    before: "120 kg/day",
                    after: "280 kg/day",
                    gain: "+133%",
                  },
                  {
                    label: "Spoilage Rate",
                    before: "18%",
                    after: "4%",
                    gain: "-78%",
                  },
                  {
                    label: "Labor Cost",
                    before: "₱45,000/mo",
                    after: "₱28,000/mo",
                    gain: "-38%",
                  },
                ].map((kpi) => (
                  <div
                    key={kpi.label}
                    className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-center"
                  >
                    <p className="text-xs text-blue-500 font-medium mb-1">
                      {kpi.label}
                    </p>
                    <p className="text-xs text-gray-500">
                      Before: {kpi.before}
                    </p>
                    <p className="text-xs text-gray-500">
                      After: {kpi.after}
                    </p>
                    <p className="text-sm font-bold text-blue-700 mt-1">
                      {kpi.gain}
                    </p>
                  </div>
                ))}
              </div>
              <BulletList
                items={[
                  "Estimated ROI within 24–30 months post-technology adoption.",
                  "Projected revenue increase of ₱1.8M annually after full implementation.",
                  "GMP and HACCP compliance achievable within 6 months of upgrade.",
                ]}
              />
            </CollapsibleSection>

            {/* Tip bar */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 text-xs text-blue-700 mt-2">
              <span className="font-semibold">Tip:</span> This
              report is generated based on data from TNA Form 1,
              site validation findings, and uploaded
              requirements.
            </div>
          </div>

          {/* ── RIGHT: Sidebar ── */}
          <div className="space-y-4">
            {/* Report includes card */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <p className="font-semibold text-gray-700 mb-3 text-sm">
                This report includes:
              </p>
              <ul className="space-y-2">
                {reportIncludes.map((item) => (
                  <li
                    key={item}
                    className="flex items-center gap-2 text-sm text-gray-700"
                  >
                    <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Illustration */}
            <div className="bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg overflow-hidden h-36 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-2 shadow">
                  <ClipboardList className="w-8 h-8 text-blue-600" />
                </div>
                <p className="text-xs text-blue-700 font-medium">
                  TNA 2 Assessment
                </p>
              </div>
            </div>

            {/* Second report includes */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <p className="font-semibold text-gray-700 mb-3 text-sm">
                This report includes:
              </p>
              <ul className="space-y-2">
                {reportIncludes.map((item) => (
                  <li
                    key={item}
                    className="flex items-center gap-2 text-sm text-gray-700"
                  >
                    <CheckCircle className="w-4 h-4 text-blue-400 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Download buttons */}
            <div className="space-y-2">
              <button className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors">
                <Download className="w-4 h-4" />
                Download TNA 2 Report (PDF)
              </button>
              <button className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors">
                <Download className="w-4 h-4" />
                Download Technical Summary (DoCX)
              </button>
              <button className="w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors">
                <Download className="w-4 h-4" />
                Download Equipment List (CSV)
              </button>
            </div>

            {/* Voice / language */}
            <div className="bg-white border border-gray-200 rounded-lg p-3 flex items-center gap-3">
              <button className="flex items-center gap-1.5 text-blue-600 text-sm font-medium hover:text-blue-800 transition-colors">
                <Mic className="w-4 h-4" />
                Voice Input
              </button>
              <div className="ml-auto">
                <button
                  onClick={() =>
                    setLanguage(
                      language === "English"
                        ? "Filipino"
                        : "English",
                    )
                  }
                  className="flex items-center gap-1.5 border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Globe className="w-3.5 h-3.5" />
                  {language}
                  <ChevronDown className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}