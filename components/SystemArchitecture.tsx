import { ArrowRight } from "lucide-react";

const steps = [
  {
    id: "market-data",
    label: "Market Data",
    description: "시장 데이터 수집 및 정규화",
  },
  {
    id: "strategy-logic",
    label: "Strategy Logic",
    description: "규칙 기반 전략 로직",
  },
  {
    id: "risk-filter",
    label: "Risk Filter",
    description: "포지션·손절·한도 검증",
  },
  {
    id: "execution-engine",
    label: "Execution Engine",
    description: "주문 실행 및 모니터링",
  },
  {
    id: "monitoring",
    label: "Monitoring",
    description: "로그·상태·알림",
  },
];

export default function SystemArchitecture() {
  return (
    <section
      id="system-architecture"
      className="px-6 py-20 md:py-28 border-t border-[var(--border)]"
    >
      <div className="max-w-5xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--foreground)] text-center">
          System Architecture
        </h2>
        {/* Desktop: horizontal flow */}
        <div className="mt-16 hidden lg:flex flex-wrap items-stretch justify-center gap-2">
          {steps.map((step, i) => (
            <div key={step.id} className="flex items-center gap-2">
              <div className="w-[140px] rounded-lg border border-[var(--border)] bg-white/[0.02] px-3 py-4 text-center">
                <h3 className="text-xs font-medium uppercase tracking-wider text-[var(--foreground)]">
                  {step.label}
                </h3>
                <p className="mt-1 text-[11px] text-[var(--muted)] leading-tight">
                  {step.description}
                </p>
              </div>
              {i < steps.length - 1 && (
                <ArrowRight
                  className="h-4 w-4 shrink-0 text-[var(--muted)]"
                  strokeWidth={1.5}
                />
              )}
            </div>
          ))}
        </div>
        {/* Mobile: vertical flow */}
        <div className="mt-12 lg:hidden flex flex-col gap-3">
          {steps.map((step, i) => (
            <div key={step.id} className="flex items-center gap-3">
              <div className="flex shrink-0 h-8 w-8 rounded-full border border-[var(--border)] flex items-center justify-center text-xs font-medium text-[var(--muted)]">
                {i + 1}
              </div>
              <div className="flex-1 rounded-lg border border-[var(--border)] bg-white/[0.02] px-4 py-3">
                <h3 className="text-sm font-medium uppercase tracking-wider text-[var(--foreground)]">
                  {step.label}
                </h3>
                <p className="mt-1 text-xs text-[var(--muted)]">
                  {step.description}
                </p>
              </div>
              {i < steps.length - 1 && (
                <ArrowRight
                  className="h-5 w-5 shrink-0 rotate-90 text-[var(--muted)]"
                  strokeWidth={1.5}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
