const BlockchainHandler = require('./lib/BlockchainHandler');
const blockchainHandler = new BlockchainHandler();
const OrionHandler = require('./lib/OrionHandler');
const orionHandler = new OrionHandler();

const LoggerManager = require('./lib/LoggerManager');
const loggerManager = new LoggerManager();

let id = null;
let type = null;
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
            entityOld = JSON.parse(JSON.stringify(entity));
            //Orion has already build the context local, build the Master
            await orionHandler.createMasterContext(id, type);
            const isUpdate = await this.isUpdate(requestType, entity);
            const result = await blockchainHandler.editEntity(entity, isUpdate);
            if (result) {
                const txId = result.tx_id.getTransactionID();
                blockchainHandler.registerTxEvent(txId, this.onEvent, this.onError);
            }
        } catch (error) {
            loggerManager.error(error);
            if (entityOld)
                orionHandler.updateEntity(entityOld);
            throw new Error(error);
        }
    }


    async onEvent(transactionId) {
        if (transactionId) {
            loggerManager.debug('Transaction ' + transactionId + ' correctly committed to the chain.');
            let entityUpd = await blockchainHandler.getEntity(id, type);
            const result = await orionHandler.updateEntityMasterFromChain(entityUpd);
            loggerManager.debug("Update executed by Blockchain with OCB updated!!!\nFinal entity ->\n" +
                JSON.stringify(result.entity));
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

    async isUpdate(requestType, entity) {
        const isUpdate = requestType === 'PUT';
        const result = await blockchainHandler.getEntity(entity.id, entity.type);
        if (!isUpdate) { //create
            if (result)
                throw new Error('Could not create entity already present in Blockchain');
            return false;
        } else { //Update
            if (!result) {
                throw new Error('Could not update entity not present in Blockchain');
            }
        }
    }
}

module.exports = SecureStateSharing;