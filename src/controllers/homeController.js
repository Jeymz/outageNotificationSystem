const debug = require('debug')('app:homeController');
const chalk = require('chalk');
const db = require('../resources/db');

async function newOutage(outageInformation) {
  try {
    const date = await new Date();
    if (!outageInformation.description) {
      debug(`
        Status: ${chalk.red('Error')}
        Function: ${chalk.red('newOutage')}
        Error: ${chalk.red('No Description Provided')}
      `);
      return {
        error: true,
        message: 'No Description Provided'
      };
    }
    let intLevel;
    if (!outageInformation.level) {
      debug(`
        Status: ${chalk.red('Error')}
        Function: ${chalk.red('newOutage')}
        Error: ${chalk.red('No Level Provided')}
      `);
      return {
        error: true,
        message: 'No Level Provided'
      };
    }
    if (outageInformation.level) {
      intLevel = await parseInt(outageInformation.level, 10);
    }
    if (!outageInformation.service || outageInformation.service.length < 1) {
      debug(`
        Status: ${chalk.red('Error')}
        Function: ${chalk.red('newOutage')}
        Error: ${chalk.red('No Affected Services Selected')}
      `);
      return {
        error: true,
        message: 'No Affected Services Selected'
      };
    }
    const query = `
      INSERT INTO
        outage
        (description, startTime, outageLevels_id)
      VALUES
        (?, ?, ?)
    `;
    const args = [
      outageInformation.description,
      date,
      intLevel
    ];
    const outageResults = await db.query(query, args);
    debug(outageResults);
    if (!outageResults.insertId) {
      debug(`
        Status: ${chalk.red('Error')}
        Function: ${chalk.red('newOutage')}
        Error: ${chalk.red('Unable to insert outage')}
      `);
      return {
        error: true,
        message: 'Unable to add outage'
      };
    }
    for (let count = 0; count < outageInformation.service.length; count += 1) {
      (async function process() {
        try {
          const intService = await parseInt(outageInformation.service[count], 10);
          const serviceQuery = `
            INSERT INTO
              outageService_has_outage
              (outageService_id, outage_id)
            VALUES
              (?, ?)
          `;
          const serviceArgs = [
            intService,
            outageResults.insertId
          ];
          const serviceReturn = await db.query(serviceQuery, serviceArgs);
          if (!serviceReturn.affectedRows || serviceReturn.affectedRows !== 1) {
            debug(`
              Status: ${chalk.red('Error')}
              Function: ${chalk.red('newOutage')}
              Error: ${chalk.red('Unable To Add Service To Outage')}
              Arguments: ${chalk.red(args)}
            `);
            return false;
          }
          return true;
        } catch (err) {
          debug(`
            Status: ${chalk.red('Error')}
            Function: ${chalk.red('newOutage')}
            Error: ${chalk.red(err)}
          `);
          return false;
        }
      }());
    }
    return {
      success: true
    };
  } catch (err) {
    debug(`
      Status: ${chalk.red('Error')}
      Function: ${chalk.red('newOutage')}
      Error: ${chalk.red(err)}
    `);
    return {
      error: true,
      message: 'An Unexpected Error Occured'
    };
  }
}

async function getLevels() {
  try {
    const query = `
      SELECT
        id, level, color
      FROM
        outageLevels
    `;
    const levels = await db.query(query);
    if (levels.length < 1) {
      debug(`
        Status: ${chalk.red('Error')}
        Function: ${chalk.red('getLevels')}
        Error: ${chalk.red('No Levels Returned')}
      `);
      return {
        error: true,
        message: 'No Levels Returned'
      };
    }
    return levels;
  } catch (err) {
    debug(`
      Status: ${chalk.red('Error')}
      Function: ${chalk.red('getLevels')}
      Error: ${chalk.red(err)}
    `);
    return {
      error: true,
      message: 'An Unexpected Error Occured'
    };
  }
}

async function getServices() {
  try {
    const query = `
      SELECT
        id, service
      FROM
        outageService
    `;
    const services = await db.query(query);
    if (services.length < 1) {
      debug(`
        Status: ${chalk.red('Error')}
        Function: ${chalk.red('getServices')}
        Error: ${chalk.red('No Services Returned')}
      `);
      return {
        error: true,
        message: 'No Services Returned'
      };
    }
    return services;
  } catch (err) {
    debug(`
      Status: ${chalk.red('Error')}
      Function: ${chalk.red('getServices')}
      Error: ${chalk.red(err)}
    `);
    return {
      error: true,
      message: 'An Unexpected Error Occured'
    };
  }
}

async function getOutages() {
  try {
    const query = `
      SELECT
        outage.id,
        outage.description,
        outage.startTime,
        outage.outageLevels_id,
        outageLevels.level,
        outageLevels.color
      FROM
        outage,
        outageLevels
      WHERE
        outage.endTime is null and
        outageLevels.id = outage.outageLevels_id
    `;
    const outages = await db.query(query);
    return outages;
  } catch (err) {
    debug(`
      Status: ${chalk.red('Error')}
      Function: ${chalk.red('getOutages')}
      Error: ${chalk.red(err)}
    `);
    return {
      error: true,
      message: 'An Unexpected Error Occured'
    };
  }
}

