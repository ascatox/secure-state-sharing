const OCB_URL = 'http://localhost:1026'; //TODO Config file
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const httpProxy = require('http-proxy');
const apiProxy = httpProxy.createProxyServer();
const config = require('./config-fabric-network.json');
const nodeLedgerClient = require('node-ledger-client');
const NGSI = require('ngsijs');
const ENTITY = require('./entity.json');
const TYPE = 'Room';
const KEY_CHAIN = '1';

var ledgerClient;
let ENTITY_HIDE;

//Configuration
const peerName = config.organizations[0].peers[0].name;
const ccid = config.chaincode.name;
const eventId = 'SSS-EVENT';


const ledger = async () => {
    ledgerClient = await nodeLedgerClient.LedgerClient.init(config);
    await chaincodeEventSubscribe(eventId, peerName).then((handle) => {
        console.log('Handler received ' + JSON.stringify(handle));
        handler = handle;
    }, (err) => {
        console.error('Handler received ' + err);
    });
};
ledger();
const ngsiConnection = new NGSI.Connection(OCB_URL);

// app.use(errorHandler);
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({
    extended: true
})); // for parsing application/x-www-form-urlencoded

app.all("/*", function (req, res) {
    console.log('redirecting to Orion Context Broker');
    if (req.path.indexOf('v1') > 0) {
        res.json("Warning!!! v1 APIs not supported use v2 -> http://telefonicaid.github.io/fiware-orion/api/v2/stable/");
        return;
    }
    if (req.path === '/info') {
        res.json({
            "name": "Secure state Sharing",
            "version": "1.0.0",
            "author": "Antonio Scatoloni"
        });
        return;
        //Editing mode of OCB    
    } else if ((req.method === 'PUT' || req.method === 'POST')) { //I'm updating attributes
        updateByBlockchain(req).then((result) => {
            console.log("Update executed by Blockchain!!!")
            res.json(result);
        }).catch((error) => {
            //next(error);
            res.status(500).send(error.message);
        });
    } else
        apiProxy.web(req, res, {
            target: OCB_URL
        });
});
app.listen(3026);


async function updateByBlockchain(req) {
    try {
        let entity = await updateEntityFromRequest(req.params[0].split("/")[2]); //TODO
        entity = mergeWithDataFromRequest(req, entity.entity);
        let rez, entityUpd = null;
        if (entity) {
            rez = await ledgerClient.doInvoke('putData', [KEY_CHAIN, JSON.stringify(entity)]); //TODO
        }
        /*if (rez) {
            // entityUpd = await ledgerClient.doInvoke('getData', [KEY_CHAIN]); //TODO

        }
       if (entityUpd) {
            console.log("Entity coming from CHAIN is now: \n" + entityUpd);
            const entityUpdObj = JSON.parse(entityUpd);
            await updatetEntity(entityUpdObj);
            return await getEntity(entity.id, TYPE);
        }*/
    } catch (error) {
        console.error(error);
        throw new Error(error);
    }
}

function extractAttributesFromEventPayload(eventPayload) {
    var attributes = {};
    attributes = Object.assign({}, eventPayload);
    delete attributes['id'];
    delete attributes['type'];
    return attributes;
}

async function chaincodeEventSubscribe(eventId, peerName) {
    return ledgerClient.registerChaincodeEvent(ccid, peerName, eventId, (event) => {
        console.log('Event arrived with name: ' + (event.event_name) +
            ' and with payload ' + (Buffer.from(event.payload)));
        const payload = JSON.parse(event.payload.toString());
        const run = async () => {
            const attributes = extractAttributesFromEventPayload(payload);
            try {
                try {
                    const getEntityResponse = await getEntity(payload.id, payload.type);
                } catch (err) {
                    // if (err.message === 'Unexpected error code: 404') { //NOT FOUND
                    //     const createEntityResponse = await createEntity(payload.id, payload.type);
                    // } else
                    console.error("Element with id " + payload.id + " with" + " code error: " + err);
                }
                const updateEntityResponse = await updateEntity(payload.id, payload.type, attributes);
            } catch (err) {
                console.error("Element with id " + payload.id + "with " + " code error: " + err);
            }
        };
        run();
    }, (err) => {
        console.error(('Errore ricevuto nell evento ' + err));
        setTimeout(() => {
            chaincodeEventSubscribe(eventId, peerName).then((handler) => {
                console.log('Handler received ' + (JSON.stringify(handler)));
            }, (err) => {
                console.error('Handler received ' + err);
            });
        }, 1000);
    });
}


async function updateEntityFromRequest(entityId) {
    try {
        return await getEntity(entityId, TYPE);
    } catch (error) {
        console.error(error);
        throw new Error(error);
    }
}

function mergeWithDataFromRequest(req, entity) {
    const attributes = req.body;
    let props = Object.keys(attributes);
    for (let prop of props) {
        entity[prop] = attributes[prop];
    }
    return entity;
}

async function getEntity(id, type) {
    return await ngsiConnection.v2.getEntity({
        id: id,
        type: type,
        //service: config.service,
        //servicepath: config.subservice
    });
}

async function updatetEntity(entity) {
    //service: config.service,
    //servicepath: config.subservice
    try {
        return await ngsiConnection.v2.appendEntityAttributes(entity);
    } catch (error) {
        console.error(error);
        throw new Error(error);
    }
}

async function createEntity(entity) {
    try {
        return await ngsiConnection.v2.createEntity(entity);
    } catch (error) {
        console.error(error);
        throw new Error(error);
    }
}

function errorHandler(err, req, res, next) {
    if (res.headersSent) {
        return next(err)
    }
    res.status(500)
    res.render('error', {
        error: err
    })
}

function buildEntityHide() {
    ENTITY_HIDE = JSON.parse(JSON.stringify(ENTITY));
    ENTITY_HIDE.id += '_hide';
}

(async function createContexts() {
    try {
        console.log('Building contexs.....');
        //buildEntityHide();
        const entity = await getEntity(ENTITY.id, ENTITY.type);
        if (!entity) { //Create the two contexts
            console.log('Creating Contexts...');
            await createEntity(entity);
            await createEntity(ENTITY_HIDE);
            //TODO Install/Instantiate into HLF
        } else
            console.log('Contexts already present --> ' + JSON.stringify(entity.entity));
    } catch (error) {
        console.error(error)
        throw new Error(error);
    }
})();