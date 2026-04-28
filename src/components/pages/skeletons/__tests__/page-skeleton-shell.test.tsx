import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PageSkeletonShell } from '../page-skeleton-shell';

describe('PageSkeletonShell', () => {
  it('exposes aria-busy=true for accessibility', () => {
    render(<PageSkeletonShell />);
    expect(screen.getByLabelText('Sayfa yükleniyor')).toHaveAttribute('aria-busy', 'true');
  });

  it('renders children inside the shell', () => {
    render(
      <PageSkeletonShell>
        <div data-testid="content">x</div>
      </PageSkeletonShell>,
    );
    expect(screen.getByTestId('content')).toBeInTheDocument();
  });

  it('uses the same outer container classes as PageShell', () => {
    render(<PageSkeletonShell />);
    const shell = screen.getByLabelText('Sayfa yükleniyor');
    expect(shell.className).toContain('mx-auto');
    expect(shell.className).toContain('max-w-[1280px]');
    expect(shell.className).toContain('px-6');
    expect(shell.className).toContain('pt-24');
    expect(shell.className).toContain('pb-32');
  });
});
