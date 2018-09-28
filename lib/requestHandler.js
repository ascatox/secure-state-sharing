'use strict';
const CONFIG = require('../resources/config.json');
const OrionHandler = require('./orionHandler');
const orionHandler = new OrionHandler();

class RequestHandler {

    constructor() {}
    async updateEntityFromRequest(entityId) {
        try {
            return await orionHandler.getEntity(entityId, orionHandler.TYPE);
        } catch (error) {
            console.error(error);
            throw new Error(error);
        }
    }

    /*mergeWithDataFromRequest(req, entity) {
        let attributes = req.body;
        if (req.path.indexOf(CONFIG.attrs_keyword) >= 0) {
            attributes = req.params[1].split("/")[2];
        }
        let props = Object.keys(attributes);
        for (let prop of props) {
            entity[prop] = attributes[prop];
        }
        return entity;
    }
    */
    getId(req) {
        const idParam = req.params[0].split("/")[2];
        if (idParam) return idParam;
        if (req.body.id) return req.body.id;
        throw new Error('Entity id not found');
    }

    getType(req) {
        if (req.query.type) {
            return req.query.type;
        }
        if (req.body.type) return req.body.type;
        throw new Error('Entity type not found');
    }

    isUpdate(req) {
        return req.method === 'PUT';
    }
    isDelete(req) {
        return req.method === 'DELETE';
    }
    isOnBehalfOfChain(req) {
        try {
            const route = req.route;
            const method = req.method;
            const pathExclude = CONFIG.path_exclude.split(',');

            if (method === 'PUT' ||
                method === 'POST' 
                //|| method === 'DELETE' //TODO Delete Context
                ) {
                for (let exclusion of pathExclude) {
                    if (req.path.indexOf(exclusion.trim()) >= 0) {
                        return false;
                    }
                }
                return true;
            }
            return false;
        } catch (error) {
            console.error(error)
            return false;
        }
    }
}

module.exports = RequestHandler;