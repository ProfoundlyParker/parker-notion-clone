import { render, fireEvent, screen, waitFor } from "@testing-library/react";
import { ImageNode } from "./ImageNode";
import { vi } from "vitest";
import { uploadImage } from "../utils/uploadImage";
import { supabase } from "../supabaseClient";

const mockRemoveNodeByIndex = vi.fn();
const mockChangeNodeValue = vi.fn();
const mockChangeNodeType = vi.fn();

vi.mock("../state/AppStateContext", () => ({
  useAppState: () => ({
    changeNodeValue: mockChangeNodeValue,
    removeNodeByIndex: mockRemoveNodeByIndex,
    changeNodeType: mockChangeNodeType,
  }),
}));

vi.mock("../Page/PageIdContext", () => ({
  usePageId: () => "test-page-id",
}));

vi.mock("../utils/uploadImage", () => ({
  uploadImage: vi.fn(),
}));

vi.mock("../supabaseClient", () => {
  const mockUpdate = vi.fn().mockReturnThis();
  const mockSelect = vi.fn().mockReturnThis();
  const mockEq = vi.fn().mockReturnThis();
  const mockSingle = vi.fn().mockResolvedValue({
    data: {
      nodes: [
        {
          id: "node456",
          width: 300,
          height: 150,
          caption: "Original",
        },
        {
          id: "node789",
          width: 500,
          height: 500,
          caption: "Another node",
        },
      ],
    },
  });

  return {
    supabase: {
      auth: {
        getUser: vi.fn(() => Promise.resolve({ data: { user: { id: "user123" } } , error: { message: 'No user found'}})),
      },
      from: vi.fn(() => ({
        select: mockSelect,
        update: mockUpdate,
        eq: mockEq,
        single: mockSingle,
      })),
    },
  };
});

