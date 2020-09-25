const debug = require('debug')('app:db');
const chalk = require('chalk');
const config = require('config');
const mysql = require('promise-mysql');

const dbConfig = config.get('dbConfig');
const db = mysql.createPool(dbConfig);

debug(`
  Status: ${chalk.green('Imported')}
`);

module.exports = db;
