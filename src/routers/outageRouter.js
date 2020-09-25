const debug = require('debug')('app:outageRouter');
const chalk = require('chalk');
const express = require('express');
const controller = require('../controllers/outageController');

const outageRouter = express.Router();

function router() {
  outageRouter.route('/')
    .all((req, res, next) => {
      if (req.user) {
        next();
      } else {
        res.redirect('/auth/login');
      }
    })
    .get((req, res) => {
      (async function process() {
        try {
          const preferredPageResults = await controller.getPreferredPage(req.user);
          res.redirect(preferredPageResults.route);
        } catch (err) {
          debug(`
            Status: ${chalk.red('Error')}
            Endpoint: ${chalk.red('/')}
            Method: ${chalk.red('GET')}
            Error: ${chalk.red(err)}
          `);
          res.redirect('/error?message=An Unexpected Error Occured');
        }
      }());
    });

  outageRouter.route('/new')
    .all((req, res, next) => {
      if (req.user) {
        next();
      } else {
        res.redirect('/auth/login');
      }
    })
    .get((req, res) => {
      (async function process() {
        
      }())
    })

  return outageRouter;
}

module.exports = router;
