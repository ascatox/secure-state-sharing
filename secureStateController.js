const BlockchainHandler = require('./lib/blockchainHandler');
const blockchainHandler = new BlockchainHandler();
const RequestHandler = require('./lib/requestHandler');
const requestHandler = new RequestHandler();
const OrionHandler = require('./lib/orionHandler');
const orionHandler = new OrionHandler();

let id = null;
let type = null;
class SecureStateController {
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
                    console.error('Context not present in Orion');
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
            console.error(error);
            if (entityOld)
                orionHandler.updateEntity(entityOld);
            throw new Error(error);
        }
    }


    async onEvent(transactionId) {
        if (transactionId) {
            console.log('Transaction ' + transactionId + ' correctly committed to the chain.');
            let entityUpd = await blockchainHandler.getEntity(id, type);
            const result = await orionHandler.updateEntityMasterFromChain(entityUpd);
            console.log("Update executed by Blockchain with OCB updated!!!\nFinal entity ->\n" +
                JSON.stringify(result.entity));
        }

    }
    async onError(error) {
        console.error(('Error received in transaction:  with error: ' + error));
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
                return true;
            }
        }
    }
}

module.exports = SecureStateController;