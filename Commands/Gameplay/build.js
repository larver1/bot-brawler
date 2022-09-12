const BotBuilder = require("../../Helpers/BotBuilder");
const BotObj = require("../../Data/Bots/BotObj");
const machinePartEmoji = "<:machine_parts:992728693799669801>";
const energyEmoji = "<:energy_v1:993195219224903832>";

module.exports = {
    name: "build",
    description: "Build a Bot Brawler to use in battles.",
    usage: "`/build type` allows you to build a Bot with a certain amount of starting EXP.",
    options: [{
        name: "type",
        description: "Choose the level the bot will start off at.",
        type: "STRING",
        required: true,
        choices: [
            {
                name: "Regular",
                value: "regular"
            }, 
            {
                name: "Super",
                value: "super"
            }, 
            {
                name: "Extreme",
                value: "extreme"
            }    
        ]},
    ],
    /**
     * @param {CommandInteraction} CommandInteraction
     * @param {Object} executeObj
     */
    async execute(interaction, utils) {

        let type = await interaction.options.getString("type");
        let exp = 0;
        let energyCost = 25;
        let moneyCost = 10;

        switch(type) {
            case "regular":
                exp = Math.round(Math.random() * 5) + 0;
                break;
            case "super":
                exp = Math.round(Math.random() * 10) + 5;
                moneyCost = 20;
                break;
            case "extreme":
                exp = Math.round(Math.random() * 20) + 15;
                moneyCost = 35;
                break;
        }

        if(utils.debug) {
            energyCost = 0;
            moneyCost = 0;
        }

        await utils.messageHelper.confirmChoice(interaction, interaction.user, `Do you wish to build a ${type} bot for \n\`x${moneyCost}\` ${machinePartEmoji} Machine Parts\n\`x${energyCost}\` ${energyEmoji} Energy?`);

        utils.messageHelper.replyEvent.on(`accepted-${interaction.id}`, async () => {

            await utils.db.checkTutorial(interaction, "build");

            // Not enough energy
            if(utils.user.energy < energyCost) {
                await utils.user.pause(false);
                return utils.handler.info(interaction, new Error(`You don't have enough ${energyEmoji} Energy to do this. Try out \`/daily\` to get more.`));
            }

            // Not enough parts
            if(utils.user.balance < moneyCost) {
                await utils.user.pause(false);
                return utils.handler.info(interaction, new Error(`You don't have enough ${machinePartEmoji} Machine Parts to do this. Try out \`/daily\` to get more.`));
            }
            
            // Displays amount of money
            let bot = await BotBuilder.build(interaction, { item: "balanced", exp: exp }, utils.user);
            let botObj = await new BotObj(interaction, bot); 

            if(bot.goldPlated) {
                await utils.dbAchievements.editAchievement(interaction, utils.user.username, "Struck Gold", 1);    
            }

            // If card fails to create, return
            const card = await new utils.card(interaction, botObj);
            if(!await card.createCard()) {
                await utils.user.pause(false);
                return;
            } 
            // Removes correct number of parts
            if(!await utils.db.remove(interaction, "balance", moneyCost)) {
                await utils.user.pause(false);
                return;
            } 

            // Removes correct number of energy
            if(!await utils.db.remove(interaction, "energy", energyCost)) {
                await utils.user.pause(false);
                return;
            } 

            // Add bot to existence
            await utils.user.createBot(bot);
            await utils.dbBots.changeOwner(interaction, bot.bot_id, utils.user.username);

            await utils.userFile.writeUserLog(utils.user.username, `built a ${botObj.bot_type.toUpperCase()} with ID ${bot.bot_id}`);
            await utils.dbBots.addLogs(interaction, bot.bot_id, `was built with ${bot.exp} EXP.`);

            await utils.user.pause(false);
            return interaction.editReply({ 
                files: [card.getCard()], 
                content: `${utils.user.username} built a *PROTOTYPE:${botObj.bot_type.toUpperCase()}*`,
                embeds: [],
                components: []
            }).catch(e => utils.consola.error(e));

        });

        utils.messageHelper.replyEvent.on(`rejected-${interaction.id}`, async () => {

            await utils.user.pause(false);
            await interaction.editReply({ 
                content: `The build was cancelled...`,
                components: [],
                embeds: []    
            }).catch((e) => utils.consola.error(e));
        });

    }

}