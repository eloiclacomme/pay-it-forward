const Product = require('../models/product');
const { cloudinary } = require("../cloudinary");

module.exports.index = async (req, res) => {
    const products = await Product.find({});
    res.render("products", {products});
}

module.exports.renderNewForm = (req, res) => {
    res.render("products/new")
}

module.exports.createProduct = async (req, res) => {
    const product = new Product(req.body.product);
    product.images = req.files.map(f => ({url: f.path, filename: f.filename}));
    product.owner = req.user._id;
    await product.save();
    req.flash('success', 'Succesfully added product')
    res.redirect(`/products/${product._id}`)
}

module.exports.showProduct = async (req, res) => {
    const product = await Product.findById(req.params.id).populate('owner');
    if (!product) {
        req.flash('error', 'Product not found.');
        return res.redirect('/products');
    }
    res.render("products/show", {product});
}

module.exports.renderEditForm = async (req, res) => {
    const product = await Product.findById(req.params.id);
    if (!product) {
        req.flash('error', 'Product not found.');
        return res.redirect('/products');
    }
    res.render('products/edit', {product});
}

module.exports.updateProduct = async (req, res) => {
    const {id} = req.params;
    const product = await Product.findByIdAndUpdate(id, { ...req.body.product });
    const imgs = req.files.map(f => ({url: f.path, filename: f.filename}))
    product.images.push(...imgs);
    await product.save();
    if (req.body.deleteImages) {
        for (let filename of req.body.deleteImages) {
            await cloudinary.uploader.destroy(filename);
        }
        await product.updateOne({ $pull: { images: { filename: { $in: req.body.deleteImages } } } });
    }
    req.flash('success', 'Succesfully updated product');
    res.redirect(`/products/${product._id}`)
}

module.exports.deleteProduct = async (req, res) => {
    const {id} = req.params;
    await Product.findByIdAndDelete(id);
    req.flash('success', 'Succesfully deleted product');
    res.redirect('/products');
}

module.exports.claimProduct = async (req, res) => {
    const {id} = req.params;
    const product = await Product.findById(id).populate('owner');
    const {owner} = product;
    await Product.deleteOne(product);
    const userMsg = `You have succesfully claimed: <b>${product.name}</b>. The owner's name is <b>${owner.username}</b> and their email is <b>${owner.email}</b>.
        Please contact the owner to set up how to exchange the item.`;
    const ownerMsg = `<b>${req.user.username}</b> claimed <b>${product.name}</b>. Their email is: <b>${req.user.email}</b>`;
    owner.messages.push(ownerMsg);
    await owner.save();
    console.log(owner.messages)
    req.flash('success', userMsg);
    res.redirect('/products');
}