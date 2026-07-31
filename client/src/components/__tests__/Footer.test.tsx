import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Footer from '../Footer';

describe('Footer', () => {
  it('renders neutral branding without footer links', () => {
    render(<Footer />);

    const footer = screen.getByRole('contentinfo');

    expect(screen.getAllByRole('contentinfo')).toHaveLength(1);
    expect(within(footer).getByText('© KitapKurdu', { exact: true })).toBeInTheDocument();
    expect(within(footer).queryAllByRole('link')).toHaveLength(0);
  });
});
