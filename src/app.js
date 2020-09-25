const debug = require('debug')('app');
const chalk = require('chalk');
const config = require('config');
const bodyParser = require('body-parser');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const session = require('express-session');

const app = express();

const sessionInfo = config.get('authInfo.sessionInfo');

app.use(bodyParser());
app.set('view engine', 'ejs');

// Express Middlewares
app.use(bodyParser.json({ type: 'application/*+json' }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(session(sessionInfo));

// Passport Auth
require('./resources/passport.js')(app);

// Asset Static Routers
app.use('/css', express.static(path.join(__dirname, 'assets/', 'css/')));
app.use('/images', express.static(path.join(__dirname, 'assets/', 'images/')));
app.use('/js', express.static(path.join(__dirname, 'assets/', 'js/')));

// Add all the routers
const homeRouter = require('./routers/homeRouter')();
const authRouter = require('./routers/authRouter')();
const dashboardRouter = require('./routers/dashboardRouter')();
const outageRouter = require('./routers/outageRouter')();

app.use('/', homeRouter);
app.use('/auth', authRouter);
app.use('/dashboard', dashboardRouter);
app.use('/outage', outageRouter);

const serverConfig = config.get('serverConfig');
const { port, environment } = serverConfig;

app.listen(port, (err) => {
  if (err) {
    debug(`
      Status: ${chalk.red('Error')}
      Port: ${chalk.red(port)}
      Environment: ${chalk.red(environment)}
      Error: ${chalk.red(err)}
    `);
  } else {
    debug(`
      Status: ${chalk.green('Running')}
      Environment: ${chalk.green(environment)}
      Port: ${chalk.green(port)}
    `);
  }
});
