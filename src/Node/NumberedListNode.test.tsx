import { render, screen, fireEvent } from "@testing-library/react";
import { NumberedListNode } from "./NumberedListNode";
import { vi } from "vitest";
import { act } from "react";

const mockChangeNodeValue = vi.fn();
const mockRemoveNodeByIndex = vi.fn();
const mockAddNode = vi.fn();
const mockChangeNodeType = vi.fn();

vi.mock("../state/AppStateContext", () => ({
  useAppState: () => ({
    changeNodeValue: mockChangeNodeValue,
    removeNodeByIndex: mockRemoveNodeByIndex,
    addNode: mockAddNode,
    changeNodeType: mockChangeNodeType,
  }),
}));

let mockSelectItem: ((type: string) => void) | undefined;

vi.mock("./CommandPanel", () => ({
  CommandPanel: ({ selectItem, nodeText }: any) => {
    mockSelectItem = selectItem;
      return (
      <div data-testid="command-panel">
        Command: {nodeText}
        <button onClick={() => selectItem("numbered-list")} data-testid="select-numbered">
          Numbered List
        </button>
      </div>
    );
  },
}));

beforeEach(() => {
  vi.useFakeTimers();
  mockChangeNodeValue.mockClear();
  mockRemoveNodeByIndex.mockClear();
  mockChangeNodeType.mockClear();
  mockAddNode.mockClear();
});

afterEach(() => {
  vi.runOnlyPendingTimers();
  vi.useRealTimers();
});

