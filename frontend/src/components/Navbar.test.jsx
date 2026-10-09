import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Navbar from './Navbar';
const page = () => render(<MemoryRouter><Navbar /></MemoryRouter>);

test('mobile navigation toggles without an external script and closes on selection', () => {
  page();
  const toggle = screen.getByRole('button', { name: 'Toggle navigation' });
  expect(toggle).toHaveAttribute('aria-expanded', 'false');
  fireEvent.click(toggle);
  expect(toggle).toHaveAttribute('aria-expanded', 'true');
  expect(document.getElementById('ocusenseNavbar')).toHaveClass('show');
  fireEvent.click(screen.getByRole('link', { name: 'Contact' }));
  expect(toggle).toHaveAttribute('aria-expanded', 'false');
  expect(document.getElementById('ocusenseNavbar')).not.toHaveClass('show');
});

test('Escape closes the menu and restores focus to the toggle', () => {
  page();
  const toggle = screen.getByRole('button', { name: 'Toggle navigation' });
  fireEvent.click(toggle);
  const link = screen.getByRole('link', { name: 'Contact' });
  link.focus();
  fireEvent.keyDown(link, { key: 'Escape' });
  expect(toggle).toHaveAttribute('aria-expanded', 'false');
  expect(toggle).toHaveFocus();
  expect(screen.getByRole('link', { name: 'Skip to content' })).toHaveAttribute('href', '#main-content');
});
