'use strict';
const CONFIG = require('../../resources/config.json');
const OCB_URL = CONFIG.ocb;
const NGSI = require('ngsijs');
const ngsiConnection = new NGSI.Connection(OCB_URL);

const LoggerManager = require('./LoggerManager');
const loggerManager = new LoggerManager();


const MASTER = '_master';
class OrionHandler {

    constructor() {
        const run = async () => {
            await this.createContexts();
        };
    }

    async updateEntityMasterFromChain(entity) {
        try {
            const id = JSON.parse(entity).id + MASTER;
            const type = JSON.parse(entity).type;
            loggerManager.debug("Entity coming from CHAIN is now: \n" + entity);
            const entityUpdObj = JSON.parse(entity);
            entityUpdObj.id += '_master';
            await this.updateEntity(entityUpdObj);
            return await this.getEntity(id, type);
        } catch (error) {
            loggerManager.error(error)
            throw new Error(error);
        }
    }

    async revertLocalChanges(id_, type_) {
        if (id_ || type_) {
            const id = id_ + MASTER;
            const master = await this.getEntity(id, type_);
            master.id = id_;
            await this.updateEntity(master);
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
        //service: config.service,
        //servicepath: config.subservice
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

    buildEntityMaster(entity) {
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
    }

}
module.exports = OrionHandler;