import { render, screen, fireEvent } from '@testing-library/react';
import { NodeContainer } from './NodeContainer.tsx';
import type { NodeType } from '../utils/types.ts';
import { vi, beforeEach } from 'vitest';
import styles from './NodeContainer.module.css';

beforeEach(() => {
  vi.clearAllMocks();
});


// Mock useSortable
vi.mock('@dnd-kit/sortable', () => ({
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: null,
  }),
}));

// Mock NodeTypeSwitcher to isolate the test to NodeContainer
vi.mock('./NodeTypeSwitcher', () => ({
  NodeTypeSwitcher: () => <div data-testid="node-switcher">NodeTypeSwitcher</div>
}));

describe('NodeContainer component', () => {
  const baseProps = {
    node: { id: 'node-1', type: 'text' as NodeType, value: 'Sample Node' },
    updateFocusedIndex: vi.fn(),
    isFocused: false,
    index: 0,
    registerRef: vi.fn(),
  };

  it('renders the container and drag handle', () => {
    render(<NodeContainer {...baseProps} />);
    const container = screen.getByTestId('node-switcher');
    const dragHandle = screen.getByText('⠿');
    expect(container).toBeInTheDocument();
    expect(dragHandle).toBeInTheDocument();
  });

  it('calls updateFocusedIndex when container is clicked (not drag handle)', () => {
    render(<NodeContainer {...baseProps} />);
    const container = screen.getByTestId('node-container');

    fireEvent.click(container);
    expect(baseProps.updateFocusedIndex).toHaveBeenCalledWith(0);
  });

  it('does not call updateFocusedIndex when drag handle is clicked', () => {
    render(<NodeContainer {...baseProps} />);
    const dragHandle = screen.getByText('⠿');

    fireEvent.click(dragHandle);
    expect(baseProps.updateFocusedIndex).not.toHaveBeenCalled();
  });

  it('calls registerRef with index and element when provided', () => {
    // Create a mock to capture the ref call
    const registerRefMock = vi.fn();
    render(<NodeContainer {...baseProps} registerRef={registerRefMock} />);
    expect(registerRefMock).toHaveBeenCalledWith(0, expect.any(HTMLDivElement));
  });
  it('uses the correct class for the container', () => {
    render(<NodeContainer {...baseProps} />);
    const container = screen.getByTestId('node-container');
    expect(container).toHaveClass(styles.container);
  });
});
