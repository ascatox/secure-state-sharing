'use strict'
const BlockchainHandler = require('./lib/BlockchainHandler');
const blockchainHandler = new BlockchainHandler();
const OrionHandler = require('./lib/OrionHandler');
const orionHandler = new OrionHandler();

const LoggerManager = require('./lib/LoggerManager');
const loggerManager = new LoggerManager();

class SecureStateSharing {
    constructor() {}

    async executeRequest(id, type, requestType) {
        let entity;
        try {
            entity = await orionHandler.getEntity(id, type);
            if (entity && entity.hasOwnProperty('entity'))
                entity = entity.entity;
            let result = null;
            result = await blockchainHandler.executeOperation(entity, requestType);
            if (result && requestType === 'MIGRATION')
                orionHandler.executeOperation('MIGRATION', result);
            loggerManager.debug('Transaction correctly committed to the chain with result: ' + JSON.stringify(result));
            return result;
        } catch (error) {
            loggerManager.error(error);
            orionHandler.revertLocalChanges(requestType, JSON.parse(error));
            throw new Error(error);
        }
    }


    async onEvent(transactionId) {
        if (transactionId) {
            loggerManager.debug('Transaction ' + transactionId + ' correctly committed to the chain.');
            loggerManager.debug("Modify executed by Blockchain with OCB updated!!!");
        }
    }

    async onError(error) {
        loggerManager.error(('Error received in transaction:  with error: ' + error));
        throw new Error(err);
    }


    getOrionHandler() {
        return orionHandler;
    }

    getBlockchainHandler() {
        return blockchainHandler;
    }
}

module.exports = SecureStateSharing;