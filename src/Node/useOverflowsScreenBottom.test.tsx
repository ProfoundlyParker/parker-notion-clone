// useOverflowsScreenBottom.test.tsx
import { renderHook } from "@testing-library/react";
import { useOverflowsScreenBottom } from "./useOverflowsScreenBottom";
import { act } from "react";

describe("useOverflowsScreenBottom", () => {
    const originalInnerHeight = window.innerHeight;

    beforeEach(() => {
        vi.resetAllMocks();
    });

    afterEach(() => {
        Object.defineProperty(window, "innerHeight", {
            writable: true,
            configurable: true,
            value: originalInnerHeight,
        });
    });

    it("returns false when element does not overflow screen bottom", () => {
        Object.defineProperty(window, "innerHeight", {
            writable: true,
            configurable: true,
            value: 800,
        });

        const { result, rerender } = renderHook(() => useOverflowsScreenBottom());

        result.current.ref.current = {
            getBoundingClientRect: () => ({ bottom: 600 }),
        } as HTMLDivElement;

        rerender();

        expect(result.current.overflows).toBe(false);
    });

    it("returns true when element overflows screen bottom", () => {
        Object.defineProperty(window, "innerHeight", {
            writable: true,
            configurable: true,
            value: 600,
        });

        const { result } = renderHook(() => useOverflowsScreenBottom());

        result.current.ref.current = {
            getBoundingClientRect: () => ({ bottom: 800 }),
        } as unknown as HTMLDivElement;

        act(() => {
            result.current.checkOverflow();
        });

        expect(result.current.overflows).toBe(true);
    });

    it("defaults to false if ref is null", () => {
        const { result } = renderHook(() => useOverflowsScreenBottom());

        expect(result.current.overflows).toBe(false);
    });
});