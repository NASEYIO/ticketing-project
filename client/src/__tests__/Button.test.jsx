// FILE: src/__tests__/Button.test.jsx
//
// LAYER: Frontend unit test
// Tests the Button component in isolation — no API calls, no routing,
// just checking it renders correctly and responds to user interaction.

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import Button from '../components/Button';

describe('Button', () => {
  it('renders its children text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('calls onClick when clicked', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();

    render(<Button onClick={handleClick}>Submit</Button>);
    await user.click(screen.getByText('Submit'));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled and does not fire onClick when isLoading is true', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();

    render(<Button onClick={handleClick} isLoading loadingText="Please wait...">Submit</Button>);

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(screen.getByText('Please wait...')).toBeInTheDocument();

    await user.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('applies the danger variant styling', () => {
    render(<Button variant="danger">Delete</Button>);
    const button = screen.getByText('Delete');
    expect(button).toHaveStyle({ background: '#dc2626' });
  });
});