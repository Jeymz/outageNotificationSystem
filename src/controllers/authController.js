const debug = require('debug')('app:authController');
const chalk = require('chalk');
const config = require('config');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const db = require('../resources/db');
const mailer = require('../resources/mailer');
const newAccountEmail = require('../mail/newAccount');
const passwordResetEmail = require('../mail/resetPassword');

const serverConfig = config.get('serverConfig');
const {
  hostname,
  protocol
} = serverConfig;

async function validateEmail(email) {
  const emailFormat = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/; // eslint-disable-line
  if (!email || typeof email !== 'string' || !email.match(emailFormat)) {
    debug(`
      Status: ${chalk.yellow('Warning')}
      Function: ${chalk.yellow('checkEmail')}
      Warning: ${chalk.yellow('Invalid email provided')}
      Email: ${chalk.yellow(email)}
    `);
    return {
      error: true,
      message: 'Invalid Email Provided',
    };
  }
  return {
    success: true
  };
}

async function checkEmail(email) {
  try {
    const query = `
      SELECT
        email
      FROM
        users
      WHERE
        email = ?
    `;
    const args = [
      email
    ];
    const emailResults = await db.query(query, args);
    if (emailResults.length < 1) {
      debug(`
        Status: ${chalk.green('Alert')}
        Function: ${chalk.green('checkEmail')}
        Alert: ${chalk.green('New User')}
        Email: ${chalk.green(email)}
      `);
      return {
        success: true,
        results: emailResults.length,
      };
    }
    if (emailResults.length > 1) {
      debug(`
        Status: ${chalk.red('Error')}
        Function: ${chalk.red('checkEmail')}
        Error: ${chalk.red('More than one result exists for email')}
        Email: ${chalk.red(email)}
      `);
      return {
        error: true,
        message: 'Something is wrong with your account'
      };
    }
    return {
      success: true,
      results: emailResults.length,

    };
  } catch (err) {
    debug(`
      Status: ${chalk.red('Error')}
      Function: ${chalk.red('checkEmail')}
      Error: ${chalk.red(err)}
    `);
    return {
      error: true,
      message: 'An Unexpected Error Occured'
    };
  }
}

async function createUserKey() {
  try {
    const userKey = await crypto.randomBytes(Math.ceil(32 / 2))
      .toString('hex') /** convert to hexadecimal format */
      .slice(0, 32);
    return userKey;
  } catch (err) {
    debug(`
      Status: ${chalk.red('Error')}
      Function: ${chalk.red('createUserKey')}
      Error: ${chalk.red(err)}
    `);
    return {
      error: true,
      message: 'An Unexpected Error Occured'
    };
  }
}

async function getUserKey(email) {
  try {
    const query = `
      SELECT
        userKey
      FROM
        users
      WHERE
        email = ?
    `;
    const args = [email];
    const results = await db.query(query, args);
    if (results.length !== 1) {
      debug(`
        Status: ${chalk.red('Error')}
        Function: ${chalk.red('getUserKey')}
        Error: ${chalk.red('Invalid Number Of Results Returned')}
        Results: ${chalk.red(results.length)}
      `);
      return {
        error: true,
        message: 'An Unexpected Error Occured'
      };
    }
    return {
      success: true,
      userKey: results[0].userKey
    };
  } catch (err) {
    debug(`
      Status: ${chalk.red('Error')}
      Function: ${chalk.red('getUserKey')}
      Error: ${chalk.red(err)}
    `);
    return {
      error: true,
      message: 'An Unexpected Error Occured'
    };
  }
}

async function saveUser(email, password, firstName, lastName) {
  try {
    const userKey = await createUserKey();
    if (userKey.error) {
      return userKey;
    }
    const query = `
      INSERT INTO
        users
        (email, password, firstName, lastName, tier, active, userKey)
      VALUES
        (?, ?, ?, ?, 1, 0, ?)
    `;
    const args = [
      email,
      password,
      firstName,
      lastName,
      userKey
    ];
    const results = await db.query(query, args);
    if (!results.insertId) {
      debug(`
        Status: ${chalk.red('Error')}
        Function: ${chalk.red('saveUser')}
        Error: ${chalk.red(results)}
      `);
      return {
        error: true,
        message: 'We Are Unable To Add Your Account To Our System'
      };
    }
    return {
      success: true,
      userID: results.insertId,
      userKey
    };
  } catch (err) {
    debug(`
      Status: ${chalk.red('Error')}
      Function: ${chalk.red('saveUser')}
      Error: ${chalk.red(err)}
    `);
    return {
      error: true,
      message: 'An Unexpected Error Occured'
    };
  }
}

