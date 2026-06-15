import { useState } from "react";
import {
  Download,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  CheckCircle,
  Mic,
  Globe,
  FileText,
  BarChart2,
  Target,
  Info,
  Calendar,
  DollarSign,
  Users,
  Briefcase,
  TrendingUp,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface BudgetItem {
  id: string;
  name: string;
  subTotal: string;
  amount: string;
}

interface Section {
  id: string;
  label: string;
  icon: React.ReactNode;
}

// ── Step Progress Bar ─────────────────────────────────────────────────────────

function StepBar({
  current = 7,
  total = 10,
}: {
  current?: number;
  total?: number;
}) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: total }, (_, i) => i + 1).map(
        (n) => (
          <div
            key={n}
            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${
              n < current
                ? "bg-green-500 border-green-500 text-white"
                : n === current
                  ? "bg-blue-600 border-blue-600 text-white ring-2 ring-blue-300"
                  : "bg-white border-gray-300 text-gray-400"
            }`}
          >
            {n}
          </div>
        ),
      )}
    </div>
  );
}

// ── Collapsible Section ───────────────────────────────────────────────────────

function CollapsibleSection({
  number,
  title,
  children,
  defaultOpen = true,
}: {
  number: number;
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden mb-3">
      <button
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-gray-50 text-left"
      >
        <span className="font-semibold text-sm text-gray-800">
          {number}. {title}
        </span>
        {open ? (
          <ChevronUp className="w-4 h-4 text-gray-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400" />
        )}
      </button>
      {open && (
        <div className="px-4 pb-4 pt-1 bg-white border-t border-gray-100 text-sm text-gray-700">
          {children}
        </div>
      )}
    </div>
  );
}

// ── Checklist Sidebar ─────────────────────────────────────────────────────────

const CHECKLIST_ITEMS = [
  "Project Overview",
  "Objectives",
  "Technical Interventions",
  "Equipment Specifications",
  "Budget Breakdown",
  "Schedule of Activities",
  "Expected Outcomes",
];

function ProposalChecklist() {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <p className="font-semibold text-gray-700 mb-3 text-sm">
        Proposal Checklist:
      </p>
      <ul className="space-y-2">
        {CHECKLIST_ITEMS.map((item) => (
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
  );
}

// ── Additional Info Grid ──────────────────────────────────────────────────────

const ADD_INFO_ITEMS = [
  {
    label: "Organizational Chart",
    icon: <Users className="w-3.5 h-3.5" />,
  },
  {
    label: "Skills and Expertise",
    icon: <Briefcase className="w-3.5 h-3.5" />,
  },
  {
    label: "Updated Product Information",
    icon: <Info className="w-3.5 h-3.5" />,
  },
  {
    label: "Technical Interventions",
    icon: <Target className="w-3.5 h-3.5" />,
  },
  {
    label: "Technical Interventions",
    icon: <ShieldCheck className="w-3.5 h-3.5" />,
  },
  {
    label: "Equipment Specifications",
    icon: <BarChart2 className="w-3.5 h-3.5" />,
  },
  {
    label: "Schedule of Activities",
    icon: <Calendar className="w-3.5 h-3.5" />,
  },
  {
    label: "Financial Plan",
    icon: <DollarSign className="w-3.5 h-3.5" />,
  },
  {
    label: "Financial Plan",
    icon: <TrendingUp className="w-3.5 h-3.5" />,
  },
  {
    label: "Risk Management Plan",
    icon: <ShieldCheck className="w-3.5 h-3.5" />,
  },
];

// ── Main Component ────────────────────────────────────────────────────────────

interface ProjectProposalProps {
  onSubmitSuccess?: () => void;
}

export function ProjectProposal({ onSubmitSuccess }: ProjectProposalProps = {}) {
  const [language, setLanguage] = useState<
    "English" | "Filipino"
  >("English");

  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([
    {
      id: "1",
      name: "Automatic Cooking/Sterilization System",
      subTotal: "",
      amount: "₱800,000",
    },
    {
      id: "2",
      name: "Semi-Automatic Filling & Sealing Machine",
      subTotal: "",
      amount: "₱900,000",
    },
    {
      id: "3",
      name: "Quick Cooling System",
      subTotal: "",
      amount: "₱300,000",
    },
    {
      id: "4",
      name: "Other Direct Costs",
      subTotal: "",
      amount: "₱500,000",
    },
  ]);

  const total = "₱2,500,000";

  const addItem = () => {
    setBudgetItems((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        name: "",
        subTotal: "",
        amount: "",
      },
    ]);
  };

  const removeItem = (id: string) => {
    setBudgetItems((prev) => prev.filter((i) => i.id !== id));
  };

  const updateItem = (
    id: string,
    field: keyof BudgetItem,
    value: string,
  ) => {
    setBudgetItems((prev) =>
      prev.map((i) =>
        i.id === id ? { ...i, [field]: value } : i,
      ),
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* ── Page Header ── */}
        <div className="mb-2">
          <h1 className="text-2xl font-bold text-gray-800">
            <span className="text-gray-400 font-normal">
              
            </span>{" "}
            Project Proposal
          </h1>
          <p className="text-gray-500 text-sm mt-1 max-w-2xl">
            Please fill out all sections to create a detailed
            SETUP project proposal for DOST review based on your
            TNA assessment and validated enterprise data for
            productivity improve.
          </p>
        </div>

        {/* ── Meta bar ── */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-4">
          <span>
            <span className="text-gray-400">
              Applicant Name
            </span>
            &nbsp;
            <span className="font-semibold text-gray-800">
              Juan Dela Cruz
            </span>
          </span>
          <span>
            <span className="text-gray-400">
              Application ID:
            </span>
            &nbsp;
            <span className="font-semibold text-gray-800">
              LOI-2024-000145
            </span>
          </span>
          <span className="font-semibold text-gray-800">
            TN0322-000145
          </span>
        </div>

        {/* ── Step bar + Download ── */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <StepBar current={7} total={10} />
          <button className="flex items-center gap-1.5 bg-blue-600 text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            <Download className="w-3.5 h-3.5" />
            Download PDF
          </button>
        </div>

        {/* ── Two-column layout ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ── LEFT: Form ── */}
          <div className="lg:col-span-2">
            {/* Header card */}
            <div className="bg-blue-600 text-white rounded-t-lg px-4 py-2.5 flex items-center gap-2 font-semibold text-sm">
              <FileText className="w-4 h-4" />
              SETUP Project Proposal
            </div>

            <div className="bg-white border border-gray-200 rounded-b-lg p-4 mb-4">
              {/* 1. Project Title */}
              <CollapsibleSection
                number={1}
                title="Project Title"
              >
                <input
                  type="text"
                  defaultValue="Production Efficiency Improvement at ABC Food Processing"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mt-1"
                />
              </CollapsibleSection>

              {/* 2. Budget */}
              <CollapsibleSection
                number={2}
                title="Project Cost and Amount Requested"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-blue-600 font-semibold bg-blue-50 px-2 py-0.5 rounded">
                    Total: ₱2,500,000
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">
                      Total Cost
                    </label>
                    <input
                      defaultValue="₱2,500,000"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">
                      Amount requested from SETUP
                    </label>
                    <input
                      defaultValue="₱2,500,000"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <p className="text-xs font-semibold text-gray-500 mb-2">
                  Breakdown of Items
                </p>
                <table className="w-full text-xs border-collapse mb-2">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left p-2 border border-gray-200 text-gray-600">
                        Breakdown of Items
                      </th>
                      <th className="text-left p-2 border border-gray-200 text-gray-600">
                        Sub Total
                      </th>
                      <th className="text-left p-2 border border-gray-200 text-gray-600">
                        Amount
                      </th>
                      <th className="p-2 border border-gray-200" />
                    </tr>
                  </thead>
                  <tbody>
                    {budgetItems.map((item) => (
                      <tr key={item.id}>
                        <td className="p-1 border border-gray-200">
                          <input
                            value={item.name}
                            onChange={(e) =>
                              updateItem(
                                item.id,
                                "name",
                                e.target.value,
                              )
                            }
                            className="w-full px-2 py-1 rounded focus:outline-none focus:ring-1 focus:ring-blue-400 text-xs"
                          />
                        </td>
                        <td className="p-1 border border-gray-200 w-24">
                          <input
                            value={item.subTotal}
                            onChange={(e) =>
                              updateItem(
                                item.id,
                                "subTotal",
                                e.target.value,
                              )
                            }
                            className="w-full px-2 py-1 rounded focus:outline-none focus:ring-1 focus:ring-blue-400 text-xs"
                          />
                        </td>
                        <td className="p-1 border border-gray-200 w-28">
                          <input
                            value={item.amount}
                            onChange={(e) =>
                              updateItem(
                                item.id,
                                "amount",
                                e.target.value,
                              )
                            }
                            className="w-full px-2 py-1 rounded focus:outline-none focus:ring-1 focus:ring-blue-400 text-xs"
                          />
                        </td>
                        <td className="p-1 border border-gray-200 w-8 text-center">
                          <button
                            onClick={() => removeItem(item.id)}
                            className="text-red-400 hover:text-red-600"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-blue-50">
                      <td
                        className="p-2 border border-gray-200 font-bold text-blue-700"
                        colSpan={2}
                      >
                        Total
                      </td>
                      <td className="p-2 border border-gray-200 font-bold text-blue-700">
                        {total}
                      </td>
                      <td className="p-2 border border-gray-200">
                        <span className="text-xs bg-blue-600 text-white px-1.5 py-0.5 rounded">
                          ok
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>

                <button
                  onClick={addItem}
                  className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-medium border border-blue-200 rounded-lg px-3 py-1.5 hover:bg-blue-50 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Item
                </button>
              </CollapsibleSection>

              {/* 3. Objectives */}
              <CollapsibleSection number={3} title="Objectives">
                <ul className="list-disc list-inside space-y-1.5 text-sm text-gray-700">
                  <li>
                    To enhance production efficiency through
                    upgraded cooking and sterilization
                    equipment.
                  </li>
                  <li>
                    To automate the packing process for
                    consistent product quality.
                  </li>
                  <li>
                    To improve cooling process to minimize
                    spoilage.
                  </li>
                </ul>
                <textarea
                  rows={2}
                  placeholder="Add more objectives..."
                  className="w-full mt-3 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </CollapsibleSection>

              {/* 4. Additional Information */}
              <CollapsibleSection
                number={4}
                title="Additional Information"
                defaultOpen={false}
              >
                <div className="grid grid-cols-2 gap-2 mt-1">
                  {ADD_INFO_ITEMS.map((item, i) => (
                    <button
                      key={i}
                      className="flex items-center justify-between gap-2 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-700 hover:bg-blue-50 hover:border-blue-300 transition-colors text-left"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-blue-500">
                          {item.icon}
                        </span>
                        {item.label}
                      </div>
                      <ArrowRight className="w-3 h-3 text-gray-400 shrink-0" />
                    </button>
                  ))}
                </div>
              </CollapsibleSection>

              {/* Risk Management Plan */}
              <CollapsibleSection
                number={5}
                title="Risk Management Plan"
                defaultOpen={false}
              >
                <textarea
                  rows={4}
                  placeholder="Describe risk management strategies..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </CollapsibleSection>
            </div>

            {/* Tip bar */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 text-xs text-blue-700 mb-4">
              <span className="font-semibold">Tip:</span> This
              report is generated based on data from TNA Form 1,
              site validation findings and uploaded from
              results.
            </div>

            {/* Action buttons */}
            <div className="flex gap-3">
              <button className="flex items-center gap-2 bg-gray-700 hover:bg-gray-800 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors">
                <FileText className="w-4 h-4" />
                Save as Draft
              </button>
              <button className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors">
                <CheckCircle className="w-4 h-4" />
                Generate Proposal
              </button>
            </div>
          </div>

          {/* ── RIGHT: Sidebar ── */}
          <div className="space-y-4">
            <ProposalChecklist />

            {/* Illustration */}
            <div className="bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg h-40 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-2 shadow">
                  <FileText className="w-8 h-8 text-blue-600" />
                </div>
                <p className="text-xs text-blue-700 font-medium">
                  SETUP Project Proposal
                </p>
              </div>
            </div>

            <ProposalChecklist />

            {/* Voice + Language */}
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