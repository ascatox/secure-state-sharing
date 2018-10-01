'use strict';
const config = require('../resources/config-fabric-network.json');
const nodeLedgerClient = require('node-ledger-client');
const CONFIG = require('../resources/config.json');
const peerName = config.organizations[0].peers[CONFIG.peer_number].name;
let ledgerClient;

class BlockchainHandler {
    constructor() {
        const ledger = async () => {
            ledgerClient = await nodeLedgerClient.LedgerClient.init(config);
        };
        ledger();
    }
    async editEntity(entity, isUpdate) {
        let result = null;
        try {
            if (entity) {
                if (!isUpdate) //Create
                    result = await ledgerClient.doInvokeWithTxId('putEntity', [JSON.stringify(entity)]);
                else //Update
                    result = await ledgerClient.doInvokeWithTxId('updateEntity', [JSON.stringify(entity)]);
            } else
                throw new Error('Entity could not be empty or null');
        } catch (error) {
            console.error(error);
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