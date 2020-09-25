const debug = require('debug')('app:viewRouter');
const chalk = require('chalk');
const express = require('express');

const viewRouter = express.Router()

function router() {
  viewRouter.route('/')
    .get((req, res) => {
      (async function process() {
        try {
          const renderInfo = await homeController.getCurrentOutagesRenderInfo();
          renderInfo.view = 'currentOutages';
          res.render('index', renderInfo);
          return true;
        } catch (err) {
          debug(`
            Status: ${chalk.red('Error')}
            Endpoint: ${chalk.red('/currentOutages')}
            Error: ${chalk.red(err)}
          `);
          res.send('Error');
          return false;
        }
      }());
    });

  viewRouter.route('/clear')
    .post((req, res) => {
      (async function process() {
        try {
          if (!req.query) {
            debug('ding');
            res.redirect('/currentOutages');
          }
          const validation = await homeController.postClearOutage(req.query.id);
          if (validation.error) {
            res.redirect('currentOutages');
          }
          res.redirect('/currentOutages');
        } catch (err) {
          debug(err);
          res.redirect('/currentOutages');
        }
      }());
    });
}
