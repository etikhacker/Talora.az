'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import {
  INTERNSHIP_CATEGORY_GROUPS,
  isKnownInternshipCategory,
} from '@/lib/internships/categories';

const CUSTOM_OPTION = '__manual_category__';

interface InternshipCategoryFieldProps {
  value: string;
  onChange: (nextValue: string) => void;
  isAz: boolean;
}

/**
 * Reusable category control for both creating and editing internships.
 * Unknown legacy categories remain editable and are never overwritten.
 */
export function InternshipCategoryField({
  value,
  onChange,
  isAz,
}: InternshipCategoryFieldProps) {
  const [manualEntry, setManualEntry] = useState(false);
  const customValue = Boolean(value.trim()) && !isKnownInternshipCategory(value);
  const isCustom = manualEntry || customValue;

  return (
    <div>
      <select
        value={isCustom ? CUSTOM_OPTION : value}
        onChange={(event) => {
          const selected = event.target.value;
          if (selected === CUSTOM_OPTION) {
            setManualEntry(true);
            onChange('');
          } else {
            setManualEntry(false);
            onChange(selected);
          }
        }}
        aria-label={isAz ? 'Təcrübə istiqaməti' : 'Internship track'}
        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
      >
        {!value && !isCustom && (
          <option value="" disabled>{isAz ? 'İstiqamət seçin' : 'Select a track'}</option>
        )}
        {INTERNSHIP_CATEGORY_GROUPS.map((group) => (
          <optgroup key={group.key} label={isAz ? group.az : group.en}>
            {group.values.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </optgroup>
        ))}
        <option value={CUSTOM_OPTION}>{isAz ? 'Digər istiqamət...' : 'Other track...'}</option>
      </select>
      {isCustom && (
        <Input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          maxLength={120}
          aria-label={isAz ? 'Fərdi istiqamətin adı' : 'Custom track name'}
          placeholder={isAz ? 'İstiqamətin adını yazın' : 'Enter a track name'}
          className="mt-2 bg-slate-950 border-slate-800 text-white text-xs"
        />
      )}
    </div>
  );
}
