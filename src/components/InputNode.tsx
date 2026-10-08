export interface InputNodeProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  unit?: string;
  disabled?: boolean;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
}

export function InputNode({
  label,
  value,
  onChange,
  unit = "%",
  disabled = false,
  min,
  max,
  step,
  className,
}: InputNodeProps) {
  return (
    <div className={`flex items-center gap-1 ${className || ""} ${disabled ? "opacity-50" : ""}`}>
      <span className="text-xs font-bold text-surface-500">{label}</span>
      <div className={`flex items-center border border-surface-300 rounded px-1.5 py-0.5 ${disabled ? "opacity-50" : ""}`}>
        <input
          type="number"
          value={value}
          onChange={e => !disabled && onChange(Number(e.target.value))}
          disabled={disabled}
          min={min}
          max={max}
          step={step}
          className="w-10 bg-transparent text-xs font-bold text-right outline-none"
        />
        <span className="text-xs text-surface-400">{unit}</span>
      </div>
    </div>
  );
}