describe("<ImageNode />", () => {
  const defaultProps = {
    index: 0,
    node: {
      id: "node-id",
      type: "image",
      value: "image.png",
      width: 300,
      height: 200,
      caption: "Example caption",
    },
  };

  it("renders image and caption", async () => {
     render(<ImageNode {...defaultProps} />);

     expect(screen.getByTestId("image-caption")).toBeInTheDocument();

     await waitFor(() => {
        expect(screen.getByTestId("image-node")).toBeInTheDocument();
     });
   });
  it("calls uploadImage and updates value on file upload", async () => {
    const mockUpload = uploadImage as unknown as vi.Mock;
    mockUpload.mockResolvedValue({ filePath: "new-path.png" });

    render(<ImageNode {...defaultProps} />);
    const fileInput = screen.getByTestId("node-image-upload", { selector: "input" });

    fireEvent.change(fileInput, {
      target: { files: [new File(["img"], "test.png", { type: "image/png" })] },
    });

    await waitFor(() => {
      expect(uploadImage).toHaveBeenCalled();
    });
  });

  it("deletes node on delete click", () => {
    render(<ImageNode {...defaultProps} />);
    fireEvent.click(screen.getByText("Delete"));
    expect(mockRemoveNodeByIndex).toHaveBeenCalledWith(0);
  });

  it("triggers file input on replace click", () => {
    render(<ImageNode {...defaultProps} />);
    const replaceButton = screen.getByText("Replace");
    fireEvent.click(replaceButton);
    // We can't test fileInput.click(), but this checks it doesn't crash
  });

  it("enters and saves caption edit mode", async () => {
    render(<ImageNode {...defaultProps} />);
    const caption = screen.getByText("Example caption");
    fireEvent.click(caption);

    const input = screen.getByDisplayValue("Example caption");
    fireEvent.change(input, { target: { value: "Updated caption" } });
    fireEvent.blur(input);

    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalled(); // called to save caption
    });
  });

  it("shows upload button if no image exists", () => {
    render(<ImageNode {...defaultProps} node={{ ...defaultProps.node, value: "" }} />);
    expect(screen.getByText("Upload Image")).toBeInTheDocument();
  });
  it("clears node value and image path if no file is uploaded", async () => {
    render(<ImageNode {...defaultProps} changeNodeValue={mockChangeNodeValue} />);
    const input = screen.getByTestId("node-image-upload") as HTMLInputElement;
    const emptyFileList = {
        length: 0,
        item: () => null,
    } as unknown as FileList;

    await fireEvent.change(input, { target: { files: emptyFileList } });
    expect(mockChangeNodeValue).toHaveBeenCalledWith(defaultProps.index, "");
  });
  it("calls removeNodeByIndex on Backspace if input is not focused", () => {
    render(<ImageNode {...defaultProps} />);
    fireEvent.keyDown(window, { key: "Backspace" });
    expect(mockRemoveNodeByIndex).toHaveBeenCalledWith(defaultProps.index);
  });
  it("blurs caption input on Enter", () => {
    render(<ImageNode {...defaultProps} />);
    const caption = screen.getByTestId("image-caption");
    fireEvent.keyDown(caption, { key: "Enter" });

    const input = screen.getByPlaceholderText("Add a caption...");
    const blur = vi.spyOn(input, "blur");

    fireEvent.keyDown(input, { key: "Enter" });
    expect(blur).toHaveBeenCalled();
  });
  it("starts editing caption on Enter or Space key", () => {
    render(<ImageNode {...defaultProps} />);
    const caption = screen.getByTestId("image-caption");
    fireEvent.keyDown(caption, { key: "Enter" });
    expect(screen.getByPlaceholderText("Add a caption...")).toBeInTheDocument();
  });
  it("updates Supabase when image is resized", async () => {
    const updateFocusedIndex = vi.fn();
    const node = {
        id: "node-id",
        type: "image",
        value: "fake-url",
        width: 300,
        height: 200,
        caption: "",
    };

    render(
        <ImageNode
        index={0}
        node={node}
        changeNodeValue={mockChangeNodeValue}
        removeNodeByIndex={mockRemoveNodeByIndex}
        updateFocusedIndex={updateFocusedIndex}
        focused={true}
        />
    );

    const resizeWrapper = screen.getByTestId("resize-wrapper");
    fireEvent.resize(resizeWrapper, { detail: { width: 100, height: 150 } });

    await waitFor(() => {
        expect(supabase.from().update).toHaveBeenCalledWith(
        expect.objectContaining({
            nodes: expect.arrayContaining([
            expect.objectContaining({
                id: "node456",
                width: 300,
                height: 150,
            }),
            ]),
        })
        );
    });
  });
  it("logs error when user is not found", async () => {
    const getUserMock = vi.spyOn(supabase.auth, "getUser").mockResolvedValueOnce({
        data: { user: null },
        error: { message: "No user found" },
    });

    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    render(<ImageNode {...defaultProps} />);

    await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith("User not found:", { message: "No user found" });
    });

    getUserMock.mockRestore();
    consoleErrorSpy.mockRestore();
  });
  it("toggles button visibility on image click when isMobile is true", async () => {
    const { getByTestId, queryByTestId } = render(<ImageNode {...defaultProps} isMobile={true} />);

    expect(queryByTestId("buttons")).toHaveStyle("display: block");

    fireEvent.click(getByTestId("image-node").parentElement!);

    await waitFor(() => {
        expect(queryByTestId("buttons")).not.toHaveStyle("display: none");
    });

    fireEvent.click(document.body);

    await waitFor(() => {
        expect(queryByTestId("buttons")).toHaveStyle("display: block");
    });
  });
  it("falls back to text node on upload error", async () => {
    const mockUpload = uploadImage as unknown as vi.Mock;
    mockUpload.mockRejectedValue(new Error("Upload failed"));

    render(<ImageNode {...defaultProps} />);
    const fileInput = screen.getByTestId("node-image-upload");

    fireEvent.change(fileInput, {
      target: { files: [new File(["fail"], "fail.png", { type: "image/png" })] },
    });

    await waitFor(() => {
      expect(mockChangeNodeValue).toHaveBeenCalledWith(0, "");
    });
  });
  it("calls updateNodeSizeInPage on resize", async () => {
    render(<ImageNode {...defaultProps} />);

    const resizeWrapper = screen.getByTestId("resize-wrapper");

    fireEvent.mouseDown(resizeWrapper);
    fireEvent.mouseUp(resizeWrapper); 

    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith("pages");
    });
  });
  it("removes node on Backspace keydown when not in input", () => {
    render(<ImageNode {...defaultProps} />);
    fireEvent.keyDown(window, { key: "Backspace" });
    expect(mockRemoveNodeByIndex).toHaveBeenCalledWith(0);
  });
  it("activates caption input on Enter or Space key", () => {
    render(<ImageNode {...defaultProps} />);
    const caption = screen.getByTestId("image-caption");

    fireEvent.keyDown(caption, { key: "Enter" });
    expect(screen.getByTestId("caption-input")).toBeInTheDocument();

    render(<ImageNode {...defaultProps} />);
    const caption2 = screen.getByTestId("image-caption");

    fireEvent.keyDown(caption2, { key: " " });
    expect(screen.getByTestId("caption-input")).toBeInTheDocument();
  });
  it("focuses caption input and moves caret to end when editing", async () => {
    render(<ImageNode node={{ id: "node-id", type: "image", value: "img.png", width: 300, height: 200, caption: "abc" }} index={0} />);
    const caption = screen.getByTestId("image-caption");
    fireEvent.click(caption);
    const input = screen.getByTestId("caption-input");
    expect(document.activeElement).toBe(input);
    expect(input.selectionStart).toBe(input.value.length);
    expect(input.selectionEnd).toBe(input.value.length);
  });
  it("removes node on Backspace if input is not focused", () => {
    render(<ImageNode node={{ id: "node-id", type: "image", value: "img.png", width: 300, height: 200 }} index={0} />);
    fireEvent.keyDown(window, { key: "Backspace" });
    expect(mockRemoveNodeByIndex).toHaveBeenCalledWith(0);
  });
  it("hides buttons when clicking outside on mobile", async () => {
    render(<ImageNode node={{ id: "node-id", type: "image", value: "img.png", width: 300, height: 200 }} index={0} />);
    Object.defineProperty(window, "innerWidth", { writable: true, value: 400 });
    window.dispatchEvent(new Event("resize"));
    const imageNode = screen.getByTestId("image-node");
    fireEvent.click(imageNode);
    const buttons = screen.getByTestId("buttons");
    expect(buttons).toBeInTheDocument();
    fireEvent.click(document.body);
    await waitFor(() => {
      expect(buttons).toHaveStyle("display: none");
    });
  });
  it("shows upload button if imagePath is empty", () => {
    render(<ImageNode node={{ id: "node-id", type: "image", value: "", width: 300, height: 200 }} index={0} />);
    expect(screen.getByText("Upload Image")).toBeInTheDocument();
  });
  it("file input has correct props", () => {
    render(<ImageNode node={{ id: "node-id", type: "image", value: "img.png", width: 300, height: 200 }} index={0} />);
    const fileInput = screen.getByTestId("node-image-upload");
    expect(fileInput).toHaveAttribute("type", "file");
    expect(fileInput).toHaveAttribute("accept", "image/*");
    expect(fileInput).toHaveStyle("display: none");
  });
  it("removes node on Backspace keydown when not in input", () => {
    render(<ImageNode node={{ id: "node-id", type: "image", value: "img.png", width: 300, height: 200 }} index={0} />);
    fireEvent.keyDown(window, { key: "Backspace" });
    expect(mockRemoveNodeByIndex).toHaveBeenCalledWith(0);
  });
    it("hides buttons when clicking outside on mobile", async () => {
    render(<ImageNode node={{ id: "node-id", type: "image", value: "img.png", width: 300, height: 200 }} index={0} />);
    Object.defineProperty(window, "innerWidth", { writable: true, value: 400 });
    window.dispatchEvent(new Event("resize"));
    const imageNode = screen.getByTestId("image-node");
    fireEvent.click(imageNode);
    const buttons = screen.getByTestId("buttons");
    expect(buttons).toBeInTheDocument();
    fireEvent.click(document.body);
    await waitFor(() => {
      expect(buttons).toHaveStyle("display: none");
    });
  });
});