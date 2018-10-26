'use strict';
const CONFIG = require('../../resources/config.json');
const OCB_URL = CONFIG.ocb;
const NGSI = require('ngsijs');
const ngsiConnection = new NGSI.Connection(OCB_URL); //TODO se non va Orion killa il processo!!!
const LoggerManager = require('./LoggerManager');
const loggerManager = new LoggerManager();
//const MASTER = '_master';

const operation = new Map([
    ['POST', 'createEntity'],
    ['PUT', 'updateEntity'],
    ['DELETE', 'deleteEntity'],
    ['GET', 'getEntity'],

]);

const reverseOperation = new Map([
    ['POST', 'DELETE'],
    ['PUT', 'PUT'],
    ['DELETE', 'POST']
]);

class OrionHandler {

    constructor() {}

    async revertLocalChanges(operationType, payload) {
        try {
            if (payload)
                await this.executeOperation(reverseOperation.get(operationType), payload);
            else
                loggerManager.error('Error coming from Blockchain could not be empty!');
        } catch (error) {
            loggerManager.error(error);
            throw new Error(error);
        }
    }

    async executeOperation(operationType, payload) {
        let method = this[operation.get(operationType)];
        if (operationType.indexOf('DELETE') >= 0) {
            method.call(this, payload.id, payload.type);
        } else {
            const entity = payload;
            await method.call(this, entity);
        }
    }

    async getEntity(id, type) {
        let entity = null;
        try {
            entity = await ngsiConnection.v2.getEntity({
                id: id,
                type: type,
                service: CONFIG.service,
                servicepath: CONFIG.servicepath
            });
        } catch (error) {
            loggerManager.error('Entity ' + id + ' not found on Orion ' + error);
            entity = null;
        }
        return entity;
    }

    async listEntities() {
        try {
            return ngsiConnection.v2.listEntities({
                service: CONFIG.service,
                servicepath: CONFIG.servicepath
            });
        } catch (error) {
            loggerManager.error(error);
            throw new Error(error);
        }
    }

    async updateEntity(entity) {
        try {
            return await ngsiConnection.v2.appendEntityAttributes(entity, {
                service: CONFIG.service,
                servicepath: CONFIG.servicepath
            });
        } catch (error) {
            loggerManager.error(error);
            throw new Error(error);
        }
    }

    async createEntity(entity) {
        try {
            return await ngsiConnection.v2.createEntity(entity, {
                service: CONFIG.service,
                servicepath: CONFIG.servicepath
            });
        } catch (error) {
            loggerManager.error(error);
            throw new Error(error);
        }
    }

    async deleteEntity(id, type) {
        try {
            await ngsiConnection.v2.deleteEntity({
                id: id,
                type: type,
                service: CONFIG.service,
                servicepath: CONFIG.servicepath
            });
        } catch (error) {
            loggerManager.error(error);
            throw new Error(error);
        }
    }

    /*buildEntityMaster(entity) {
        const entityMASTER = JSON.parse(JSON.stringify(entity.entity));
        entityMASTER.id += MASTER;
        return entityMASTER;
    }

    async createMasterContext(id, type) {
        try {
            loggerManager.debug('Building contexs.....');
            let entity, entityMaster;
            entity = await this.getEntity(id, type);
            if (!entity) return;
            entityMaster = await this.getEntity(id + '_master', type);
            if (!entityMaster)
                entityMaster = await this.createEntity(this.buildEntityMaster(entity));
            loggerManager.debug('Contexts already present -->\n' + JSON.stringify(entity.entity) + '\n' + JSON.stringify(entityMaster.entity));
        } catch (error) {
            loggerManager.error(error)
            throw new Error(error);
        }
    }

    async createContext(entity) {
        try {
            loggerManager.debug('Building contexs.....');
            entity = await this.getEntity(id, type);
            if (entity) return;
            entity = await this.createEntity(entity);
            loggerManager.debug('Entity created correctly');
        } catch (error) {
            loggerManager.error(error)
            throw new Error(error);
        }
    }*/

}
module.exports = OrionHandler;