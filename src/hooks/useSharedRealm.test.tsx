import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useSharedRealm } from "./useSharedRealm";

describe("useSharedRealm", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.spyOn(window, "dispatchEvent").mockImplementation(() => true);
    vi.spyOn(window, "addEventListener").mockImplementation(() => {});
    vi.spyOn(window, "removeEventListener").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns default realm 0 when no localStorage value", () => {
    const { result } = renderHook(() => useSharedRealm());
    expect(result.current[0]).toBe(0);
  });

  it("returns saved realm from localStorage", () => {
    localStorage.setItem("simco_realm", "3");
    const { result } = renderHook(() => useSharedRealm());
    expect(result.current[0]).toBe(3);
  });

  it("updates localStorage when realm changes", async () => {
    const { result } = renderHook(() => useSharedRealm());
    
    result.current[1](2);
    
    await waitFor(() => expect(localStorage.getItem("simco_realm")).toBe("2"));
    await waitFor(() => expect(result.current[0]).toBe(2));
  });

  it("dispatches realm_change event on change", async () => {
    const { result } = renderHook(() => useSharedRealm());
    
    result.current[1](5);
    
    await waitFor(() => expect(window.dispatchEvent).toHaveBeenCalledTimes(2));
    const calls = vi.mocked(window.dispatchEvent).mock.calls;
    const lastCall = calls[calls.length - 1][0] as CustomEvent;
    expect(lastCall).toBeInstanceOf(CustomEvent);
    expect(lastCall.type).toBe("realm_change");
    expect(lastCall.detail).toBe(5);
  });

  it("listens for realm_change events", () => {
    const addEventListenerSpy = vi.spyOn(window, "addEventListener");
    
    renderHook(() => useSharedRealm());
    
    expect(addEventListenerSpy).toHaveBeenCalledWith(
      "realm_change",
      expect.any(Function)
    );
  });

  it("cleans up event listener on unmount", () => {
    const removeEventListenerSpy = vi.spyOn(window, "removeEventListener");
    const { unmount } = renderHook(() => useSharedRealm());
    
    unmount();
    
    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      "realm_change",
      expect.any(Function)
    );
  });

  it("handles multiple components syncing realm", async () => {
    const { result: result1 } = renderHook(() => useSharedRealm());
    const { result: result2 } = renderHook(() => useSharedRealm());
    
    expect(result1.current[0]).toBe(0);
    expect(result2.current[0]).toBe(0);
    
    result1.current[1](1);
    
    await waitFor(() => {
      const { result: result3 } = renderHook(() => useSharedRealm());
      expect(result3.current[0]).toBe(1);
    });
  });
});