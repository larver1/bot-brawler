const fs = require('fs');
const { MessageActionRow, MessageSelectMenu } = require("discord.js");
const achievementData = JSON.parse(fs.readFileSync('./Data/Achievements/achievementsData.json'));
const { v4: uuidv4 } = require('uuid');

module.exports = {
    name: "achievements",
    description: "View all of your achievements.",
    /**
     * @param {CommandInteraction} CommandInteraction
     * @param {Object} executeObj
     */
    async execute(interaction, utils) {

        // Add all achievements as options
        let optionsList = [];
        let selectedAchievement;
        for(let i = 0; i < achievementData.length; i++) {
            let achievement = achievementData[i];
            optionsList.push({
                label: `${achievement.name}`,
                value: `${i}`
            });
        }

        await utils.dbAchievements.editAchievement(interaction, utils.username, "Conqueror", 5);

        let listId = uuidv4();
        const list = new MessageActionRow()
            .addComponents(
                new MessageSelectMenu()
                    .setCustomId(listId)
                    .setPlaceholder('Choose an achievement')
                    .addOptions(optionsList)
            );

        const information = new utils.embed(interaction, utils.user)
            .setTitle(`Achievement Progress: None`)
            .setDescription(`(None selected)`)

        // Display current achievement progress
        await interaction.editReply({
            embeds: [information],
            components: [list]
        }).catch((e) => utils.consola.error(e));

        const filter = i => (i.user.id === interaction.user.id && (i.customId == listId));
        const collector = interaction.channel.createMessageComponentCollector({ filter });
       
        collector.on('collect', async i => {
            await i.deferUpdate()
                .catch(e => utils.consola.error(e));

            selectedAchievement = achievementData[parseInt(i.values)];
            
            // Update current description information
            let descriptionMsg = `*${selectedAchievement.description}*\n\n`;
            for(const desc of selectedAchievement.values) {
                descriptionMsg += `❌\t${desc[1]}\n`
            }

            information.setTitle(`Achievement Progress: ${selectedAchievement.name}`)
            information.setDescription(`${descriptionMsg}`)

            // Update message
            await interaction.editReply({
                embeds: [information]
            }).catch((e) => utils.consola.error(e));

        });

    }

}