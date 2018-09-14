const orionHandler = require('./orionHandler');

const Validator = require('jsonschema').Validator;
const v = new Validator();
const ENTITY = require('../entity.json');

async function updateEntityFromRequest(entityId) {
    try {
        return await orionHandler.getEntity(entityId, orionHandler.TYPE);
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

function getId(req) {
    return req.params[0].split("/")[2];
}

function isOnBehalfOfChain(req) {
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

function validateEntity(entity) {
    return v.validate(entity, JSON.stringify(ENTITY));
}

module.exports.updateEntityFromRequest = updateEntityFromRequest;
module.exports.mergeWithDataFromRequest = mergeWithDataFromRequest;
module.exports.isOnBehalfOfChain = isOnBehalfOfChain;
module.exports.getId = getId;
module.exports.validateEntity = validateEntity;