'use strict'
const BlockchainHandler = require('./lib/BlockchainHandler');
const blockchainHandler = new BlockchainHandler();
const OrionHandler = require('./lib/OrionHandler');
const orionHandler = new OrionHandler();

const LoggerManager = require('./lib/LoggerManager');
const loggerManager = new LoggerManager();

let id = null;
let type = null;
let timeoutId = null;
class SecureStateSharing {
    constructor() {}

    async executeRequest(id_, type_, requestType) {
        id = id_;
        type = type_;
        let entity;
        try {
            entity = await orionHandler.getEntity(id, type);
            if (entity && entity.hasOwnProperty('entity'))
                entity = entity.entity;
            let result = null;
            if (requestType !== 'DELETE')
                result = await blockchainHandler.editEntity(entity, requestType);
            else
                result = await blockchainHandler.deletentity(entity, requestType);
            if (result) {
                const txId = result.tx_id.getTransactionID();
                    blockchainHandler.registerTxEvent(txId, this.onEvent, this.onError);
            } 
        } catch (error) {
            loggerManager.error(error);
            orionHandler.revertLocalChanges(requestType, JSON.parse(error));
            throw new Error(error);
        }
    }


    async onEvent(transactionId) {
        if (transactionId) {
            loggerManager.debug('Transaction ' + transactionId + ' correctly committed to the chain.');
            if (timeoutId)
                clearTimeout(timeoutId);
          //  let entityUpd = await blockchainHandler.getEntity(id, type);
            //const result = await orionHandler.updateEntityMasterFromChain(entityUpd);
            loggerManager.debug("Modify executed by Blockchain with OCB updated!!!");
            //+JSON.stringify(entityUpd));
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