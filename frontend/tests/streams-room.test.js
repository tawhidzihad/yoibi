import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

/**
 * Streams live-room regression tests (static contract checks).
 *
 * Root cause fixed in this suite: HostControls and ViewerControls use LiveKit
 * room-context hooks (useConnectionState, TrackToggle). Before the fix they
 * were rendered OUTSIDE the <StreamRoom> provider in StreamDetailView, so
 * opening the studio/viewer page threw
 *   "No room provided, make sure you are inside a Room context or pass the
 *    room explicitly"
 * which crashed the whole app into the "Something went wrong" error page.
 *
 * These tests guard the required architecture:
 *   1. Controls live INSIDE the StreamRoom provider (RoomContext present).
 *   2. StreamRoom always renders the real LiveKitRoom (never an empty shell).
 *   3. No parameterized async function is wrapped in useCallback in
 *      StreamDetailView (Next 16 React Compiler cannot memoize it and emits a
 *      spurious "Unexpected token" parse error — which breaks lint/build).
 *   4. StreamRoom only captures audio for hosts (viewers get subscribe-only).
 *   5. The Streams page uses the shared container rhythm (px-4 sm:px-6).
 */

const ROOT = path.resolve(import.meta.dirname, "..");

function readSrc(relativePath) {
    return readFileSync(path.join(ROOT, "src", relativePath), "utf8");
}

function innerBetween(source, openTag, closeTag) {
    const start = source.indexOf(openTag);
    if (start < 0) return "";
    const end = source.indexOf(closeTag, start);
    if (end < 0) return "";
    return source.slice(start, end + closeTag.length);
}

describe("streams live room: controls inside the LiveKit provider", () => {
    const detailSource = readSrc("features/streams/ui/StreamDetailView.js");

    it("renders HostControls inside the StreamRoom provider (RoomContext available)", () => {
        const roomBlock = innerBetween(detailSource, "<StreamRoom", "</StreamRoom>");
        expect(roomBlock.length).toBeGreaterThan(0);
        expect(roomBlock).toContain("<HostControls");
    });

    it("renders ViewerControls inside the StreamRoom provider (RoomContext available)", () => {
        const roomBlock = innerBetween(detailSource, "<StreamRoom", "</StreamRoom>");
        expect(roomBlock).toContain("<ViewerControls");
    });

    it("no longer renders HostControls/ViewerControls as siblings after the player area", () => {
        // Before the fix, the controls were placed after the closing player div.
        const afterPlayer = detailSource.slice(
            detailSource.indexOf("</StreamRoom>") + "</StreamRoom>".length
        );
        expect(afterPlayer).not.toContain("<HostControls");
        expect(afterPlayer).not.toContain("<ViewerControls");
    });

    it("keeps a friendly 'Unable to connect to this stream.' fallback (no raw LiveKit errors)", () => {
        expect(detailSource).toContain("Unable to connect to this stream.");
        expect(detailSource).toContain("Try again");
    });

    it("guards viewers from joining a 'ready' stream (contract: STREAM_NOT_LIVE)", () => {
        expect(detailSource).toMatch(/target\.status === "ready"/);
        expect(detailSource).toContain('STREAM_NOT_LIVE');
    });

    it("does not wrap a parameterized async function in useCallback (React Compiler guard)", () => {
        // The previous iteration used `useCallback(async (targetStream, ...) => {`
        // which Next 16's React Compiler cannot memoize — it crashed eslint and
        // the production build with a spurious "Unexpected token" parse error.
        expect(detailSource).not.toMatch(/useCallback\(\s*async\s*\(\s*[^)\s]/);
        expect(detailSource).toContain("connectToRoomRef.current = connectToRoom");
    });
});

describe("streams live room: StreamRoom provider", () => {
    const roomSource = readSrc("features/streams/ui/StreamRoom.js");

    it("mounts the real LiveKitRoom when a token is present", () => {
        expect(roomSource).toContain("<LiveKitRoom");
    });

    it("only captures audio for hosts (viewers subscribe without publishing mic)", () => {
        // Viewers must not auto-publish microphone tracks (subscribe-only grants).
        expect(roomSource).toContain("audio={isHost}");
    });

    it("does not suppress real errors or wrap children in a fake provider", () => {
        expect(roomSource).toContain("onError={handleError}");
        expect(roomSource).not.toContain("RoomContext.Provider");
    });
});

describe("streams page container rhythm", () => {
    const viewSource = readSrc("features/streams/ui/StreamsView.js");
    const detailSource = readSrc("features/streams/ui/StreamDetailView.js");

    it("uses the shared max-w-7xl container with px-4 sm:px-6 horizontal rhythm on StreamsView", () => {
        expect(viewSource).toContain("mx-auto w-full max-w-7xl px-4");
        expect(viewSource).toContain("sm:px-6");
    });

    it("uses the shared max-w-7xl container with px-4 sm:px-6 horizontal rhythm on StreamDetailView", () => {
        expect(detailSource).toContain("mx-auto w-full max-w-7xl px-4 py-4 sm:px-6 sm:py-6");
    });

    it("renders HostControls for stream owners in ready state (not restricted to isLive)", () => {
        // Must allow host controls during preparation (ready state) so host can toggle mic/cam/screen and click Go Live
        expect(detailSource).toContain("{isOwner ? (");
        expect(detailSource).not.toContain("{isLive && isOwner ? (");
    });
});

describe("streams room regression file sanity", () => {
    it("ensures the test reads real source files", () => {
        expect(existsSync(path.join(ROOT, "src/features/streams/ui/StreamDetailView.js"))).toBe(true);
        expect(existsSync(path.join(ROOT, "src/features/streams/ui/StreamRoom.js"))).toBe(true);
    });
});