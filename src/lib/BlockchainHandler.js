'use strict';
const config = require('../../resources/config-fabric-network.json');
const nodeLedgerClient = require('node-ledger-client');
const CONFIG = require('../../resources/config.json');
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
                result = await ledgerClient.doInvoke(operation.get(operationType), args);
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
                result = await ledgerClient.doInvoke(operation.get(operationType), args);
            } else
                throw new Error('Entity could not be empty or null');
        } catch (error) {
            loggerManager.error(error);
            throw new Error(error);
        }
        return result;
    }

    async getEntity(id, type) {
        return await ledgerClient.doInvoke(operation.get('GET'), [id, type]);
    }
}

module.exports = BlockchainHandler;