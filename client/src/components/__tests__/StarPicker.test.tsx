import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { StarPicker } from '../StarPicker';

describe('StarPicker', () => {
  it('renders five labelled radio stars', () => {
    render(<StarPicker value={2} onChange={vi.fn()} />);

    expect(screen.getByRole('radiogroup', { name: 'Rating' })).toBeInTheDocument();
    expect(screen.getAllByRole('radio')).toHaveLength(5);
    expect(screen.getByRole('radio', { name: '1 star' })).toHaveAttribute('aria-checked', 'false');
    expect(screen.getByRole('radio', { name: '2 stars' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getAllByRole('radio')[1]).toHaveAttribute('tabindex', '0');
  });

  it('previews hovered stars and selects on click', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<StarPicker value={1} onChange={onChange} />);

    const thirdStar = screen.getByRole('radio', { name: '3 stars' });
    await user.hover(thirdStar);

    expect(
      screen
        .getAllByRole('radio')
        .slice(0, 3)
        .every((radio) => radio.querySelector('svg')?.classList.contains('fill-yellow-400'))
    ).toBe(true);

    await user.unhover(thirdStar);
    expect(
      screen
        .getAllByRole('radio')
        .slice(0, 1)
        .every((radio) => radio.querySelector('svg')?.classList.contains('fill-yellow-400'))
    ).toBe(true);
    expect(
      screen
        .getAllByRole('radio')
        .slice(1)
        .every((radio) => !radio.querySelector('svg')?.classList.contains('fill-yellow-400'))
    ).toBe(true);

    await user.click(thirdStar);
    expect(onChange).toHaveBeenCalledWith(3);
  });

  it('keeps zero unselected and focuses the first star', () => {
    render(<StarPicker value={0} onChange={vi.fn()} />);

    expect(screen.getByText('Selected rating: 0 stars')).toBeInTheDocument();
    expect(
      screen.getAllByRole('radio').every((radio) => radio.getAttribute('aria-checked') === 'false')
    ).toBe(true);
    expect(screen.getAllByRole('radio')[0]).toHaveAttribute('tabindex', '0');
    expect(
      screen
        .getAllByRole('radio')
        .every((radio) => !radio.querySelector('svg')?.classList.contains('fill-yellow-400'))
    ).toBe(true);
  });

  it('moves focus with arrows, Home, and End without selecting until Enter or Space', () => {
    const onChange = vi.fn();
    render(<StarPicker value={2} onChange={onChange} />);
    const radios = screen.getAllByRole('radio');

    radios[1].focus();
    expect(
      radios
        .slice(0, 2)
        .every((radio) => radio.querySelector('svg')?.classList.contains('fill-yellow-400'))
    ).toBe(true);
    expect(
      radios
        .slice(2)
        .every((radio) => !radio.querySelector('svg')?.classList.contains('fill-yellow-400'))
    ).toBe(true);
    fireEvent.keyDown(radios[1], { key: 'ArrowRight' });
    expect(document.activeElement).toBe(radios[2]);
    fireEvent.keyDown(radios[2], { key: 'ArrowLeft' });
    expect(document.activeElement).toBe(radios[1]);
    fireEvent.keyDown(radios[1], { key: 'End' });
    expect(document.activeElement).toBe(radios[4]);
    fireEvent.keyDown(radios[4], { key: 'Home' });
    expect(document.activeElement).toBe(radios[0]);
    expect(onChange).not.toHaveBeenCalled();

    fireEvent.keyDown(radios[0], { key: 'Enter' });
    fireEvent.keyDown(radios[0], { key: ' ' });
    expect(onChange).toHaveBeenNthCalledWith(1, 1);
    expect(onChange).toHaveBeenNthCalledWith(2, 1);
  });

  it('updates the checked radio and live announcement when controlled value changes', () => {
    const { rerender } = render(<StarPicker value={2} onChange={vi.fn()} />);

    expect(screen.getByText('Selected rating: 2 stars')).toHaveAttribute('aria-live', 'polite');
    rerender(<StarPicker value={4} onChange={vi.fn()} />);

    expect(screen.getByRole('radio', { name: '4 stars' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByText('Selected rating: 4 stars')).toBeInTheDocument();
    expect(screen.getAllByRole('radio')[3]).toHaveAttribute('tabindex', '0');
  });

  it('uses custom accessible labels for interactive and read-only pickers', () => {
    render(
      <>
        <StarPicker value={2} onChange={vi.fn()} ariaLabel="Your rating" />
        <StarPicker value={4} readOnly ariaLabel="Average rating" />
      </>
    );

    expect(screen.getByRole('radiogroup', { name: 'Your rating' })).toBeInTheDocument();
    expect(
      screen.getByRole('img', { name: 'Average rating: 4 out of 5 stars' })
    ).toBeInTheDocument();
  });

  it('renders a clamped, fractional read-only fill without controls', () => {
    const { rerender } = render(<StarPicker value={6.5} readOnly />);

    expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Rating: 5 out of 5 stars' })).toBeInTheDocument();
    rerender(<StarPicker value={-2} readOnly />);
    expect(screen.getByRole('img', { name: 'Rating: 0 out of 5 stars' })).toBeInTheDocument();

    const fractional = render(<StarPicker value={2.5} readOnly />);
    expect(fractional.container.querySelector('[style*="width: 50%"]')).toBeInTheDocument();
    expect(fractional.container.querySelectorAll('svg')).toHaveLength(10);
  });
});
