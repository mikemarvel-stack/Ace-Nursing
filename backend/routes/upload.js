const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protect, restrictTo } = require('../middleware/auth');
const { uploadToS3, deleteFromS3 } = require('../utils/s3');
const Product = require('../models/Product');
const asyncHandler = require('../utils/asyncHandler');
const axios = require('axios');

const SITE_URL = process.env.FRONTEND_URL || 'https://acenursing.com';

// Ping Google to re-crawl a URL after publishing
const pingGoogle = (slug) => {
  const url = `${SITE_URL}/product/${slug}`;
  axios.get(`https://www.google.com/ping?sitemap=${encodeURIComponent(`${process.env.BACKEND_URL || 'https://ace-nursing.onrender.com'}/sitemap.xml`)}`, { timeout: 5000 })
    .catch(() => {});
};

// Auto-generate SEO fields if not provided
const buildSeo = ({ title, description, category, seoTitle, seoDescription, seoKeywords }) => ({
  metaTitle: seoTitle || `${title} – ${category} | AceNursing`,
  metaDescription: seoDescription || (description ? description.slice(0, 155) : `Download ${title} — premium nursing study material from AceNursing. Instant PDF access.`),
  keywords: seoKeywords
    ? seoKeywords.split(',').map(k => k.trim()).filter(Boolean)
    : [title, category, 'nursing study material', 'NCLEX prep', 'AceNursing'].filter(Boolean),
});

const storage = multer.memoryStorage();

const fileFilter = (allowedMimes) => (req, file, cb) => {
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Allowed: ${allowedMimes.join(', ')}`), false);
  }
};

const uploadPdf = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: fileFilter([
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'application/rtf',
    'application/epub+zip',
  ]),
});

const uploadImage = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: fileFilter(['image/jpeg', 'image/png', 'image/webp']),
});

// ─── POST /api/upload/pdf ─────────────────────────────────────────────────────
router.post('/pdf', protect, restrictTo('admin'), uploadPdf.single('file'),
  asyncHandler(async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No PDF file provided.' });

    const result = await uploadToS3({
      buffer: req.file.buffer,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      folder: 'pdfs',
    });

    if (req.body.productId) {
      const product = await Product.findById(req.body.productId);
      if (product) {
        if (product.fileUrl?.key) await deleteFromS3(product.fileUrl.key).catch(() => {});
        product.fileUrl = { key: result.key, originalName: result.originalName, size: result.size };
        await product.save();
      }
    }

    res.json({
      message: 'PDF uploaded successfully.',
      file: { key: result.key, size: result.size, originalName: result.originalName },
    });
  })
);

// ─── POST /api/upload/image ───────────────────────────────────────────────────
router.post('/image', protect, restrictTo('admin'), uploadImage.single('image'),
  asyncHandler(async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No image provided.' });

    const result = await uploadToS3({
      buffer: req.file.buffer,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      folder: 'covers',
    });

    if (req.body.productId) {
      const product = await Product.findById(req.body.productId);
      if (product) {
        if (product.coverImage?.key) await deleteFromS3(product.coverImage.key).catch(() => {});
        product.coverImage = { key: result.key, url: result.url };
        await product.save();
      }
    }

    res.json({ message: 'Image uploaded successfully.', image: { key: result.key, url: result.url } });
  })
);

// ─── POST /api/upload/product-full ───────────────────────────────────────────
router.post('/product-full', protect, restrictTo('admin'),
  multer({ storage, limits: { fileSize: 100 * 1024 * 1024 } }).fields([
    { name: 'pdf', maxCount: 1 },
    { name: 'cover', maxCount: 1 },
  ]),
  asyncHandler(async (req, res) => {
    const { title, category, price, originalPrice, pages, description, badge, emoji, seoTitle, seoDescription, seoKeywords } = req.body;
    if (!title || !price) return res.status(400).json({ error: 'Title and price are required.' });

    const productData = {
      title, category,
      price: parseFloat(price),
      originalPrice: parseFloat(originalPrice) || parseFloat(price) * 1.5,
      pages: parseInt(pages) || 0,
      description,
      badge: badge || null,
      emoji: emoji || '📘',
      uploadedBy: req.user._id,
      seo: buildSeo({ title, description, category, seoTitle, seoDescription, seoKeywords }),
    };

    if (req.files?.pdf?.[0]) {
      const pdfFile = req.files.pdf[0];
      const pdfResult = await uploadToS3({
        buffer: pdfFile.buffer,
        originalName: pdfFile.originalname,
        mimeType: pdfFile.mimetype,
        folder: 'pdfs',
      });
      productData.fileUrl = { key: pdfResult.key, originalName: pdfResult.originalName, size: pdfResult.size };
    }

    if (req.files?.cover?.[0]) {
      const imgFile = req.files.cover[0];
      const imgResult = await uploadToS3({
        buffer: imgFile.buffer,
        originalName: imgFile.originalname,
        mimeType: imgFile.mimetype,
        folder: 'covers',
      });
      productData.coverImage = { key: imgResult.key, url: imgResult.url };
    }

    const product = await Product.create(productData);
    pingGoogle(product.slug);
    res.status(201).json({ message: 'Product created successfully.', product });
  })
);

// ─── POST /api/upload/custom-order-file ─────────────────────────────────────
const uploadAny = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 },
});

router.post('/custom-order-file', protect, restrictTo('admin'), uploadAny.single('file'),
  asyncHandler(async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file provided.' });
    const { customOrderId } = req.body;

    const result = await uploadToS3({
      buffer: req.file.buffer,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      folder: 'custom-orders',
    });

    // Optionally attach the key to the custom order
    if (customOrderId) {
      const CustomOrder = require('../models/CustomOrder');
      await CustomOrder.findByIdAndUpdate(customOrderId, {
        $set: {
          'delivery.fileKey': result.key,
          'delivery.originalName': result.originalName,
        },
      });
    }

    // Return a 7-day signed URL for immediate use
    const { getSignedDownloadUrl } = require('../utils/s3');
    const signedUrl = await getSignedDownloadUrl(result.key, 7 * 24 * 60 * 60);

    res.json({
      key: result.key,
      originalName: result.originalName,
      size: result.size,
      signedUrl,
    });
  })
);

// ─── DELETE /api/upload/file ──────────────────────────────────────────────────
router.delete('/file', protect, restrictTo('admin'), asyncHandler(async (req, res) => {
  const { key } = req.body;
  if (!key) return res.status(400).json({ error: 'File key is required.' });
  await deleteFromS3(key);
  res.json({ message: 'File deleted successfully.' });
}));

module.exports = router;
