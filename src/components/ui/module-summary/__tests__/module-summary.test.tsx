import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ModuleSummary } from "../module-summary";
import { StoreProvider } from "@/lib/store";

function renderWithStore(ui: React.ReactElement) {
  return render(<StoreProvider>{ui}</StoreProvider>);
}

describe("ModuleSummary", () => {
  it("seçili entry için header başlığını render eder", () => {
    renderWithStore(
      <ModuleSummary
        entryId="listings"
        onCardClick={() => {}}
        onPrimary={() => {}}
        onClose={() => {}}
      />,
    );
    expect(screen.getByText(/Arsa/)).toBeInTheDocument();
    expect(screen.getByText(/portföyü/)).toBeInTheDocument();
  });

  it("4 kart render eder (her slot için 1)", () => {
    renderWithStore(
      <ModuleSummary
        entryId="listings"
        onCardClick={() => {}}
        onPrimary={() => {}}
        onClose={() => {}}
      />,
    );
    const cards = screen.getAllByRole("button", { name: /kartı/ });
    expect(cards).toHaveLength(4);
  });

  it("kart tıklamasında onCardClick çağrılır ve deepLink iletilir", () => {
    const onCardClick = vi.fn();
    renderWithStore(
      <ModuleSummary
        entryId="listings"
        onCardClick={onCardClick}
        onPrimary={() => {}}
        onClose={() => {}}
      />,
    );
    const cards = screen.getAllByRole("button", { name: /kartı/ });
    cards[1].click(); // kpi-tall: { filter: "Aktif" }
    expect(onCardClick).toHaveBeenCalledWith({ filter: "Aktif" });
  });

  it("ESC tuşuyla onClose tetiklenir", () => {
    const onClose = vi.fn();
    renderWithStore(
      <ModuleSummary
        entryId="customers"
        onCardClick={() => {}}
        onPrimary={() => {}}
        onClose={onClose}
      />,
    );
    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).toHaveBeenCalled();
  });

  it("Sayfaya git butonu onPrimary çağırır", () => {
    const onPrimary = vi.fn();
    renderWithStore(
      <ModuleSummary
        entryId="finance"
        onCardClick={() => {}}
        onPrimary={onPrimary}
        onClose={() => {}}
      />,
    );
    screen.getByRole("button", { name: /finance sayfasına git/ }).click();
    expect(onPrimary).toHaveBeenCalled();
  });
});
