const { Users } = require('./Database/dbObjects');
const dbAccess = require('./Database/dbAccess');
const BotBuilder = require('./Helpers/BotBuilder');
const { promisify } = require('util');
const sleep = promisify(setTimeout);
const { v4: uuidv4 } = require('uuid');

let args = process.argv.slice(2);
let givenID = args[0];

async function giveBot(ID, maxExp) {
    
    const user = await dbAccess.findUser(null, ID);
    if(!user)
        return;

    for(let i = 0; i < 100; i++) {
        let bot = await BotBuilder.build(null, { bot_type: "Bostrom", goldPlated: true, item: "balanced", exp: maxExp }, user);
        await user.createBot(bot);
    }

    console.log(`Successfully given a bot to ${user.username}!`);

}

giveBot(givenID, 0);