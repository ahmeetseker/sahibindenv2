import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AtomButton } from '../atom-button';

describe('AtomButton', () => {
  it('renders with the AI assistant aria-label', () => {
    render(<AtomButton onClick={() => {}} />);
    expect(screen.getByLabelText('Yapay zeka asistanı')).toBeInTheDocument();
  });

  it('calls onClick when clicked', async () => {
    const onClick = vi.fn();
    render(<AtomButton onClick={onClick} />);
    screen.getByLabelText('Yapay zeka asistanı').click();
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
