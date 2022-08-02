const BotCollection = require("../../Helpers/BotCollection");
const Card = require("../../Helpers/Card");
const machinePartEmoji = "<:machine_parts:992728693799669801>";

async function trade(interaction, utils, buyingUser, sellingUser, sellingBot, moneyOffered) {

    if(moneyOffered > buyingUser.balance) {
        await utils.user.pause(false);
        let err = new Error(`\`${buyingUser.username}\` does not have sufficient funds`);
        await utils.handler.info(interaction, err);
        return;
    }

    const yourCard = await new utils.card(interaction, sellingBot);

    if(!await yourCard.createCard()) {
        await utils.user.pause(false);
        return;
    }

    // Exchange money from buyer to seller
    await utils.db.add(interaction, "balance", moneyOffered, sellingUser.user_id);
    await utils.db.remove(interaction, "balance", moneyOffered, buyingUser.user_id);

    // Exchange bot ownership
    await utils.dbBots.changeOwner(interaction, sellingBot.botObj.bot_id, buyingUser.username);

    // Add achievement
    let achievementIndex = 0;
    switch(sellingBot.findColour().type) {
        case "Prototype":
            achievementIndex = 1;
            break;
        case "Testing":
            achievementIndex = 2;
            break;
        case "Alpha":
            achievementIndex = 3;
            break;
        case "Beta":
            achievementIndex = 4;
            break;
        case "Complete":
            achievementIndex = 5;
            break;
        default:
            break;
    }

    await utils.dbAchievements.editAchievement(interaction, buyingUser.username, "Army Builder", sellingBot.botObj.bot_id, achievementIndex);
    await utils.dbAchievements.editAchievement(interaction, buyingUser.username, "Entrepreneur", sellingBot.botObj.bot_id);
    await utils.dbAchievements.editAchievement(interaction, sellingUser.username, "Entrepreneur", sellingBot.botObj.bot_id);             

    await utils.dbBots.addLogs(interaction, sellingBot.botObj.bot_id, `has been sold to ${buyingUser.username} for x${moneyOffered} Machine Parts.`);

    // Display confirmation message
    await interaction.editReply({ 
        files: [yourCard.getCard()], 
        content: `\`${sellingUser.username}'s ${sellingBot.name}\` has been sold to \`${buyingUser.username} for ${moneyOffered}x\` ${machinePartEmoji} Machine Parts!`,
        embeds: [],
        components: []
    }).catch((e) => utils.consola.error(e));

    await buyingUser.pause(false);
    await sellingUser.pause(false);

    return yourCard;
}

