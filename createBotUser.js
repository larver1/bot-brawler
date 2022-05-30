const { Users } = require('./Database/dbObjects');
const BotBuilder = require('./Helpers/BotBuilder');
const { v4: uuidv4 } = require('uuid');

let args = process.argv.slice(2);
let givenUsername = args[0];

async function createUser(username){
    
    console.log(Users);
    let user = await Users.create({ 
        user_id: uuidv4(),
        username: username,
        balance: 0,
        exp: 0,
        friends: "|",
        privacy: "public", 
        energy: 100,
        balance: 0, 
        daily: new Date('January 10, 2022 03:24:00'), 
        spawn: new Date('January 10, 2022 03:24:00'),
        lastCommand: Date.now(),
        isBot: true,
        currentChallenge: "",
        challengesComplete: 0,
    });

    let maxExp = Math.ceil(Math.random() * 100);

    // Build 10 random bots of different EXP
    for(let i = 0; i < 100; i++) {
        let bot = await BotBuilder.build(null, { item: "balanced", exp: Math.ceil(Math.random() * maxExp) }, user);
        await user.createBot(bot);
    }

    console.log(`Successfully created a new user with name ${username}!`);

}

async function createManyUsers(numUsers) {
    for(let i = 0; i < numUsers; i++) {
        await createUser(`${givenUsername}-${i}`);
    }
}

createManyUsers(100);
async function createOneUser(username) {
    await createUser(username);
}

//createOneUser(`Professor Diriski`);
