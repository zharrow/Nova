import { describe, it, expect, vi } from "vitest";
import { render, act } from "@testing-library/react";
import { useState } from "react";
import type { NovaInstance } from "@nova-ui/core";
import { useNovaEngine } from "../src/hooks/use-nova-engine";

/**
 * Le pont React est la pièce la plus facile à casser : une comparaison
 * d'options trop naïve et le moteur se recrée à chaque rendu (ou pire, boucle).
 * Ces tests verrouillent son contrat.
 */

interface Options {
  value?: number;
  onEvent?: () => void;
}

function makeSpyFactory() {
  const created: Options[] = [];
  const updated: Partial<Options>[] = [];
  const destroyed = { count: 0 };
  let last: NovaInstance<Options> | null = null;

  const factory = (element: HTMLElement, options: Options) => {
    created.push(options);
    last = {
      element,
      update(next) {
        updated.push(next);
      },
      destroy() {
        destroyed.count++;
      },
    };
    return last;
  };

  return { factory, created, updated, destroyed, get last() { return last; } };
}

describe("useNovaEngine", () => {
  it("crée le moteur une seule fois, quels que soient les rendus", () => {
    const local = makeSpyFactory();

    function Component({ value }: { value: number }) {
      const ref = useNovaEngine<HTMLDivElement, Options>(local.factory, { value });
      return <div ref={ref} />;
    }

    const { rerender } = render(<Component value={1} />);
    rerender(<Component value={1} />);
    rerender(<Component value={1} />);

    expect(local.created).toHaveLength(1);
    // Aucune option n'a bougé : aucune mise à jour ne doit être émise.
    expect(local.updated).toHaveLength(0);
  });

  it("appelle update() quand une option change, sans recréer le moteur", () => {
    const local = makeSpyFactory();

    function Component({ value }: { value: number }) {
      const ref = useNovaEngine<HTMLDivElement, Options>(local.factory, { value });
      return <div ref={ref} />;
    }

    const { rerender } = render(<Component value={1} />);
    rerender(<Component value={2} />);

    expect(local.created).toHaveLength(1);
    expect(local.updated).toHaveLength(1);
    expect(local.updated[0]?.value).toBe(2);
  });

  it("ne se met pas à jour parce qu'un callback a changé d'identité", () => {
    const local = makeSpyFactory();

    function Component() {
      const [, force] = useState(0);
      // Callback recréé à chaque rendu — le cas courant en React.
      const ref = useNovaEngine<HTMLDivElement, Options>(local.factory, {
        value: 1,
        onEvent: () => {},
      });
      return <button ref={ref as never} onClick={() => force((n) => n + 1)} />;
    }

    const { container } = render(<Component />);
    act(() => {
      container.querySelector("button")!.click();
    });

    expect(local.updated).toHaveLength(0);
  });

  it("appelle toujours la version la plus récente d'un callback", () => {
    const local = makeSpyFactory();
    const first = vi.fn();
    const second = vi.fn();

    function Component({ handler }: { handler: () => void }) {
      const ref = useNovaEngine<HTMLDivElement, Options>(local.factory, {
        value: 1,
        onEvent: handler,
      });
      return <div ref={ref} />;
    }

    const { rerender } = render(<Component handler={first} />);
    rerender(<Component handler={second} />);

    // Le moteur détient un relais stable, créé au montage : il doit router
    // vers `second`, pas vers `first` figé dans la fermeture d'origine.
    local.created[0]?.onEvent?.();

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });

  it("détruit le moteur au démontage", () => {
    const local = makeSpyFactory();

    function Component() {
      const ref = useNovaEngine<HTMLDivElement, Options>(local.factory, { value: 1 });
      return <div ref={ref} />;
    }

    const { unmount } = render(<Component />);
    unmount();

    expect(local.destroyed.count).toBe(1);
  });
});
