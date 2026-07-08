const LOG_LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };

const currentLevel = LOG_LEVELS[process.env.LOG_LEVEL || 'info'];

/**
 * Simple structured logger — replaces raw console.log.
 * Respects LOG_LEVEL env var (error | warn | info | debug).
 */
const logger = {
  error(message, ...args) {
    if (currentLevel >= LOG_LEVELS.error) {
      // eslint-disable-next-line no-console
      console.error(`[ERROR] ${new Date().toISOString()} — ${message}`, ...args);
    }
  },

  warn(message, ...args) {
    if (currentLevel >= LOG_LEVELS.warn) {
      // eslint-disable-next-line no-console
      console.warn(`[WARN]  ${new Date().toISOString()} — ${message}`, ...args);
    }
  },

  info(message, ...args) {
    if (currentLevel >= LOG_LEVELS.info) {
      // eslint-disable-next-line no-console
      console.info(`[INFO]  ${new Date().toISOString()} — ${message}`, ...args);
    }
  },

  debug(message, ...args) {
    if (currentLevel >= LOG_LEVELS.debug) {
      // eslint-disable-next-line no-console
      console.debug(`[DEBUG] ${new Date().toISOString()} — ${message}`, ...args);
    }
  },
};

module.exports = logger;
