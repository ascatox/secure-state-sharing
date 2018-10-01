'use strict';
const CONFIG = require('../resources/config.json');
const OCB_URL = CONFIG.ocb;
const NGSI = require('ngsijs');
const ngsiConnection = new NGSI.Connection(OCB_URL);

class OrionHandler {

    constructor() {
        const run = async () => {
            await this.createContexts();
        };
    }

    async updateEntityMasterFromChain(entity) {
        try {
            const id = JSON.parse(entity).id + '_master';
            const type = JSON.parse(entity).type;
            console.log("Entity coming from CHAIN is now: \n" + entity);
            const entityUpdObj = JSON.parse(entity);
            entityUpdObj.id += '_master';
            await this.updateEntity(entityUpdObj);
            return await this.getEntity(id, type);
        } catch (error) {
            console.error(error)
            throw new Error(error);
        }
    }


    async getEntity(id, type) {
        let entity = null;
        try {
            entity = await ngsiConnection.v2.getEntity({
                id: id,
                type: type,
                //service: config.service,
                //servicepath: config.subservice
            });
        } catch (error) {
            console.error('Entity ' + id + 'not found on Orion ' + error);
            entity = null;
        }
        return entity;
    }

    async updateEntity(entity) {
        //service: config.service,
        //servicepath: config.subservice
        try {
            return await ngsiConnection.v2.appendEntityAttributes(entity);
        } catch (error) {
            console.error(error);
            throw new Error(error);
        }
    }

    async createEntity(entity) {
        try {
            return await ngsiConnection.v2.createEntity(entity);
        } catch (error) {
            console.error(error);
            throw new Error(error);
        }
    }

    buildEntityMaster(entity) {
        const entityMASTER = JSON.parse(JSON.stringify(entity.entity));
        entityMASTER.id += '_master';
        return entityMASTER;
    }

    async createMasterContext(id, type) {
        try {
            console.log('Building contexs.....');
            let entity, entityMaster;
            entity = await this.getEntity(id, type);
            if (!entity) return;
            entityMaster = await this.getEntity(id + '_master', type);
            if (!entityMaster)
                entityMaster = await this.createEntity(this.buildEntityMaster(entity));
            console.log('Contexts already present -->\n' + JSON.stringify(entity.entity) + '\n' + JSON.stringify(entityMaster.entity));
        } catch (error) {
            console.error(error)
            throw new Error(error);
        }
    }

    async createContext(entity) {
        try {
            console.log('Building contexs.....');
            entity = await this.getEntity(id, type);
            if (entity) return;
            entity = await this.createEntity(entity);
            console.log('Entity created correctly');
        } catch (error) {
            console.error(error)
            throw new Error(error);
        }
    }

}
module.exports = OrionHandler;