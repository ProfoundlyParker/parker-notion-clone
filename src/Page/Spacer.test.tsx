import { render, screen, fireEvent } from '@testing-library/react';
import { Spacer } from './Spacer';
import styles from './Spacer.module.css';

describe('Spacer component', () => {
  it('renders without crashing', () => {
    render(<Spacer handleClick={() => {}} showHint={false} />);
    const spacerElement = screen.getByTestId('spacer');
    expect(spacerElement).toBeInTheDocument();
  });

  it('displays the hint text when showHint is true', () => {
    render(<Spacer handleClick={() => {}} showHint={true} />);
    expect(screen.getByText('Click to create first paragraph')).toBeInTheDocument();
  });

  it('does not display the hint text when showHint is false', () => {
    render(<Spacer handleClick={() => {}} showHint={false} />);
    expect(screen.queryByText('Click to create first paragraph')).not.toBeInTheDocument();
  });

  it('calls handleClick when clicked', () => {
    const handleClickMock = vi.fn();
    render(<Spacer handleClick={handleClickMock} showHint={false} />);
    const spacerElement = screen.getByTestId('spacer');

    fireEvent.click(spacerElement);
    expect(handleClickMock).toHaveBeenCalledTimes(1);
  });
  it("has the correct class applied", () => {
    render(<Spacer handleClick={() => {}} showHint={true} />);
    const spacerElement = screen.getByTestId("spacer");
    expect(spacerElement).toHaveClass(styles.spacer);
  });
});