const CONFIG = require('../resources/config.json');
const OCB_URL = CONFIG.ocb;
const NGSI = require('ngsijs');

const ENTITY = require('../resources/entity.json');
const TYPE = ENTITY.type;
let ENTITY_MASTER;

const ngsiConnection = new NGSI.Connection(OCB_URL);

async function updateEntityMasterFromChain(entity) {
    try {
        const id = JSON.parse(entity).id + '_master';
        console.log("Entity coming from CHAIN is now: \n" + entity);
        const entityUpdObj = JSON.parse(entity);
        entityUpdObj.id += '_master';
        await updateEntity(entityUpdObj);
        return await getEntity(id, TYPE);
    } catch (error) {
        console.error(error)
        throw new Error(error);
    }
}


async function getEntity(id, type) {
    const entity = await ngsiConnection.v2.getEntity({
        id: id,
        type: type,
        //service: config.service,
        //servicepath: config.subservice
    });
    return entity;
}

async function updateEntity(entity) {
    //service: config.service,
    //servicepath: config.subservice
    try {
        return await ngsiConnection.v2.appendEntityAttributes(entity);
    } catch (error) {
        console.error(error);
        throw new Error(error);
    }
}

async function createEntity(entity) {
    try {
        return await ngsiConnection.v2.createEntity(entity);
    } catch (error) {
        console.error(error);
        throw new Error(error);
    }
}


//TODO
function buildEntityMaster() {
    ENTITY_MASTER = JSON.parse(JSON.stringify(ENTITY));
    ENTITY_MASTER.id += '_master';
}

(async function createContexts() {
    try {
        console.log('Building contexs.....');
        buildEntityMaster();
        let entity, entityMaster;
        try {
            entity = await getEntity(ENTITY.id, ENTITY.type);
        } catch (error) {
            console.log('Creating Context...');
            await createEntity(ENTITY);
        }
        try {
            entityMaster = await getEntity(ENTITY_MASTER.id, ENTITY_MASTER.type);
        } catch (error) {
            console.log('Creating Context MASTER...');
            await createEntity(ENTITY_MASTER);
        }
        console.log('Contexts already present -->\n' + JSON.stringify(entity.entity) + '\n' + JSON.stringify(entityMaster.entity));
    } catch (error) {
        console.error(error)
        throw new Error(error);
    }
})();



module.exports.updateEntity = updateEntity;
module.exports.getEntity = getEntity;
module.exports.updateEntityMasterFromChain = updateEntityMasterFromChain;
module.exports.createEntity = createEntity;