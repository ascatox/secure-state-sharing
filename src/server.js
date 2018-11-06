'use strict';

const CONFIG = require('../resources/config.json');
const OCB_URL = CONFIG.ocb;

const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const proxy = require('express-http-proxy'); //https://www.npmjs.com/package/express-http-proxy

const SecureStateSharing = require('./secureStateSharing');
const secureStateSharing = new SecureStateSharing();

const RequestHandler = require('./lib/requestHandler');
const requestHandler = new RequestHandler();

const LoggerManager = require('./lib/LoggerManager');
const loggerManager = new LoggerManager();

app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({
    extended: true
}));

(async function launchCompanion() {
        try {
            const {
                spawn
            } = require('child_process');

            const child = spawn('node', ['./companion/src/companion.js'], {
                detached : true,
                stdio: [process.stdin, process.stdout, process.stderr]
            }); 
        //child.unref();
        loggerManager.info('Companion started correctly!');
    } catch (error) {
        loggerManager.error(error)
        process.exit(0);
    }
})();
async function serveResponse(proxyResData, req, res) {
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
                let method = req.method;
                const result = await secureStateSharing.executeRequest(id, type, method);
                res.status(200);
                return requestHandler.createProxyResData(proxyResData, result);
            } else {
                return proxyResData;
            }
        } catch (error) {
            loggerManager.error(error);
            res.status(500);
            return requestHandler.createProxyResData(proxyResData, error.message);
        }

    }
}

async function processReq(req) {
    try {
        let method = 'MIGRATION';
        const id = null;
        const type = null;
        const result = await secureStateSharing.executeRequest(id, type, method);
        loggerManager.info('Migration finished correctly')
    } catch (error) {
        loggerManager.error(error);
    }
}

app.use('/', proxy(OCB_URL, {
    proxyReqOptDecorator: function (proxyReqOpts, srcReq) {
        //proxyReqOpts.headers['Content-Type'] = 'text/html';
        //proxyReqOpts.method = 'GET';
        const isMigration = requestHandler.isMigration(proxyReqOpts);
        if (isMigration) {
            processReq(proxyReqOpts);
        }
        return proxyReqOpts;
    },
    userResDecorator: function (proxyRes, proxyResData, userReq, userRes) {
        if (requestHandler.isMigration(userReq)) {
            userRes.status(200);
            return requestHandler.createProxyResDataMigration(proxyResData, 'Migration running...');
        }
        if (proxyResData.length > 0) {
            const data = JSON.parse(proxyResData.toString('utf8'));
            if (data.hasOwnProperty('error'))
                return proxyResData;
        }
        return serveResponse(proxyResData, userReq, userRes);
    }
    /* ,proxyErrorHandler: function (err, res, next) {
         errorHandler(err, res);
     }*/
}));
//app.all("/*", function (req, res));
app.listen(CONFIG.port);

function errorHandler(err, res, next) {
    if (res.headersSent) {
        return next(err)
    }
    res.status(500);
    res.json(err.message);
}

module.exports = app;