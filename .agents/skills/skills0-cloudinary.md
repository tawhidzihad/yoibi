# Cloudinary Skill

Source of truth: https://cloudinary.com/documentation/node_image_and_video_upload

Cloudinary is the default YOIBI image/video media provider.

Rules:
- Keep Cloudinary credentials server-side.
- Store asset metadata in MongoDB.
- Validate file type/size before upload.
- Use appropriate resource types for video.
- Prefer secure, signed server-side flows when the use case requires stronger control.
- For large uploads, use streaming/chunked upload strategies instead of loading giant files into memory.
- Use transformations/thumbnails deliberately and document important presets.
