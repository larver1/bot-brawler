const { Client, MessageEmbed, MessageActionRow, MessageSelectMenu, MessageButton } = require("discord.js");
const BotBuilder = require("../../Helpers/BotBuilder");
const BotObj = require("../../Data/Bots/BotObj");
const BattleView = require("../../Helpers/BattleView");
const BotCollection = require("../../Helpers/BotCollection");
const { promisify } = require('util');
const ErrorHandler = require("../../Helpers/ErrorHandler");
const sleep = promisify(setTimeout);

module.exports = {
    name: "trade",
    description: "Trade your bot with another player for Machine Parts.",
    options: [
    {
        name: "buy",
        description: "Buy a bot from another user on the server.",
        required: false,
        type: "SUB_COMMAND",
        options: [
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
        name: "sell",
        description: "Sell a bot to another user on the server.",
        required: false,
        type: "SUB_COMMAND",
        options: [
        {
            name: "user",
            description: "The user you wish to sell to.",
            required: true,
            type: "USER",
        },
        {
            name: "amount",
            description: "The amount of Machine Parts you will receive.",
            required: true,
            type: "INTEGER",
        },
        ]
    },

],
    /**
     * @param {CommandInteraction} CommandInteraction
     * @param {Object} executeObj
     */
    async execute(interaction, utils) {

        let user = utils.user;
        let sellingUser, buyingUser;
        let otherUser = await utils.db.findUser(interaction, interaction.options.getUser("user").id);
        const subCommand = interaction.options.getSubcommand();
        let amount = interaction.options.getInteger("amount");

        // If buying, then select from other user's cards instead
        if(subCommand == "buy") {
            sellingUser = otherUser;
            buyingUser = user;
        } else {
            sellingUser = user;
            buyingUser = otherUser;
        }

        let bots = await sellingUser.getBots();
        let collection = await new BotCollection(bots, interaction);

        if(!collection || !sellingUser)
            return;

        // If the buying user doesn't have sufficient funds, return
        if(amount > buyingUser.balance) {
            let err = new Error(`\`${buyingUser.username}\` does not have sufficient funds`);
            return utils.handler.info(interaction, err);
        }

        // Inspect the collection
        await collection.inspectCollection(interaction, 1);

        // When a card is selected, display it
        collection.selectedEvent.on(`selected`, async () => {

            // Select bot to buy/sell
            let yourBot = collection.selected;
            const yourCard = await new utils.card(interaction, yourBot);

            if(!await yourCard.createCard())
                return;

            // Exchange money from buyer to seller
            await utils.db.remove(interaction, "balance", amount, buyingUser.user_id);
            await utils.db.add(interaction, "balance", amount, sellingUser.user_id);

            // Exchange bot ownership
            await utils.dbBots.changeOwner(interaction, yourBot.botObj.bot_id, buyingUser.username);

            // Display confirmation message
            await interaction.editReply({ files: [yourCard.getCard()], content: 
                `\`${sellingUser.username}'s ${yourBot.name}\` has been sold to \`${buyingUser.username} for ${amount}x\` Machine Parts!`
            }).catch((e) => utils.consola.error(e));

        });

    }

}