import { Star } from 'lucide-react';
import { type KeyboardEvent, useRef, useState } from 'react';

const STAR_COUNT = 5;

export type StarPickerSize = 'sm' | 'md' | 'lg' | number;

export interface StarPickerProps {
  value: number;
  onChange?: (value: number) => void;
  readOnly?: boolean;
  size?: StarPickerSize;
  ariaLabel?: string;
}

const clampRating = (value: number) => {
  if (!Number.isFinite(value)) return 0;
  return Math.min(STAR_COUNT, Math.max(0, value));
};

const formatRating = (value: number) =>
  Number.isInteger(value) ? String(value) : String(Number(value.toFixed(2)));

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
};

const getIconProps = (size: StarPickerSize) => ({
  className: typeof size === 'number' ? undefined : sizeClasses[size],
  size: typeof size === 'number' ? size : undefined,
});

export const StarPicker = ({
  value,
  onChange,
  readOnly = false,
  size = 'md',
  ariaLabel = 'Rating',
}: StarPickerProps) => {
  const clampedValue = clampRating(value);
  const selectedRating = readOnly ? clampedValue : Math.round(clampedValue);
  const [focusedValue, setFocusedValue] = useState<number | null>(null);
  const [hoveredValue, setHoveredValue] = useState<number | null>(null);
  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const iconProps = getIconProps(size);

  if (readOnly) {
    return (
      <span
        role="img"
        aria-label={`${ariaLabel}: ${formatRating(clampedValue)} out of ${STAR_COUNT} stars`}
        className="inline-flex items-center"
      >
        {Array.from({ length: STAR_COUNT }, (_, index) => {
          const fillPercentage = Math.min(1, Math.max(0, clampedValue - index)) * 100;
          const star = index + 1;

          return (
            <span key={star} aria-hidden="true" className="relative inline-block shrink-0">
              <Star
                {...iconProps}
                aria-hidden="true"
                className={`${iconProps.className || ''} text-muted-foreground`}
              />
              <span
                className="pointer-events-none absolute inset-y-0 left-0 overflow-hidden"
                style={{ width: `${fillPercentage}%` }}
              >
                <Star
                  {...iconProps}
                  aria-hidden="true"
                  className={`${iconProps.className || ''} fill-yellow-400 text-yellow-400`}
                />
              </span>
            </span>
          );
        })}
      </span>
    );
  }

  const previewValue = hoveredValue ?? selectedRating;
  const rovingValue = (focusedValue ?? selectedRating) || 1;

  const focusValue = (nextValue: number) => {
    setFocusedValue(nextValue);
    buttonRefs.current[nextValue - 1]?.focus();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, star: number) => {
    let nextValue: number | null = null;

    switch (event.key) {
      case 'ArrowLeft':
      case 'ArrowDown':
        nextValue = Math.max(1, star - 1);
        break;
      case 'ArrowRight':
      case 'ArrowUp':
        nextValue = Math.min(STAR_COUNT, star + 1);
        break;
      case 'Home':
        nextValue = 1;
        break;
      case 'End':
        nextValue = STAR_COUNT;
        break;
      case 'Enter':
      case ' ':
      case 'Spacebar':
      case 'Space':
        event.preventDefault();
        onChange?.(star);
        return;
      default:
        return;
    }

    if (nextValue === null) return;
    event.preventDefault();
    focusValue(nextValue);
  };

  return (
    <div role="radiogroup" aria-label={ariaLabel} className="inline-flex items-center">
      {Array.from({ length: STAR_COUNT }, (_, index) => {
        const star = index + 1;
        const highlighted = star <= previewValue;

        return (
          /* biome-ignore lint/a11y/useSemanticElements: Custom button radio behavior is required for explicit focus navigation and Enter/Space selection. */
          <button
            key={star}
            ref={(element) => {
              buttonRefs.current[index] = element;
            }}
            type="button"
            role="radio"
            aria-checked={selectedRating === star}
            aria-label={`${star} ${star === 1 ? 'star' : 'stars'}`}
            tabIndex={rovingValue === star ? 0 : -1}
            onClick={() => onChange?.(star)}
            onFocus={() => setFocusedValue(star)}
            onBlur={() => setFocusedValue(null)}
            onMouseEnter={() => setHoveredValue(star)}
            onMouseLeave={() => setHoveredValue(null)}
            onKeyDown={(event) => handleKeyDown(event, star)}
            className="rounded-sm p-1 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <Star
              {...iconProps}
              aria-hidden="true"
              className={`${iconProps.className || ''} transition-colors duration-150 ${
                highlighted ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'
              }`}
            />
          </button>
        );
      })}
      <span className="sr-only" aria-live="polite">
        Selected rating: {selectedRating} {selectedRating === 1 ? 'star' : 'stars'}
      </span>
    </div>
  );
};
