import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import RouteAccessibilityManager from '../RouteAccessibilityManager';

function RouteHarness() {
  const navigate = useNavigate();

  return (
    <>
      <button type="button" onClick={() => navigate('/books')}>
        Go to books
      </button>
      <button type="button" onClick={() => navigate('/books?filter=two')}>
        Change filter
      </button>
      <Routes>
        <Route
          path="/home"
          element={
            <main id="main-content" data-route-path="/home" tabIndex={-1}>
              <h1>Home</h1>
            </main>
          }
        />
        <Route
          path="/books"
          element={
            <main id="main-content" data-route-path="/books" tabIndex={-1}>
              <h1>Books</h1>
            </main>
          }
        />
      </Routes>
    </>
  );
}

function renderHarness(initialEntry: string) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <RouteAccessibilityManager />
      <RouteHarness />
    </MemoryRouter>
  );
}

describe('RouteAccessibilityManager', () => {
  it('does not steal focus on initial load', () => {
    renderHarness('/home');

    const initialControl = screen.getByRole('button', { name: 'Go to books' });
    initialControl.focus();

    expect(initialControl).toHaveFocus();
  });

  it('focuses the new route heading and announces pathname navigation', async () => {
    const user = userEvent.setup();
    renderHarness('/home');

    await user.click(screen.getByRole('button', { name: 'Go to books' }));

    const heading = await screen.findByRole('heading', { name: 'Books' });
    expect(heading).toHaveFocus();
    expect(document.querySelector('[aria-live="polite"]')).toHaveTextContent('Books');
  });

  it('does not move focus for search-param-only changes', async () => {
    const user = userEvent.setup();
    renderHarness('/books?filter=one');

    const filterControl = screen.getByRole('button', { name: 'Change filter' });
    await user.click(filterControl);

    expect(filterControl).toHaveFocus();
  });
});
