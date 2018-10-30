'use strict';

const CONFIG = require('../resources/config.json');
const OCB_URL = CONFIG.ocb;

const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const proxy = require('express-http-proxy');

const SecureStateSharing = require('./secureStateSharing');
const secureStateSharing = new SecureStateSharing();

const RequestHandler = require('./lib/requestHandler');
const requestHandler = new RequestHandler();

const LoggerManager = require('./lib/LoggerManager');
const loggerManager = new LoggerManager();

let timeoutId;

//app.use(errorHandler);
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({
    extended: true
}));


async function serve(proxyResData, req, res) {
    {
        loggerManager.info('redirecting to Orion Context Broker');
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
                const id = requestHandler.getId(req);
                const type = requestHandler.getType(req);
                await secureStateSharing.executeRequest(id, type, req.method);
                return requestHandler.createProxyResData(proxyResData, 'Operation now in Blockchain');

            } else {
                return proxyResData;
            }
        } catch (error) {
            loggerManager.error(JSON.stringify(error));
            res.status(500);
            return requestHandler.createProxyResData(proxyResData, error.message);
        }

    }
}
app.use('/', proxy(OCB_URL, {
    proxyReqOptDecorator: function (proxyReqOpts, srcReq) {
        // you can update headers
        //proxyReqOpts.headers['Content-Type'] = 'text/html';
        // you can change the method
        //proxyReqOpts.method = 'GET';
        return proxyReqOpts;
    },
    userResDecorator: function (proxyRes, proxyResData, userReq, userRes) {
        if (proxyResData.length > 0) {
            const data = JSON.parse(proxyResData.toString('utf8'));
            if (data.hasOwnProperty('error'))
                return proxyResData;
        }
        return serve(proxyResData, userReq, userRes);
    }
    /* ,proxyErrorHandler: function (err, res, next) {
         errorHandler(err, res);
     }*/
}));
//app.all("/*", function (req, res));
app.listen(3026);

function errorHandler(err, res, next) {
    if (res.headersSent) {
        return next(err)
    }
    res.status(500);
    res.json(err.message);
}

module.exports = app;