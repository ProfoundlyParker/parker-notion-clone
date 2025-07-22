import { render, screen } from '@testing-library/react';
import { NodeTypeSwitcher } from './NodeTypeSwitcher';
import { vi } from 'vitest';

// Mock child components
vi.mock('./BasicNode', () => ({
  BasicNode: () => <div data-testid="basic-node">BasicNode</div>
}));

vi.mock('./NumberedListNode', () => ({
  NumberedListNode: () => <div data-testid="numbered-list-node">NumberedListNode</div>
}));

vi.mock('./PageNode', () => ({
  PageNode: () => <div data-testid="page-node">PageNode</div>
}));

vi.mock('./ImageNode', () => ({
  ImageNode: () => <div data-testid="image-node">ImageNode</div>
}));

describe('NodeTypeSwitcher component', () => {
  const baseProps = {
    node: { id: 'node-1', value: 'Some value', type: 'text' as const },
    index: 0,
    isFocused: false,
    updateFocusedIndex: vi.fn()
  };

  it('renders BasicNode for "text" node type', () => {
    render(<NodeTypeSwitcher {...baseProps} node={{ ...baseProps.node, type: 'text' }} />);
    expect(screen.getByTestId('basic-node')).toBeInTheDocument();
  });

  it('renders BasicNode for "list" node type', () => {
    render(<NodeTypeSwitcher {...baseProps} node={{ ...baseProps.node, type: 'list' }} />);
    expect(screen.getByTestId('basic-node')).toBeInTheDocument();
  });

  it('renders BasicNode for "heading1" node type', () => {
    render(<NodeTypeSwitcher {...baseProps} node={{ ...baseProps.node, type: 'heading1' }} />);
    expect(screen.getByTestId('basic-node')).toBeInTheDocument();
  });

  it('renders BasicNode for "heading2" node type', () => {
    render(<NodeTypeSwitcher {...baseProps} node={{ ...baseProps.node, type: 'heading2' }} />);
    expect(screen.getByTestId('basic-node')).toBeInTheDocument();
  });

  it('renders BasicNode for "heading3" node type', () => {
        render(<NodeTypeSwitcher {...baseProps} node={{ ...baseProps.node, type: 'heading3' }} />);
        expect(screen.getByTestId('basic-node')).toBeInTheDocument();
  });   

  it('renders NumberedListNode for "numberedList" node type', () => {
    render(<NodeTypeSwitcher {...baseProps} node={{ ...baseProps.node, type: 'numberedList' }} />);
    expect(screen.getByTestId('numbered-list-node')).toBeInTheDocument();
  });

  it('renders PageNode for "page" node type', () => {
    render(<NodeTypeSwitcher {...baseProps} node={{ ...baseProps.node, type: 'page' }} />);
    expect(screen.getByTestId('page-node')).toBeInTheDocument();
  });

  it('renders ImageNode for "image" node type', () => {
    render(<NodeTypeSwitcher {...baseProps} node={{ ...baseProps.node, type: 'image' }} />);
    expect(screen.getByTestId('image-node')).toBeInTheDocument();
  });

  it('renders nothing for unknown node types', () => {
    render(<NodeTypeSwitcher {...baseProps} node={{ ...baseProps.node, type: 'unknown' as any }} />);
    expect(screen.queryByTestId('basic-node')).not.toBeInTheDocument();
    expect(screen.queryByTestId('numbered-list-node')).not.toBeInTheDocument();
    expect(screen.queryByTestId('page-node')).not.toBeInTheDocument();
    expect(screen.queryByTestId('image-node')).not.toBeInTheDocument();
  });
});
