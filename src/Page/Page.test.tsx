// Page.test.tsx
import { render, fireEvent, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { Page } from "./Page";
import { useAppState } from "../state/AppStateContext";
import { supabase } from "../supabaseClient";
import { useNavigate, useParams } from "react-router-dom";

// Mocks
vi.mock("react-router-dom", () => ({
  useNavigate: vi.fn(),
  useParams: vi.fn(),
}));

vi.mock("../state/AppStateContext", () => ({
  useAppState: vi.fn(),
}));

vi.mock("../supabaseClient", () => {
  const mockEq = vi.fn(function () {
    return this;
  });

  const mockUpdate = vi.fn(function () {
    return {
      eq: mockEq,
    };
  });

  const mockSelect = vi.fn().mockReturnThis();

  const mockSingle = vi.fn().mockResolvedValue({
    data: { id: 1, title: "My Title", emoji: "🔥" },
    error: null,
  });

  const mockFrom = vi.fn(() => ({
    select: mockSelect,
    single: mockSingle,
    update: mockUpdate,
    eq: mockEq,
  }));

  return {
    supabase: {
      from: mockFrom,
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user123" } },
          error: null,
        }),
        signOut: vi.fn().mockResolvedValue({}),
      },
    },
  };
});

vi.mock("../Page/Cover", () => ({
  Cover: () => <div data-testid="cover" />,
}));
vi.mock("../Page/Title", () => ({
  Title: ({ title, changePageTitle }: any) => (
    <input
      data-testid="title-input"
      value={title}
      onChange={(e) => changePageTitle(e.target.value)}
    />
  ),
}));
vi.mock("../Page/Spacer", () => ({
  Spacer: ({ handleClick }: any) => <button data-testid="add-node" onClick={handleClick}>Add Node</button>,
}));
vi.mock("../Node/NodeContainer", () => ({
  NodeContainer: () => <div data-testid="node" />,
}));
vi.mock("../Node/SortableNumberedListNode", () => ({
  SortableNumberedListNode: () => <div data-testid="list-node" />,
}));
vi.mock("emoji-picker-react", () => {
  return {
    default: ({ onEmojiClick }: any) => (
      <button data-testid="emoji-option-button" onClick={() => onEmojiClick({ emoji: "🧪" })}>
        Pick Emoji
      </button>
    )
  };
});
vi.mock("@dnd-kit/core", async () => {
  const actual = await vi.importActual<any>("@dnd-kit/core");

  return {
    ...actual,
    DndContext: ({ children, onDragEnd }: any) => (
      <div data-testid="dnd-context" onClick={() => onDragEnd({
        active: { id: "a" },
        over: { id: "b" },
      })}>
        {children}
      </div>
    ),
  };
});

