const { Users } = require('./Database/dbObjects');
const BotBuilder = require('./Helpers/BotBuilder');
const { promisify } = require('util');
const sleep = promisify(setTimeout);
const { v4: uuidv4 } = require('uuid');

let args = process.argv.slice(2);
let givenUsername = args[0];

async function createUser(username, maxExp) {
    
    let user = await Users.create({ 
        user_id: uuidv4(),
        username: username,
        balance: 0,
        exp: 0,
        friends: "|",
        privacy: "public", 
        energy: 100,
        daily: new Date('January 10, 2022 03:24:00'), 
        spawn: new Date('January 10, 2022 03:24:00'),
        lastCommand: Date.now(),
        isBot: true,
        currentChallenge: "",
        challengesComplete: 0,
        minigame: new Date('January 10, 2022 03:24:00'),
        achievements: [{}],
        tasks: [{}],
        paused: false,
        tutorial: 0,
        joinDate: Date.now(),
        playerLevel: 1,
        playerExp: 0,
        voteStreak: 0,
        voteTime: Date.now(),
        icon: "",
        daysMember: 0,
        memberType: 1,
        extras: [{}]
    });

    // Build 100 random bots of different EXP
    let exp = 1;

    for(let i = 0; i < 100; i++) {
        let bot = await BotBuilder.build(null, { item: "balanced", exp: exp }, user);
        await user.createBot(bot);
        exp *= 2; 
        if(exp >= maxExp)
            exp = 1;
    }

    console.log(`Successfully created a new user with name ${username}!`);

}

async function createManyUsers(numUsers) {
    for(let i = 0; i < numUsers; i++) {
        await createUser(`olibot-${i}`, 10000);
    }
}

//createManyUsers(100);
async function createOneUser(username, maxExp) {
    await createUser(username, maxExp);
}

createOneUser(`Professor Diriski`, 100);
createOneUser(`Clunk`, 10);
createManyUsers(100);
//createManyUsers(100);