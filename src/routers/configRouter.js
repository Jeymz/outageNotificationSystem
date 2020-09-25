const debug = require('debug')('app:configRouter');
const chalk = require('chalk');
const express = require('express');

const configRouter = express.Router();

function router() {
  configRouter.route('/')
    .get((req, res) => {
      
    })
  return configRouter;
}
