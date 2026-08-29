require('dotenv').config();

const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const productsRouter = require('./src/routes/products');
const productStatusRouter = require('./src/routes/productStatus');
const adminRouter = require('./src/routes/admin');
const authRouter = require('./src/routes/auth');
const adminCatalogRouter = require('./src/routes/adminCatalog');
const categoriesRouter = require('./src/routes/categories');
const categoryStatusRouter = require('./src/routes/categoryStatus');
const orderStatusFixRouter = require('./src/routes/orderStatusFix');
const ordersRouter = require('./src/routes/orders');
const mediaRouter = require('./src/routes/media');
const errorHandler = require('./src/middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '1mb' }));

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false
});

app.use(limiter);

app.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'herstory.al backend is running'
    });
});

app.use('/api/admin/products', productStatusRouter);
app.use('/api/products', productsRouter);
app.use('/api/auth', authRouter);
app.use('/api/admin', adminRouter);
app.use('/api/admin/catalog', adminCatalogRouter);
app.use('/api/admin/categories', categoryStatusRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/orders', orderStatusFixRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/media', mediaRouter);
app.use(express.static(path.join(__dirname, 'public')));


app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route nuk u gjet'
    });
});

app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});





