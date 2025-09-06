import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders SubsGPT app', () => {
  render(<App />);
  const titleElement = screen.getByText(/Translate Subtitles/i);
  expect(titleElement).toBeInTheDocument();
});
