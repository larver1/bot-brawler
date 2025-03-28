const BattleView = require("../../Helpers/BattleView");
const BotCollection = require("../../Helpers/BotCollection");
const { promisify } = require('util');
const sleep = promisify(setTimeout);

const wagers = {
    friendly: "nothing is at stake, the loser will not give the winner anything",
    damage: "the loser bot will lose EXP and give it to the winner bot",
    destroy: "the loser bot will be destroyed and the winner will gain lots of EXP",
    collect: "the loser bot will be given to the owner of the winner bot"
}

// Battle logic
async function battle(interaction, utils, yourBot, otherBot, wager, otherUser){
    
    // Perform battle
    let results = await yourBot.battle(otherBot);
    let msg = ``;
    
    let loserBot, winnerBot, loserUser, winnerUser, exp;

    //New battle scene
    let scene = await new BattleView(interaction, yourBot, otherBot, results);
    
    //Show left bot
    if(otherBot.ability == "Factory Reset")
        msg = `${yourBot.name} is forced to use a Balanced Strategy due to ${otherBot.name}'s ability!`;
    else
        msg = `${yourBot.name} ${yourBot.getBattleText()}${otherBot.ability == "Factory Reset" ? '' : ''}\n`;
    await scene.createCards(true, false, true);
    await interaction.editReply({ content: msg, files: [scene.getScene()], embeds: [], components: [] })
        .catch((e) => utils.consola.error(e));
    await sleep(5000);

    //Show right bot
    if(yourBot.ability == "Factory Reset")
        msg = `${otherBot.name} is forced to use a Balanced Strategy due to ${yourBot.name}'s ability!`;
    else
        msg = `${otherBot.name} ${otherBot.getBattleText()}\n`;

    await scene.createCards(true, true, false);
    await interaction.editReply({ content: msg, files: [scene.getScene()] })
            .catch((e) => utils.consola.error(e));
    await sleep(5000);

    //Show left side advantage
    await scene.createCards(true, false, false);
    await interaction.editReply({ content: results.yourMsg, files: [scene.getScene()] })
        .catch((e) => utils.consola.error(e));
    await sleep(5000);

    //Show right side advantage
    await interaction.editReply({ content: results.opponentMsg })
        .catch((e) => utils.consola.error(e));
    await sleep(5000);

    //Show chart
    msg = `Battle commence...\n`;
    await scene.createCards(false, false, false);
    await interaction.editReply({ content: msg, files: [scene.getScene()] })
        .catch((e) => utils.consola.error(e));
    await sleep(10000);

    // You won
    if(results.winner <= results.yourPercent || otherUser.username == "Clunk"){
        winnerBot = yourBot;
        winnerUser = utils.user;
        loserBot = otherBot;
        loserUser = otherUser;
        if(results.otherPercent >= 74.5) {
            await utils.dbAchievements.checkTask(interaction, winnerUser.username, "Underdog");
            await utils.dbAchievements.checkTask(interaction, loserUser.username, "Never Lucky");
        }
    } else {
        // They won
        winnerBot = otherBot;
        winnerUser = otherUser;
        loserBot = yourBot;
        loserUser = utils.user;
        if(results.yourPercent >= 74.5) {
            await utils.dbAchievements.checkTask(interaction, winnerUser.username, "Underdog");
            await utils.dbAchievements.checkTask(interaction, loserUser.username, "Never Lucky");
        }
    }

    msg = `${winnerBot.name} is the winner!`;

    results.scene = scene.getScene();
    results.winnerBot = winnerBot;
    results.loserBot = loserBot;
    results.winnerUser = winnerUser;
    results.loserUser = loserUser;

    //Update global stats
    if(!await utils.dbBotStats.addWin(interaction, winnerBot.bot_type))
        return;
    if(!await utils.dbBotStats.addLoss(interaction, loserBot.bot_type))
        return;

    winnerBot.battling = true;
    const winnerCard = await new utils.card(interaction, winnerBot);

    if(!await winnerCard.createCard())
        return;

    switch(wager) {
        case "destroy":
            //Loser bot is destroyed and is no longer usable
            exp = Math.ceil(loserBot.exp / 2);
            if(winnerBot.ability == "Greedy AI") {
                exp = Math.ceil(exp * 1.5);
            }

            if(!await utils.dbBots.addExp(interaction, winnerBot.botObj.bot_id, exp + 1))
                return;
                
            if(loserBot.ability == "Backup Drive" && Math.random() > 0.5) {
                msg += `\nDestruction was prevented due to ${loserBot.name}'s ability!`
                break;
            }

            // Add achievement
            await utils.dbAchievements.editAchievement(interaction, winnerUser.username, "Destroyer", 1);
            await utils.dbAchievements.checkTask(interaction, winnerUser.username, "Terminator");

            msg += `\nLoser bot gets destroyed by winner for EXP.`;
            if(winnerBot.ability == "Greedy AI")
                msg += `\n${winnerBot.name} gets extra EXP due to their ability.`;

            if(winnerBot.ability == "Bounty Hunter" && winnerBot.powerBoost < 45) {
                msg += `\n${winnerBot.name} gained +5 Base Power due to their ability.`;
                if(!await utils.dbBots.addBoost(interaction, winnerBot.botObj.bot_id, "power", 5))
                    return;
            }

            if(winnerBot.ability == "Maximum Satisfiability" && winnerBot.totalBoost < 60) {
                let options = ["firewall", "lifespan"];
                let option = options[Math.floor(Math.random() * options.length)];
                msg += `\n${winnerBot.name} gained +5 Base ${option} due to their ability.`;
                if(!await utils.dbBots.addBoost(interaction, winnerBot.botObj.bot_id, option, 5))
                    return;
            }

            if(winnerBot.ability == "Fetch Request" && winnerBot.totalBoost < 60) {
                let options = ["power", "lifespan", "viral", "firewall"];
                let option = Math.floor(Math.random() * options.length);
                if(winnerBot.item && winnerBot.item != "balanced")
                    option = winnerBot.item;
                else
                    option = options[option];
                msg += `\n${winnerBot.name} gained ${option} due to their ability.`;
                if(!await utils.dbBots.addBoost(interaction, winnerBot.botObj.bot_id, option, 5)) {
                    await utils.user.pause(false);
                    return;
                } 
            }

            if(loserUser.usuername != "Clunk") {
                if(!await utils.dbBots.destroy(interaction, loserBot.botObj.bot_id))
                return;
            if(!await utils.dbBotStats.removeAlive(interaction, loserBot.bot_type))
                return;
            }

            break;
        case "collect":
            //The loser bot owner changes to winner username
            msg += `\nLoser bot gets collected by winner.`;
            if(!await utils.dbBots.changeOwner(interaction, loserBot.botObj.bot_id, winnerUser.username))
                return;

            // Add achievement
            await utils.dbAchievements.editAchievement(interaction, winnerUser.username, "Hoarder", 1);
            await utils.dbAchievements.checkTask(interaction, winnerUser.username, "Pirate");

            break;
        case "damage":
            //Pass EXP over to winner
            msg += "\nLoser bot gives winner bot some EXP.";
            exp = Math.floor(loserBot.exp / 5);

            if(winnerBot.ability == "Greedy AI") {
                exp = Math.floor(exp * 1.5);
                msg += `\n${winnerBot.name} gets extra EXP due to their ability.`;
            }

            if(exp == 0) 
                msg += "\nLoser didn't have enough EXP left to give, so was destroyed for scrap metal...";

            if(!await utils.dbBots.removeExp(interaction, loserBot.botObj.bot_id, exp)) {
                await utils.user.pause(false);
                return;
            } 

            exp += 1;

            if(!await utils.dbBots.addExp(interaction, winnerBot.botObj.bot_id, exp)) {
                await utils.user.pause(false);
                return;
            } 
            break;
        case "train":
            if(utils.user != winnerUser) {
                msg += "\nThe loser lost the training match and walked away with nothing...";
                break;
            } 

            msg += "\nThe winner is rewarded with some EXP.";
            exp = Math.max(Math.ceil(loserBot.exp / 5), 1);
            if(winnerBot.ability == "Greedy AI") {
                exp = Math.ceil(exp * 1.5);
                msg += `\n${winnerBot.name} gets extra EXP due to their ability.`;
            } 
            if(!await utils.dbBots.addExp(interaction, winnerBot.botObj.bot_id, exp + 1)) {
                await utils.user.pause(false);
                return;
            } 
            break;
        case "friendly":
            msg += "\nThe bots shake claws and go their separate ways.";
            break;
        default:
            break;
    }

    // Add achievements
    await utils.dbAchievements.editAchievement(interaction, winnerUser.username, "Winner", 1);
    await utils.dbAchievements.editAchievement(interaction, loserUser.username, "Loser", 1);

    let taskToAdd;
    switch(winnerBot.item) {
        case "power":
            taskToAdd = "Quad Core";
            break;
        case "lifespan":
            taskToAdd = "Battery Saver";
            break;
        case "viral":
            taskToAdd = "Security Threat";
            break;
        case "firewall":
            taskToAdd = "Inpenetrable Wall";
            break;
        default:
            break;
    }

    if(taskToAdd)
        await utils.dbAchievements.checkTask(interaction, winnerUser.username, taskToAdd);

    if(winnerBot.item != "balanced")
        await utils.dbAchievements.checkTask(interaction, winnerUser.username, "Tactician");

    const newWinnerBotObj = await utils.dbBots.findBotObj(interaction, winnerBot.botObj.bot_id);
    const newWinnerCard = await new utils.card(interaction, newWinnerBotObj);
    await newWinnerCard.createCard();

    // If bot has unique winning image, show it
    if(newWinnerBotObj.obj.imageWin) {
        newWinnerCard.botObj.image = newWinnerBotObj.obj.imageWin;
        await newWinnerCard.createCard();
    }

    await utils.userFile.writeUserLog(utils.user.username, `battled their ${yourBot.name} with ID ${yourBot.botObj.bot_id} against ${otherUser.username}'s ${otherBot.name} with ID ${otherBot.botObj.bot_id}. ${msg}.`);
    
    await utils.dbBots.addLogs(interaction, winnerBot.botObj.bot_id, `won in ${wager} battle against ${loserBot.botObj.bot_type} ${loserBot.botObj.model_no} and gained ${exp ? exp : 0} EXP.`);
    await utils.dbBots.addLogs(interaction, loserBot.botObj.bot_id, `lost in ${wager} battle against ${winnerBot.botObj.bot_type} ${winnerBot.botObj.model_no} and lost ${exp ? exp : 0} EXP.`);

    await interaction.editReply({ files: [newWinnerCard.getCard()], content: msg })
        .catch((e) => utils.consola.error(e));

    await winnerUser.pause(false);
    await loserUser.pause(false);

    return results;
}

