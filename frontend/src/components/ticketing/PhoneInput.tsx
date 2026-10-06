import { useMemo, useState } from 'react';
import { DEFAULT_PHONE_PREFIX, formatPhoneInput, phoneFlag } from '@/lib/phone';

export function PhoneInput({
  id = 'phone',
  name = 'phone',
  defaultValue = DEFAULT_PHONE_PREFIX,
  required = true,
  className,
}: {
  id?: string;
  name?: string;
  defaultValue?: string;
  required?: boolean;
  className?: string;
}) {
  const [value, setValue] = useState(defaultValue);
  const meta = useMemo(() => phoneFlag(value), [value]);

  return (
    <div className="flex items-stretch gap-2">
      <span
        className="inline-flex min-w-14 items-center justify-center rounded-2xl border border-line bg-card px-3 text-xl"
        title={meta.label}
        aria-label={`Land: ${meta.label}`}
      >
        {meta.flag}
      </span>
      <input
        id={id}
        name={name}
        type="tel"
        autoComplete="tel"
        inputMode="tel"
        required={required}
        maxLength={40}
        value={value}
        onChange={(event) => setValue(formatPhoneInput(event.target.value))}
        onBlur={() => setValue((current) => formatPhoneInput(current))}
        placeholder="+32 4xx xx xx xx"
        className={className}
      />
    </div>
  );
}
