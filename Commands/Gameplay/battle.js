const { Client, MessageEmbed, MessageActionRow, MessageSelectMenu, MessageButton } = require("discord.js");
const BotBuilder = require("../../Helpers/BotBuilder");
const BotObj = require("../../Data/Bots/BotObj");
const BattleView = require("../../Helpers/BattleView");
const BotCollection = require("../../Helpers/BotCollection");
const { promisify } = require('util');
const sleep = promisify(setTimeout);

// Battle logic
async function battle(interaction, utils, yourBot, otherBot, wager, otherUser){
    
    // Perform battle
    let results = await yourBot.battle(otherBot);
    let msg = ``;
    
    let loserBot, winnerBot, loserUser, winnerUser, exp;

    //New battle scene
    let scene = await new BattleView(interaction, yourBot, otherBot, results);
    
    //Show left bot
    msg = `${yourBot.name} ${yourBot.getBattleText()}\n`;
    await scene.createCards(true, false, true);
    await interaction.editReply({ content: msg, files: [scene.getScene()], embeds: [], components: [] });
    await sleep(5000);

    //Show right bot
    msg = `${otherBot.name} ${otherBot.getBattleText()}\n`;
    await scene.createCards(true, true, false);
    await interaction.editReply({ content: msg, files: [scene.getScene()] });
    await sleep(5000);

    //Show left side advantage
    await scene.createCards(true, false, false);
    await interaction.editReply({ content: results.yourMsg, files: [scene.getScene()] });
    await sleep(5000);

    //Show right side advantage
    await interaction.editReply({ content: results.opponentMsg });
    await sleep(5000);

    //Show chart
    msg = `Battle commence...\n`;
    await scene.createCards(false, false, false);
    await interaction.editReply({ content: msg, files: [scene.getScene()] });
    await sleep(10000);

    msg = `${results.winner <= results.yourPercent ? yourBot.name + " is the winner" : otherBot.name + " is the winner"}`;

    //Determine winner
    if(results.winner <= results.yourPercent){
        winnerBot = yourBot;
        winnerUser = utils.user;
        loserBot = otherBot;
        loserUser = otherUser;
    } else {
        winnerBot = otherBot;
        winnerUser = otherUser;
        loserBot = yourBot;
        loserUser = utils.user;
    }

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

    console.log(wager);

    switch(wager) {
        case "destroy":
            //Loser bot is destroyed and is no longer usable
            msg += `\nLoser bot gets destroyed by winner for EXP.`;
            exp = Math.ceil(loserBot.exp);
            if(!await utils.dbBots.addExp(interaction, winnerBot.botObj.bot_id, exp + 1))
                return;
            if(!await utils.dbBots.destroy(interaction, loserBot.botObj.bot_id))
                return;
            if(!await utils.dbBotStats.removeAlive(interaction, loserBot.bot_type))
                return;
            break;
        case "collect":
            //The loser bot owner changes to winner username
            msg += `\nLoser bot gets collected by winner.`;
            if(!await utils.dbBots.changeOwner(interaction, loserBot.botObj.bot_id, winnerUser.username))
                return;
            break;
        case "damage":
            //Pass EXP over to winner
            msg += "\nLoser bot gives winner bot some EXP.";
            exp = Math.ceil(loserBot.exp / 5);

            if(exp == 0) 
                msg += "\nLoser had no EXP left to give, so was destroyed for scrap metal...";

            if(!await utils.dbBots.removeExp(interaction, loserBot.botObj.bot_id, exp)) 
                return;
            if(!await utils.dbBots.addExp(interaction, winnerBot.botObj.bot_id, exp + 1))
                return;
            break;
        case "friendly":
            msg += "\nThe bots shake claws and go their separate ways.";
            break;
        default:
            break;
    }

    // If bot has unique winning image, show it
    if(winnerBot.obj.imageWin) {
        winnerCard.botObj.image = winnerBot.obj.imageWin;
        await winnerCard.createCard();
    }

    await interaction.editReply({ files: [winnerCard.getCard()], content: msg });
    return results;
}

