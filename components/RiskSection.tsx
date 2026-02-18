import { Ruler, Scissors, TrendingUp, AlertTriangle } from "lucide-react";

const items = [
  {
    icon: Ruler,
    title: "포지션 사이징",
    description: "계정 규모와 변동성에 맞춘 포지션 크기 결정",
  },
  {
    icon: Scissors,
    title: "손절 규칙",
    description: "사전 정의된 손절 라인과 실행 규칙",
  },
  {
    icon: TrendingUp,
    title: "변동성 고려",
    description: "시장 변동성에 따른 리스크 조정",
  },
  {
    icon: AlertTriangle,
    title: "최대 손실 한도",
    description: "일/주 단위 손실 상한과 중단 조건",
  },
];

export default function RiskSection() {
  return (
    <section
      id="risk"
      className="px-6 py-20 md:py-28 border-t border-[var(--border)]"
    >
      <div className="max-w-5xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--foreground)] text-center">
          Risk Before Return
        </h2>
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 gap-6">
          {items.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="rounded-lg border border-[var(--border)] bg-white/[0.02] p-6"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--border)] text-[var(--muted)]">
                <Icon className="h-5 w-5" strokeWidth={1.5} />
              </div>
              <h3 className="mt-4 text-base font-medium text-[var(--foreground)]">
                {title}
              </h3>
              <p className="mt-2 text-sm text-[var(--muted)] leading-relaxed">
                {description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
