const { Client, MessageEmbed } = require("discord.js");

module.exports = {
    name: "parts",
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
                    .setDescription(`Your total machine parts is: \`${utils.user.balance}\`.`)] })
                        .catch((e) => utils.consola.error(e));

    }

}