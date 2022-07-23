const machinePartEmoji = "<:machine_parts:992728693799669801>";

module.exports = {
    name: "tasks",
    description: "View your daily tasks.",
    /**
     * @param {CommandInteraction} CommandInteraction
     * @param {Object} executeObj
     */
    async execute(interaction, utils) {

        let numHours = Math.abs(Date.now() - utils.user.daily) / 36e5;
        let msg = ``;
        let allCompleted = true;

        if(!utils.user.tasks[0].name) {
            await interaction.editReply({ content: 'You have no daily tasks available...' })
                .catch((e) => utils.consola.error(e));
                
            await utils.user.pause(false);     
            return;
        }

        for(const task of utils.user.tasks) {
            msg += `${task.completed == "true" ? '✅' : '❌'} __${task.name}__\n${task.description}\n\n`;
            if(task.completed != "true")
                allCompleted = false;
        }

        msg += `Reward: \`x100\` ${machinePartEmoji} Machine Parts!`;

        const information = new utils.embed(interaction, utils.user)
            .setTitle(`Daily Tasks`)
            .setDescription(`Time until expiration: ⏰ \`${(24 - numHours).toFixed(2)} hours\`.\n\n${msg}`)

        if(numHours >= 24) {
            information.setDescription(`Your tasks have expired... Use \`/daily\` to get more.`)
            await utils.dbAchievements.clearTasks(interaction);
        } else if(allCompleted) {
            // User has completed all tasks
            if(!await utils.db.add(interaction, "balance", 100)) {
                await utils.user.pause(false); 
                return;
            }
            await utils.dbAchievements.clearTasks(interaction);
            information.setDescription(`🎉 Congratulations! You have completed your daily tasks and earned \`x100\` ${machinePartEmoji} Machine Parts!`);
        }

        // Display current task progress
        await utils.user.pause(false);
        await interaction.editReply({
            embeds: [information],
        }).catch((e) => utils.consola.error(e));

    }

}