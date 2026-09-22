import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

const posthogMock = vi.hoisted(() => ({ init: vi.fn() }));

vi.mock("posthog-js", () => ({ default: posthogMock }));
vi.mock("posthog-js/react", () => ({
  PostHogProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

async function renderProvider() {
  const { PostHogProvider } = await import("@/lib/posthog/client");
  return render(
    <PostHogProvider>
      <div>child</div>
    </PostHogProvider>,
  );
}

describe("PostHogProvider", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    window.localStorage.clear();
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "phc_test");
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("renders children without initializing when no key is set", async () => {
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "");
    await renderProvider();
    expect(screen.getByText("child")).toBeInTheDocument();
    expect(posthogMock.init).not.toHaveBeenCalled();
  });

  it("initializes opted out with memory persistence when consent is absent", async () => {
    await renderProvider();
    expect(posthogMock.init).toHaveBeenCalledWith(
      "phc_test",
      expect.objectContaining({
        capture_pageview: "history_change",
        capture_pageleave: true,
        persistence: "memory",
        opt_out_capturing_by_default: true,
      }),
    );
  });

  it("initializes opted in with persistent storage when consent was granted", async () => {
    window.localStorage.setItem("ds_analytics_consent", "granted");
    await renderProvider();
    expect(posthogMock.init).toHaveBeenCalledWith(
      "phc_test",
      expect.objectContaining({
        persistence: "localStorage+cookie",
        opt_out_capturing_by_default: false,
      }),
    );
  });

  it("uses a custom host when one is configured", async () => {
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_HOST", "https://custom.example.com");
    await renderProvider();
    expect(posthogMock.init).toHaveBeenCalledWith(
      "phc_test",
      expect.objectContaining({ api_host: "https://custom.example.com" }),
    );
  });

  it("warns in development when the key is not a project key", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "phx_personal");
    await renderProvider();
    expect(warn).toHaveBeenCalledOnce();
  });

  it("does not warn for a project key", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    await renderProvider();
    expect(warn).not.toHaveBeenCalled();
  });
});
