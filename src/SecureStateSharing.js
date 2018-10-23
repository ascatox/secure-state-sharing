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
        let entity, entityOld = null;
        try {
            entity = await orionHandler.getEntity(id, type);
            if (entity && entity.hasOwnProperty('entity'))
                entity = entity.entity;
            else {
                if (this.isMigration(id, type)) {
                    entity = await blockchainHandler.getEntity(id, type);
                    orionHandler.createContext(entity);
                } else
                    loggerManager.error('Context not present in Orion');
            }
            //Orion has already build the context local, build the Master
            await orionHandler.createMasterContext(id, type);
            // const isUpdate = await this.isUpdate(requestType, entity);
            let result = null;
            if (requestType !== 'DELETE')
                result = await blockchainHandler.updateEntity(entity, requestType);
            else
                result = await blockchainHandler.deletentity(entity, requestType);
            if (result) {
                const txId = result.tx_id.getTransactionID();
                if (requestType !== 'DELETE')
                    blockchainHandler.registerTxEvent(txId, this.onEventUpdate, this.onError);
                else
                    blockchainHandler.registerTxEvent(txId, this.onEventDelete, this.onError);
            }
        } catch (error) {
            loggerManager.error(error);
            orionHandler.revertLocalChanges(entity.id, entity.type);
            throw new Error(error);
        }
    }


    async onEventUpdate(transactionId) {
        if (transactionId) {
            loggerManager.debug('Transaction ' + transactionId + ' correctly committed to the chain.');
            if (timeoutId)
                clearTimeout(timeoutId);
            let entityUpd = await blockchainHandler.getEntity(id, type);
            const result = await orionHandler.updateEntityMasterFromChain(entityUpd);
            loggerManager.debug("Update executed by Blockchain with OCB updated!!!\nFinal entity ->\n" +
                JSON.stringify(result.entity));
        }
    }

    async onEventDelete(transactionId) {
        if (transactionId) {
            loggerManager.debug('Transaction ' + transactionId + ' correctly committed to the chain.');
            if (timeoutId)
                clearTimeout(timeoutId);
            loggerManager.debug("Delete executed by Blockchain with OCB updated!!!");
        }
    }

    async onError(error) {
        loggerManager.error(('Error received in transaction:  with error: ' + error));
        throw new Error(err);
    }

    async isMigration() {
        const result = await blockchainHandler.getEntity(id, type);
        if (result) return true;
        return false;
    }

    getOrionHandler() {
        return orionHandler;
    }

    getBlockchainHandler() {
        return blockchainHandler;
    }
}

module.exports = SecureStateSharing;