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
        let bot = await BotBuilder.build(interaction, {}, utils.user);
        console.log(bot);
        let botObj = await new BotObj(interaction, bot); 
        console.log(botObj);

        await interaction.editReply({ embeds: [ 
            new utils.embed(interaction, utils.user)
                .setTitle(`${utils.user.username} built Prototype:${bot.bot_type}`)
                .setImage(`${botObj.image}`)
                .setDescription(`Power: **${botObj.power}** (${botObj.powerBoost})\nLifespan: **${botObj.lifespan}** (${botObj.lifespanBoost})\nViral: **${botObj.viral}**(${botObj.viralBoost})\nFirewall: **${botObj.firewall}**(${botObj.firewallBoost})\n\nTrain it well, ${utils.user.username}!`)] })
                    .catch((e) => utils.consola.error(e));

        return utils.user.createBot(bot);

    }

}