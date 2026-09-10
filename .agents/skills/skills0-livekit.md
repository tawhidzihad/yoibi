# LiveKit Skill

Sources:
- https://docs.livekit.io/reference/client-sdk-js/
- https://docs.livekit.io/reference/server-sdk-js/

Use LiveKit for live streams and meet-up realtime audio/video/screen sharing.

Rules:
- Backend generates access tokens; never expose LiveKit API secrets to the browser.
- Frontend uses the token and LiveKit URL supplied by the backend.
- Keep stream/room ownership and permissions in YOIBI backend logic.
- Document room identity and participant permissions.
- Handle connect/disconnect/error states in the UI.
- For browser features, follow the current JS client SDK documentation.
