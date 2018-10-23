'use strict';
const config = require('../../resources/config-fabric-network.json');
const nodeLedgerClient = require('node-ledger-client');
const CONFIG = require('../../resources/config.json');
const peerName = config.organizations[0].peers[CONFIG.peer_number].name;
let ledgerClient;

const LoggerManager = require('./LoggerManager');
const loggerManager = new LoggerManager();

const operations = new Map([
    ['POST', 'putEntity'],
    ['PUT', 'updateEntity'],
    ['DELETE', 'deleteEntity']
]);

class BlockchainHandler {

    constructor() {
        const ledger = async () => {
            ledgerClient = await nodeLedgerClient.LedgerClient.init(config);
        };
        ledger();
    }

    async updateEntity(entity, operation) {
        let result = null;
        try {
            if (entity) {
                let args = [JSON.stringify(entity)];
                result = await ledgerClient.doInvokeWithTxId(operations.get(operation), args);
            } else
                throw new Error('Entity could not be empty or null');
        } catch (error) {
            loggerManager.error(error);
            throw new Error(error);
        }
        return result;
    }


    async deleteEntity(entity, operation) {
        let result = null;
        try {
            if (entity) {
                args = [entity.id, entity.type];
                result = await ledgerClient.doInvokeWithTxId(operations.get(operation), args);
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
        return await ledgerClient.doInvoke('getEntity', [id, type]);
    }
}

module.exports = BlockchainHandler;