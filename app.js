if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
const path = require('path');
const ejsMate = require('ejs-mate');
const mongoose = require('mongoose');
const Product = require('./models/product');
const methodOverride = require('method-override'); 
const dbUrl = process.env.DB_URL || 'mongodb://127.0.0.1:27017/pay-it-forward';
const secret = process.env.MONGO_SECRET;
const catchAsync = require('./utils/catchAsync');
const ExpressError = require('./utils/ExpressError');
const { emitKeypressEvents } = require('readline');
const {productSchema} = require('./schemas.js');
const session = require('express-session')
const productRoutes = require('./routes/products');
const userRoutes = require('./routes/users');
const flash = require('connect-flash');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const User = require('./models/user');
const mongoSanitize = require('express-mongo-sanitize');
const MongoDBStore = require('connect-mongo')(session);

main().catch(err => console.log(err));
async function main() {
    await mongoose.connect(dbUrl);
    console.log('Mongo connection open')
}

app.set('views', path.join(__dirname, 'views'));
app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(mongoSanitize());

const store = new MongoDBStore({
    url: dbUrl,
    secret,
    touchAfter: 24 * 60 * 60
})

store.on("error", function(e) {
    console.log("SESSION STORE ERROR", e)
})

const sessionConfig = {
    store,
    name: 'session',
    secret,
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        // secure: true,
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 60 * 24 * 7,
        httpOnly: true
    }
}
app.use(session(sessionConfig));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    res.locals.info = req.flash('info');
    res.locals.currentUser = req.user;
    next();
})

app.use("/products", productRoutes);
app.use('/', userRoutes);

//homepage
app.get('/', (req, res) => {
    res.render("home")
})

//Error handler
app.all('*', (req, res, next) => {
    next(new ExpressError('Page Not Found', 404))
})

app.use((err, req, res, next) => {
    const {statusCode = 500, message = 'Something went wrong'} = err;
    if (!err.message) {
        err.message = "Oh no, Something went wrong!"
    }
    res.status(statusCode).render('error', {err});
})

app.listen(port, (req, res) => {
    console.log(`Serving on port ${port}`)
})