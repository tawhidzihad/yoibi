# MongoDB Skill

Source of truth: https://www.mongodb.com/docs/

Rules:
- Keep media binaries out of MongoDB; store provider metadata/URLs instead.
- Validate ownership before update/delete operations.
- Index common lookup fields after measuring/query planning.
- Keep destructive user deletion consistent across related collections.
- Use environment-based connection strings.
