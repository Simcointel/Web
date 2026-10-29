import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useDataRepo } from "./useDataRepo";

describe("useDataRepo", () => {
  it("initializes with loading state", () => {
    const fetcher = vi.fn().mockResolvedValue({ data: "test" });
    const { result } = renderHook(() => useDataRepo(fetcher));

    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it("provides refresh function", () => {
    const fetcher = vi.fn().mockResolvedValue({ data: "test" });
    const { result } = renderHook(() => useDataRepo(fetcher));

    expect(typeof result.current.refresh).toBe("function");
  });

  it("calls fetcher on mount", () => {
    const fetcher = vi.fn().mockResolvedValue({ data: "test" });
    renderHook(() => useDataRepo(fetcher));

    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("calls fetcher when deps change", () => {
    const fetcher1 = vi.fn().mockResolvedValue({ data: "1" });
    const fetcher2 = vi.fn().mockResolvedValue({ data: "2" });
    
    const { result, rerender } = renderHook(
      ({ fetcher, dep }) => useDataRepo(fetcher, [dep]),
      { initialProps: { fetcher: fetcher1, dep: 1 } }
    );

    expect(fetcher1).toHaveBeenCalledTimes(1);
    expect(fetcher2).not.toHaveBeenCalled();

    rerender({ fetcher: fetcher2, dep: 2 });

    expect(fetcher2).toHaveBeenCalledTimes(1);
  });

  it("refresh triggers new fetch", () => {
    const fetcher = vi.fn().mockResolvedValue({ data: "initial" });
    const { result } = renderHook(() => useDataRepo(fetcher));

    expect(fetcher).toHaveBeenCalledTimes(1);
    
    fetcher.mockResolvedValueOnce({ data: "refreshed" });
    act(() => { result.current.refresh(); });

    expect(fetcher).toHaveBeenCalledTimes(2);
  });
});