async function validatePassword(password, confirmPassword) {
  if (typeof password !== 'string' || typeof confirmPassword !== 'string') {
    debug(`
      Status: ${chalk.red('Warning')}
      Function: ${chalk.red('validatePassword')}
      Warning: ${chalk.red('Password provided is not a string')}
      Password: ${chalk.red(password)}
      Password Confirmation: ${chalk.red(confirmPassword)}
    `);
    return {
      error: true,
      message: 'Something Is Wrong With The Password You Provided'
    };
  }
  // Check to make sure the password and password confirmation match
  if (password !== confirmPassword) {
    debug(`
      Status: ${chalk.yellow('Alert')}
      Function: ${chalk.yellow('validatePassword')}
      Alert: ${chalk.yellow('Password do not match')}
    `);
    return {
      error: true,
      message: 'Passwords Do Not Match'
    };
  }

  // Check to see if the password meets minimum security requirements
  const passwordComplexitySettings = config.get('authInfo.passwordComplexitySettings');
  const {
    minimumLength,
    upperCaseRequired,
    lowerCaseRequired,
    numberRequired,
    specialRequired
  } = passwordComplexitySettings;
  // First lets check password length
  if (password.length < minimumLength) {
    debug(`
      Status: ${chalk.yellow('Alert')}
      Function: ${chalk.yellow('validatePassword')}
      Alert: ${chalk.yellow('Password less than')} ${chalk.yellow(minimumLength)} ${chalk.yellow('characters')}
    `);
    return {
      error: true,
      message: `Password Less Than ${minimumLength} Characters`
    };
  }

  // Check for upper case characters if required
  if (upperCaseRequired && !/[A-Z]/.test(password)) {
    debug(`
      Status: ${chalk.yellow('Alert')}
      Function: ${chalk.yellow('validatePassword')}
      Alert: ${chalk.yellow('Password does not contain any upper case characters')}
    `);
    return {
      error: true,
      message: 'Password Does Not Contain Any Upper Case Characters'
    };
  }

  // Check for lower case characters if required
  if (lowerCaseRequired && !/[a-z]/.test(password)) {
    debug(`
      Status: ${chalk.yellow('Alert')}
      Function: ${chalk.yellow('validatePassword')}
      Alert: ${chalk.yellow('Password does not contain any lower case characters')}
    `);
    return {
      error: true,
      message: 'Password Does Not Contain Any Lower Case Characters'
    };
  }

  // Check for number characters if required
  if (numberRequired && !/[0-9]/.test(password)) {
    debug(`
      Status: ${chalk.yellow('Alert')}
      Function: ${chalk.yellow('validatePassword')}
      Alert: ${chalk.yellow('Password does not contain any numbers')}
    `);
    return {
      error: true,
      message: 'Password Does Not Contain Any Numbers'
    };
  }

  // Check for special characters if required
  if (specialRequired && !/[\!@#$%^&*()\\[\]{}\-_+=~`|:;"'<>,./?]/.test(password)) { // eslint-disable-line
    debug(`
      Status: ${chalk.yellow('Alert')}
      Function: ${chalk.yellow('validatePassword')}
      Alert: ${chalk.yellow('Password does not contain any special characters')}
    `);
    return {
      error: true,
      message: 'Password Does Not Contain Any Special Characters'
    };
  }

  // Return success and cleaned password
  return {
    success: true
  };
}

async function encryptPassword(password) {
  try {
    const salt = bcrypt.genSaltSync(10);
    const hash = await bcrypt.hashSync(password, salt);
    if (!hash || !salt) {
      debug(`
        Status: ${chalk.red('Error')}
        Function: ${chalk.red('encryptPassword')}
        Error: ${chalk.red('Unable to get Salt And/Or Hash')}
        Salt: ${chalk.red(salt)}
        Hash: ${chalk.red('Hash')}
      `);
      return {
        error: true,
        message: 'An Unexpected Error Occured'
      };
    }
    return {
      success: true,
      hash
    };
  } catch (err) {
    debug(`
      Status: ${chalk.red('Error')}
      Function: ${chalk.red('encryptPassword')}
      Error: ${chalk.red(err)}
    `);
    return {
      error: true,
      message: 'An Unexpected Error Occured'
    };
  }
}

async function updatePassword(encryptedPassword, email, token) {
  try {
    const userKey = await createUserKey();
    if (userKey.error) {
      return userKey;
    }
    const query = `
      UPDATE
        users
      SET
        password = ?,
        userKey = ?
      WHERE
        email = ? AND
        userKey = ?
    `;
    const args = [
      encryptedPassword,
      userKey,
      email,
      token
    ];
    const results = await db.query(query, args);
    if (results.affectedRows !== 1) {
      debug(`
        Status: ${chalk.red('Error')}
        Function: ${chalk.red('updatePassword')}
        Error: ${chalk.red('Invalid Affected Rows')}
        Affected Rows: ${chalk.red(results.affectedRows)}
      `);
      return {
        error: true,
        message: 'Invalid Password Reset Link'
      };
    }
    return {
      success: true,
    };
  } catch (err) {
    debug(`
      Status: ${chalk.red('Error')}
      Function: ${chalk.red('updatePassword')}
      Error: ${chalk.red(err)}
    `);
    return {
      error: true,
      message: 'An Unexpected Error Occured'
    };
  }
}

async function getAccountStatus(email) {
  try {
    const query = `
      SELECT
        id
      FROM
        users
      WHERE
        email = ? AND
        active = 1
    `;
    const args = [
      email
    ];
    const results = await db.query(query, args);
    if (results.length !== 1) {
      return {
        error: true,
        message: 'Account Has Not Been Activated Yet'
      };
    }
    return {
      success: true
    };
  } catch (err) {
    debug(`
      Status: ${chalk.red('Error')}
      Function: ${chalk.red('getAccountStatus')}
      Error: ${chalk.red(err)}
    `);
    return {
      error: true,
      message: 'An Unexpected Error Occured'
    };
  }
}

async function activateUserAccount(email, token) {
  try {
    const query = `
      UPDATE
        users
      SET
        active = 1
      WHERE
        email = ? AND
        userKey = ?
    `;
    const args = [
      email,
      token
    ];
    const activationResults = await db.query(query, args);
    if (activationResults.affectedRows !== 1) {
      return {
        error: true,
        message: 'Invalid Activation Link'
      };
    }
    return {
      success: true
    };
  } catch (err) {
    debug(`
      Status: ${chalk.red('Error')}
      Function: ${chalk.red('activateUserAccount')}
      Error: ${chalk.red(err)}
    `);
    return {
      error: true,
      message: 'An Unexpected Error Occured'
    };
  }
}

async function updateUserKey(newUserKey, oldUserKey, email) {
  try {
    const query = `
      UPDATE
        users
      SET
        userKey = ?
      WHERE
        userKey = ? AND
        email = ?
    `;
    const args = [
      newUserKey,
      oldUserKey,
      email
    ];
    const results = await db.query(query, args);
    if (results.affectedRows !== 1) {
      return {
        error: true,
        message: 'Expired Activation Link'
      };
    }
    return {
      success: true
    };
  } catch (err) {
    debug(`
      Status: ${chalk.red('Error')}
      Function: ${chalk.red('updateUserKey')}
      Error: ${chalk.red(err)}
    `);
    return {
      error: true,
      message: 'An Unexpected Error Occured'
    };
  }
}

const exportFunctions = {
  signupOrLoginCheck: async function signupOrLoginCheck(body) {
    try {
      const { email } = body;

      // Check if an email was even provided
      if (!email || email === '') {
        return {
          success: true,
          route: '/auth/signup'
        };
      }

      // Validate the email matches email structure
      const emailValidation = await validateEmail(email);

      // Check if the email failed structure validation
      if (emailValidation.error) {
        return {
          success: true,
          route: `/auth/login?message=${emailValidation.message}`
        };
      }

      // Check if the email exists already
      const emailCheck = await checkEmail(email);

      // Check if there was an error in checking for existing emails
      if (emailCheck.error) {
        return {
          success: true,
          route: `/auth/login?message=${emailCheck.message}`
        };
      }

      // Check to see if there were no matches found for email
      if (emailCheck.results === 0) {
        return {
          success: true,
          route: `/auth/signup?email=${email}`
        };
      }

      // Attempt Login
      return {
        success: true,
        route: `/auth/login?email=${email}`
      };
    } catch (err) {
      debug(`
        Status: ${chalk.red('Error')}
        Function: ${chalk.red('loginCheck')}
        Error: ${chalk.red(err)}
      `);
      return {
        error: true,
        message: 'An Unexpected Error Occured',
        route: '/auth/login?message=An Unexpected Error Occured'
      };
    }
  },
  signupVerification: async function signupVerification(body) {
    try {
      const {
        email,
        firstName,
        lastName,
        password,
        confirmPassword
      } = body;

      // Test Password
      const validPassword = await validatePassword(password, confirmPassword);
      if (validPassword.error) {
        return {
          success: true,
          route: `/auth/signup?message=${validPassword.message}&email=${email}&firstName=${firstName}&lastName=${lastName}`
        };
      }

      // Test Email
      const emailVerification = await validateEmail(email);
      if (emailVerification.error) {
        return {
          success: true,
          route: `/auth/signup?message=${emailVerification.message}`
        };
      }

      const emailCheck = await checkEmail(email);
      if (emailCheck.error) {
        return {
          success: true,
          route: `/auth/signup?message=${emailCheck.message}`
        };
      }
      if (emailCheck.results > 0) {
        return {
          success: true,
          route: `/auth/login?message=An Account With That Email Already Exists&email=${email}`
        };
      }

      const encryptedPassword = await encryptPassword(password);
      if (encryptedPassword.error) {
        return {
          route: `/auth/signup?message=${encryptedPassword.message}&email=${email}`
        };
      }

      const userCreation = await saveUser(email, encryptedPassword.hash, firstName, lastName);
      if (userCreation.error) {
        return {
          success: true,
          route: `auth/signup?message=${userCreation.message}&email=${email}&firtsName=${firstName}&lastname=${lastName}`
        };
      }
      const route = `/auth/verification?token=${userCreation.userKey}&email=${email}`;
      const html = await newAccountEmail(route);
      const mail = await mailer(email, 'Robotti Rapid Response - Account Activation', `Activation Link: ${protocol}://${hostname}${route}`, html);
      if (mail.error) {
        debug(`
          Status: ${chalk.red('Error')}
          Function: ${chalk.red('signupVerification')}
          Error: ${chalk.red('Unable to send email to user')}
        `);
      }
      return {
        success: true,
        route: `/auth/verification?firstName=${firstName}&email=${email}`
      };
    } catch (err) {
      debug(`
        Status: ${chalk.red('Error')}
        Function: ${chalk.red('signupVerification')}
        Error: ${chalk.red(err)}
      `);
      return {
        error: true,
        message: 'An Unexpected Error Occured',
        route: 'auth/signup?message=An Unexpected Error Occured'
      };
    }
  },
  requestPasswordReset: async function requestPasswordReset(body) {
    try {
      const { email } = body;
      const emailValidationResults = await validateEmail(email);
      if (emailValidationResults.error) {
        return {
          route: `/auth/resetPassword?message=${emailValidationResults.message}`
        };
      }
      const keyResults = await getUserKey(email);
      if (keyResults.error) {
        return {
          route: `/auth/resetPassword?message=${keyResults.message}`
        };
      }
      const route = `/auth/resetPassword?verification=${keyResults.userKey}&email=${email}`;
      const html = await passwordResetEmail(route);
      const mail = await mailer(email, 'Robotti Rapid Response - Password Reset', `Reset Link: ${protocol}://${hostname}${route}`, html);
      if (mail.error) {
        return {
          route: `/auth/resetPassword?message=${mail.message}`
        };
      }
      return {
        route: `/auth/resetPassword?request=success&email=${email}`
      };
    } catch (err) {
      debug(`
        Status: ${chalk.red('Error')}
        Function: ${chalk.red('requestPasswordReset')}
        Error: ${chalk.red(err)}
      `);
      return {
        route: '/auth/resetPassword?message=An Unexpected Error Occured'
      };
    }
  },
  resetPassword: async function resetPassword(body) {
    try {
      const {
        password,
        confirmPassword,
        email,
        verification
      } = body;
      const validatedPassword = await validatePassword(password, confirmPassword);
      if (validatedPassword.error) {
        return {
          route: `/auth/resetPassword?verification=${verification}&email=${email}&message=${validatedPassword.message}`
        };
      }
      const encryptedPassword = await encryptPassword(password);
      if (encryptedPassword.error) {
        return {
          route: `/auth/resetPassword?verification=${verification}&email=${email}&message=${encryptedPassword.message}`
        };
      }
      const updateResults = await updatePassword(encryptedPassword.hash, email, verification);
      if (updateResults.error) {
        return {
          route: `/auth/resetPassword?verification=${verification}&email=${email}&message=${updateResults.message}`
        };
      }
      return {
        route: '/auth/resetPassword?reset=success'
      };
    } catch (err) {
      debug(`
        Status: ${chalk.red('Error')}
        Function: ${chalk.red('resetPassword')}
        Error: ${chalk.red(err)}
      `);
      return {
        route: `/auth/resetPassword?message=An Unexpected Error Occured&verification=${body.verification}&email=${body.email}`
      };
    }
  },
  validateLogin: async function validateLogin(body) {
    try {
      const { email } = body;
      const validEmail = await validateEmail(email);
      if (validEmail.error) {
        return {
          route: `/auth/login?email=${email}&message=${validEmail.message}`
        };
      }
      const activeAccount = await getAccountStatus(email);
      if (activeAccount.error) {
        return {
          route: `/auth/login?email=${email}&message=${activeAccount.message}&status=0`
        };
      }
      return activeAccount;
    } catch (err) {
      debug(`
        Status: ${chalk.red('Error')}
        Function: ${chalk.red('validateLogin')}
        Error: ${chalk.red(err)}
      `);
      return {
        route: '/auth/login?message=An Unexpected Error Occured'
      };
    }
  },
  activateAccount: async function activateAccount(body) {
    try {
      const {
        email,
        token
      } = body;
      const newTokenResults = await createUserKey();
      if (newTokenResults.error) {
        return {
          route: `/auth/verification?send=true&email=${email}&message=${newTokenResults.message}`
        };
      }
      const updateUserKeyResults = await updateUserKey(newTokenResults, token, email);
      if (updateUserKeyResults.error) {
        return {
          route: `/auth/verificaiton?send=true&email=${email}&message=${updateUserKeyResults.message}`
        };
      }
      const activationResults = await activateUserAccount(email, newTokenResults);
      if (activationResults.error) {
        return {
          route: `/auth/verification?email=${email}&message=${activationResults.message}`
        };
      }
      return {
        route: '/auth/verification?complete=true'
      };
    } catch (err) {
      debug(`
        Status: ${chalk.red('Error')}
        Function: ${chalk.red('activateAccount')}
        Error: ${chalk.red(err)}
      `);
      return {
        route: '/auth/verification?send=true'
      };
    }
  },
  sendActivation: async function sendActivation(body) {
    try {
      const { email } = body;
      const validEmailResults = await validateEmail(email);
      if (validEmailResults.error) {
        return {
          route: `/auth/verificaiton?send=true&message=${validEmailResults.message}`
        };
      }
      const checkEmailResults = await checkEmail(email);
      if (checkEmailResults.error) {
        return {
          route: '/auth/verification?send=true&message=An Unexpected Error Occured'
        };
      }
      if (checkEmailResults.results !== 1) {
        return {
          route: `/auth/verification?send=true&message=A User Account With That Email Doesn't Exist&email=${email}`
        };
      }
      const userKeyResults = await getUserKey(email);
      if (userKeyResults.error) {
        return {
          route: `/auth/verification?send=true&email=${email}&message=${userKeyResults.message}`
        };
      }
      const route = `/auth/verification?token=${userKeyResults.userKey}&email=${email}`;
      const html = await newAccountEmail(route);
      const mail = await mailer(email, 'Robotti Tapid Response - Account Activation', `Activation Link: ${protocol}://${hostname}${route}`, html);
      if (mail.error) {
        return {
          route: `/auth/verification?send=true&email=${email}&message=${mail.message}`
        };
      }
      return {
        route: `/auth/verification?sent=true&email=${email}`
      };
    } catch (err) {
      debug(`
        Status: ${chalk.red('Error')}
        Function: ${chalk.red('sendActivation')}
        Error: ${chalk.red(err)}
      `);
      return {
        route: '/auth/verification?send=true&message=An Unexpected Error Occured'
      };
    }
  }
};

module.exports = exportFunctions;
