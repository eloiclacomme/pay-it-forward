const {productSchema} = require('./schemas.js');
const ExpressError = require('./utils/ExpressError');
const Product = require('./models/product');

module.exports.isLoggedIn = (req, res, next) => {
    if (!req.isAuthenticated()) {
        req.session.returnTo = req.originalUrl;
        req.flash('error', 'You must be signed in first')
        return res.redirect('/login')
    }
    next();
}

module.exports.validateProduct = (req, res, next) => {
    const {error} = productSchema.validate(req.body);
    if (error) {
        const msg = error.details.map(elm => elm.message).join(',')
        throw new ExpressError(msg, 400)
    } else {
        next();
    }
}

module.exports.isOwner = async(req, res, next) => {
    const {id} = req.params;
    const product = await Product.findById(id);
    if (!product.owner.equals(req.user._id)) {
        req.flash('error', 'You do not have permission to do that.');
        return res.redirect(`/products/${id}`)
    }
    next();
}

module.exports.isNotOwner = async(req, res, next) => {
    const {id} = req.params;
    const product = await Product.findById(id);
    if (product.owner.equals(req.user._id)) {
        req.flash('error', 'You cannot claim your own item.');
        return res.redirect(`/products/${id}`)
    }
    next();
}