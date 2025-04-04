const fs = require('fs');
const bots = JSON.parse(fs.readFileSync('./Data/Bots/botData.json'));

module.exports = {
    name: "info",
    description: "Find more information about the Battle Bots.",
    usage: "`/info bot` allows you to get information of a certain bot name (e.g. Greedisk).",
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
        let searchedBot = interaction.options.getString("bot").toLowerCase(); 
        let foundBot;
        let goldPlated = false;

        if(searchedBot.includes(" gold plated")) {
            searchedBot = searchedBot.replace(" gold plated", "");
            goldPlated = true;
        }

        //Search for the bot by name
        for(let i = 0; i < bots.length; i++) {
            if(bots[i].name.toLowerCase() == searchedBot.toLowerCase()) {
                foundBot = bots[i];
                break;
            }
        }

        //Name doesn't exist
        if(!foundBot)  {
            await utils.user.pause(false); 
            return utils.handler.info(interaction, new Error(`A bot of the name '${searchedBot}' does not exist.`));
        }

        let exists = await utils.dbBotStats.getData(interaction, foundBot.name, "exists");
        let alive = await utils.dbBotStats.getData(interaction, foundBot.name, "alive");
        let wins = await utils.dbBotStats.getData(interaction, foundBot.name, "wins");
        let losses = await utils.dbBotStats.getData(interaction, foundBot.name, "losses");

        //Display the Battle Bot info
        const Info = new utils.embed(interaction, utils.user)
            .setTitle(`${foundBot.name} ${goldPlated ? "Gold Plated" : ""}`)
            .setDescription(`Power Output: **${foundBot.basePower}**\nLifespan: **${foundBot.baseLifespan}**\nViral: **${foundBot.baseViral}**\nFirewall: **${foundBot.baseFirewall}**\n\n*${foundBot.ability}: ${foundBot.abilityDescription}*\n\nTotal Built: **${exists}**\nTotal Alive: **${alive}**\n\nGlobal Wins: **${wins}**\nGlobal Losses: **${losses}**\n\n${foundBot.description}`)

        if(foundBot.image.length) {
            if(goldPlated)
                Info.setImage(foundBot.imageGoldPlated)
            else
                Info.setImage(foundBot.image);
        } 

        await utils.user.pause(false);     
        await interaction.editReply({ embeds: [Info] })
            .catch((e) => utils.consola.error(e));
    }
}