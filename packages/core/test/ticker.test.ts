import { describe, it, expect } from "vitest";
import { subscribe, tickerSize } from "../src/internal/ticker";

describe("ticker partagé", () => {
  it("compte ses abonnés et se vide au désabonnement", () => {
    expect(tickerSize()).toBe(0);
    const stopA = subscribe(() => {});
    const stopB = subscribe(() => {});
    expect(tickerSize()).toBe(2);
    stopA();
    stopB();
    expect(tickerSize()).toBe(0);
  });

  it("appelle les abonnés avec un delta", async () => {
    let calls = 0;
    let sawDelta = false;
    const stop = subscribe((_now, delta) => {
      calls++;
      if (delta > 0) sawDelta = true;
    });
    await new Promise((resolve) => setTimeout(resolve, 80));
    stop();
    expect(calls).toBeGreaterThan(1);
    expect(sawDelta).toBe(true);
  });

  it("supporte qu'un abonné se retire pendant sa propre frame", async () => {
    let stop = () => {};
    let errored = false;
    stop = subscribe(() => {
      try {
        stop();
      } catch {
        errored = true;
      }
    });
    await new Promise((resolve) => setTimeout(resolve, 60));
    expect(errored).toBe(false);
    expect(tickerSize()).toBe(0);
  });
});
