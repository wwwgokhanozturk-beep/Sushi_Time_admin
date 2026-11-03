import React from 'react';
import { ALLERGEN_ICONS } from '@/utils/allergens';

// Allergen line icon; colour comes from the parent (stroke = currentColor).
export default function AllergenIcon({ code, size = 18, ...rest }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      // Static markup from utils/allergens, never user input.
      dangerouslySetInnerHTML={{ __html: ALLERGEN_ICONS[code] }}
      {...rest}
    />
  );
}
