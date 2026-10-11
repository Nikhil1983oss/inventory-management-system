
function validateProduct(req, res, next) {
  const {
    name,
    sku,
    category,
    price,
    quantity,
    reorderLevel
  } = req.body;

  const errors = [];

  if (typeof name !== "string" || name.trim().length < 2) {
    errors.push("Name must contain at least 2 characters");
  }

  if (typeof sku !== "string" || !sku.trim()) {
    errors.push("SKU is required");
  }

  if (typeof category !== "string" || !category.trim()) {
    errors.push("Category is required");
  }

  if (
    price === undefined ||
    typeof price !== "number" ||
    !Number.isFinite(price) ||
    price < 0
  ) {
    errors.push("Price must be a non-negative number");
  }

  if (
    quantity === undefined ||
    !Number.isInteger(quantity) ||
    quantity < 0
  ) {
    errors.push("Quantity must be a non-negative integer");
  }

  if (
    reorderLevel !== undefined &&
    (!Number.isInteger(reorderLevel) || reorderLevel < 0)
  ) {
    errors.push("Reorder level must be a non-negative integer");
  }

  if (errors.length > 0) {
    return res.status(400).json({
      message: "Validation failed",
      errors
    });
  }

  next();
}

module.exports = validateProduct;
