// src/middleware/validate.js
const { ZodError } = require('zod');

/**
 * Returns Express middleware that validates a specific request property ("body", "params", "query")
 * against the provided Zod schema.
 */
function validate(schema, property = 'body') {
    return (req, res, next) => {
        try {
            const data = req[property];
            schema.parse(data);
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
