const OCB_URL = 'http://localhost:1026'; //TODO Config file

const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const httpProxy = require('http-proxy'); //https://github.com/nodejitsu/node-http-proxy
const apiProxy = httpProxy.createProxyServer();

//const proxy = require('http-proxy-middleware');
const blockchainHandler = require('./lib/blockchainHandler');
const requestHandler = require('./lib/requestHandler');
const orionHandler = require('./lib/orionHandler');
// app.use(errorHandler);
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({
    extended: true
})); // for parsing application/x-www-form-urlencoded
//app.use('/', proxy({target: OCB_URL}));

app.all("/*", function (req, res) {
    console.log('redirecting to Orion Context Broker');
    if (req.path.indexOf('v1') > 0) {
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
                // let entity = await requestHandler.updateEntityFromRequest(requestHandler.getId(req)); //TODO
                // entity = requestHandler.mergeWithDataFromRequest(req, entity.entity);
                let entity = await orionHandler.getEntity(requestHandler.getId(req), orionHandler.TYPE);
                if (entity && entity.hasOwnProperty('entity'))
                    entity = entity.entity;
                blockchainHandler.updateByBlockchain(entity).then((result) => {
                    if (result)
                        console.log("Update correclty executed with result\n" + JSON.stringify(result));
                }).catch((error) => {
                    console.log('Error encountered : ' + error.message);
                });
            } catch (error) {
                console.error(error);
            }
        };
        setTimeout(run, 5000);
        //res.status(202).send('Update in execution by Blockchain...');
        res.writeHead(200, {
            'Content-Type': 'text/plain'
        });
        res.write('request successfully proxied to Orion Context Broker ' + OCB_URL + '\n' + JSON.stringify(req.headers, true, 2));
        res.end();
    }
    //else
    apiProxy.web(req, res, {
        target: OCB_URL,
        changeOrigin: true,
        toProxy: false,
        prependPath: false
    });

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