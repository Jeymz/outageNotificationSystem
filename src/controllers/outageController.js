const debug = require('debug')('app:submitOutageController');
const chalk = require('chalk');
const db = require('../resources/db');

async function checkForPreferredPage(id) {
  try {
    const query = `
      SELECT
        string
      FROM
        settings
      WHERE
        \`key\`= 'outagePreferredPage' AND
        users_id = ?
    `;
    const args = [
      id
    ];
    const results = await db.query(query, args);
    if (results.length !== 1 || !results[0].string) {
      return {
        success: true,
        preferredPage: false
      };
    }
    return {
      success: true,
      preferredPage: results[0].string
    };
  } catch (err) {
    debug(`
      Status: ${chalk.red('Error')}
      Function: ${chalk.red('checkForPrefferedPage')}
      Error: ${chalk.red(err)}
    `);
    return {
      error: true,
      message: 'An Unexpected Error Occured'
    };
  }
}

async function validateID(email, token) {
  try {
    const query = `
      SELECT
        id, tier
      FROM
        users
      WHERE
        userKey = ? AND
        email = ?
    `;
    const args = [
      token,
      email
    ];
    const results = await db.query(query, args);
    if (results.length !== 1) {
      return {
        error: true,
        message: 'Unable To Validate Account'
      };
    }
    return {
      success: true,
      userInfo: results[0]
    };
  } catch (err) {
    debug(`
      Status: ${chalk.red('Error')}
      Function: ${chalk.red('validateID')}
      Eror: ${chalk.red(err)}
    `);
    return {
      error: true,
      message: 'An Unexpected Error Occured'
    };
  }
}

async function getOutageLevels(id) {
  try {
    const query = `
      SELECT
        level,
        color
      FROM
        outageLevels
      WHERE
        users_id = ? AND
        active = 1
    `;
    const args = [id];
    const results = await db.query(query, args);
    if (results.length === 0) {
      return {
        success: true
      };
    }
    return {
      success: true,
      outageLevels: results
    };
  } catch (err) {
    debug(`
      Status: ${chalk.red('Error')}
      Function: ${chalk.red('getOutageLevels')}
      Error: ${chalk.red(err)}
    `);
    return {
      error: true,
      message: 'An Unexpected Error Occured'
    };
  }
}

const exportFunctions = {
  getPreferredPage: async function getPreferredPage(user) {
    try {
      const {
        token,
        email
      } = user;
      // Validate user hasn't modified id
      const validateIDResults = await validateID(email, token);
      if (validateIDResults.error) {
        return {
          route: `/error?message=${validateIDResults.message}`
        };
      }
      const { id } = validateIDResults.userInfo;

      // Check if the user has a preferred page
      const preferredPageResults = await checkForPreferredPage(id);
      if (preferredPageResults.error) {
        return {
          route: `/error?message=${preferredPageResults.error}`
        };
      }
      if (!preferredPageResults.preferredPage) {
        return {
          route: '/outage/new'
        };
      }
      return {
        route: `/outage/${preferredPageResults.preferredPage}?redirect=true`
      };
    } catch (err) {
      debug(`
        Status: ${chalk.red('Error')}
        Function: ${chalk.red('getPreferredPage')}
        Error: ${chalk.red(err)}
      `);
      return {
        error: true,
        route: '/error?message=An Unexpected Error Occured'
      };
    }
  },
  getNewRenderInfo: async function getNewRenderInfo(user) {
    try {
      const {
        email,
        token
      } = user;
      const validateIDResults = await validateID(email, token);
      if (validateIDResults.error) {
        return {
          error: true,
          route: `/error?message=${validateIDResults.message}`
        };
      }
      const { id } = validateIDResults;
      const renderInfo = {};
      const outageLevelResults = await getOutageLevels(id);
      if (outageLevelResults.error) {
        return {
          error: true,
          route: `/error?message=${outageLevelResults.message}`
        };
      }
      if (!outageLevelResults.outageLevels) {

      }
      // renderInfo.outageLevels = await
    } catch (err) {
      debug(`
        Status: ${chalk.red('Error')}
        Function: ${chalk.red('getNewRenderInfo')}
        Error: ${chalk.red(err)}
      `);
      return {
        error: true,
        route: '/error?message=An Unexpected Error Occured'
      };
    }
  }
};

module.exports = exportFunctions;
