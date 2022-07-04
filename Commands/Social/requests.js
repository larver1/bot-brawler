const BattleView = require("../../Helpers/BattleView");
const Card = require("../../Helpers/Card");
const machinePartEmoji = "<:machine_parts:992728693799669801>";

const wagers = {
    friendly: "nothing is at stake, the loser will not give the winner anything",
    damage: "the loser bot will lose EXP and give it to the winner bot",
    destroy: "the loser bot will be destroyed and the winner will gain lots of EXP",
    collect: "the loser bot will be given to the owner of the winner bot"
}

module.exports = {
    name: "requests",
    description: "Manage all of your friend/battle/trade requests.",
    options: [{
        name: "list",
        description: "View all incoming + outgoing requests.",
        type: "SUB_COMMAND",
        options: [{
            name: "filter",
            description: "Filter the requests in a certain way.",
            required: false,
            type: "STRING",
            choices: [
            {    
                name: "Battle",
                value: "battle",
            },    
            {   name: "Trade",
                value: "trade",
            },
            {    
                name: "Battle",
                value: "battle",
            },    

        ]
        }],
    },
    {
        name: "info",
        description: "Get more information regarding a user's request.",
        type: "SUB_COMMAND",
        options: [{
            name: "number",
            description: "The request number in your /requests list.",
            required: true,
            type: "INTEGER"
        }],
    },
    ],
    /**
     * @param {CommandInteraction} CommandInteraction
     * @param {Object} executeObj
     */
    async execute(interaction, utils) {

        let subCommand = interaction.options.getSubcommand();

        if(!utils.user)
            return;

        //Display list of requests
        if(subCommand == "list") {
            let filter = interaction.options.getString("filter");

            // Find all incoming messages with filters applied
            let inbox = await utils.messenger.readAllMessages(interaction, utils.user, filter, true);
            if(!inbox)
                return;

            // Present all messages
            let inboxMsg = ``;
            for(const message of inbox) {
                let otherUser = await utils.db.findUsername(interaction, message.sender_username);
                let msgContent = message.message_content.split("|");
                let contentMsg = ``;

                // Battle content message
                if(message.message_type == "battle") {
                    let bot1 = await utils.dbBots.findBot(interaction, msgContent[0]);
                    let bot2 = await utils.dbBots.findBot(interaction, msgContent[1]);

                    contentMsg += `Your \`${bot2.bot_type}\` vs \`${message.sender_username}'s ${bot1.bot_type}\`. Wager is \`${msgContent[2]}\`.`;
                } else if(message.message_type == "trade") {
                    let sellingBot = await utils.dbBots.findBotObj(interaction, msgContent[2]);
                    let sellingUser;
                    
                    // If recipient is the selling user
                    if(msgContent[0] == utils.user.username) {
                        sellingUser = utils.user;
                    } else {
                        sellingUser = otherUser;
                    }

                    contentMsg += `\`x${msgContent[3]} ${machinePartEmoji} Machine Parts\` for \`${sellingUser.username}'s ${sellingBot.name}\`.\n\n`;
                } else if(message.message_type == "friend") {
                    contentMsg += `Friend Request from \`${message.sender_username}\` 😄\n`;
                }

                inboxMsg += `From: \`${message.sender_username}\`\n`;
                inboxMsg += `Request: \`${message.message_type}\`\n`;
                inboxMsg += `ID Number: \`${message.message_number}\`\n`;
                inboxMsg += `Details: ${contentMsg}\n`;
                inboxMsg += `More Info: \`/requests info ${message.message_number}\`\n\n`;

            }

            // Show inbox to the user
            await utils.messageHelper.listPages(interaction, utils.user, inboxMsg, {
                title: `Inbox`,
                linesPerPage: 30
            });

            return;
            
        }

        const msg = await utils.messenger.getMessageByNumber(interaction, utils.user, interaction.options.getInteger("number")); 
        if(!msg)
            return; 
        
        let otherUser = await utils.db.findUsername(interaction, msg.sender_username);
        if(!otherUser)
            return;
     
        let details = msg.message_content.split("|");

        // Get more info on a request
        if(subCommand == "info") {
            console.log(msg);
            let msgContent = ``;
            if(msg.message_type == "battle") {

                let yourBot = await utils.dbBots.findBotObj(interaction, details[1]);
                let otherBot = await utils.dbBots.findBotObj(interaction, details[0]);
                let scene = await new BattleView(interaction, yourBot, otherBot);
                
                if(!await scene.createCards())
                    return;

                msgContent += `**__${msg.recipient_username}'s ${yourBot.name}__ VS __${msg.sender_username}'s ${otherBot.name}__.**\n\n`;
                msgContent += `The wager is \`${details[2]}\`, this means that ${wagers[details[2]]}.\n\n`;
                msgContent += `Like all battles, neither player will know their opponent's \`/chip\` selection until the battle commences. Be sure to keep this secret as it will influence the battle outcome.\n\n`;
                msgContent += `To accept: \`/battle accept ${msg.message_number}\`\nTo reject: \`/battle reject ${msg.message_number}\``;

                await interaction.editReply({ 
                    content: `${msgContent}`, 
                    files: [scene.getScene()] })
                .catch(e => utils.consola.error(e));
                
            } else if(msg.message_type == "trade") {
                let sellingBot = await utils.dbBots.findBotObj(interaction, details[2]);
                let sellingUser, buyingUser;
                
                // If recipient is the selling user
                if(details[0] == utils.user) {
                    sellingUser = utils.user;
                    buyingUser = otherUser;
                } else {
                    sellingUser = otherUser;
                    buyingUser = utils.user;
                }

                let card = await new Card(interaction, sellingBot);
                if(!await card.createCard())
                    return;

                msgContent += `**__${sellingUser.username}'s ${sellingBot.name} for x${details[3]} ${machinePartEmoji} Machine Parts!__**\n\n`;
                msgContent += `The buyer (${buyingUser.username}) will pay the seller (${sellingUser.username}) ${details[3]} Machine Parts for their ${sellingBot.name}.\n\n`;
                msgContent += `To accept: \`/trade accept ${msg.message_number}\`\nTo reject: \`/trade reject ${msg.message_number}\``;

                await interaction.editReply({ 
                    content: `${msgContent}`, 
                    files: [card.getCard()] })
                .catch(e => utils.consola.error(e));

            } else if(msg.message_type == "friend") {
                msgContent += `**__${otherUser.username} has sent you a friend request__**\n\n`;
                msgContent += `If you choose to accept, this user will be able to send you battle/trade requests even if your \`/privacy\` settings are "Private" or "Moderate".\n\n`;
                msgContent += `You may remove them at any time using \`/friend remove ${otherUser.username}\`\n\n`;
                msgContent += `To accept: \`/friend accept ${msg.message_number}\`\nTo reject: \`/friend reject ${msg.message_number}\``;

                await interaction.editReply({
                    content: `${msgContent}`})
                .catch(e => utils.consola.error(e));
            }
        }

    }
}