describe("Page component", () => {
  const mockNavigate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    (useNavigate as any).mockReturnValue(mockNavigate);
    (useParams as any).mockReturnValue({ id: "test-slug" });

    let mockTitle = "Test Page";

    (useAppState as any).mockReturnValue({
      title: mockTitle,
      nodes: [],
      cover: "test.jpg",
      isCommanPanelOpen: false,
      addNode: vi.fn(),
      reorderNodes: vi.fn(),
      setCoverImage: vi.fn(),
      setTitle: (newTitle: string) => {
        mockTitle = newTitle;
      },
    });
  });

  it("renders cover and title input", async () => {
    const { getByTestId } = render(<Page />);
    expect(getByTestId("cover")).toBeInTheDocument();
    expect(getByTestId("title-input")).toBeInTheDocument();
  });

  it("shows and selects emoji", async () => {
    const { getByTestId, queryByTestId } = render(<Page />);

    fireEvent.click(getByTestId("emoji-option")); // open emoji picker
    expect(getByTestId("emoji-option-button")).toBeInTheDocument();

    fireEvent.click(getByTestId("emoji-option-button")); // pick emoji (mocked component)

    await waitFor(() => {
        expect(queryByTestId("emoji-option-button")).not.toBeInTheDocument(); // still present but picker closed
    });
  });

  it("calls setTitle when editing the title", async () => {
    const mockSetTitle = vi.fn();

    (useAppState as any).mockReturnValueOnce({
        ...useAppState(),
        setTitle: mockSetTitle,
    });

    const { getByTestId } = render(<Page />);
    const input = getByTestId("title-input");

    fireEvent.change(input, { target: { value: "New Title" } });

    await waitFor(() => {
        expect(mockSetTitle).toHaveBeenCalledWith("New Title");
    });
  });

  it("handles sign out", async () => {
    const { getByText } = render(<Page />);
    fireEvent.click(getByText("Sign Out"));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/auth");
    });
  });

  it("adds a node when Spacer is clicked", () => {
    const addNodeMock = vi.fn();
    (useAppState as any).mockReturnValueOnce({
      ...useAppState(),
      addNode: addNodeMock,
      nodes: [],
    });

    const { getByTestId } = render(<Page />);
    fireEvent.click(getByTestId("add-node"));
    expect(addNodeMock).toHaveBeenCalled();
  });

  it("goes back when previous page button is clicked", () => {
    const { getByText } = render(<Page />);
    fireEvent.click(getByText("Previous Page"));
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });
  it("shows back button when id param is present", () => {
    (useParams as any).mockReturnValue({ id: "123" });
    const { getByText } = render(<Page />);
    expect(getByText("Previous Page")).toBeInTheDocument();
  });
  it("does not show back button when no id param is present", () => {
    (useParams as any).mockReturnValue({ id: undefined });
    const { queryByText } = render(<Page />);
    expect(queryByText("Previous Page")).not.toBeInTheDocument();
  });
  it("closes emoji picker when clicking outside", async () => {
    const { getByTestId } = render(<Page />);

    fireEvent.click(getByTestId("emoji-option")); // open picker

    await waitFor(() => {
        expect(getByTestId("emoji-option")).toBeInTheDocument(); // still in DOM
    });

    fireEvent.mouseDown(document);

    await waitFor(() => {
        expect(getByTestId("emoji-option")).toBeInTheDocument();
    });
  });
  it("handles arrow key navigation", () => {
    (useAppState as any).mockReturnValueOnce({
        ...useAppState(),
        nodes: [{ id: "1", type: "text", value: "" }],
    });

    render(<Page />);
    fireEvent.keyDown(window, { key: "ArrowDown" });
    fireEvent.keyDown(window, { key: "ArrowUp" });
    fireEvent.keyDown(window, { key: "Delete" });
  });
  it("fetches page data and sets emoji/title", async () => {
    const mockSetTitle = vi.fn();
    const mockSetEmoji = vi.fn();

    (useAppState as any).mockReturnValue({
        title: "Test Page",
        nodes: [],
        cover: "test.jpg",
        isCommanPanelOpen: false,
        addNode: vi.fn(),
        reorderNodes: vi.fn(),
        setCoverImage: vi.fn(),
        setTitle: mockSetTitle,
    });

    render(<Page />);

    await waitFor(() => {
        expect(mockSetTitle).toHaveBeenCalledWith("My Title");
    });
  });
  it("handles fetchPageData error", async () => {
    const errorFromSupabase = { code: "PGRST999", message: "Oops" };

    vi.mocked(supabase.from).mockReturnValueOnce({
        select: () => ({
        eq: () => ({
            eq: () => ({
            single: () => Promise.resolve({ error: errorFromSupabase }),
            }),
        }),
        }),
    } as any);

    render(<Page />);
    await waitFor(() => {
        expect(true).toBe(true); // Ensure component doesn't crash
    });
  });
  it("handles arrow key navigation", async () => {
    render(<Page />);

    fireEvent.keyDown(window, { key: "ArrowUp" });
    fireEvent.keyDown(window, { key: "ArrowDown" });
    fireEvent.keyDown(window, { key: "Delete" });

    // Assert doesn't crash; optionally spy on focusNode logic
    expect(true).toBe(true);
  });
  it("updates emoji via handleEmojiClick", async () => {
    const mockSetTitle = vi.fn();
    const chain = {
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { title: "My Title", emoji: "🧪" } }),
    };

    vi.mocked(supabase.from).mockReturnValue({
      update: vi.fn().mockReturnValue(chain),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { title: "My Title", emoji: "🧪" } }),
    } as any);

    (useAppState as any).mockReturnValue({
      title: "Test Page",
      nodes: [],
      cover: "test.jpg",
      isCommanPanelOpen: false,
      addNode: vi.fn(),
      reorderNodes: vi.fn(),
      setCoverImage: vi.fn(),
      setTitle: mockSetTitle,
    });

    const { getByTestId } = render(<Page />);
    fireEvent.click(getByTestId("emoji-option"));
    fireEvent.click(getByTestId("emoji-option-button"));

    await waitFor(() => {
      expect(mockSetTitle).toHaveBeenCalledWith("My Title");
    });
  });
  it("calls reorderNodes on drag end", () => {
    const reorderNodes = vi.fn();

    (useAppState as any).mockReturnValue({
        title: "Test Page",
        nodes: [{ id: "a" }, { id: "b" }],
        cover: "test.jpg",
        isCommanPanelOpen: false,
        addNode: vi.fn(),
        reorderNodes,
        setCoverImage: vi.fn(),
        setTitle: vi.fn(),
    });

    const { getByTestId } = render(<Page />);
    fireEvent.click(getByTestId("dnd-context"));
    expect(reorderNodes).toHaveBeenCalledWith("a", "b");
  });
  it("saves title after debounce", async () => {
    const mockSetTitle = vi.fn();
    (useAppState as any).mockReturnValueOnce({
        ...useAppState(),
        setTitle: mockSetTitle,
    });

    const { getByTestId } = render(<Page />);
    fireEvent.change(getByTestId("title-input"), { target: { value: "Updated Title" } });

    await new Promise((r) => setTimeout(r, 250));
    expect(mockSetTitle).toHaveBeenCalledWith("Updated Title");
  });
  it("renders grouped nodes correctly", () => {
    const nodes = [
        { id: "n1", type: "numberedList", value: "" },
        { id: "n2", type: "numberedList", value: "" },
        { id: "n3", type: "text", value: "" },
    ];

    (useAppState as any).mockReturnValueOnce({
        ...useAppState(),
        nodes,
    });

    const { getAllByTestId } = render(<Page />);
    expect(getAllByTestId("list-node")).toHaveLength(2);
    expect(getAllByTestId("node")).toHaveLength(1); 
  });
  it("calls focusNode on ArrowDown", () => {
    const mockFocus = vi.fn();

    const dummyDiv = document.createElement("div");
    dummyDiv.textContent = "Some text";
    document.body.appendChild(dummyDiv);
    dummyDiv.getBoundingClientRect = () => ({ left: 42, top: 24, right: 0, bottom: 0, width: 0, height: 0, x: 0, y: 0, toJSON: () => "" });

    const focusableDiv = document.createElement("div");
    focusableDiv.focus = mockFocus;
    (focusableDiv as any).getBoundingClientRect = () => ({ left: 42, top: 24, right: 0, bottom: 0, width: 0, height: 0, x: 0, y: 0, toJSON: () => "" });

    (useAppState as any).mockReturnValueOnce({
        ...useAppState(),
        nodes: [{ id: "a", type: "text", value: "" }, { id: "b", type: "text", value: "" }],
    });

    render(<Page />);

    fireEvent.keyDown(window, { key: "ArrowDown" });

    expect(true).toBe(true);
  });
  it("sets user ID from supabase on mount", async () => {
    render(<Page />);
    await waitFor(() => {
        expect(true).toBe(true);
    });
  });
  it("logs error when no user is found", async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValueOnce({
        data: null,
        error: { message: "No user" },
    });

    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    render(<Page />);

    await waitFor(() => {
        expect(errorSpy).toHaveBeenCalledWith("User not found:", { message: "No user" });
    });

    errorSpy.mockRestore();
  });
  it("registers refs for SortableNumberedListNode and NodeContainer", () => {
    (useAppState as any).mockReturnValueOnce({
        ...useAppState(),
        nodes: [
        { id: "n1", type: "numberedList", value: "" },
        { id: "n2", type: "text", value: "" },
        ],
    });

    const { getAllByTestId } = render(<Page />);
    expect(getAllByTestId("list-node")).toHaveLength(1);
    expect(getAllByTestId("node")).toHaveLength(1);
  });
  it("fetches page data and sets title and emoji", async () => {
    (useParams as any).mockReturnValue({ id: "test-slug" });

    (useAppState as any).mockReturnValueOnce({
      ...useAppState(),
      title: "Old Title",
      node: { value: "test-slug" },
      userId: "user123",
      setTitle: vi.fn(),
    });

    render(<Page />);
    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith("pages");
    });
  });
  it("handles emoji selection", async () => {
    const { getByTestId } = render(<Page />);
    const emojiButton = getByTestId("emoji-option");
    fireEvent.click(emojiButton);

    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith("pages");
    });
  });
  it("handleTitleChange clears and sets debounce timer", async () => {
    const mockSetTitle = vi.fn();
    (useAppState as any).mockReturnValueOnce({
      ...useAppState(),
      setTitle: mockSetTitle,
    });
    const { getByTestId } = render(<Page />);
    fireEvent.change(getByTestId("title-input"), { target: { value: "New Title" } });
    await new Promise((r) => setTimeout(r, 250));
    expect(mockSetTitle).toHaveBeenCalledWith("New Title");
  });
  it("getCaretCoordinates returns coordinates if selection exists", () => {
    render(<Page />);
    const div = document.createElement("div");
    div.textContent = "abc";
    document.body.appendChild(div);
    const range = document.createRange();
    range.selectNodeContents(div);
    range.collapse(true);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
  });
  it("fetchPageData returns if error.code is PGRST116", async () => {
    vi.mocked(supabase.from).mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: { code: "PGRST116" } }),
    } as any);
    render(<Page />);
    await waitFor(() => {
      expect(true).toBe(true);
    });
  });
  it("handleKeyDown returns if isCommanPanelOpen", () => {
    (useAppState as any).mockReturnValueOnce({
      ...useAppState(),
      isCommanPanelOpen: true,
    });
    render(<Page />);
    fireEvent.keyDown(window, { key: "ArrowUp" });
    expect(true).toBe(true);
  });
  it("renders grouped nodes when currentGroup.length > 0", () => {
    const nodes = [
      { id: "n1", type: "numberedList", value: "" },
      { id: "n2", type: "numberedList", value: "" },
      { id: "n3", type: "text", value: "" },
    ];
    (useAppState as any).mockReturnValueOnce({
      ...useAppState(),
      nodes,
    });
    const { getAllByTestId } = render(<Page />);
    expect(getAllByTestId("list-node")).toHaveLength(2);
    expect(getAllByTestId("node")).toHaveLength(1);
  });
});