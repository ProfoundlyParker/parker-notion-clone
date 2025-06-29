import { render, screen } from '@testing-library/react';
import { Loader } from './Loader';
import styles from './Loader.module.css';

describe("Loader component", () => {
  it("renders the loader container", () => {
    render(<Loader />);
    const loaderElement = screen.getByRole("status"); // Optional: add role for accessibility
    expect(loaderElement).toBeInTheDocument();
  });

  it("has the correct number of inner divs", () => {
    render(<Loader />);
    const innerDivs = screen.getByTestId("loader").querySelectorAll("div");
    expect(innerDivs.length).toBe(4);
  });

  it("has the correct class applied", () => {
    render(<Loader />);
    const loaderElement = screen.getByTestId("loader");
    expect(loaderElement).toHaveClass(styles.loader);
  });
});