import * as React from 'react';
import { Input } from '@/components/ui/Input';
import { Tooltip } from '@/components/ui/Tooltip';
import { cn } from '@/lib/utils';

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
      <Input
        type="number"
        value={value || ''}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        placeholder={placeholder}
        icon={<span className="text-sm font-medium">€</span>}
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
      <Input
        type="number"
        value={value || ''}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
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
      <Input
        type="number"
        value={value || ''}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        suffix={suffix}
        min={min}
        max={max}
      />
    </FormField>
  );
}
