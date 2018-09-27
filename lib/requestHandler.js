'use strict';

const OrionHandler = require('./orionHandler');
const orionHandler = new OrionHandler();
const Ajv = require('ajv');
const ajv = new Ajv();
const ENTITY = require('../resources/entity.json');

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

    mergeWithDataFromRequest(req, entity) {
        const attributes = req.body;
        let props = Object.keys(attributes);
        for (let prop of props) {
            entity[prop] = attributes[prop];
        }
        return entity;
    }

    getId(req) {
        const idParam = req.params[0].split("/")[2];
        if (idParam) return idParam;
        if (req.body.id) return req.body.id;
        throw new Error('Entity id not found');
    }

    getType(req) {
        if (req.query.type) {
            return query.type;
        }
        if (req.body.type) return req.body.type;
        throw new Error('Entity type not found');
    }

    isOnBehalfOfChain(req) {
        try {
            const route = req.route;
            const method = req.method;
            if (method === 'PUT' ||
                method === 'POST' ||
                method === 'DELETE') {
                /*if (ENTITY.id === getId(req))
                    if (req.path.indexOf('attrs') < 0) {
                        return true;
                    }*/
                return true;
            }
            return false;
        } catch (error) {
            console.error(error)
            return false;
        }
    }

    validateEntity(entity) {
        const val = ajv.validate('entity', entity);
        if (!val) {
            console.error(valid.errorsText());
        }
        return val;
    }
}

module.exports = RequestHandler;