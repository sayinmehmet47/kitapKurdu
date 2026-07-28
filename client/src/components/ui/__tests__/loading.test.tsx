import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LoadingSpinner } from '../loading';

describe('LoadingSpinner', () => {
  it('renders with default width and height of 24 and animate-spin class', () => {
    const { container } = render(<LoadingSpinner />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('width', '24');
    expect(svg).toHaveAttribute('height', '24');
    expect(svg).toHaveClass('animate-spin');
  });

  it('renders with custom size', () => {
    const { container } = render(<LoadingSpinner size={48} />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('width', '48');
    expect(svg).toHaveAttribute('height', '48');
  });

  it('accepts and merges custom className', () => {
    const { container } = render(<LoadingSpinner className="text-primary" />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveClass('animate-spin');
    expect(svg).toHaveClass('text-primary');
  });

  it('forwards accessible SVG props like role and aria-label', () => {
    render(<LoadingSpinner role="img" aria-label="Loading content" />);
    const svg = screen.getByRole('img', { name: 'Loading content' });
    expect(svg).toBeInTheDocument();
  });
});
