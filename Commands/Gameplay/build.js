const { Client, MessageEmbed } = require("discord.js");
const BotBuilder = require("../../Helpers/BotBuilder");

module.exports = {
    name: "build",
    description: "Build your very own Battle Bot.",
    /**
     * @param {CommandInteraction} CommandInteraction
     * @param {Object} executeObj
     */
    async execute(interaction, utils) {

        //Displays amount of money
        let bot = await BotBuilder.build(interaction, {}, utils.user);
        console.log(bot);

        await interaction.editReply({ embeds: [ 
            new utils.embed(interaction, utils.user)
                .setTitle(`${utils.user.username} built Prototype:${bot.bot_type}`)
                .setDescription(`Power Boost: **${bot.powerBoost}**\nLifespan Boost: **${bot.lifespanBoost}**\nViral Boost: **${bot.viralBoost}**\nFirewall Boost: **${bot.firewallBoost}**\n\nTrain it well, ${utils.user.username}!`)] })
                    .catch((e) => utils.consola.error(e));

        return utils.user.createBot(bot);

        

    }

}