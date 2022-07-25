const User = require('../models/user');


module.exports.renderRegister = (req, res) => {
    res.render('users/register')
}

module.exports.register = async (req, res) => {
    try {
        const {email, username, password} = req.body;
        const user = new User({email, username});
        const registeredUser = await User.register(user, password);
        req.login(registeredUser, err => {
            if (err) return next(err);
            req.flash('success', 'Welcome to Pay It Forward!');
            res.redirect('/');
        })
    }  catch(e) {
        req.flash('error', e.message);
        res.redirect('register');
    }
}

module.exports.renderLogin = (req, res) => {
    res.render('users/login')
}

module.exports.login = async (req, res) => {
    req.flash('success', 'Welcome back!');
    if (req.user.messages.length) {
        let fullMsg = `<h3>Notifications</h3><ul class="my-auto">`;
        for (let msg of req.user.messages) {
              fullMsg += `<li>` + msg + `</li>`;              
        }
        fullMsg += `</ul>`
        req.flash('info', fullMsg);  
    }
    req.user.messages=[];
    await req.user.save();
    const redirectUrl = req.session.returnTo || '/';
    delete req.session.returnTo;
    res.redirect(redirectUrl);
}

module.exports.logout = async (req, res, next) => {
    req.logout((err) => {
        if (err) {
            return next(err);
        }
        req.flash('success', 'Goodbye!');
        res.redirect('/');
    });
}