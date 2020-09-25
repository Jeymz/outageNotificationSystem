const debug = require('debug')('app:dashboardRouter');
const chalk = require('chalk');
const express = require('express');
const controller = require('../controllers/dashboardController');

const dashboardRouter = express.Router();

function router() {
  dashboardRouter.route('/')
    .all((req, res, next) => {
      if (req.user) {
        next();
      } else {
        res.redirect('/auth/login');
      }
    })
    .get((req, res) => {
      const renderInfo = {
        view: 'dashboard',
        name: false,
      };
      // Probably get some data or something to display here
      res.render('dashboard', renderInfo);
    });

  return dashboardRouter;
}

module.exports = router;
