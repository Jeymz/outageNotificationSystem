const debug = require('debug')('app:homeRouter');
const chalk = require('chalk');
const config = require('config');
const express = require('express');
const homeController = require('../controllers/homeController');


const homeRouter = express.Router();

function router() {
  homeRouter.route('/')
    .all((req, res, next) => {
      if (req.user) {
        debug(req.user);
        res.redirect('/dashboard');
      } else {
        next();
      }
    })
    .get((req, res) => {
      const renderInfo = {};
      renderInfo.view = 'home';
      res.render('index', renderInfo);
    });

  homeRouter.route('/pricing')
    .all((req, res, next) => {
      if (req.user) {
        res.redirect('/dashboard');
      } else {
        next();
      }
    })
    .get((req, res) => {
      const renderInfo = {
        view: 'pricing',
      };
      renderInfo.pricing = config.get('pricing'); // Move to DB
      renderInfo.view = 'pricing';
      res.render('index', renderInfo);
    });

  homeRouter.route('/features')
    .all((req, res, next) => {
      if (req.user) {
        res.redirect('/dashboard');
      } else {
        next();
      }
    })
    .get((req, res) => {
      const renderInfo = {};
      renderInfo.view = 'features';
      res.render('index', renderInfo);
    });

  return homeRouter;
}

module.exports = router;
