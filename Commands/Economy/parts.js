const machinePartEmoji = "<:machine_parts:992728693799669801>";
const energyEmoji = "<:energy_v1:993195219224903832>";

module.exports = {
    name: "balance",
    description: "View your total number of Machine Parts.",
    /**
     * @param {CommandInteraction} CommandInteraction
     * @param {Object} executeObj
     */
    async execute(interaction, utils) {

        //Displays amount of money
        if(utils.user)
            return interaction.editReply({ embeds: [ 
                new utils.embed(interaction, utils.user)
                    .setDescription(`${machinePartEmoji} Machine Parts: \`${utils.user.balance}\`\n${energyEmoji} Energy: \`${utils.user.energy}/100\`\n\nGet more resources with \`/daily\``)] })
                        .catch((e) => utils.consola.error(e));

    }

}