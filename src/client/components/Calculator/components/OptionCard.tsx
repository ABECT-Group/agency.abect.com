'use client';

import { JSX, ReactNode } from 'react';
import { Check } from 'lucide-react';
import './OptionCard.scss';

interface OptionCardProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  selected?: boolean;
  onClick?: () => void;
  variant?: 'default' | 'large' | 'checkbox';
  price?: string;
  disabled?: boolean;
}

export default function OptionCard({
  title,
  description,
  icon,
  selected = false,
  onClick,
  variant = 'default',
  price,
  disabled = false,
}: OptionCardProps): JSX.Element {
  return (
    <button
      type="button"
      className={`option-card option-card--${variant} ${selected ? 'option-card--selected' : ''} ${
        disabled ? 'option-card--disabled' : ''
      }`}
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
    >
      {/* Без чекбокса / радіо: вибір показує сама картка (рамка й фон, --selected); стан для скрінрідера — aria-pressed */}
      {/* Icon */}
      {icon && <div className="option-card__icon">{icon}</div>}

      {/* Content */}
      <div className="option-card__content">
        <div className="option-card__title">{title}</div>
        {description && <div className="option-card__description">{description}</div>}
        {price && <div className="option-card__price">{price}</div>}
      </div>

      {/* Selected check for large variant */}
      {variant === 'large' && selected && (
        <div className="option-card__check">
          <Check size={24} />
        </div>
      )}
    </button>
  );
}
