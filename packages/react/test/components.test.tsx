import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Reveal, ScrambleText, Counter, TextEffect, Marquee, Cursor } from "../src/index";
import { MockIntersectionObserver } from "./setup";

describe("composants React", () => {
  it("Reveal rend ses enfants et respecte la balise demandée", () => {
    const { container } = render(
      <Reveal as="section" className="bloc" variant="mask">
        contenu
      </Reveal>,
    );
    const element = container.querySelector("section")!;
    expect(element.className).toBe("bloc");
    expect(element.textContent).toBe("contenu");
    expect(element.dataset.novaRevealVariant).toBe("mask");
  });

  it("ScrambleText rend son texte dès le premier rendu", () => {
    // C'est ce qui garantit la lisibilité sans JavaScript et une hydratation
    // sans clignotement.
    const { container } = render(<ScrambleText text="NOVA" />);
    expect(container.textContent).toBe("NOVA");
    expect(container.querySelector("span")?.getAttribute("aria-label")).toBe("NOVA");
  });

  it("Counter affiche la valeur finale au montage puis compte à l'entrée en vue", async () => {
    const { container } = render(<Counter to={42} duration={20} />);
    const element = container.querySelector("span")!;
    expect(element.textContent).toBe("42");

    MockIntersectionObserver.fire(element);
    await new Promise((resolve) => setTimeout(resolve, 120));
    expect(element.textContent).toBe("42");
  });

  it("TextEffect découpe un titre en gardant sa sémantique", () => {
    const { container } = render(<TextEffect as="h1" text="Nova en mouvement" />);
    const heading = container.querySelector("h1")!;
    expect(heading.querySelectorAll(".nova-word")).toHaveLength(3);
    // Le titre reste annoncé d'une seule traite.
    expect(heading.querySelector(".nova-sr")?.textContent).toBe("Nova en mouvement");
  });

  it("TextEffect change de grain quand l'effet l'exige", () => {
    const { container, rerender } = render(<TextEffect text="Nova" effect="line" />);
    expect(container.querySelectorAll(".nova-letter")).toHaveLength(0);
    rerender(<TextEffect text="Nova" effect="wave" />);
    expect(container.querySelectorAll(".nova-letter")).toHaveLength(4);
  });

  it("Marquee duplique son contenu", () => {
    const { container } = render(
      <Marquee speed={80}>
        <span>NOVA</span>
      </Marquee>,
    );
    const track = container.querySelector(".nova-marquee__track");
    expect(track).not.toBeNull();
    expect(container.textContent).toContain("NOVA");
  });

  // Une option du moteur oubliée dans la déstructuration de l'adaptateur part
  // deux fois en silence : elle n'atteint jamais le moteur, et React la pose
  // sur le nœud — d'où l'avertissement « React does not recognize the prop ».
  // C'est arrivé à `replayOnHover`, `variant` et `pauseOffscreen`.
  it("ne laisse fuir aucune option de moteur dans le DOM", () => {
    const scramble = render(
      <ScrambleText text="NOVA" interval={5000} replayOnHover trigger="view" />,
    ).container.querySelector("span")!;
    expect(scramble.getAttribute("interval")).toBeNull();
    expect(scramble.getAttribute("replayonhover")).toBeNull();

    const marquee = render(
      <Marquee speed={80} pauseOffscreen={false}>
        <span>NOVA</span>
      </Marquee>,
    ).container.firstElementChild!;
    expect(marquee.getAttribute("pauseoffscreen")).toBeNull();

    const curseur = render(<Cursor variant="dot-ring" />).container
      .firstElementChild as HTMLElement;
    expect(curseur.getAttribute("variant")).toBeNull();
    // Et l'option est bien arrivée jusqu'au moteur.
    expect(curseur.dataset.novaCursorVariant).toBe("dot-ring");
  });

  it("nettoie tout au démontage", () => {
    const { container, unmount } = render(<ScrambleText text="NOVA" />);
    unmount();
    expect(container.querySelector("[data-nova-scramble]")).toBeNull();
  });
});
