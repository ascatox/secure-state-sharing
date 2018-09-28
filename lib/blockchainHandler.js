'use strict';
const OrionHandler = require('./orionHandler');
const orionHandler = new OrionHandler();
const config = require('../resources/config-fabric-network.json');
const nodeLedgerClient = require('node-ledger-client');
const peerName = config.organizations[0].peers[0].name;
let ledgerClient;

class BlockchainHandler {
    constructor() {
        const ledger = async () => {
            ledgerClient = await nodeLedgerClient.LedgerClient.init(config);
        };
        ledger();
    }
    async updateByBlockchain(entity, isUpdate) {
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
                            let entityUpd = await ledgerClient.doInvoke('getEntity', [entity.id, entity.type]); 
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
    }


}

module.exports = BlockchainHandler;