const debug = require('debug')('app:authRouter');
const chalk = require('chalk');
const express = require('express');
const passport = require('passport');
const controller = require('../controllers/authController');


const authRouter = express.Router();

function router() {
  authRouter.route('/')
    .all((req, res, next) => {
      if (req.user) {
        res.redirect('/dashboard');
      } else {
        next();
      }
    })
    .get((req, res) => {
      /*
        If user is authenticated then pull user view
        Else redirect user to login screen
      */
      res.redirect('/auth/login');
    })
    .post((req, res) => {
      (async function process() {
        try {
          const results = await controller.signupOrLoginCheck(req.body);
          res.redirect(results.route);
        } catch (err) {
          debug(err);
        }
      }());
    });

  authRouter.route('/login')
    .all((req, res, next) => {
      if (req.user) {
        res.redirect('/dashboard');
      } else {
        next();
      }
    })
    .get((req, res) => {
      const renderInfo = {
        view: 'login',
        email: false,
        message: false,
        status: false
      };
      renderInfo.view = 'login';
      if (req.query.message) {
        renderInfo.message = req.query.message;
      }
      if (req.query.email) {
        renderInfo.email = req.query.email;
      }
      if (req.query.status) {
        renderInfo.status = req.query.status;
      }
      res.render('auth', renderInfo);
    })
    .post((req, res) => {
      (async function process() { // eslint-disable-line
        try {
          const results = await controller.validateLogin(req.body);
          if (results.route) {
            return res.redirect(results.route);
          }
          passport.authenticate('local', {
            successRedirect: '/dashboard',
            failureRedirect: `/auth/login?email=${req.body.email}&message=Invalid Credentials`
          })(req, res);
        } catch (err) {
          debug(`
            Status: ${chalk.red('Error')}
            Endpoint: ${chalk.red('/login')}
            Method: ${chalk.red('POST')}
            Error: ${chalk.red(err)}
          `);
          return res.redirect(`/auth/login?email=${req.body.email}&message=An Unexpected Error Occured`);
        }
      }());
    });

  authRouter.route('/signup')
    .all((req, res, next) => {
      if (req.user) {
        res.redirect('/dashboard');
      } else {
        next();
      }
    })
    .get((req, res) => {
      const renderInfo = {
        view: 'signup',
        email: false,
        message: false,
        firstName: false,
        lastName: false
      };
      if (req.query.email) {
        renderInfo.email = req.query.email;
      }
      if (req.query.message) {
        renderInfo.message = req.query.message;
      }
      if (req.query.firstName) {
        renderInfo.firstName = req.query.firstName;
      }
      if (req.query.lastName) {
        renderInfo.lastName = req.query.lastName;
      }
      res.render('auth', renderInfo);
    })
    .post((req, res) => {
      (async function process() {
        try {
          const signupVerification = await controller.signupVerification(req.body);
          res.redirect(signupVerification.route);
        } catch (err) {
          debug(`
            Status: ${chalk.red('Error')}
            Route: ${chalk.red('/signup')}
            Method: ${chalk.red('POST')}
            Error: ${chalk.red(err)}
          `);
          res.redirect('/auth/signup?message=An Unexpected Error Occured');
        }
      }());
    });

  authRouter.route('/verification')
    .all((req, res, next) => {
      if (req.user) {
        res.redirect('/dashboard');
      } else {
        next();
      }
    })
    .get((req, res) => {
      (async function process() {
        try {
          const renderInfo = {
            view: 'verification',
            email: false,
            token: false,
            firstName: false,
            sent: false,
            send: false,
            complete: false,
            message: false
          };
          if (req.query.email) {
            renderInfo.email = req.query.email;
          }
          if (req.query.firstName) {
            renderInfo.firstName = req.query.firstName;
          }
          if (req.query.sent) {
            renderInfo.sent = req.query.sent;
          }
          if (req.query.send) {
            renderInfo.send = req.query.send;
          }
          if (req.query.complete) {
            renderInfo.complete = req.query.complete;
          }
          if (req.query.token) {
            renderInfo.token = req.query.token;
          }
          if (req.query.message) {
            renderInfo.message = req.query.message;
          }

          if (!renderInfo.complete && !renderInfo.sent && !renderInfo.send) {
            renderInfo.send = true;
          }

          // Check is the user is clicking on an activation link
          if (renderInfo.token && renderInfo.email) {
            const activationResults = await controller.activateAccount(req.query);
            res.redirect(activationResults.route);
            return;
          }

          // Check is the first name and last name exist and sent is not set.
          if (renderInfo.email && renderInfo.firstName && !renderInfo.sent) {
            renderInfo.sent = true;
          }

          res.render('auth', renderInfo);
        } catch (err) {
          debug(`
            Status: ${chalk.red('Error')}
            Endpoint: ${chalk.red('/verification')}
            Method: ${chalk.red('GET')}
            Error: ${chalk.red(err)}
          `);
          res.redirect('/auth/verification?send=true');
        }
      }());
    })
    .post((req, res) => {
      (async function process() {
        try {
          const accountActivation = await controller.sendActivation(req.body);
          res.redirect(accountActivation.route);
        } catch (err) {
          debug(`
            Status: ${chalk.red('Error')}
            Endpoint: ${chalk.red('/verification')}
            Method: ${chalk.red('POST')}
            Error: ${chalk.red(err)}
          `);
          res.redirect('/auth/verification?send=true&message=An Unexpected Error Occured');
        }
      }());
    });

  authRouter.route('/resetPassword')
    .all((req, res, next) => {
      if (req.user) {
        res.redirect('/dashboard');
      } else {
        next();
      }
    })
    .get((req, res) => {
      const renderInfo = {
        view: 'resetPassword',
        message: false,
        email: false,
        verification: false,
        request: false,
        reset: false
      };
      if (req.query.message) {
        renderInfo.message = req.query.message;
      }
      if (req.query.email) {
        renderInfo.email = req.query.email;
      }
      if (req.query.verification) {
        renderInfo.verification = req.query.verification;
      }
      if (req.query.request) {
        renderInfo.request = req.query.request;
      }
      if (req.query.reset) {
        renderInfo.reset = req.query.reset;
      }
      res.render('auth', renderInfo);
    })
    .post((req, res) => {
      (async function process() {
        try {
          if (req.body.verification) {
            const returnInfo = await controller.resetPassword(req.body);
            res.redirect(returnInfo.route);
          } else {
            const returnInfo = await controller.requestPasswordReset(req.body);
            res.redirect(returnInfo.route);
          }
        } catch (err) {
          debug(`
            Status: ${chalk.red('Error')}
            Endpoint: ${chalk.red('/resetPassword')}
            Method: ${chalk.red('POST')}
            Error: ${chalk.red(err)}
          `);
          res.redirect('/auth/resetPassword?message=An Unexpected Error Occured');
        }
      }());
    });

  authRouter.route('/signout')
    .get((req, res) => {
      req.logout();
      res.redirect('/');
    });
  return authRouter;
}

module.exports = router;
