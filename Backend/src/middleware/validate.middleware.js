const { validationResult } = require('express-validator');
const { errorResponse } = require('../utils/response');

/**
 * Runs after express-validator chains. Returns 422 with all field errors if any.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((e) => ({
      field: e.path || e.param,
      message: e.msg,
    }));
    return res.status(422).json({
      success: false,
      message: 'Validation failed',
      data: null,
      errors: formattedErrors,
    });
  }
  next();
};

module.exports = validate;
