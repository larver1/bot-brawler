const { Client, MessageEmbed } = require("discord.js");

module.exports = {
    name: "daily",
    description: "View your total number of Machine Parts.",
    /**
     * @param {CommandInteraction} CommandInteraction
     * @param {Object} executeObj
     */
    async execute(interaction, utils) {

        //Find hours since last drop
        let numHours = Math.abs(Date.now() - utils.user.daily) / 36e5;

        //Displays amount of money
        if(numHours < 24)
            return interaction.editReply({ embeds: [ 
                new utils.embed(interaction, utils.user)
                    .setDescription(`You cannot claim your daily Machine Parts yet. You can claim 24 hours after your last claim.\n\n⏰ **${(24 - numHours).toFixed(2)} hours remaining**...`)] })
                        .catch((e) => utils.consola.error(e));

        //Daily command was successful
        let numParts = Math.ceil(Math.random() * 50) + 20;
        
        await interaction.editReply({ embeds: [ 
            new utils.embed(interaction, utils.user)
                .setTitle(`${utils.user.username}, here are your daily rewards!`)
                .setDescription(`\`+${numParts}\` Machine Parts!`)] })
                    .catch((e) => utils.consola.error(e));

        //Adds correct number of parts
        await utils.db.add(interaction, "balance", numParts);
        
        //Resets daily to current time
        await utils.db.add(interaction, "daily");

        

    }

}