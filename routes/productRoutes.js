const validateProduct = require("../middleware/validateProduct");
const express = require("express");
const mongoose = require("mongoose");
const Product = require("../models/Product");

const router = express.Router();

// Create a product
router.post("/", validateProduct, async (req, res) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json(product);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get all products with filtering, sorting and pagination
router.get("/", async (req, res) => {
  try {
    const {
      category,
      search,
      minPrice,
      maxPrice,
      sortBy = "createdAt",
      order = "desc",
      page = 1,
      limit = 10
    } = req.query;

    const filter = {};

    if (category) {
      filter.category = {
        $regex: `^${category.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
        $options: "i"
      };
    }

    if (search) {
      filter.name = {
        $regex: search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        $options: "i"
      };
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.price = {};

      if (minPrice !== undefined) {
        filter.price.$gte = Number(minPrice);
      }

      if (maxPrice !== undefined) {
        filter.price.$lte = Number(maxPrice);
      }

      if (
        Object.values(filter.price).some(
          (value) => !Number.isFinite(value)
        ) ||
        (minPrice !== undefined && minPrice.trim() === "") ||
        (maxPrice !== undefined && maxPrice.trim() === "")
      ) {
        return res.status(400).json({
          message: "Invalid price filter"
        });
      }

      if (
        filter.price.$gte !== undefined &&
        filter.price.$lte !== undefined &&
        filter.price.$gte > filter.price.$lte
      ) {
        return res.status(400).json({
          message: "minPrice cannot exceed maxPrice"
        });
      }
    }

    const allowedSortFields = [
      "name",
      "price",
      "quantity",
      "createdAt"
    ];

    if (!allowedSortFields.includes(sortBy)) {
      return res.status(400).json({
        message: "Invalid sort field"
      });
    }

    if (!["asc", "desc"].includes(order)) {
      return res.status(400).json({
        message: "Order must be asc or desc"
      });
    }

    const currentPage = Number(page);
    const pageSize = Number(limit);

    if (
      !Number.isInteger(currentPage) ||
      !Number.isInteger(pageSize) ||
      currentPage < 1 ||
      pageSize < 1 ||
      pageSize > 100
    ) {
      return res.status(400).json({
        message: "Invalid page or limit"
      });
    }

    const total = await Product.countDocuments(filter);

    const products = await Product.find(filter)
      .sort({ [sortBy]: order === "asc" ? 1 : -1 })
      .skip((currentPage - 1) * pageSize)
      .limit(pageSize);

    res.json({
      total,
      page: currentPage,
      totalPages: Math.ceil(total / pageSize),
      count: products.length,
      products
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Low-stock report
router.get("/low-stock", async (req, res) => {
  try {
    const lowStockItems = await Product.find({
      $expr: {
        $lte: ["$quantity", "$reorderLevel"]
      }
    }).sort({ quantity: 1 });

    res.json({
      count: lowStockItems.length,
      lowStockItems
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Category-wise inventory summary using aggregation
router.get("/summary", async (req, res) => {
  try {
    const summary = await Product.aggregate([
      {
        $group: {
          _id: "$category",
          totalItems: { $sum: 1 },
          totalQuantity: { $sum: "$quantity" },
          totalStockValue: {
            $sum: {
              $multiply: ["$price", "$quantity"]
            }
          },
          avgPrice: { $avg: "$price" }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    res.json({
      categories: summary.length,
      summary
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Adjust stock safely
router.patch("/:id/stock", async (req, res) => {
  try {
    const { change } = req.body;

    if (!Number.isInteger(change) || change === 0) {
      return res.status(400).json({
        message: "Change must be a non-zero integer"
      });
    }

    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid product ID"
      });
    }

    const product = await Product.findOneAndUpdate(
      {
        _id: req.params.id,
        quantity: { $gte: Math.max(0, -change) }
      },
      {
        $inc: { quantity: change }
      },
      {
       returnDocument: "after",
       runValidators: true
      }
    );

    if (!product) {
      const existingProduct = await Product.exists({
        _id: req.params.id
      });

      if (!existingProduct) {
        return res.status(404).json({
          message: "Product not found"
        });
      }

      return res.status(400).json({
        message: "Insufficient stock for this adjustment"
      });
    }

    res.json({
      message: "Stock updated successfully",
      product
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get a single product by ID
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        message: "Product not found"
      });
    }

    res.json(product);
  } catch (error) {
    res.status(400).json({
      message: "Invalid product ID"
    });
  }
});

// Update product details
router.put("/:id", async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    if (!product) {
      return res.status(404).json({
        message: "Product not found"
      });
    }

    res.json(product);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete a product
router.delete("/:id", async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({
        message: "Product not found"
      });
    }

    res.json({
      message: "Product deleted",
      id: product._id
    });
  } catch (error) {
    res.status(400).json({
      message: "Invalid product ID"
    });
  }
});

module.exports = router;