module.exports = {
    name: "battle",
    description: "Battle your bot with another player.",
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
            otherUser = await utils.db.findUser(interaction, userSubCommand.id);
        
        // If accepting a request, find the msg
        if(subCommand == "accept") {
            const msg = await utils.messenger.getMessageByNumber(interaction, utils.user, interaction.options.getInteger("number"), "battle");
            if(!msg)
                return;

            otherUser = await utils.db.findUsername(interaction, msg.sender_username);
            if(!otherUser)
                return;

            let details = msg.message_content.split("|");
            let yourBot = await utils.dbBots.findBotObj(interaction, details[1]);
            let otherBot = await utils.dbBots.findBotObj(interaction, details[0]);
            wager = details[2];

            if(!yourBot || !otherBot)
                return;

            if(!interaction.channel)
                await interaction.user.createDM();

            let results = await battle(interaction, utils, yourBot, otherBot, wager, otherUser);

            if(!results)
                return;

            // Send the other user the progress of the battle
            let userToSend = await utils.client.users.fetch(otherUser.user_id);
            let success = true;

            // Battle from other players point of view
            let otherResults = await otherBot.battle(yourBot);
            let otherScene = await new BattleView(interaction, otherBot, yourBot, otherResults);
            if(!await otherScene.createCards())
                return;

            await userToSend.send({ 
                content: `Battle outcome: ${results.winnerUser.username}'s ${results.winnerBot.name} won!`,
                files: [otherScene.getScene()] })
            .catch(() => {
                success = false;
                return utils.handler.info(interaction, new Error(`Failed to send a message to user \`${otherUser.username}\`. They may have their Discord DMs disabled.`)); 
            });

            if(!success)
                return;

            await utils.messenger.clearMessages(interaction, otherUser, utils.user, "battle");
            return;
        }

        //If rejecting a request, remove it
        if(subCommand == "reject") {
            const msg = await utils.messenger.getMessageByNumber(interaction, utils.user, interaction.options.getInteger("number"), "battle");
            if(!msg)
                return;

            otherUser = await utils.db.findUsername(interaction, msg.sender_username);
            if(!otherUser)
                return;            
                
            if(!await utils.messenger.deleteMessageByNumber(interaction, utils.user, interaction.options.getInteger("number"), "battle"))
                return;

            return interaction.editReply({ embeds: [
                new utils.embed(interaction, utils.user)
                    .setTitle(`${otherUser.username}'s Battle Request`)
                    .setDescription(`You have rejected \`${otherUser.username}\`'s battle request.`)] })
                        .catch((e) => utils.consola.error(e));
        }

        if(!collection || !otherUser)
            return;

        let otherBots = await otherUser.getBots();
        let otherCollection = await new BotCollection(otherBots, interaction);

        //Inspect the collection
        await collection.inspectCollection(interaction, 1, `Choose ${utils.user.username}'s bot`);

        //When a card is selected, display it
        collection.selectedEvent.on(`selected`, async () => {

            let yourBot = collection.selected;
            const yourCard = await new utils.card(interaction, yourBot);
            if(!await yourCard.createCard())
                return;

            await interaction.editReply({ files: [yourCard.getCard()] })
                .catch(e => utils.consola.error(e));

            await otherCollection.inspectCollection(interaction, 1, `Choose ${otherUser.username}'s bot`);
            otherCollection.selectedEvent.on(`selected`, async() => {

                let otherBot = otherCollection.selected;

                //Send a request for later
                if(subCommand == "request") {
                    if(await utils.messenger.checkMessages(interaction, utils.user, otherUser))
                        return utils.handler.info(interaction, new Error("You can only send this person one request at a time."));
    
                    // Details that will be contained within the message
                    details = {
                        sender_bot_id: yourBot.botObj.bot_id,
                        recipient_bot_id: otherBot.botObj.bot_id,
                        wager: wager
                    }

                    let messageNumber = await utils.messenger.sendBattleRequest(interaction, utils.user, otherUser, details);
                    if(!messageNumber)
                        return;
                    
                    await utils.messenger.sendDM(interaction, utils.client, otherUser, 
                        `${utils.user.username} has sent you a battle request.\nFor more info: \`/requests info ${messageNumber}\`.`);
                    
                    return;

                } else if(subCommand == "user") {

                    let scene = await new BattleView(interaction, yourBot, otherBot);
                    await scene.createCards(true, false, false);

                    await utils.messageHelper.confirmChoice(interaction, userSubCommand, `${userSubCommand}, do you accept this Battle Request from ${interaction.user}?`, scene.getScene());

                    // If other user accepts
                    utils.messageHelper.replyEvent.on(`accepted`, async () => {
                        await battle(interaction, utils, yourBot, otherBot, wager, otherUser);
                    });

                    // If other user rejects
                    utils.messageHelper.replyEvent.on(`rejected`, async() => {
                        await interaction.editReply({ 
                            content: `The battle was cancelled...`,
                            components: [],
                            embeds: []    
                        })
                    });                  
                    
                }

                /*

                // BATTLE SIMULATION SCRIPT

                let chips = ["power", "lifespan", "viral", "firewall", "balanced"];

                let yourPercent = 0;
                let otherPercent = 0;

                for(let i = 0; i < chips.length; i++) {
                    for(let j = 0; j < chips.length; j++) {
                        await yourBot.investStats(chips[i]);
                        await otherBot.investStats(chips[j]);    
                        console.log(`${yourBot.name} (${chips[i]}) VS ${otherBot.name} (${chips[j]})`);
                        let results = await yourBot.battle(otherBot);
                        console.log(`\n\n`);

                        yourPercent += results.yourPercent;
                        otherPercent += results.otherPercent;
                    }
                }

                console.log(`${yourPercent}% vs ${otherPercent}%`);

                */


            });

        });

    }

}