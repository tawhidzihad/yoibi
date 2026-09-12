// src/middleware/validate.js
const { ZodError } = require('zod');

/**
 * Returns Express middleware that validates a specific request property ("body", "params", "query")
 * against the provided Zod schema.
 *
 * The PARSED (transformed + stripped) result is attached to the request as
 * `req.validatedBody` / `req.validatedQuery` / `req.validatedParams` so that
 * server-side normalizations (e.g. handle lowercasing, country uppercasing)
 * take effect and unknown fields stripped by `.strict()` schemas are removed.
 * Controllers read the validated property first and fall back to the raw one.
 */
function validate(schema, property = 'body') {
    return (req, res, next) => {
        try {
            const data = schema.parse(req[property]);
            if (property === 'body') req.validatedBody = data;
            else if (property === 'query') req.validatedQuery = data;
            else if (property === 'params') req.validatedParams = data;
            next();
        } catch (err) {
            if (err instanceof ZodError) {
                return res.status(422).json({
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'Invalid request data',
                        fields: err.format()
                    }
                });
            }
            return next(err);
        }
    };
}

module.exports = { validate };
