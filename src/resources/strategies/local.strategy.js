const debug = require('debug')('app:localStrategy');
const chalk = require('chalk');
const passport = require('passport');
const { Strategy } = require('passport-local');
const bcrypt = require('bcryptjs');
// const randomToken = require('rand-token');
const db = require('../db');

function localStrategy() {
  debug('Localstrategy Called');
  passport.use('local', new Strategy({
    usernameField: 'email',
    passwordField: 'password'
  }, (username, password, done) => {
    (async function lookup() {
      try {
        const query = `
          SELECT
            email,
            firstName,
            lastName,
            password,
            id,
            userKey
          FROM
            users
          WHERE
            email = ? AND
            active = 1
        `;
        const args = [
          username
        ];
        const userInfo = await db.query(query, args);
        if (userInfo.length !== 1) {
          debug(`
            Status: ${chalk.red('Auth Failed')}
            Username: ${chalk.red(username)}
            Results: ${chalk.red(userInfo.length)}
          `);
          done(null, false, { email: username, message: 'Invalid Credentials' });
        } else if (bcrypt.compareSync(password, userInfo[0].password)) {
          // user[0].token = randomToken.generate(32);
          const user = {
            email: userInfo[0].email,
            token: userInfo[0].userKey,
            firstName: userInfo[0].firstName,
            lastName: userInfo[0].lastName
          };
          done(null, user);
        } else {
          debug(`
            Status: ${chalk.red('Error')}
            Username: ${chalk.red(username)}
            Error: ${chalk.red('Invalid Password')}
          `);
          done(null, false, { email: username, message: 'Invalid  Password' });
        }
      } catch (err) {
        debug(`
          Status: ${chalk.red('Error')}
          Username: ${chalk.red(username)}
          Error: ${chalk.red(err)}
        `);
        done(null, false, { message: 'An Unexpected Error Occured' });
      }
    }());
  }));
}

module.exports = localStrategy;
