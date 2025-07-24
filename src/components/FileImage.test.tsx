import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { FileImage } from "./FileImage";
import { vi } from "vitest";

vi.mock("./Loader", () => ({
  Loader: () => <div data-testid="loader">Loading...</div>
}));

const downloadMock = vi.fn();

vi.mock("../supabaseClient", () => ({
  supabase: {
    storage: {
      from: () => ({
        download: downloadMock,
      }),
    },
  },
}));

beforeEach(() => {
  global.URL.createObjectURL = vi.fn(() => "blob:http://localhost/fake-url");
});

describe("FileImage", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    downloadMock.mockReset();
  });

  it("shows loader while loading", async () => {
    downloadMock.mockReturnValueOnce(
      new Promise(() => {}) // never resolves
    );

    render(<FileImage filePath="test.jpg" />);
    expect(screen.getByTestId("loader")).toBeInTheDocument();
  });

  it("renders image when download succeeds", async () => {
    const mockBlob = new Blob(["fake image"], { type: "image/jpeg" });
    downloadMock.mockResolvedValueOnce({ data: mockBlob, error: null });

    render(<FileImage filePath="test.jpg" />);
    
    const img = await screen.findByRole("img");
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("alt", "test.jpg");
  });

  it("calls onLoad when image is loaded", async () => {
    const mockBlob = new Blob(["fake image"], { type: "image/jpeg" });
    downloadMock.mockResolvedValueOnce({ data: mockBlob, error: null });

    const onLoadMock = vi.fn();
    render(<FileImage filePath="test.jpg" onLoad={onLoadMock} />);

    const img = await screen.findByRole("img");

    fireEvent.load(img);

    await waitFor(() => {
      expect(onLoadMock).toHaveBeenCalled();
    });
  });

  it("returns null if filePath is empty", async () => {
    render(<FileImage filePath="" />);
    await waitFor(() => {
      expect(screen.queryByRole("img")).not.toBeInTheDocument();
      expect(screen.queryByTestId("loader")).not.toBeInTheDocument();
    });
  });

  it("does not render image if download fails", async () => {
    downloadMock.mockResolvedValueOnce({ data: null, error: new Error("failed") });

    render(<FileImage filePath="broken.jpg" />);

    await waitFor(() => {
      expect(screen.queryByRole("img")).not.toBeInTheDocument();
    });
  });
  it("logs error when download throws", async () => {
    const errorSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    downloadMock.mockRejectedValueOnce(new Error("network fail"));

    render(<FileImage filePath="error.jpg" />);
    
    await waitFor(() => {
      expect(errorSpy).toHaveBeenCalledWith(
        "error downloading image:",
        expect.any(Error)
      );
    });

    errorSpy.mockRestore();
  });
  it("sets loading false and image empty when filePath is falsy", async () => {
    const { container } = render(<FileImage filePath={null as any} />);
    
    await waitFor(() => {
      expect(container.querySelector("img")).toBeNull();
    });
  });
  it("does not render image if createObjectURL returns empty string", async () => {
    (global.URL.createObjectURL as any).mockReturnValueOnce("");

    const mockBlob = new Blob(["data"], { type: "image/jpeg" });
    downloadMock.mockResolvedValueOnce({ data: mockBlob, error: null });

    render(<FileImage filePath="test.jpg" />);

    await waitFor(() => {
      expect(screen.queryByRole("img")).not.toBeInTheDocument();
    });
  });
});