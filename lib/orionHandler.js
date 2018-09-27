'use strict';
const CONFIG = require('../resources/config.json');
const OCB_URL = CONFIG.ocb;
const NGSI = require('ngsijs');
const ENTITY = require('../resources/entity.json');
let ENTITY_MASTER;

const ngsiConnection = new NGSI.Connection(OCB_URL);

class OrionHandler {

    constructor() {
        const run = async () => {
            await this.createContexts();
        };
        //run();
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
        const entity = await ngsiConnection.v2.getEntity({
            id: id,
            type: type,
            //service: config.service,
            //servicepath: config.subservice
        });
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


    //TODO
    buildEntityMaster(entity) {
        const entityMASTER = JSON.parse(JSON.stringify(entity.entity));
        entityMASTER.id += '_master';
        return entityMASTER;
    }

    async createMasterContext(id, type) {
        try {
            console.log('Building contexs.....');
            //this.buildEntityMaster();
            let entity, entityMaster;
            try {
                entity = await this.getEntity(id, type);
            } catch (error) {
                //console.log('Creating Context...');
                //await this.createEntity(ENTITY);
                console.error('Entity ' + entity.id + 'not found on Orion ' + error)
                throw new Error(error);
            }
            try {
                entityMaster = await this.getEntity(id + '_master', type);
            } catch (error) {
                console.log('Creating Context MASTER...');
                 entityMaster = await this.createEntity(this.buildEntityMaster(entity));
            }
            console.log('Contexts already present -->\n' + JSON.stringify(entity.entity) + '\n' + JSON.stringify(entityMaster.entity));
        } catch (error) {
            console.error(error)
            throw new Error(error);
        }
    }

}


module.exports = OrionHandler;