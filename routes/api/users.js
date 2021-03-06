const express =  require('express');
const router = express.Router();
const gravater = require('gravatar');
const bcrypt = require('bcryptjs')
const jwt =     require('jsonwebtoken');
const keys = require('../../config/keys');
const passport = require('passport');

// load input validation 
const validateRegisterInput =  require('../../validation/register');

// load user model
const User = require('../../models/User');
const { route } = require('./profile');


router.get('/test', (req, res) => res.json({msg: "Users Works"}));


// route GET api/users/register
// desc regester users
// access public


router.post('/register', (req, res) => {

    const { errors, isValid } = validateRegisterInput(req.body);

    if(!isValid){
        return res.status(400).json(errors);
    }

    User.findOne({email: req.body.email })
    .then(user => {
        if(user){
            return res.status(400).json({email: "Email Already Exists"});
        }else{
            const avatar = gravater.url(req.body.email, {
                s: '200',
                r: 'pg',
                d: 'mm'
            });

            const newUser = new User({
                name : req.body.name,
                email: req.body.email,
                avatar,
                password: req.body.password
            })

            bcrypt.genSalt(10, (err, salt) => {
                bcrypt.hash(newUser.password, salt, (err, hash) => {
                    if(err) throw err;
                    newUser.password = hash;
                    newUser.save()
                    .then(user => res.json(user))
                    .catch(err = console.log(err));
                });
            });
        }
    });
});



// route GET api/users/login
// desc login user / returning jwt
// access public

router.post('/login', (req, res) => {
    const email = req.body.email;
    const pass = req.body.password;


    // find user by email
    User.findOne({email})
    .then(user => {
       // check for user
       if (!user){
           return res.status(404).json({email: 'user not found'});
       }

        //    check password
        bcrypt.compare(pass, user.password)
        .then(isMatch => {
            if(isMatch){
                // user matched
                const payload = { id: user.id, name: user.name, avatar: user.avatar} //create payload
                //sign token
                jwt.sign(payload, keys.secretOrKey, { expiresIn: 3600}, 
                    (err, token) => {
                        res.json({
                            success: true,
                            token: 'Bearer '+ token
                        })
                });
            }else{
                res.status(400).json({password: 'Password Incorrect'});
            }
        })
    });
});




// @route get api/users/current 
// @desc return current user
// @access private

router.get('/current', passport.authenticate('jwt', { session: false }), (req, res) => {
    res.json(req.user)
})

module.exports = router;