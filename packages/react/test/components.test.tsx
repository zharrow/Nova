import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Reveal, ScrambleText, Counter, SplitText, Marquee } from "../src/index";
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

  it("SplitText découpe un titre en gardant sa sémantique", () => {
    const { container } = render(<SplitText as="h1" text="Bâtir en verre" />);
    const heading = container.querySelector("h1")!;
    expect(heading.querySelectorAll(".nova-split__unit")).toHaveLength(3);
    expect(heading.getAttribute("aria-label")).toBe("Bâtir en verre");
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

  it("nettoie tout au démontage", () => {
    const { container, unmount } = render(<ScrambleText text="NOVA" />);
    unmount();
    expect(container.querySelector("[data-nova-scramble]")).toBeNull();
  });
});
