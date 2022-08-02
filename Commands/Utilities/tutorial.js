const machinePartEmoji = "<:machine_parts:992728693799669801>";
const energyEmoji = "<:energy_v1:993195219224903832>";
const fs = require('fs');
const tutorialData = JSON.parse(fs.readFileSync('./Data/Misc/tutorialData.json'));

module.exports = {
    name: "tutorial",
    description: "Get taught the basics of Bot Brawler.",
    /***
     * @param {CommandInteraction} interaction
     * @param {Object} utils
     */
    async execute(interaction, utils) {
        
        await utils.user.pause(false);

        await utils.db.checkTutorial(interaction, null, true);

        const dialog = new utils.embed(interaction, utils.user)
            .setTitle(`Clunk the Tutorial Bot`)
            .setDescription(`${tutorialData[utils.user.tutorial > 0 ? utils.user.tutorial : 0].text}`)
            .setThumbnail(`https://i.imgur.com/9ASFW97.png`)

        await interaction.editReply({
            embeds: [dialog]
        }).catch((e) => utils.consola.error(e));

    }

}