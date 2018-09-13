const OCB_URL = 'http://localhost:1026'; //TODO Config file

const NGSI = require('ngsijs');
const TYPE = 'Room';

const ENTITY = require('../entity.json');
let ENTITY_MASTER;

const ngsiConnection = new NGSI.Connection(OCB_URL);

async function updateEntityFromChain(entity) {
    try {
        const id = JSON.parse(entity).id;
        console.log("Entity coming from CHAIN is now: \n" + entity);
        const entityUpdObj = JSON.parse(entity);
        await updateEntity(entityUpdObj);
        return await getEntity(id, TYPE);
    } catch (error) {
        console.error(error)
        throw new Error(error);
    }
}


async function getEntity(id, type) {
    return await ngsiConnection.v2.getEntity({
        id: id,
        type: type,
        //service: config.service,
        //servicepath: config.subservice
    });
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
        //buildEntityMaster();
        const entity = await getEntity(ENTITY.id, ENTITY.type);
        if (!entity) { //Create the two contexts
            console.log('Creating Contexts...');
            await createEntity(entity);
            //await createEntity(ENTITY_MASTER);
            //TODO MANUAL Install/Instantiate into HLF
        } else
            console.log('Contexts already present -->\n' + JSON.stringify(entity.entity));
    } catch (error) {
        console.error(error)
        throw new Error(error);
    }
})();


module.exports.updateEntity = updateEntity;
module.exports.getEntity = getEntity;
module.exports.updateEntityFromChain = updateEntityFromChain;
module.exports.createEntity = createEntity;