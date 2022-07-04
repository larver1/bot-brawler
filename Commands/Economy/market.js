const powerEmoji = `<:power:965731751009849406>`;
const lifespanEmoji = `<:lifespan:965731750510727228>`;
const viralEmoji = `<:Viral_v1:965943499801382983>`;
const firewallEmoji = `<:firewall:965731750795935844>`;
const machinePartEmoji = "<:machine_parts:992728693799669801>";

module.exports = {
    name: "market",
    description: "Buy and sell Bot Brawlers on the Global Market.",
    options: [{
        name: "view",
        description: "Browse Bot Brawlers on the Global Market.",
        required: false,
        type: "SUB_COMMAND",
        options: [{
            name: "level",
            description: "Choose which colour to filter by.",
            required: true,
            type: "STRING",
            choices: [{
                name: "PROTOTYPE: 1",
                value: "0"
            },
            {
                name: "PROTOTYPE: 2",
                value: "1"
            },
            {
                name: "PROTOTYPE: 3",
                value: "2"
            },
            {
                name: "TESTING: 1",
                value: "3"
            },
            {
                name: "TESTING: 2",
                value: "4"
            },
            {
                name: "TESTING: 3",
                value: "5"
            },
            {
                name: "ALPHA: 1",
                value: "6"
            },
            {
                name: "ALPHA: 2",
                value: "7"
            },
            {
                name: "ALPHA: 3",
                value: "8"
            },
        ],
        },
    ]},
    {
        name: "sell",
        description: "Put a Bot Brawler up for sale on the Global Market.",
        required: false,
        type: "SUB_COMMAND",
        options: [{
            name: "price",
            description: "Choose a price in Machine Parts.",
            required: true,
            type: "INTEGER"
        }],
    },
    {
        name: "withdraw",
        description: "Remove a Bot Brawler you are selling on the Global Market.",
        required: false,
        type: "SUB_COMMAND",
    },
    {
        name: "buy",
        description: "Buy a Bot Brawler on the Global Market.",
        required: false,
        type: "SUB_COMMAND",
        options: [{
            name: "level",
            description: "Choose which colour to filter by.",
            required: true,
            type: "STRING",
            choices: [{
                name: "PROTOTYPE: 1",
                value: "0"
            },
            {
                name: "PROTOTYPE: 2",
                value: "1"
            },
            {
                name: "PROTOTYPE: 3",
                value: "2"
            },
            {
                name: "TESTING: 1",
                value: "3"
            },
            {
                name: "TESTING: 2",
                value: "4"
            },
            {
                name: "TESTING: 3",
                value: "5"
            },
            {
                name: "ALPHA: 1",
                value: "6"
            },
            {
                name: "ALPHA: 2",
                value: "7"
            },
            {
                name: "ALPHA: 3",
                value: "8"
            },
        ],
        },
        {
            name: "name",
            description: "The name of the Bot Brawler you are going to buy.",
            required: false,
            type: "STRING",
        }
    ]}

],
    /**
     * @param {CommandInteraction} CommandInteraction
     * @param {Object} executeObj
     */
    async execute(interaction, utils) {

        const subCommand = interaction.options.getSubcommand();
        
        // Browse available bots on the market
        if(subCommand == "view") {
            const botLevel = await interaction.options.getString("level");
            let bots = await utils.dbMarket.findBotsByLevel(interaction, parseInt(botLevel));
            console.log(bots);
            let msg = ``;

            // Display each bot and their price
            for(const bot of bots) {
                msg += `${bot.findColour().emoji}\`${bot.name}\`\n${powerEmoji}\`${bot.battleStats.power}\`${lifespanEmoji}\`${bot.battleStats.lifespan}\`${viralEmoji}\`${bot.battleStats.viral}\`${firewallEmoji}\`${bot.battleStats.firewall}\`\n`;
                msg += `💰\`${bot.price}\`\n\n`;
            }

            // Allow user to flick through
            await utils.messageHelper.listPages(interaction, utils.user, msg, {
                title: `Bots for sale!`,
                linesPerPage: 30
            });

            return;
        } else if(subCommand == "sell") {
            let bots = await utils.user.getBots();
            let collection = await new utils.botCollection(bots, interaction);
            const price = await interaction.options.getInteger("price");

            if(!price || price <= 0) {
                let err = new Error(`You cannot sell a bot for that price.`);
                await utils.handler.info(interaction, err);
                return;
            }

            // Add selected bot to market
            await collection.inspectCollection(interaction);            
            collection.selectedEvent.on(`selected`, async () => {
                const card = await new utils.card(interaction, collection.selected);
                if(!await card.createCard())
                    return;

                // Add bot to market and change ownership
                if(!await utils.dbMarket.addBotToMarket(interaction, utils.user.username, collection.selected.botObj.bot_id, price))
                    return;
                if(!await utils.dbBots.changeOwner(interaction, collection.selected.botObj.bot_id, "", true))
                    return;

                await interaction.editReply({ 
                    content: `Your bot is now listed on the market! If you change your mind, use \`/market withdraw\``, 
                    components: [], 
                    files: [card.getCard()] })
                .catch((e) => utils.consola.error(e));

            });

        } else if(subCommand == "withdraw") {
            
            let sellingBots = await utils.dbMarket.findBotsBySeller(interaction, utils.user.username);
            let collection = await new utils.botCollection([], interaction);
            collection.objs = sellingBots;

            await collection.inspectCollection(interaction);
            collection.selectedEvent.on(`selected`, async () => {
                const card = await new utils.card(interaction, collection.selected);
            
                if(!await card.createCard())
                    return;

                // Remove bot from market and give user ownership
                if(!await utils.dbMarket.removeBotFromMarket(interaction, utils.user.username, collection.selected.botObj.bot_id))
                    return;
                if(!await utils.dbBots.changeOwner(interaction, collection.selected.botObj.bot_id, utils.user.username))
                    return;

                await interaction.editReply({ 
                    files: [card.getCard()],
                    content: `Your bot has been removed from the market, and added back to your collection!` })
                .catch(e => utils.consola.error(e));

            })

        } else if(subCommand == "buy") {
            const botLevel = await interaction.options.getString("level");
            let bots = await utils.dbMarket.findBotsByLevel(interaction, parseInt(botLevel));
            let collection = await new utils.botCollection([], interaction);
            collection.objs = bots;

            await collection.inspectCollection(interaction, 1);
            collection.selectedEvent.on(`selected`, async () => {
                
                await utils.messageHelper.confirmChoice(interaction, interaction.user, `Do you wish to buy ${collection.selected.name} for \`x${collection.selected.price}\` ${machinePartEmoji} Machine Parts?`);
                utils.messageHelper.replyEvent.on(`accepted`, async () => {
                    if(utils.user.balance < collection.selected.price) {
                        return utils.handler.info(interaction, new Error(`You don't have enough ${machinePartEmoji} Machine Parts to do this. Try out \`/daily\` to get more.`));
                    }

                    const card = await new utils.card(interaction, collection.selected);
                    if(!await card.createCard())
                        return;

                    const otherUser = await utils.db.findUsername(interaction, collection.selected.seller_username);
    
                    // Remove bot from market and give user ownership
                    if(!await utils.db.remove(interaction, "balance", collection.selected.price))
                        return;
                    if(!await utils.db.add(interaction, "balance", collection.selected.price, otherUser.user_id))
                        return;
                    if(!await utils.dbMarket.removeBotFromMarket(interaction, utils.user.username, collection.selected.botObj.bot_id))
                        return;
                    if(!await utils.dbBots.changeOwner(interaction, collection.selected.botObj.bot_id, utils.user.username))
                        return;
    
                    await interaction.editReply({ 
                        files: [card.getCard()],
                        content: `You have bought this bot and it has been added to your collection!`,
                        components: [],
                        embeds: [] })
                    .catch(e => utils.consola.error(e));

                });
            });

        }

    }

}