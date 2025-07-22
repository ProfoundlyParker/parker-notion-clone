import { render, screen } from "@testing-library/react";
import { SortableNumberedListNode } from "./SortableNumberedListNode";
import { vi } from "vitest";

vi.mock("@dnd-kit/sortable", () => ({
  useSortable: () => ({
    attributes: { "data-testid": "sortable-attributes" },
    setNodeRef: vi.fn(),
    listeners: { "data-testid": "sortable-listeners" },
    transition: "transform 200ms ease",
  }),
}));

vi.mock("./NumberedListNode", () => ({
  NumberedListNode: ({ node }: any) => (
    <div data-testid="numbered-node">Node content for {node.id}</div>
  ),
}));

describe("SortableNumberedListNode", () => {
  const baseProps = {
    node: { id: "123", type: "numbered", content: "Test node" },
    index: 0,
    isFocused: false,
    updateFocusedIndex: vi.fn(),
    registerRef: vi.fn(),
  };

  it("renders the sortable list item", () => {
    render(<SortableNumberedListNode {...baseProps} />);
    const li = screen.getByRole("listitem");
    expect(li).toBeInTheDocument();
  });

  it("renders drag handle with listeners and attributes", () => {
    render(<SortableNumberedListNode {...baseProps} />);
    expect(screen.getByTestId("sortable-attributes")).toBeInTheDocument();
    expect(screen.getByTestId("sortable-listeners")).toBeInTheDocument();
  });

  it("renders NumberedListNode with correct content", () => {
    render(<SortableNumberedListNode {...baseProps} />);
    expect(screen.getByTestId("numbered-node")).toHaveTextContent(
      "Node content for 123"
    );
  });
});