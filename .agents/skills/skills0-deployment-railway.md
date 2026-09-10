# Railway Deployment Skill

Source of truth: https://docs.railway.com/

Rules:
- Backend must start from a conventional npm script such as `npm start`.
- Port comes from `process.env.PORT` with a safe local fallback for development.
- Bind the Express server in a container/platform-friendly way.
- Provide `/health`.
- All secrets/configuration come from Railway environment variables.
- Do not assume local filesystem persistence.
- Verify logs and environment configuration after deployment.
