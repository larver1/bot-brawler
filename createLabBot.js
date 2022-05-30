const { Bots } = require('./Database/dbObjects');
const BotBuilder = require('./Helpers/BotBuilder');
const { v4: uuidv4 } = require('uuid');
const { Utils } = require('discord-api-types');

let args = process.argv.slice(2);
let givenUsername = args[0];

async function createBot(username){
    
    let exp = Math.random() * 100;
    let bot = await BotBuilder.build(null, { item: "balanced", exp: exp }, utils.user);
 

    console.log(`Successfully created a new user with name ${username}!`);

}

createManyUsers(100);

