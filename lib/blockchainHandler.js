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
    /*async updateByBlockchain(entity, isUpdate) {
        try {
            let rez = null;
            if (entity) {
                if (!isUpdate) //Create
                    rez = await ledgerClient.doInvokeWithTxId('putEntity', [JSON.stringify(entity)]);
                else //Update
                    rez = await ledgerClient.doInvokeWithTxId('updateEntity', [JSON.stringify(entity)]);
            }
            if (rez) {
                const txId = rez.tx_id.getTransactionID();
                ledgerClient.registerTxEvent(peerName, txId, (transactionId) => {
                    if (transactionId) {
                        console.log('Transaction ' + transactionId + ' correctly committed to the chain.');
                        const run = async () => {
                            let entityUpd = this.getByBlockchain(entity.id, entity.type);
                            const result = await orionHandler.updateEntityMasterFromChain(entityUpd);
                            console.log("Update executed by Blockchain with OCB updated!!!\nFinal entity ->\n" +
                                JSON.stringify(result.entity));
                        };
                        run();
                    }
                }, (err) => {
                    console.error(('Error received in transaction: ' + txId + ' with error: ' + err));
                    //Revert local changes
                    orionHandler.updateEntity(entity);
                    throw new Error(err);
                });
            }
        } catch (error) {
            console.error(error);
            throw new Error(error);
        }
    }*/

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