'use strict'
const winston = require('winston');
const CONFIG = require('../../resources/config.json');


class LoggerManager {

    constructor() {
        this.logger = winston.createLogger({
            level: CONFIG.logLevel,
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.printf(info => {
                    return `${info.timestamp} ${info.level}: ${info.message}`;
                })
            ),
            transports: [new winston.transports.Console()]
        });
    }

    get getLogger() {
        return this.logger;
    }

    debug(message) {
        if (!CONFIG.development)
            this.logger.log('debug', message);
        else
            console.log(message);
    }
    info(message) {
        if (!CONFIG.development)
            this.logger.log('info', message);
        else console.log(message);

    }

    warn(message) {
        if (!CONFIG.development)
            this.logger.log('warn', message);
        else console.error(message);
    }

    error(error) {
        if (!CONFIG.development)
            this.logger.log('error', error);
        else console.error(message);
    }


}

module.exports = LoggerManager;