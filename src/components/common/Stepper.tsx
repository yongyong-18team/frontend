type StepperProps = {
  current: number;
  total?: number;
  label?: string;
  className?: string;
};

export default function Stepper({ current, total = 4, label, className = "" }: StepperProps) {
  const step = Math.min(Math.max(current, 1), total);

  return (
    <div
      className={`flex flex-col gap-2 ${className}`}
      role="progressbar"
      aria-valuemin={1}
      aria-valuemax={total}
      aria-valuenow={step}
      aria-label={`${total}단계 중 ${step}단계${label ? `, ${label}` : ""}`}
    >
      <div className="flex items-baseline gap-2">
        <span className="text-caption font-bold text-primary-strong">
          {step} / {total} 단계
        </span>
        {label && <span className="text-caption text-text-secondary">{label}</span>}
      </div>

      <div className="flex gap-1.5">
        {Array.from({ length: total }, (_, i) => (
          <span
            key={i}
            className={`h-1.5 flex-1 rounded-chip transition-colors ${
              i < step ? "bg-primary-strong" : "bg-line-strong"
            }`}
          />
        ))}
      </div>
    </div>
  );
}