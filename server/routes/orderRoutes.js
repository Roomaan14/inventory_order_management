// @ts-nocheck
const express = require('express');
const Order = require('../models/Order');
const Product = require('../models/Product');

const router = express.Router();

// GET /api/orders  -> list orders
router.get('/', async (req, res) => {
  try {
    const orders = await Order.find()
      .sort({ createdAt: -1 })
      .populate('items.productId', 'name price');
    res.json(orders);
  } catch (err) {
    console.error('Error fetching orders:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/orders/:id  -> single order
router.get('/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate(
      'items.productId',
      'name price'
    );
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (err) {
    console.error('Error fetching order:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/orders  -> create order + reduce stock
router.post('/', async (req, res) => {
  try {
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Order items are required' });
    }

    // validate each item
    for (const item of items) {
      if (!item.productId || !item.qty || item.qty <= 0) {
        return res.status(400).json({
          message: 'Each item must have productId and qty > 0'
        });
      }
    }

    const productIds = items.map((i) => i.productId);
    const products = await Product.find({ _id: { $in: productIds } });

    if (products.length !== productIds.length) {
      return res
        .status(400)
        .json({ message: 'One or more products not found' });
    }

    // create map for quick lookup
    const productMap = new Map();
    products.forEach((p) => productMap.set(p._id.toString(), p));

    // check stock + calculate total
    let totalAmount = 0;

    for (const item of items) {
      const product = productMap.get(item.productId);
      if (!product) {
        return res
          .status(400)
          .json({ message: `Product not found: ${item.productId}` });
      }

      if (product.stock < item.qty) {
        return res.status(400).json({
          message: `Insufficient stock for ${product.name}. Available: ${product.stock}`
        });
      }

      totalAmount += product.price * item.qty;
    }

    // reduce stock in MongoDB
    const bulkOps = items.map((item) => ({
      updateOne: {
        filter: { _id: item.productId },
        update: { $inc: { stock: -item.qty } }
      }
    }));

    await Product.bulkWrite(bulkOps);

    // create order document
    const order = await Order.create({
      items,
      totalAmount,
      status: 'CONFIRMED'
    });

    const populatedOrder = await Order.findById(order._id).populate(
      'items.productId',
      'name price'
    );

    res.status(201).json(populatedOrder);
  } catch (err) {
    console.error('Error creating order:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
