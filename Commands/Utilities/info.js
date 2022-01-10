const { MessageEmbed } = require("discord.js");
const fs = require('fs');
const bots = JSON.parse(fs.readFileSync('./Data/Bots/botData.json'));

module.exports = {
    name: "info",
    description: "Find more information about the Battle Bots.",
    options: [{
        name: "bot",
        description: "The name of the Bot.",
        required: true,
        type: "STRING",
    }],
    /***
     * @param {CommandInteraction} interaction
     * @param {Object} utils
     */
    async execute(interaction, utils){
        let searchedBot = interaction.options.getString("bot"); 
        let foundBot;

        //Search for the bot by name
        for(let i = 0; i < bots.length; i++) {
            if(bots[i].name.toLowerCase() == searchedBot.toLowerCase()) {
                foundBot = bots[i];
                break;
            }
        }

        //Name doesn't exist
        if(!foundBot)
            return utils.handler.info(interaction, new Error(`A bot of the name '${searchedBot}' does not exist.`));

        //Display the Battle Bot info
        const Info = new utils.embed(interaction)
            .setTitle(`${foundBot.name}`)
            .setDescription(`Power Output: **${foundBot.basePower}**\nLifespan: **${foundBot.baseLifespan}**\nViral: **${foundBot.baseViral}**\nFirewall: **${foundBot.baseFirewall}**\n\n${foundBot.description}`)

        interaction.editReply({ embeds: [Info] })
            .catch((e) => utils.consola.error(e));;
    }
}