export const FOOD_OPTIONS = [
  { value: 'geen-voorkeur', label: 'Geen voorkeur' },
  { value: 'vegetarisch', label: 'Vegetarisch' },
  { value: 'veganistisch', label: 'Veganistisch' },
  { value: 'halal', label: 'Halal' },
  { value: 'glutenvrij', label: 'Glutenvrij' },
  { value: 'pescotarisch', label: 'Pescotarisch' },
  { value: 'andere', label: 'Andere / allergie (toelichten bij extra info)' },
] as const;

export type FoodValue = (typeof FOOD_OPTIONS)[number]['value'];

export function foodLabel(value: string): string {
  return FOOD_OPTIONS.find((option) => option.value === value)?.label ?? value;
}
