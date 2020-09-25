const debug = require('debug')('app:goodleStrategy');
const chalk = require('chalk');
const config = require('config');
const passport = require('passport');
const { OAuth2Strategy } = require('passport-google-oauth');

function googleStrategy() {
  const googleAuthInfo = config.get('authInfo.google');
  passport.use(new OAuth2Strategy(googleAuthInfo,
    (req, token, refreshToken, profile, done) => {

      // asynchronous
      process.nextTick(() => {
        // check if the user is already logged in
        if (!req.user) {

          User.findOne({ 'google.id': profile.id }, (err, user) => {
            if (err) {
              return done(err);
            }

            if (user) {
              // if there is a user id already but no token
              // (user was linked at one point and then removed)
              if (!user.google.token) {
                user.google.token = token;
                user.google.name = profile.displayName;
                user.google.email = profile.emails[0].value; // pull the first email

                user.save((err) => {
                  if (err) {
                    throw err;
                  }
                  return done(null, user);
                });
              }

              return done(null, user);
            } else {
                var newUser          = new User();

                newUser.google.id    = profile.id;
                newUser.google.token = token;
                newUser.google.name  = profile.displayName;
                newUser.google.email = profile.emails[0].value; // pull the first email

                newUser.save(function(err) {
                    if (err)
                        throw err;
                    return done(null, newUser);
                });
            }
          });

      } else {
          // user already exists and is logged in, we have to link accounts
          var user               = req.user; // pull the user out of the session

          user.google.id    = profile.id;
          user.google.token = token;
          user.google.name  = profile.displayName;
          user.google.email = profile.emails[0].value; // pull the first email

          user.save(function(err) {
              if (err)
                  throw err;
              return done(null, user);
          });

        }

      });

  }));
}
