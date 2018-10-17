'use strict';

const CONFIG = require('../resources/config.json');
const OCB_URL = CONFIG.ocb;

const express = require('express');
const app = express();
const bodyParser = require('body-parser');

const SecureStateSharing = require('./secureStateSharing');
const secureStateSharing = new SecureStateSharing();

const RequestHandler = require('./lib/requestHandler');
const requestHandler = new RequestHandler();

const LoggerManager = require('./lib/LoggerManager');
const loggerManager = new LoggerManager();

let timeoutId;
app.use(errorHandler);
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({
    extended: true
}));


app.all("/*", function (req, res) {
    console.log('redirecting to Orion Context Broker');
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
            const run = async () => {
                secureStateSharing.executeRequest(id, type, req.method);
            };
            timeoutId = setTimeout(run, CONFIG.timeout);
        }
        return res.redirect(307, OCB_URL + req.path);
    } catch (error) {
        loggerManager.error(error);
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

module.exports = app;