describe("NumberedListNode", () => {
  const baseProps = {
    node: { id: "1", type: "numbered", value: "Test" },
    index: 0,
    isFocused: false,
    updateFocusedIndex: vi.fn(),
    registerRef: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders node content", () => {
    render(<NumberedListNode {...baseProps} />);
    expect(screen.getByText("Test")).toBeInTheDocument();
  });

  it("renders CommandPanel if value starts with / and is focused", () => {
    const props = { ...baseProps, isFocused: true, node: { ...baseProps.node, value: "/cmd" } };
    render(<NumberedListNode {...props} />);
    expect(screen.getByTestId("command-panel")).toHaveTextContent("Command: /cmd");
  });

  it("calls changeNodeValue on input", () => {
    render(<NumberedListNode {...baseProps} />);
    const editable = screen.getByText("Test");
    editable.textContent = "Updated";
    fireEvent.input(editable);
    expect(mockChangeNodeValue).toHaveBeenCalledWith(0, "Updated");
  });

  it("calls addNode and updates focus on Enter", () => {
    const props = { ...baseProps, isFocused: true };
    render(<NumberedListNode {...props} />);
    const editable = screen.getByText("Test");
    editable.focus();

    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(editable);
    range.collapse(false);
    selection?.removeAllRanges();
    selection?.addRange(range);

    fireEvent.keyDown(editable, { key: "Enter" });

    vi.runAllTimers();

    expect(mockAddNode).toHaveBeenCalled();
    expect(props.updateFocusedIndex).toHaveBeenCalledWith(1);
  });

  it("calls removeNodeByIndex when Backspace on empty node", async () => {
    render(
      <NumberedListNode
        index={0}
        node={{ type: "numberedList", value: "" }}
        isFocused={true}
        changeNodeValue={vi.fn()}
        updateFocusedIndex={vi.fn()}
      />
    );

    const editable = screen.getByTestId("editable");
    editable.focus();

    Object.defineProperty(editable, "textContent", {
      value: "",
      configurable: true,
    });
    Object.defineProperty(editable, "innerHTML", {
      value: "<br>",
      configurable: true,
    });

    const range = document.createRange();
    range.setStart(editable, 0);
    range.setEnd(editable, 0);

    const selection = {
      rangeCount: 1,
      getRangeAt: () => range,
      removeAllRanges: vi.fn(),
      addRange: vi.fn(),
    };

    vi.spyOn(window, "getSelection").mockReturnValue(selection as unknown as Selection);
    fireEvent.keyDown(editable, { key: "Backspace" });

    vi.runAllTimers();

    expect(mockRemoveNodeByIndex).toHaveBeenCalledWith(0);
  });

  it("calls removeNodeByIndex and merges nodes on Delete (render both components)", () => {
    render(
      <>
        <NumberedListNode
          index={0}
          node={{ type: "numbered-list", value: "" }}
          isFocused={true}
          changeNodeValue={mockChangeNodeValue}
          removeNodeByIndex={mockRemoveNodeByIndex}
          updateFocusedIndex={vi.fn()}
        />
        <NumberedListNode
          index={1}
          node={{ type: "numbered-list", value: "Next" }}
          isFocused={false}
          changeNodeValue={mockChangeNodeValue}
          removeNodeByIndex={mockRemoveNodeByIndex}
          updateFocusedIndex={vi.fn()}
        />
      </>
    );

    const editable = screen.getAllByTestId("editable")[0];

    editable.textContent = "";
    editable.innerHTML = "<br>";
    editable.focus();

    const range = document.createRange();
    range.selectNodeContents(editable);
    range.collapse(true);

    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);

    fireEvent.keyDown(editable, { key: "Delete", code: "Delete" });
    vi.runAllTimers();

    expect(mockChangeNodeValue).toHaveBeenCalledWith(0, "Next");
    expect(mockRemoveNodeByIndex).toHaveBeenCalledWith(1);
  });
  it("calls updateFocusedIndex on click", () => {
    const mockUpdateFocusedIndex = vi.fn();
    render(
      <NumberedListNode
        index={1}
        node={{ type: "numbered-list", value: "Test" }}
        changeNodeValue={vi.fn()}
        updateFocusedIndex={mockUpdateFocusedIndex}
      />
    );
    fireEvent.click(screen.getByText("Test"));
    expect(mockUpdateFocusedIndex).toHaveBeenCalledWith(1);
  });
  it("deletes node if it is empty", () => {

  render(
    <NumberedListNode
      index={0}
      node={{ type: "numbered-list", value: "" }}
      removeNodeByIndex={mockRemoveNodeByIndex}
      changeNodeValue={vi.fn()}
      updateFocusedIndex={vi.fn()}
    />
  );

  const editable = screen.getByRole("textbox");

  editable.innerHTML = "<br>";
  editable.textContent = "";
  editable.focus();

  fireEvent.keyDown(editable, { key: "Backspace" });

  expect(mockRemoveNodeByIndex).toHaveBeenCalledWith(0);
});
  it("merges current node with previous if caret is at start (mock querySelector)", () => {
   render(
      <NumberedListNode
        index={1}
        node={{ type: "numbered-list", value: "Next" }}
        changeNodeValue={mockChangeNodeValue}
        removeNodeByIndex={mockRemoveNodeByIndex}
        updateFocusedIndex={vi.fn()}
        isFocused={true}
      />
    );

    const editable = screen.getByTestId("editable");

    const fakePrevNode = document.createElement("div");
    const fakePrevTextNode = document.createTextNode("Prev");
    fakePrevNode.appendChild(fakePrevTextNode);

    vi.spyOn(document, "querySelector").mockImplementation((selector) => {
      if (selector === `[data-node-index="0"] div[contenteditable]`) {
        return fakePrevNode;
      }
      return document.querySelector(selector);
    });

    const range = document.createRange();
    range.setStart(editable.firstChild || editable, 0);
    range.collapse(true);

    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);

    fireEvent.keyDown(editable, { key: "Backspace" });
    vi.runAllTimers();

    expect(mockChangeNodeValue).toHaveBeenCalledWith(0, "PrevNext");
    expect(mockRemoveNodeByIndex).toHaveBeenCalledWith(1);
    expect(screen.getByTestId("editable")).toHaveFocus();

    vi.restoreAllMocks();
  });
  it("deletes node if all text is selected and Backspace is pressed", () => {
    const nodeText = "To be deleted";
    render(
      <NumberedListNode
        index={1}
        node={{ type: "numbered-list", value: nodeText }}
        changeNodeValue={mockChangeNodeValue}
        removeNodeByIndex={mockRemoveNodeByIndex}
        updateFocusedIndex={vi.fn()}
        isFocused={true}
      />
    );

    const editable = screen.getByTestId("editable");

    editable.textContent = nodeText;

    const range = document.createRange();
    range.setStart(editable.firstChild!, 0);
    range.setEnd(editable.firstChild!, nodeText.length);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);

    fireEvent.keyDown(editable, { key: "Backspace" });
    vi.runAllTimers();

    expect(mockRemoveNodeByIndex).toHaveBeenCalledWith(1);
  });
  it("ignores Enter key if justChangedType is true", () => {
    render(
      <NumberedListNode
        index={0}
        node={{ type: "numbered-list", value: "" }}
        changeNodeValue={mockChangeNodeValue}
        removeNodeByIndex={mockRemoveNodeByIndex}
        updateFocusedIndex={vi.fn()}
        isFocused={true}
      />
    );

    const editable = screen.getByTestId("editable");

    act(() => {
      editable.textContent = "";
    });

    fireEvent.keyDown(editable, { key: "Enter" });
    vi.runAllTimers();

    fireEvent.keyDown(editable, { key: "Enter" });
    vi.runAllTimers();

    expect(mockChangeNodeValue).not.toHaveBeenCalled();
  });
  it("resets justChangedType on Enter key", () => {
    const { getByTestId } = render(<NumberedListNode {...baseProps} />);
    const editable = getByTestId("editable");

    mockSelectItem?.("heading");

    fireEvent.keyDown(editable, {
      key: "Enter",
    });

    expect(mockAddNode).toHaveBeenCalled();
  });
  it("calls changeNodeType and clears content when command is selected", () => {
    const props = {
      ...baseProps,
      isFocused: true,
      node: { ...baseProps.node, value: "/cmd" },
    };

    render(<NumberedListNode {...props} />);
    const editable = screen.getByTestId("editable");
    editable.textContent = "/cmd";

    fireEvent.click(screen.getByTestId("select-numbered"));

    expect(mockChangeNodeType).toHaveBeenCalledWith(0, "numbered-list");
    expect(editable.textContent).toBe("");
  });
  it("does not add new node if Enter is pressed after command change", () => {
    const props = {
      ...baseProps,
      isFocused: true,
      node: { ...baseProps.node, value: "/cmd" },
    };

    render(<NumberedListNode {...props} />);

    fireEvent.click(screen.getByTestId("select-numbered"));

    const editable = screen.getByTestId("editable");
    editable.focus();

    fireEvent.keyDown(editable, { key: "Enter" });

    vi.runAllTimers();

    expect(mockAddNode).not.toHaveBeenCalled();
  });
  it("merges current node with previous if caret is at start", () => {
    render(
      <>
        <NumberedListNode
          index={0}
          node={{ id: "prev", type: "numbered-list", value: "Prev" }}
          isFocused={false}
          updateFocusedIndex={vi.fn()}
          changeNodeValue={mockChangeNodeValue}
          removeNodeByIndex={mockRemoveNodeByIndex}
        />
        <NumberedListNode
          index={1}
          node={{ id: "curr", type: "numbered-list", value: "Curr" }}
          isFocused={true}
          updateFocusedIndex={vi.fn()}
          changeNodeValue={mockChangeNodeValue}
          removeNodeByIndex={mockRemoveNodeByIndex}
        />
      </>
    );

    const editable = screen.getAllByTestId("editable")[1];
    editable.textContent = "Curr";
    editable.focus();

    const range = document.createRange();
    range.setStart(editable.firstChild!, 0);
    range.collapse(true);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);

    fireEvent.keyDown(editable, { key: "Backspace" });

    vi.runAllTimers();

    expect(mockChangeNodeValue).toHaveBeenCalledWith(0, "PrevCurr");
    expect(mockRemoveNodeByIndex).toHaveBeenCalledWith(1);
  });
  it("merges current node with next if caret is at end and Delete is pressed", () => {
    render(
      <>
        <NumberedListNode
          index={0}
          node={{ id: "curr", type: "numbered-list", value: "Curr" }}
          isFocused={true}
          updateFocusedIndex={vi.fn()}
          changeNodeValue={mockChangeNodeValue}
          removeNodeByIndex={mockRemoveNodeByIndex}
        />
        <NumberedListNode
          index={1}
          node={{ id: "next", type: "numbered-list", value: "Next" }}
          isFocused={false}
          updateFocusedIndex={vi.fn()}
          changeNodeValue={mockChangeNodeValue}
          removeNodeByIndex={mockRemoveNodeByIndex}
        />
      </>
    );

    const editable = screen.getAllByTestId("editable")[0];
    editable.textContent = "Curr";
    editable.focus();

    const range = document.createRange();
    range.setStart(editable.firstChild!, "Curr".length);
    range.collapse(true);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);

    fireEvent.keyDown(editable, { key: "Delete" });

    vi.runAllTimers();

    expect(mockChangeNodeValue).toHaveBeenCalledWith(0, "CurrNext");
    expect(mockRemoveNodeByIndex).toHaveBeenCalledWith(1);
  });
  it("deletes node and moves focus to previous node when all text is selected and Backspace is pressed", () => {
    render(
      <>
        <NumberedListNode
          index={0}
          node={{ id: "prev", type: "numbered-list", value: "Prev" }}
          isFocused={false}
          updateFocusedIndex={mockChangeNodeValue}
          changeNodeValue={mockChangeNodeValue}
          removeNodeByIndex={mockRemoveNodeByIndex}
        />
        <NumberedListNode
          index={1}
          node={{ id: "curr", type: "numbered-list", value: "Curr" }}
          isFocused={true}
          updateFocusedIndex={mockChangeNodeValue}
          changeNodeValue={mockChangeNodeValue}
          removeNodeByIndex={mockRemoveNodeByIndex}
        />
      </>
    );

    const editable = screen.getAllByTestId("editable")[1];
    editable.textContent = "Curr";
    editable.focus();

    const range = document.createRange();
    range.setStart(editable.firstChild!, 0);
    range.setEnd(editable.firstChild!, "Curr".length);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);

    const prevNode = screen.getAllByTestId("editable")[0];
    const focusSpy = vi.spyOn(prevNode, "focus");

    fireEvent.keyDown(editable, { key: "Backspace" });

    vi.runAllTimers();

    expect(mockRemoveNodeByIndex).toHaveBeenCalledWith(1);
    expect(focusSpy).toHaveBeenCalled();
    expect(mockChangeNodeValue).toHaveBeenCalledWith(0);
  });
  it("deletes node and moves focus to previous node when node is empty and Backspace is pressed", () => {
    render(
      <>
        <NumberedListNode
          index={0}
          node={{ id: "prev", type: "numbered-list", value: "Prev" }}
          isFocused={false}
          updateFocusedIndex={mockChangeNodeValue}
          changeNodeValue={mockChangeNodeValue}
          removeNodeByIndex={mockRemoveNodeByIndex}
        />
        <NumberedListNode
          index={1}
          node={{ id: "curr", type: "numbered-list", value: "" }}
          isFocused={true}
          updateFocusedIndex={mockChangeNodeValue}
          changeNodeValue={mockChangeNodeValue}
          removeNodeByIndex={mockRemoveNodeByIndex}
        />
      </>
    );

    const editable = screen.getAllByTestId("editable")[1];
    editable.textContent = "";
    editable.innerHTML = "<br>";
    editable.focus();

    const range = document.createRange();
    range.setStart(editable, 0);
    range.collapse(true);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);

    const prevNode = screen.getAllByTestId("editable")[0];
    const focusSpy = vi.spyOn(prevNode, "focus");

    fireEvent.keyDown(editable, { key: "Backspace" });

    vi.runAllTimers();

    expect(mockRemoveNodeByIndex).toHaveBeenCalledWith(1);
    expect(focusSpy).toHaveBeenCalled();
    expect(mockChangeNodeValue).toHaveBeenCalledWith(0);
  });
});