const express = require('express');
const Product = require('../models/Product');

const router = express.Router();

// GET /api/products  -> list all products
router.get('/', async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    console.error('Error fetching products:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/products  -> create product
router.post('/', async (req, res) => {
  try {
    const { name, price, stock, category } = req.body;

    if (!name || price == null || stock == null) {
      return res
        .status(400)
        .json({ message: 'Name, price and stock are required' });
    }

    if (price < 0 || stock < 0) {
      return res
        .status(400)
        .json({ message: 'Price and stock must be >= 0' });
    }

    const product = await Product.create({
      name,
      price,
      stock,
      category: category || 'General'
    });

    res.status(201).json(product);
  } catch (err) {
    console.error('Error creating product:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/products/:id  -> delete product
router.delete('/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json({ message: 'Product deleted' });
  } catch (err) {
    console.error('Error deleting product:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
