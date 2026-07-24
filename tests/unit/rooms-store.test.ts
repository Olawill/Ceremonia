import { useRoomsStore } from "@/components/rooms-r3f/store";
import { beforeEach, describe, expect, it } from "vitest";

// Zustand stores persist across tests in the same module instance, so reset
// to the initial shape before every test.
beforeEach(() => {
  useRoomsStore.getState().reset();
});

describe("useRoomsStore — navigate/arrive", () => {
  it("starts at room 0, not moving", () => {
    const s = useRoomsStore.getState();
    expect(s.activeRoom).toBe(0);
    expect(s.targetRoom).toBe(0);
    expect(s.isMoving).toBe(false);
  });

  it("navigate sets targetRoom and isMoving, but not activeRoom yet", () => {
    useRoomsStore.getState().navigate(3);
    const s = useRoomsStore.getState();
    expect(s.targetRoom).toBe(3);
    expect(s.isMoving).toBe(true);
    expect(s.activeRoom).toBe(0); // camera hasn't arrived
  });

  it("setArrived moves activeRoom to targetRoom and clears isMoving", () => {
    useRoomsStore.getState().navigate(3);
    useRoomsStore.getState().setArrived();
    const s = useRoomsStore.getState();
    expect(s.activeRoom).toBe(3);
    expect(s.isMoving).toBe(false);
  });

  it("setArrived is a no-op on activeRoom if navigate was never called", () => {
    useRoomsStore.getState().setArrived();
    expect(useRoomsStore.getState().activeRoom).toBe(0);
  });
});

describe("useRoomsStore — modal state", () => {
  it("setOpenPanelKey opens and closes the generic panel overlay", () => {
    useRoomsStore.getState().setOpenPanelKey("rsvp");
    expect(useRoomsStore.getState().openPanelKey).toBe("rsvp");

    useRoomsStore.getState().setOpenPanelKey(null);
    expect(useRoomsStore.getState().openPanelKey).toBeNull();
  });

  it("only one modal key is tracked at a time (switching replaces it)", () => {
    useRoomsStore.getState().setOpenPanelKey("rsvp");
    useRoomsStore.getState().setOpenPanelKey("guestbook");
    expect(useRoomsStore.getState().openPanelKey).toBe("guestbook");
  });

  it("setOpenFaqIndex / setOpenHotelIndex / setOpenPartyMember track independently", () => {
    const store = useRoomsStore.getState();
    store.setOpenFaqIndex(2);
    store.setOpenHotelIndex(1);
    store.setOpenPartyMember({
      name: "Jane",
      role: "bridesmaid",
      side: "bride",
    } as never);

    const s = useRoomsStore.getState();
    expect(s.openFaqIndex).toBe(2);
    expect(s.openHotelIndex).toBe(1);
    expect(s.openPartyMember?.name).toBe("Jane");
  });
});

describe("useRoomsStore — reset", () => {
  it("clears all navigation and modal state back to initial values", () => {
    const store = useRoomsStore.getState();
    store.navigate(5);
    store.setArrived();
    store.setOpenPanelKey("registry");
    store.setOpenFaqIndex(1);
    store.setPeek(2.5);
    store.setZoomOffset(1);

    store.reset();

    const s = useRoomsStore.getState();
    expect(s.activeRoom).toBe(0);
    expect(s.targetRoom).toBe(0);
    expect(s.isMoving).toBe(false);
    expect(s.openPanelKey).toBeNull();
    expect(s.openFaqIndex).toBeNull();
    expect(s.peekX).toBe(0);
    expect(s.peekTarget).toBe(0);
    expect(s.zoomOffset).toBe(0);
  });
});

describe("useRoomsStore — peek/zoom", () => {
  it("setPeek and setZoomOffset update independently of navigation", () => {
    useRoomsStore.getState().setPeek(1.2);
    useRoomsStore.getState().setZoomOffset(0.5);
    const s = useRoomsStore.getState();
    expect(s.peekTarget).toBe(1.2);
    expect(s.zoomOffset).toBe(0.5);
  });
});