module.exports = {
    name: "trade",
    description: "Trade your bot with another player for Machine Parts.",
    usage: "`/trade user` allows you to trade with another mentioned user on the same server.\n`/trade request` allows you to send a trade request to a user's inbox.\n`/trade accept` allows you to accept a trade from your inbox.\n`/trade reject` allows you to reject a trade from your inbox.",
    options: [{
        name: "user",
        description: "Trade with another user on the server.",
        required: false,
        type: "SUB_COMMAND",
        options: [{
            name: "type",
            description: "Choose whether to buy or sell",
            required: true,
            type: "STRING",
            choices: [{
                name: "Buy",
                value: "buy"
            },
            {
                name: "Sell",
                value: "sell"
            }],
        },
        {
            name: "user",
            description: "The user you wish to buy from.",
            required: true,
            type: "USER",
        },
        {
            name: "amount",
            description: "The number of Machine Parts you will offer.",
            required: true,
            type: "INTEGER",
        },
        ]
    },
    {
        name: "request",
        description: "Send a battle request to send to the recipient's DMs.",
        required: false,
        type: "SUB_COMMAND",
        options: [{
            name: "type",
            description: "Choose whether to buy or sell",
            required: true,
            type: "STRING",
            choices: [{
                name: "Buy",
                value: "buy"
            },
            {
                name: "Sell",
                value: "sell"
            }],
        },
        {
            name: "username",
            description: "The recipient's Bot Brawler Username (NOT their @user).",
            required: true,
            type: "STRING"
        },
        {
            name: "amount",
            description: "The number of Machine Parts you will offer.",
            required: true,
            type: "INTEGER",
        },
        ]
    },
    {
        name: "accept",
        description: "Accept a trade request from your inbox.",
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
        description: "Reject a user's trade request from your inbox.",
        required: false,
        type: "SUB_COMMAND",
        options: [{
            name: "number",
            description: "The request number in your /requests list",
            required: true,
            type: "INTEGER"
        }
    ]}

],
    /**
     * @param {CommandInteraction} CommandInteraction
     * @param {Object} executeObj
     */
    async execute(interaction, utils) {

        let user = utils.user;
        let sellingUser, buyingUser, otherUser;
        const subCommand = interaction.options.getSubcommand();
        let userSubCommand = await interaction.options.getUser("user");

        if(subCommand == "request") {
            otherUser = await utils.db.findUsername(interaction, interaction.options.getString("username"));
        } else if(subCommand == "user"){
            otherUser = await utils.db.findUser(interaction, userSubCommand.id);
        }

        // If accepting a request, find the msg
        if(subCommand == "accept") {
            const msg = await utils.messenger.getMessageByNumber(interaction, utils.user, interaction.options.getInteger("number"), "trade");
            if(!msg) {
                await utils.user.pause(false);
                return;
            }

            otherUser = await utils.db.findUsername(interaction, msg.sender_username);
            if(!otherUser) {
                await utils.user.pause(false);
                return;
            }

            // Pause other user so that they can't exploit
            if(!await utils.db.pauseUser(interaction, otherUser.user_id)) {
                await utils.user.pause(false);
                return interaction.editReply({ content: `The other user is currently busy. Try again later.` });
            }

            let details = msg.message_content.split("|");
            let sellingBot = await utils.dbBots.findBotObj(interaction, details[2]);
            let sellingUser = await utils.db.findUsername(interaction, details[0]);
            let buyingUser = await utils.db.findUsername(interaction, details[1]);
            let amount = parseInt(details[3]);

            if(!sellingBot || !sellingUser || !buyingUser) {
                await utils.user.pause(false);
                await otherUser.pause(false);
                return;
            }

            if(!interaction.channel)
                await interaction.user.createDM();

            let card = await trade(interaction, utils, buyingUser, sellingUser, sellingBot, amount);
            if(!card) {
                await utils.user.pause(false);
                await otherUser.pause(false);
                return;
            }

            // Send the other user the results of the trade
            let userToSend = await utils.client.users.fetch(otherUser.user_id);

            await userToSend.send({
                content: `Trade accepted: ${sellingUser.username}'s ${sellingBot.name} was traded to ${buyingUser.username} for x${amount} ${machinePartEmoji} Machine Parts!`,
                files: [card.getCard()] })
            .catch(() => {
                return utils.handler.info(interaction, new Error(`Failed to send a message to user \`${otherUser.username}\`. They may have their Discord DMs disabled.`)); 
            });

            await utils.messenger.clearMessages(interaction, otherUser, utils.user, "trade");
            await utils.userFile.writeUserLog(utils.user.username, `accepted a trade from ${otherUser.username}. ${sellingUser.username}'s ${sellingBot.name} with ID ${sellingBot.botObj.bot_id} was traded to ${buyingUser.username} for x${amount} Machine Parts.`);

            await utils.user.pause(false);
            await otherUser.pause(false);
            return;
            
        }

        if(subCommand == "reject") {
            const msg = await utils.messenger.getMessageByNumber(interaction, utils.user, interaction.options.getInteger("number"), "trade");
            if(!msg) {
                await utils.user.pause(false);
                return;
            }

            otherUser = await utils.db.findUsername(interaction, msg.sender_username);
            if(!otherUser) {
                await utils.user.pause(false);
                return;
            }            
                
            if(!await utils.messenger.deleteMessageByNumber(interaction, utils.user, interaction.options.getInteger("number"), "trade")) {
                await utils.user.pause(false);
                return;
            }

            await utils.user.pause(false);

            await utils.userFile.writeUserLog(utils.user.username, `rejected a trade from ${otherUser.username}.`);
            return interaction.editReply({ embeds: [
                new utils.embed(interaction, utils.user)
                    .setTitle(`${otherUser.username}'s Trade Request`)
                    .setDescription(`You have rejected \`${otherUser.username}\`'s trade request.`)] })
                        .catch((e) => utils.consola.error(e));
        }

        if(!otherUser) {
            await utils.user.pause(false);
            return;
        }

        // Pause other user so that they can't exploit
        if(!await utils.db.pauseUser(interaction, otherUser.user_id)) {
            await utils.user.pause(false);
            return interaction.editReply({ content: `The other user is currently busy. Try again later.` });
        }

        let amount = interaction.options.getInteger("amount");
        const buyOrSell = interaction.options.getString("type");

        // If buying, then select from other user's cards instead
        if(buyOrSell == "buy") {
            sellingUser = otherUser;
            buyingUser = user;
        } else {
            sellingUser = user;
            buyingUser = otherUser;
        }

        let bots = await sellingUser.getBots();
        let collection = await new BotCollection(bots, interaction);

        if(!collection || !sellingUser) {
            await utils.user.pause(false);
            await otherUser.pause(false);
            return;
        }

        // If the buying user doesn't have sufficient funds, return
        if(amount > buyingUser.balance) {
            let err = new Error(`\`${buyingUser.username}\` does not have sufficient funds`);
            await utils.user.pause(false);
            await otherUser.pause(false);
            return utils.handler.info(interaction, err);
        }

        // Inspect the collection
        if(!await collection.inspectCollection(interaction, utils.user, 1, `Choose ${sellingUser.username}'s bot to offer.`)) {
            await utils.user.pause(false);
            await otherUser.pause(false);
            return;
        }

        // When a card is selected, display it
        collection.selectedEvent.on(`selected`, async () => {

            // Select bot to buy/sell
            let yourBot = collection.selected;
            let yourCard = await new Card(interaction, yourBot);
            await yourCard.createCard();

            if(subCommand == "request") {
                if(await utils.messenger.checkMessages(interaction, utils.user, otherUser)) {
                    await utils.user.pause(false);
                    await otherUser.pause(false);
                    return utils.handler.info(interaction, new Error("You can only send this person one request at a time."));
                }
                // If other user is a bot, instantly accept
                if(otherUser.isBot) {
                    /*
                    if(!await trade(interaction, utils, buyingUser, sellingUser, yourBot, amount)) {
                        await utils.user.pause(false);
                        await otherUser.pause(false);
                    }
                    */
                    await utils.user.pause(false);
                    await otherUser.pause(false);
                    await interaction.editReply({ 
                        content: `You cannot send Trade Requests to bot users.`,
                        embeds: [],
                        components: [],
                    }).catch((e) => utils.consola.error(e));
                    return;
                }

                // Details that will be contained within the message
                let details = {
                    selling_user: sellingUser,
                    buying_user: buyingUser,
                    bot_id: yourBot.botObj.bot_id,
                    amount_offered: amount 
                }

                let messageNumber = await utils.messenger.sendTradeRequest(interaction, utils.user, otherUser, details);
                if(!messageNumber) {
                    await utils.user.pause(false);
                    await otherUser.pause(false);
                    return;
                }
            
                await utils.messenger.sendDM(interaction, utils.client, otherUser, 
                    `${utils.user.username} has sent you a trade request.\nFor more info: \`/requests info ${messageNumber}\`.`);
                
                await utils.user.pause(false);
                await otherUser.pause(false);   

                return;
            } else if(subCommand == "user") {

                await utils.messageHelper.confirmChoice(interaction, userSubCommand, `\`${sellingUser.username}'s ${yourBot.name}\` for \`x${amount} ${machinePartEmoji} Machine Parts\`\n\n${userSubCommand}, you accept this Trade Request from ${interaction.user}?`, yourCard.getCard());
                await utils.userFile.writeUserLog(utils.user.username, `has requested a trade to ${otherUser.username}. ${sellingUser.username}'s ${yourBot.name} with ID ${yourBot.botObj.bot_id} was traded to ${buyingUser.username} for x${amount} Machine Parts.`);

                // If other user accepts
                utils.messageHelper.replyEvent.on(`accepted`, async () => {
                    if(!await trade(interaction, utils, buyingUser, sellingUser, yourBot, amount)) {
                        await utils.userFile.writeUserLog(utils.user.username, `server trade accepted by ${otherUser.username}. ${sellingUser.username}'s ${yourBot.name} with ID ${yourBot.botObj.bot_id} was traded to ${buyingUser.username} for x${amount} Machine Parts.`);
                        await utils.user.pause(false);
                        await otherUser.pause(false);
                        return;
                    }

                });

                // If other user rejects
                utils.messageHelper.replyEvent.on(`rejected`, async() => {
                    
                    await utils.userFile.writeUserLog(utils.user.username, `server trade rejected by ${otherUser.username}. ${sellingUser.username}'s ${yourBot.name} with ID ${yourBot.botObj.bot_id} was traded to ${buyingUser.username} for x${amount} Machine Parts.`);

                    await interaction.editReply({ 
                        content: `The trade was cancelled...`,
                        components: [],
                        embeds: []    
                    }).catch((e) => utils.consola.error(e));
                    
                    await utils.user.pause(false);
                    await otherUser.pause(false);
                    return;
                });

                utils.messageHelper.replyEvent.on(`timeOut`, async() => {
                    await utils.userFile.writeUserLog(utils.user.username, `server trade ignored by ${otherUser.username}. ${sellingUser.username}'s ${yourBot.name} with ID ${yourBot.botObj.bot_id} was traded to ${buyingUser.username} for x${amount} Machine Parts.`);
                 
                    await utils.user.pause(false);
                    await otherUser.pause(false);
                    return;
                }); 

            }

        });

    }

}