async function getOutageServices(outageID) {
  try {
    const query = `
      SELECT
        outageService.service
      FROM
        outageService,
        outageService_has_outage
      WHERE
        outageService.id = outageService_has_outage.outageService_id AND
        outageService_has_outage.outage_id = ?
    `;
    const args = [
      outageID
    ];
    const services = await db.query(query, args);
    return services;
  } catch (err) {
    debug(`
      Status: ${chalk.red('Error')}
      Function: ${chalk.red('getOutageServices')}
      Error: ${chalk.red(err)}
    `);
    return false;
  }
}

async function getCurrentOutages(outages) {
  try {
    const outageInfo = [];
    const services = [];
    for (let count = 0; count < outages.length; count += 1) {
      (async function process() {
        try {
          const outageDate = new Date(outages[count].startTime).toString();
          const outageObject = {
            id: outages[count].id,
            description: outages[count].description,
            startTime: outageDate,
            level: outages[count].level,
            color: outages[count].color
          };

          const serviceReturns = getOutageServices(outageObject.id);
          outageInfo.push(outageObject);
          services.push(serviceReturns);
        } catch (err) {
          debug(err);
        }
      }());
    }
    const returnObject = await Promise.all(outageInfo);
    const returnServices = await Promise.all(services);
    return {
      outages: returnObject,
      services: returnServices
    };
  } catch (err) {
    debug(`
      Status: ${chalk.red('Error')}
      Function: ${chalk.red('getCurrentOutages')}
      Error: ${chalk.red(err)}
    `);
    return {
      error: true,
      message: 'An Unexpected Error Occured'
    };
  }
}

async function clearOutage(outageID) {
  try {
    const currentDateTime = await new Date();
    const query = `
      UPDATE
        outage
      SET
        endTime = ?
      WHERE
        id = ?
    `;
    const args = [
      currentDateTime,
      outageID
    ];
    const updateResults = await db.query(query, args);
    if (updateResults.affectedRows !== 1) {
      debug(`
        Status: ${chalk.red('Error')}
        Function: ${chalk.red('clearOutage')}
        Error: ${chalk.red('Unable to update outage')}
      `);
      return {
        error: true,
        message: 'Unable To Update Outage'
      };
    }
    return {
      success: true
    };
  } catch (err) {
    debug(`
      Status: ${chalk.reD('Error')}
      Function: ${chalk.red('clearOutage')}
      Error: ${chalk.red(err)}
    `);
    return {
      error: true,
      message: 'An Unknown Exception Occured'
    };
  }
}

const exportFunctions = {
  submitOutage: async function submitOutage(outageDetails) {
    try {
      // Whatever we want to try here
      const results = await newOutage(outageDetails);
      if (results.error) {
        return results;
      }
      return {
        success: true
      };
    } catch (err) {
      debug(`
        Status: ${chalk.red('Error')}
        Function: ${chalk.red('submitOutage')}
        Error: ${chalk.red(err)}
      `);
      return {
        error: true,
        message: 'Unable to submit outage notification'
      };
    }
  },
  getSubmitRenderInfo: async function getSubmitRenderInfo() {
    try {
      const renderInfo = {};
      renderInfo.levels = await getLevels();
      if (renderInfo.levels.error) {
        return renderInfo.levels;
      }
      renderInfo.services = await getServices();
      if (renderInfo.services.error) {
        return renderInfo.services;
      }
      return renderInfo;
    } catch (err) {
      debug(`
        Status: ${chalk.red('Error')}
        Function: ${chalk.red('getSubmitInfo')}
        Error: ${chalk.red(err)}
      `);
      return {
        error: true,
        message: 'An Unexpected Error Occured'
      };
    }
  },
  getCurrentOutagesRenderInfo: async function getCurrentOutagesRenderInfo() {
    try {
      const outages = await getOutages();
      if (outages.error) {
        return outages;
      }
      const outageInformation = await getCurrentOutages(outages);
      if (outageInformation.error) {
        return outageInformation;
      }
      return outageInformation;
    } catch (err) {
      debug(`
        Status: ${chalk.red('Error')}
        Function: ${chalk.red('getCurrentOutagesRenderInfo')}
        Error: ${chalk.red(err)}
      `);
      return {
        error: true,
        message: 'An Unexpected Error Occured'
      };
    }
  },
  postClearOutage: async function postClearOutage(outageID) {
    try {
      const validation = await clearOutage(outageID);
      if (validation.error) {
        return validation;
      }
      return validation;
    } catch (err) {
      debug(`
        Status: ${chalk.red('Error')}
        Function: ${chalk.red('postClearOutage')}
        Error: ${chalk.red(err)}
      `);
      return {
        error: true,
        message: 'An Unexpected Error Occured'
      };
    }
  },
  getOutageInformation: async function getOutageInformation(outageID) {
    try {

    } catch (err) {
      debug(`
        Status: ${chalk.red('Error')}
        Function: ${chalk.red('getOutageInformation')}
        Error: ${chalk.reD(err)}
      `);
      return {
        error: true,
        message: 'An Unexpected Error Occured'
      };
    }
  }
};

module.exports = exportFunctions;
