// server/validate.js (ESM)
export const validate =
  (schema, where = 'body') =>
  (req, res, next) => {
    const data =
      where === 'query'
        ? req.query
        : where === 'params'
        ? req.params
        : req.body;

    const result = schema.safeParse(data);
    if (!result.success) {
      return res.status(400).json({
        error: 'validation_error',
        details: result.error.flatten(), // { fieldErrors, formErrors }
      });
    }
    // 検証後の正規化済みデータで置き換える
    if (where === 'query') req.query = result.data;
    else if (where === 'params') req.params = result.data;
    else req.body = result.data;

    next();
  };
