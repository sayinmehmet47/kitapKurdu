import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from '../dialog';

function TestDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button type="button">Open dialog</button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Dialog title</DialogTitle>
        <DialogDescription>Dialog description</DialogDescription>
        <button type="button">Dialog action</button>
      </DialogContent>
    </Dialog>
  );
}

describe('Dialog accessibility', () => {
  it('traps focus, closes with Escape, and restores focus to its trigger', async () => {
    const user = userEvent.setup();
    render(<TestDialog />);

    const trigger = screen.getByRole('button', { name: 'Open dialog' });
    await user.click(trigger);

    const dialog = await screen.findByRole('dialog');
    const initialActiveElement = document.activeElement;
    expect(initialActiveElement).toBeInstanceOf(HTMLElement);
    if (initialActiveElement instanceof HTMLElement) {
      expect(dialog).toContainElement(initialActiveElement);
    }

    await user.tab();
    const tabbedActiveElement = document.activeElement;
    expect(tabbedActiveElement).toBeInstanceOf(HTMLElement);
    if (tabbedActiveElement instanceof HTMLElement) {
      expect(dialog).toContainElement(tabbedActiveElement);
    }

    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(trigger).toHaveFocus();
  });
});
