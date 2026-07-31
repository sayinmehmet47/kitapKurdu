import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import SkipLink from '../SkipLink';

describe('SkipLink', () => {
  it('is first in tab order and targets the main content landmark', () => {
    const { container } = render(
      <>
        <SkipLink />
        <button type="button">Following control</button>
        <main id="main-content" tabIndex={-1}>
          Main content
        </main>
      </>
    );

    const skipLink = screen.getByRole('link', { name: 'Skip to main content' });
    const focusableControls = Array.from(
      container.querySelectorAll<HTMLElement>(
        'a[href], button, input, select, textarea, [tabindex]'
      )
    ).filter((element) => !element.hasAttribute('disabled') && element.tabIndex >= 0);

    expect(focusableControls[0]).toBe(skipLink);
    expect(skipLink).toHaveAttribute('href', '#main-content');
    expect(screen.getByRole('main')).toHaveAttribute('id', 'main-content');
  });
});
