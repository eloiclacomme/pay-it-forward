const express = require('express');
const router = express.Router();
const catchAsync = require('../utils/catchAsync');
const Product = require('../models/product');
const {isLoggedIn, isOwner, isNotOwner, validateProduct} = require('../middleware');
const products = require('../controllers/products');
const multer = require('multer');
const { resolveInclude } = require('ejs');
const {storage} = require('../cloudinary');
const upload = multer({storage});

router.route('/')
    .get(catchAsync(products.index))
    .post(isLoggedIn, upload.array('image'), validateProduct, catchAsync(products.createProduct));

router.get('/new', isLoggedIn, products.renderNewForm)

router.route('/:id')
    .get(catchAsync(products.showProduct))
    .put(isLoggedIn, isOwner, upload.array('image'), validateProduct, catchAsync(products.updateProduct))
    .patch(isLoggedIn, isNotOwner, catchAsync(products.claimProduct))
    .delete(isLoggedIn, isOwner, catchAsync(products.deleteProduct))
    

router.get('/:id/edit', isLoggedIn, isOwner, catchAsync(products.renderEditForm))

module.exports = router;