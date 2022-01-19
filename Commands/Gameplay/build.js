const { Client, MessageEmbed } = require("discord.js");
const BotBuilder = require("../../Helpers/BotBuilder");
const BotObj = require("../../Data/Bots/BotObj");

module.exports = {
    name: "build",
    description: "Build your very own Battle Bot.",
    /**
     * @param {CommandInteraction} CommandInteraction
     * @param {Object} executeObj
     */
    async execute(interaction, utils) {


        let botsToChoose = ["Bostrom", "Compactisk", "Greedisk"];
        let botChoice = botsToChoose[Math.floor(Math.random() * botsToChoose.length)];

        //Displays amount of money
        let bot = await BotBuilder.build(interaction, {bot_type: botChoice, exp: Math.ceil(Math.random() * 100)}, utils.user);
        console.log(bot);
        let botObj = await new BotObj(interaction, bot); 
        let opponentObj = await new BotObj(interaction, bot);

        botObj.setChip("power");
        opponentObj.setChip("lifespan");

        botObj.battle(opponentObj);
        opponentObj.battle(botObj);

        let collection = await utils.user.getBots();

        //If card fails to create, return
        const card = await new utils.card(interaction, botObj);
        if(!await card.createCard())
            return;

        await interaction.editReply({ files: [card.getCard()], content: `${utils.user.username} built a *PROTOTYPE:${botObj.bot_type.toUpperCase()}*` });

        return utils.user.createBot(bot);

    }

}