const powerEmoji = `<:power:965731751009849406>`;
const lifespanEmoji = `<:lifespan:965731750510727228>`;
const viralEmoji = `<:Viral_v1:965943499801382983>`;
const firewallEmoji = `<:firewall:965731750795935844>`;
const machinePartEmoji = "<:machine_parts:992728693799669801>";

module.exports = {
    name: "market",
    description: "Buy and sell Bot Brawlers on the Global Market.",
    usage: "`/market view` allows you to choose a Bot Level and browse all of the available bots.\n`/market sell` allows you to put a bot for sale on the market.\n`/market withdraw` allows you to withdraw a bot you put up for sale.\n`/market buy` allows you to buy a bot from the market.",
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
            {
                name: "BETA: 1",
                value: "9"
            },
            {
                name: "BETA: 2",
                value: "10"
            },
            {
                name: "BETA: 3",
                value: "11"
            },
            {
                name: "COMPLETE: 1",
                value: "12"
            },
            {
                name: "COMPLETE: 2",
                value: "13"
            },
            {
                name: "COMPLETE: 3",
                value: "14"
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
            {
                name: "BETA: 1",
                value: "9"
            },
            {
                name: "BETA: 2",
                value: "10"
            },
            {
                name: "BETA: 3",
                value: "11"
            },
            {
                name: "COMPLETE: 1",
                value: "12"
            },
            {
                name: "COMPLETE: 2",
                value: "13"
            },
            {
                name: "COMPLETE: 3",
                value: "14"
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
            let msg = ``;

            // Display each bot and their price
            for(const bot of bots) {
                msg += `${bot.findColour().emoji}\`${bot.name}\`\n${powerEmoji}\`${bot.battleStats.power}\`${lifespanEmoji}\`${bot.battleStats.lifespan}\`${viralEmoji}\`${bot.battleStats.viral}\`${firewallEmoji}\`${bot.battleStats.firewall}\`\n`;
                msg += `${machinePartEmoji}\`x${bot.price}\`\n\n`;
            }

            // Allow user to flick through
            await utils.messageHelper.listPages(interaction, utils.user, msg, {
                title: `Bots for sale!`,
                linesPerPage: 30
            });

            await utils.user.pause(false);
            return;
        } else if(subCommand == "sell") {
            let bots = await utils.user.getBots();
            let collection = await new utils.botCollection(bots, interaction);
            const price = await interaction.options.getInteger("price");

            if(!price || price <= 0) {
                await utils.user.pause(false);
                let err = new Error(`You cannot sell a bot for that price.`);
                await utils.handler.info(interaction, err);
                return;
            }

            // Add selected bot to market
            if(!await collection.inspectCollection(interaction, utils.user))  {
                await utils.user.pause(false);
                return;
            }

            collection.selectedEvent.on(`selected`, async () => {
                const card = await new utils.card(interaction, collection.selected);
                if(!await card.createCard()) {
                    await utils.user.pause(false);
                    return;
                }

                let serviceCharge = 10 + Math.round(collection.selected.exp / 10);
                if(utils.user.balance < serviceCharge)
                {
                    await utils.user.pause(false);
                    return utils.handler.info(interaction, new Error(`You don't have enough ${machinePartEmoji} Machine Parts to pay the service charge. Try out \`/daily\` to get more.`));
                }

                // Add bot to market and change ownership
                if(!await utils.dbMarket.addBotToMarket(interaction, utils.user.username, collection.selected.botObj.bot_id, price)) {
                    await utils.user.pause(false);
                    return;
                }
                if(!await utils.dbBots.changeOwner(interaction, collection.selected.botObj.bot_id, "", true)) {
                    await utils.user.pause(false);
                    return;
                }

                if(!await utils.db.remove(interaction, "balance", serviceCharge))
                {
                    await utils.user.pause(false);
                    return;   
                }

                await interaction.editReply({ 
                    content: `You paid ${machinePartEmoji}\`x${serviceCharge}\` for the service charge and listed your bot on the market!\n If you change your mind, use \`/market withdraw\`\n\n`, 
                    components: [], 
                    files: [card.getCard()] })
                .catch((e) => utils.consola.error(e));

                await utils.userFile.writeUserLog(utils.user.username, `listed ${collection.selected.botObj.bot_type} on the market with ID ${collection.selected.botObj.bot_id} with offer of ${price}.`);
                await utils.dbBots.addLogs(interaction, collection.selected.botObj.bot_id, `was put on the market with offer x${price} Machine Parts.`);

                await utils.user.pause(false);
                return;
            });

        } else if(subCommand == "withdraw") {
            
            let sellingBots = await utils.dbMarket.findBotsBySeller(interaction, utils.user.username);
            let collection = await new utils.botCollection([], interaction);
            collection.objs = sellingBots;

            if(!await collection.inspectCollection(interaction, utils.user))  {
                await utils.user.pause(false);
                return;
            }

            collection.selectedEvent.on(`selected`, async () => {
                const card = await new utils.card(interaction, collection.selected);
            
                if(!await card.createCard()) {
                    await utils.user.pause(false);
                    return;
                }

                // Remove bot from market and give user ownership
                if(!await utils.dbMarket.removeBotFromMarket(interaction, utils.user.username, collection.selected.botObj.bot_id)) {
                    await utils.user.pause(false);
                    return;
                }
                if(!await utils.dbBots.changeOwner(interaction, collection.selected.botObj.bot_id, utils.user.username)) {
                    await utils.user.pause(false);
                    return;
                }

                await utils.userFile.writeUserLog(utils.user.username, `withdrew ${collection.selected.botObj.bot_type} from the market with ID ${collection.selected.botObj.bot_id}.`);
                await utils.dbBots.addLogs(interaction, collection.selected.botObj.bot_id, `was withdrawn from the market.`);
                
                let serviceCharge = 10 + Math.round(collection.selected.exp / 10);
                if(!await utils.db.add(interaction, "balance", serviceCharge)){
                    await utils.user.pause(false);
                    return;
                }

                await interaction.editReply({ 
                    files: [card.getCard()],
                    content: `Your bot was removed from the market, and added back to your collection! \nYou were returned your service charge of ${machinePartEmoji}\`x${serviceCharge}\``,
                    components: [] })
                .catch(e => utils.consola.error(e));

                await utils.user.pause(false);
            })

        } else if(subCommand == "buy") {
            const botLevel = await interaction.options.getString("level");
            let bots = await utils.dbMarket.findBotsByLevel(interaction, parseInt(botLevel));
            let collection = await new utils.botCollection([], interaction);
            collection.objs = bots;

            if(!await collection.inspectCollection(interaction, utils.user, 1))  {
                await utils.user.pause(false);
                return;
            }

            collection.selectedEvent.on(`selected`, async () => {
                
                await utils.messageHelper.confirmChoice(interaction, interaction.user, `Do you wish to buy ${collection.selected.name} for \`x${collection.selected.price}\` ${machinePartEmoji} Machine Parts?`);
                utils.messageHelper.replyEvent.on(`accepted`, async i => {

                    if(i.id != interaction.id)
                        return;

                    if(utils.user.balance < collection.selected.price) {
                        await utils.user.pause(false);
                        return utils.handler.info(interaction, new Error(`You don't have enough ${machinePartEmoji} Machine Parts to do this. Try out \`/daily\` to get more.`));
                    }

                    const card = await new utils.card(interaction, collection.selected);
                    if(!await card.createCard()) {
                        await utils.user.pause(false);
                        return;
                    }

                    const otherUser = await utils.db.findUsername(interaction, collection.selected.seller_username);
    
                    if(otherUser.username == utils.user.username) {
                        let err = new Error(`You cannot buy your own bot. If you wish to withdraw your listing, use \`/market withdraw\`.`);
                        await utils.handler.info(interaction, err);
                        await utils.user.pause(false);
                        return;
                    }

                    // Remove bot from market and give user ownership
                    if(!await utils.db.remove(interaction, "balance", collection.selected.price)) {
                        await utils.user.pause(false);
                        return;
                    }
                    if(!await utils.db.add(interaction, "balance", collection.selected.price, otherUser.user_id)) {
                        await utils.user.pause(false);
                        return;
                    }
                    if(!await utils.dbMarket.removeBotFromMarket(interaction, utils.user.username, collection.selected.botObj.bot_id)) {
                        await utils.user.pause(false);
                        return;
                    }
                    if(!await utils.dbBots.changeOwner(interaction, collection.selected.botObj.bot_id, utils.user.username)) {
                        await utils.user.pause(false);
                        return;
                    }

                    await utils.dbAchievements.checkTask(interaction, otherUser.username, "Investor");

                    // Add achievement
                    let achievementIndex = 0;
                    switch(collection.selected.findColour().type) {
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

                    await utils.dbAchievements.editAchievement(interaction, utils.user.username, "Army Builder", collection.selected.botObj.bot_id, achievementIndex);
                    await utils.dbAchievements.editAchievement(interaction, utils.user.username, "Entrepreneur", collection.selected.botObj.bot_id);
                    await utils.dbAchievements.editAchievement(interaction, otherUser.username, "Entrepreneur", collection.selected.botObj.bot_id);

                    await utils.userFile.writeUserLog(utils.user.username, `bought ${collection.selected.botObj.bot_type} from the market with ID ${collection.selected.botObj.bot_id} for ${collection.selected.price}.`);
                    await utils.dbBots.addLogs(interaction, collection.selected.botObj.bot_id, `was bought off the market for x${collection.selected.price} Machine Parts.`);
                    
                    await interaction.editReply({ 
                        files: [card.getCard()],
                        content: `You have bought this bot and it has been added to your collection!`,
                        components: [],
                        embeds: [] })
                    .catch(e => utils.consola.error(e));
                    
                    await utils.user.pause(false);
                    return;

                });

                utils.messageHelper.replyEvent.on(`rejected`, async i => {

                    if(i.id != interaction.id)
                        return;

                    await interaction.editReply({ 
                        files: [],
                        content: `The command was cancelled.`,
                        components: [],
                        embeds: [] })
                    .catch(e => utils.consola.error(e));                    
                    await utils.user.pause(false);
                    return;
                }); 

            });

        }

    }

}