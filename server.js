'use strict';

const CONFIG = require('./resources/config.json');
const OCB_URL = CONFIG.ocb;

const express = require('express');
const app = express();
const bodyParser = require('body-parser');

const BlockchainHandler = require('./lib/blockchainHandler');
const blockchainHandler = new BlockchainHandler();
const RequestHandler = require('./lib/requestHandler');
const requestHandler = new RequestHandler();
const OrionHandler = require('./lib/orionHandler');
const orionHandler = new OrionHandler();

let timeoutId;
app.use(errorHandler);
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({
    extended: true
})); // for parsing application/x-www-form-urlencoded
//app.use('/', proxy({target: OCB_URL}));




app.all("/*", function (req, res) {
    console.log('redirecting to Orion Context Broker');

    // apiProxy.on('error', function (e) {
    //     clearTimeout(timeoutId);
    //     next(e);
    // });
    try {
        if (req.path.indexOf('v1') >= 0) {
            res.status(400).send("Warning!!! v1 APIs not supported use v2 -> http://telefonicaid.github.io/fiware-orion/api/v2/stable/");
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
        } else if (requestHandler.isOnBehalfOfChain(req)) { //I'm updating attributes
            const run = async () => {
                try {
                    let entity = await orionHandler.getEntity(requestHandler.getId(req), requestHandler.getType(req));
                    if (entity && entity.hasOwnProperty('entity'))
                        entity = entity.entity;
                    //requestHandler.validateEntity(entity);
                    await orionHandler.createMasterContext(entity.id, entity.type);
                    blockchainHandler.updateByBlockchain(entity, requestHandler.isUpdate(req)).then((result) => {
                        if (result)
                            console.log("Update correclty executed with result\n" + JSON.stringify(result));
                    }).catch(error => {
                        console.error('Error encountered : ' + JSON.stringify(error));
                    });
                } catch (error) {
                    console.error(error);
                }
            };
            timeoutId = setTimeout(run, CONFIG.timeout);
            /*res.writeHead(200, {
                'Content-Type': 'text/plain'
            });
            res.write('request successfully proxied to Orion Context Broker -> ' + OCB_URL + '\n' + req.method + ": " + req.path + "\n" +
                JSON.stringify(req.headers, true, 2));
            res.end();
            */
        }
        /*return apiProxy.web(req, res, {
            target: OCB_URL,
            changeOrigin: true,
            toProxy: false,
            prependPath: false
        });*/
        return res.redirect(307, OCB_URL + req.path);
    } catch (error) {
        console.error(error);
        clearTimeout(timeoutId);
        next(error);
    }

});
app.listen(3026);


function errorHandler(err, req, res, next) {
    if (res.headersSent) {
        return next(err)
    }
    res.status(500)
    res.render('error', {
        error: err
    })
}