import { render, screen } from '@testing-library/react';
import App from './App';

test('renders app header', () => {
  render(<App />);
  const title = screen.getByText(/Modern Notes/i);
  expect(title).toBeInTheDocument();
});
