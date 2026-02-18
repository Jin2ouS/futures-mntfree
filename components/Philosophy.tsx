import {
  LayoutGrid,
  Cog,
  Percent,
  Shield,
} from "lucide-react";

const items = [
  {
    icon: LayoutGrid,
    title: "Structure",
    description: "시장을 예측하지 않는다",
  },
  {
    icon: Cog,
    title: "Automation",
    description: "반복을 시스템으로 만든다",
  },
  {
    icon: Percent,
    title: "Probability",
    description: "감정을 제거한다",
  },
  {
    icon: Shield,
    title: "Risk",
    description: "리스크를 수치화한다",
  },
];

export default function Philosophy() {
  return (
    <section className="px-6 py-20 md:py-28 border-t border-[var(--border)]">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--foreground)] text-center">
          Execution without Emotion
        </h2>
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6">
          {items.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="flex flex-col items-center text-center"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-[var(--border)] text-[var(--muted)]">
                <Icon className="h-6 w-6" strokeWidth={1.5} />
              </div>
              <h3 className="mt-4 text-sm font-medium uppercase tracking-wider text-[var(--foreground)]">
                {title}
              </h3>
              <p className="mt-2 text-sm text-[var(--muted)]">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
