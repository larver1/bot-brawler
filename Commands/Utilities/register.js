const fs = require('fs');
const { Users } = require('../../Database/dbObjects');
var badWords = [];
const FileReadWrite = require('../../Helpers/FileReadWrite.js');

async function getBadWords()
{
    var file = new FileReadWrite('./Helpers/badwords.txt');
	badWords = await file.processLineByLine();
}

getBadWords();

function checkValid(nickname) {
    if(nickname.length > 20 || nickname.length == 0) return false;

    for(let i = 0; i < nickname.length; i++) {
        let currentChar = nickname.charCodeAt(i);
        if(currentChar != 32 && (currentChar > 122 || currentChar < 48 || currentChar == 96))
            return false;
    }

    let checkNick = nickname.toLowerCase().replace(/ /g,'');
    checkNick = checkNick.replace(/1/g,'i');
    checkNick = checkNick.replace(/3/g,'e');
    checkNick = checkNick.replace(/0/g,'o');

    for(let i = 0; i < badWords.length; i++) {
        if(checkNick.includes(badWords[i])) 
            return false;   
    }
    
    return true;
}

module.exports = {
    name: "register",
    description: "Choose a username to start your adventure.",
    usage: "`/register username` allows you to create a new user account with the given username.",
    options: [{
        name: "username",
        description: "Enter a username, this cannot be changed!",
        required: true,
        type: "STRING"
    }],
    /**
     * @param {CommandInteraction} CommandInteraction
     * @param {Object} executeObj
     */
    async execute(interaction, utils) {

        let username = interaction.options.getString("username");
        let user = await Users.findOne({ where: { user_id: interaction.user.id }});

        //Prevents user from making more than one account
        if(user)
            return interaction.editReply({ embeds: [ 
                new utils.embed(interaction, user)
                    .setDescription(`You already have an account with username: \`${user.username}\`!`)] })
                        .catch((e) => utils.consola.error(e));

        //If nickname is invalid
        if(!checkValid(username)) 
            return interaction.editReply({ embeds: [ 
                new utils.embed(interaction, user)
                    .setDescription(`Your username is invalid, please use up to 20 A-Z + 0-9 characters, and do not use any inappropriate words!`)] })
                        .catch((e) => utils.consola.error(e));

        //Attempts to register user to DB
		user = await Users.create({ user_id: interaction.user.id,
                                    username: username, 
                                    balance: 0, 
                                    exp: 0,
                                    friends: "|",
                                    privacy: "public", 
                                    energy: 100,
                                    daily: new Date('January 10, 2022 03:24:00'), 
                                    spawn: new Date('January 10, 2022 03:24:00'),
                                    minigame: new Date('January 10, 2022 03:24:00'),
                                    lastCommand: Date.now(),
                                    isBot: false,
                                    currentChallenge: "",
                                    challengesComplete: 0,
                                    achievements: [{}],
                                    tasks: [{}],
                                    paused: false,
                                    tutorial: -1,
                                    joinDate: Date.now(),
                                    playerLevel: 1,
                                    playerExp: 0,
                                    voteStreak: 0,
                                    voteTime: new Date('January 10, 2022 03:24:00'), 
                                    icon: "",
                                    daysMember: 0,
                                    memberType: 1,
                                    extras: [{}]
                                 })
        .catch(() => {
            let err = new Error(`Cannot create a user with name \`${username}\`! It may have already been taken.`);
            utils.handler.info(interaction, err);    
        });

        if(!user) {
            await utils.user.pause(false); 
            return;
        }

        // Create user file
        await fs.writeFile(`UserLogs/${user.username}.txt`, ` `, function (err) {
            if (err) utils.consola.error(err);
        });   	
            
        // Setup achievements template
        if(!await utils.dbAchievements.setupAchievements(interaction)) {
            await utils.user.pause(false); 
            return;
        }

        //Tries to send DM, if failed, then cancel
        if(!await utils.messenger.sendDM(interaction, utils.client, user, `Welcome to Bot Brawler. This game relies on Direct Messages to notify you about requests from other players (such as battling, trading). Please keep your Server DMs on for your server with Bot Brawler in order to play the game. Thanks, and enjoy!`, 
            `https://i.imgur.com/5FceJV4.png`)) {
            let err = new Error(`Bot Brawler requires Server DMs to be turned on in order to play. Please toggle the 'Server DMs' option in this server's Privacy Settings, and try again.`);
            await user.destroy();
            await utils.handler.info(interaction, err);
            return;
        }
        
        //Successful signup message
        return interaction.editReply({ embeds: [
            new utils.embed(interaction, user)
                .setDescription(`You have successfully registered with the name \`${username}\``)] })
                    .catch((e) => utils.consola.error(e));

    }
}