module.exports = {
    name: "battle",
    description: "Battle your bot with another player.",
    usage: "`/battle user` allows you to battle another user on the same server.\n`/battle train` allows you to battle Professor Diriski in the training lab.\n`/battle request` allows you to send a battle request to a user's inbox.\n`/battle accept` allows you to accept a battle from your inbox.\n`/battle reject` allows you to reject a battle from your inbox.",
    options: [{
        name: "user",
        description: "Battle with another user on the server.",
        required: false,
        type: "SUB_COMMAND",
        options: [{
            name: "user",
            description: "Mention the person's @tag.",
            required: true,
            type: "USER"
        },
        {
            name: "wager",
            description: "Choose the wager involved.",
            required: true,
            type: "STRING",
            choices: [{
                name: "Destroy",
                value: "destroy"
            },
            {
                name: "Collect",
                value: "collect"
            },
            {
                name: "Damage",
                value: "damage"
            },
            {
                name: "Friendly",
                value: "friendly"
            }
            ]
        },
        ]
    },
    {
        name: "train",
        description: "Battle with the Professor in the training lab.",
        required: false,
        type: "SUB_COMMAND",
    },
    {
        name: "request",
        description: "Send a battle request to send to the recipient's DMs.",
        required: false,
        type: "SUB_COMMAND",
        options: [{
            name: "username",
            description: "The recipient's Bot Brawler Username (NOT their @user).",
            required: true,
            type: "STRING"
        },
        {
            name: "wager",
            description: "Choose the wager involved.",
            required: true,
            type: "STRING",
            choices: [{
                name: "Destroy",
                value: "destroy"
            },
            {
                name: "Collect",
                value: "collect"
            },
            {
                name: "Damage",
                value: "damage"
            },
            {
                name: "Friendly",
                value: "friendly"
            }]
        }],
    },
    {
        name: "accept",
        description: "Accept a battle request from your inbox.",
        required: false,
        type: "SUB_COMMAND",
        options: [{
            name: "number",
            description: "The request number in your /requests list.",
            required: true,
            type: "INTEGER"
        }
    ]},
    {
        name: "reject",
        description: "Reject another user's battle request",
        required: false,
        type: "SUB_COMMAND",
        options: [{
            name: "number",
            description: "The request number in your /requests list",
            required: true,
            type: "INTEGER"
        }
    ]}],
    /**
     * @param {CommandInteraction} CommandInteraction
     * @param {Object} executeObj
     */
    async execute(interaction, utils) {

        let bots = await utils.user.getBots();
        let collection = await new BotCollection(bots, interaction);
        let otherUser;
        let subCommand = interaction.options.getSubcommand();
        let wager = interaction.options.getString("wager");
        let userSubCommand = await interaction.options.getUser("user");

        if(subCommand == "request") 
            otherUser = await utils.db.findUsername(interaction, interaction.options.getString("username"));
        else if(subCommand == "user")
            otherUser = await utils.handler.findOtherUser(interaction, userSubCommand);
        else if(subCommand == "train") {
            otherUser = await utils.db.findUsername(interaction, "Professor Diriski");
            if(!utils.user.currentChallenge) {
                await utils.user.pause(false);
                return utils.handler.info(interaction, new Error(`You do not have any challenges available... Try out \`/daily\` to get more.`)); 
            } 
        }

        if(otherUser) {
            // Pause other user so that they can't exploit
            if(!await utils.db.pauseUser(interaction, otherUser.user_id)) {
                await utils.user.pause(false);
                return interaction.editReply({ content: `The other user is currently busy. Try again later.` }).catch(e => { utils.consola.log(e)});
            }
        }
   
        // If accepting a request, find the msg
        if(subCommand == "accept") {
            const msg = await utils.messenger.getMessageByNumber(interaction, utils.user, interaction.options.getInteger("number"), "battle");
            if(!msg) {
                await utils.user.pause(false);
                if(otherUser)
                    await otherUser.pause(false);
                return;
            }

            otherUser = await utils.db.findUsername(interaction, msg.sender_username);
            if(!otherUser) {
                await utils.user.pause(false);
                return;
            }

            if(!interaction.channel) {
                await interaction.user.createDM();
            }

            let details = msg.message_content.split("|");
            let yourBot = await utils.dbBots.findBotObj(interaction, details[1]);
            let otherBot = await utils.dbBots.findBotObj(interaction, details[0]);
            let wager = details[2];
    
            if(!yourBot || !otherBot) {       
                await utils.user.pause(false);
                await otherUser.pause(false);
                return;        
            }

            let results = await battle(interaction, utils, yourBot, otherBot, wager, otherUser);
            if(!results) {
                await utils.user.pause(false);
                await otherUser.pause(false);
                return;
            }

            // Send the other user the progress of the battle
            let userToSend;

            // Battle from other players point of view
            let otherResults = await otherBot.battle(yourBot);
            let otherScene = await new BattleView(interaction, otherBot, yourBot, otherResults);
            if(!await otherScene.createCards()) {
                await utils.user.pause(false);
                await otherUser.pause(false);
                return;
            }

            if(!otherUser.isBot) {
                userToSend = await utils.client.users.fetch(otherUser.user_id);

                await userToSend.send({ 
                    content: `Battle outcome: ${results.winnerUser.username}'s ${results.winnerBot.name} won!`,
                    files: [otherScene.getScene()] })
                .catch(() => {
                    return utils.handler.info(interaction, new Error(`Failed to send a message to user \`${otherUser.username}\`. They may have their Discord DMs disabled.`)); 
                });
            }

            await utils.userFile.writeUserLog(utils.user.username, `has accepted a battle request from ${otherUser.username}. ${utils.user.username}'s ${yourBot.name} with ID ${yourBot.botObj.bot_id} versus ${otherUser.username}'s ${otherBot.name} with ID ${otherBot.botObj.bot_id}. The wager is ${wager}.`);
            await utils.messenger.clearMessages(interaction, otherUser, utils.user, "battle");

            return;
        }

        //If rejecting a request, remove it
        if(subCommand == "reject") {
            const msg = await utils.messenger.getMessageByNumber(interaction, utils.user, interaction.options.getInteger("number"), "battle");
            if(!msg) {
                await utils.user.pause(false);
                await otherUser.pause(false);
                return;
            }
            let details = msg.message_content.split("|");

            otherUser = await utils.db.findUsername(interaction, msg.sender_username);
            if(!otherUser) {
                await utils.user.pause(false);
                await otherUser.pause(false);
                return;
            }            
                
            if(!await utils.messenger.deleteMessageByNumber(interaction, utils.user, interaction.options.getInteger("number"), "battle")) {
                await utils.user.pause(false);
                await otherUser.pause(false);
                return;
            }

            let yourBot = await utils.dbBots.findBotObj(interaction, details[1]);
            let otherBot = await utils.dbBots.findBotObj(interaction, details[0]);
            let wager = details[2];

            await utils.user.pause(false);     
            await utils.userFile.writeUserLog(utils.user.username, `has rejected a battle request from ${otherUser.username}. ${utils.user.username}'s ${yourBot.name} with ID ${yourBot.botObj.bot_id} versus ${otherUser.username}'s ${otherBot.name} with ID ${otherBot.botObj.bot_id}. The wager is ${wager}.`);
            
            return interaction.editReply({ embeds: [
                new utils.embed(interaction, utils.user)
                    .setTitle(`${otherUser.username}'s Battle Request`)
                    .setDescription(`You have rejected \`${otherUser.username}\`'s battle request.`)] })
                        .catch((e) => utils.consola.error(e));
        }

        if(!collection || !otherUser) {
            await utils.user.pause(false);
            if(otherUser)
                await otherUser.pause(false);
            return;
        }

        let otherBots = await otherUser.getBots();
        let otherCollection = await new BotCollection(otherBots, interaction);


        if(subCommand == "train") {
            otherCollection.filterCollection({
                isChallenge: utils.user.currentChallenge,
            });
        }

        // Ran out of Professor Diriski challenges
        if(!otherCollection.objs.length) {
            if(otherUser.username == "Professor Diriski") {
                let err = new Error(`You are out of \`/battle train\` challenges. Use \`/daily\` to refresh them.`);
                await utils.handler.info(interaction, err);                
            } else {
                let err = new Error(`The other user doesn't have any bots to battle with!`);
                await utils.handler.info(interaction, err);     
            }  
            
            await utils.user.pause(false);  
            await otherUser.pause(false);  
            return;
        }

        //Inspect the collection
        if(!await collection.inspectCollection(interaction, utils.user, 1, `Choose ${utils.user.username}'s bot`, otherUser))  {
            await utils.user.pause(false);
            await otherUser.pause(false);
            await interaction.editReply({ content: `Your collection is empty... `} ).catch((e) => utils.consola.error(e));
            return;
        }

        //When a card is selected, display it
        collection.selectedEvent.on(`selected`, async () => {

            let yourBot = collection.selected;
            const yourCard = await new utils.card(interaction, yourBot);
            if(!await yourCard.createCard()) {
                await utils.user.pause(false);
                await otherUser.pause(false);
                return;
            }

            if(!await otherCollection.inspectCollection(interaction, utils.user, 1, `Choose ${otherUser.username}'s bot`, otherUser)) {
                await utils.user.pause(false);
                await otherUser.pause(false);
                await interaction.editReply({ content: `The opponent's collection is empty... `} ).catch((e) => utils.consola.error(e));
                return;
            }

            otherCollection.selectedEvent.on(`selected`, async() => {

                let otherBot = otherCollection.selected;

                //Send a request for later
                if(subCommand == "request") {
                    if(await utils.messenger.checkMessages(interaction, utils.user, otherUser)) {
                        await utils.user.pause(false);
                        await otherUser.pause(false);
                        return utils.handler.info(interaction, new Error("You can only send this person one request at a time."));
                    }
    
                    // If other user is a bot, instantly accept
                    if(otherUser.isBot) {
                        let scene = await new BattleView(interaction, yourBot, otherBot);
                        if(!await scene.createCards(true, false, false)) {
                            await utils.user.pause(false);
                            return;
                        }

                        // Clunk tutorial
                        if(otherUser.username == "Clunk") {
                            // Can't do a tutorial without destroying
                            if(wager != "destroy") {
                                await utils.user.pause(false);
                                await otherUser.pause(false);
                                await interaction.editReply({ 
                                    content: `You cannot battle Clunk with \`${wager}\` wager.`,
                                    embeds: [],
                                    components: [],
                                }).catch((e) => utils.consola.error(e));
                                return;                                    
                            } else {
                                if(!await utils.db.checkTutorial(interaction, "battle destroy")) {
                                    await utils.user.pause(false);
                                    await otherUser.pause(false);
                                    await interaction.editReply({ 
                                        content: `Clunk doesn't have time to battle noobs like you.`,
                                        embeds: [],
                                        components: [],
                                    }).catch((e) => utils.consola.error(e));
                                    return;
                                }
                            }
                        } else {
                            // Bot users will never accept
                            await utils.user.pause(false);
                            await otherUser.pause(false);
                            await interaction.editReply({ 
                                content: `Bot Users cannot accept battle...`,
                                embeds: [],
                                components: [],
                            }).catch((e) => utils.consola.error(e));
                            return;
                            

                        }

                        await battle(interaction, utils, yourBot, otherBot, wager, otherUser);
                        return;
                    }

                    // Details that will be contained within the message
                    let details = {
                        sender_bot_id: yourBot.botObj.bot_id,
                        recipient_bot_id: otherBot.botObj.bot_id,
                        wager: wager
                    }     

                    let messageNumber = await utils.messenger.sendBattleRequest(interaction, utils.user, otherUser, details);
                    if(!messageNumber) {
                        await utils.user.pause(false);
                        await otherUser.pause(false);
                        return;
                    }    

                    await utils.dbAchievements.checkTask(interaction, utils.user.username, "Networking");

                    await utils.userFile.writeUserLog(utils.user.username, `has sent a battle request to ${otherUser.username}. ${utils.user.username}'s ${yourBot.name} with ID ${yourBot.botObj.bot_id} versus ${otherUser.username}'s ${otherBot.name} with ID ${otherBot.botObj.bot_id}. The wager is ${wager}.`);
                    await utils.user.pause(false);
                    await otherUser.pause(false);
                    await utils.messenger.sendDM(interaction, utils.client, otherUser, 
                        `${utils.user.username} has sent you a battle request.\nFor more info: \`/requests info ${messageNumber}\`.`);

                    return;

                } else if(subCommand == "user") {

                    let scene = await new BattleView(interaction, yourBot, otherBot);
                    await scene.createCards(true, false, false);

                    await utils.messageHelper.confirmChoice(interaction, userSubCommand, `The wager is \`${wager}\`, this means that ${wagers[wager]}.\n\n${userSubCommand}, do you accept this Battle Request from ${interaction.user}?`, scene.getScene());

                    // If other user accepts
                    utils.messageHelper.replyEvent.on(`accepted-${interaction.id}`, async () => {

                        let results = await battle(interaction, utils, yourBot, otherBot, wager, otherUser);
                        await utils.userFile.writeUserLog(utils.user.username, `server battle accepted by ${otherUser.username}. ${utils.user.username}'s ${yourBot.name} with ID ${yourBot.botObj.bot_id} versus ${otherUser.username}'s ${otherBot.name} with ID ${otherBot.botObj.bot_id}. The wager is ${wager}.`);
                        if(!results) {
                            await utils.user.pause(false);
                            await otherUser.pause(false);
                            return;
                        }        
                    });

                    // If other user rejects
                    utils.messageHelper.replyEvent.on(`rejected-${interaction.id}`, async () => {

                        await utils.userFile.writeUserLog(utils.user.username, `server battle rejected by ${otherUser.username}. ${utils.user.username}'s ${yourBot.name} with ID ${yourBot.botObj.bot_id} versus ${otherUser.username}'s ${otherBot.name} with ID ${otherBot.botObj.bot_id}. The wager is ${wager}.`);
                        await interaction.editReply({ 
                            content: `The battle was cancelled...`,
                            components: [],
                            embeds: []    
                        }).catch((e) => utils.consola.error(e));
                        
                        await utils.user.pause(false);
                        await otherUser.pause(false);
                        return;
                    }); 

                    // Time out
                    utils.messageHelper.replyEvent.on(`timeOut-${interaction.id}`, async () => {

                        await utils.userFile.writeUserLog(utils.user.username, `server battle ignored by ${otherUser.username}. ${utils.user.username}'s ${yourBot.name} with ID ${yourBot.botObj.bot_id} versus ${otherUser.username}'s ${otherBot.name} with ID ${otherBot.botObj.bot_id}. The wager is ${wager}.`);
                        
                        await utils.user.pause(false);
                        await otherUser.pause(false);
                        return;
                    }); 
                        
                    return;
                    
                } else if(subCommand == "train") {
                    let scene = await new BattleView(interaction, yourBot, otherBot);
                    await scene.createCards(true, false, false);
                    
                    // Remove challenge from list, and increase number of challenges complete
                    await utils.db.add(interaction, "currentChallenge", utils.user.currentChallenge.replace(`${otherBot.botObj.bot_id}|`, ``));
                    await battle(interaction, utils, yourBot, otherBot, "train", otherUser);
                    await utils.db.add(interaction, "challengesComplete");
                    await utils.userFile.writeUserLog(utils.user.username, `is battle training with Professor Diriski. ${utils.user.username}'s ${yourBot.name} with ID ${yourBot.botObj.bot_id} versus ${otherUser.username}'s ${otherBot.name} with ID ${otherBot.botObj.bot_id}. The wager is ${wager}.`);

                    await utils.user.pause(false);
                    return;
                }

            });

        });

    }

}