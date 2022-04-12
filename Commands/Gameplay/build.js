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


        //Displays amount of money
        let bot = await BotBuilder.build(interaction, { item: "power" }, utils.user);
        let botObj = await new BotObj(interaction, bot); 

        //If card fails to create, return
        const card = await new utils.card(interaction, botObj);
        if(!await card.createCard())
            return;

        //Add bot to existence
        await utils.dbBotStats.addExists(interaction, botObj.bot_type);

        await utils.user.createBot(bot);
        return interaction.editReply({ files: [card.getCard()], content: `${utils.user.username} built a *PROTOTYPE:${botObj.bot_type.toUpperCase()}*` });

    }

}