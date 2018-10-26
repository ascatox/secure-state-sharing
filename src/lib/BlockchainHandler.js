'use strict';
const config = require('../../resources/config-fabric-network.json');
const nodeLedgerClient = require('node-ledger-client');
const CONFIG = require('../../resources/config.json');
const peerName = config.organizations[0].peers[CONFIG.peer_number].name;
let ledgerClient;

const LoggerManager = require('./LoggerManager');
const loggerManager = new LoggerManager();

const operation = new Map([
    ['POST', 'putEntity'],
    ['PUT', 'updateEntity'],
    ['DELETE', 'deleteEntity'],
    ['GET', 'getEntity'],
]);

class BlockchainHandler {

    constructor() {
        const ledger = async () => {
            ledgerClient = await nodeLedgerClient.LedgerClient.init(config);
        };
        ledger();
    }


    async editEntity(entity, operationType) {
        let result = null;
        try {
            if (entity) {
                let args = [JSON.stringify(entity)];
                result = await ledgerClient.doInvokeWithTxId(operation.get(operationType), args);
            } else
                throw new Error('Entity could not be empty or null');
        } catch (error) {
            loggerManager.error(error);
            throw new Error(error);
        }
        return result;
    }


    async deleteEntity(entity, operationType) {
        let result = null;
        try {
            if (entity) {
                args = [entity.id, entity.type];
                result = await ledgerClient.doInvokeWithTxId(operation.get(operationType), args);
            } else
                throw new Error('Entity could not be empty or null');
        } catch (error) {
            loggerManager.error(error);
            throw new Error(error);
        }
        return result;
    }

    async registerTxEvent(transactionId, onEvent, onError) {
        return ledgerClient.registerTxEvent(peerName, transactionId, onEvent, onError);
    }

    async getEntity(id, type) {
        return await ledgerClient.doInvoke(operation.get('GET'), [id, type]);
    }
}

module.exports = BlockchainHandler;