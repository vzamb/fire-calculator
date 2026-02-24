import * as React from 'react';
import { Input } from '@/components/ui/Input';
import { Tooltip } from '@/components/ui/Tooltip';
import { cn } from '@/lib/utils';
import { getCurrencySymbol } from '@/lib/formatters';

interface EditableNumberInputProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  className?: string;
  icon?: React.ReactNode;
  suffix?: string;
  placeholder?: string;
  step?: number;
}

function clampNumber(value: number, min?: number, max?: number): number {
  if (typeof min === 'number' && value < min) return min;
  if (typeof max === 'number' && value > max) return max;
  return value;
}

function EditableNumberInput({ value, onChange, min, max, ...props }: EditableNumberInputProps) {
  const [draft, setDraft] = React.useState(String(value ?? ''));
  const [isFocused, setIsFocused] = React.useState(false);

  React.useEffect(() => {
    if (!isFocused) {
      setDraft(String(value ?? ''));
    }
  }, [value, isFocused]);

  const commit = (rawValue: string) => {
    const normalized = rawValue.replace(',', '.').trim();
    if (normalized === '' || normalized === '-' || normalized === '.' || normalized === '-.') {
      const clampedZero = clampNumber(0, min, max);
      onChange(clampedZero);
      setDraft(String(clampedZero));
      return;
    }

    const parsed = Number(normalized);
    if (!Number.isFinite(parsed)) {
      setDraft(String(value ?? ''));
      return;
    }

    const clamped = clampNumber(parsed, min, max);
    onChange(clamped);
    setDraft(String(clamped));
  };

  return (
    <Input
      type="text"
      inputMode="decimal"
      value={draft}
      onFocus={() => setIsFocused(true)}
      onBlur={(e) => {
        setIsFocused(false);
        commit(e.target.value);
      }}
      onChange={(e) => {
        const raw = e.target.value;
        setDraft(raw);

        const normalized = raw.replace(',', '.').trim();
        if (normalized === '' || normalized === '-' || normalized === '.' || normalized === '-.') {
          return;
        }

        const parsed = Number(normalized);
        if (Number.isFinite(parsed)) {
          onChange(clampNumber(parsed, min, max));
        }
      }}
      {...props}
    />
  );
}

interface FormFieldProps {
  label: string;
  tooltip?: string;
  children: React.ReactNode;
  className?: string;
}

export function FormField({ label, tooltip, children, className }: FormFieldProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center gap-1.5">
        <label className="text-sm font-medium text-foreground">{label}</label>
        {tooltip && <Tooltip content={tooltip} />}
      </div>
      {children}
    </div>
  );
}

interface CurrencyInputProps {
  value: number;
  onChange: (value: number) => void;
  label: string;
  tooltip?: string;
  placeholder?: string;
  className?: string;
}

export function CurrencyInput({
  value,
  onChange,
  label,
  tooltip,
  placeholder = '0',
  className,
}: CurrencyInputProps) {
  return (
    <FormField label={label} tooltip={tooltip} className={className}>
      <EditableNumberInput
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        icon={<span className="text-sm font-medium">{getCurrencySymbol()}</span>}
        min={0}
      />
    </FormField>
  );
}

interface PercentInputProps {
  value: number;
  onChange: (value: number) => void;
  label: string;
  tooltip?: string;
  step?: number;
  min?: number;
  max?: number;
  className?: string;
}

export function PercentInput({
  value,
  onChange,
  label,
  tooltip,
  step = 0.1,
  min = 0,
  max = 100,
  className,
}: PercentInputProps) {
  return (
    <FormField label={label} tooltip={tooltip} className={className}>
      <EditableNumberInput
        value={value}
        onChange={onChange}
        suffix="%"
        step={step}
        min={min}
        max={max}
      />
    </FormField>
  );
}

interface NumberInputProps {
  value: number;
  onChange: (value: number) => void;
  label: string;
  tooltip?: string;
  suffix?: string;
  min?: number;
  max?: number;
  className?: string;
}

export function NumberInput({
  value,
  onChange,
  label,
  tooltip,
  suffix,
  min,
  max,
  className,
}: NumberInputProps) {
  return (
    <FormField label={label} tooltip={tooltip} className={className}>
      <EditableNumberInput
        value={value}
        onChange={onChange}
        suffix={suffix}
        min={min}
        max={max}
      />
    </FormField>
  );
}
