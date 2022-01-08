const { ContextMenuInteraction, MessageEmbed } = require("discord.js");

module.exports = {
    name: "userinfo",
    type: "USER",
    permission: "",
    /***
     * @param {ContextMenuInteraction} interaction
     * @param {Object} utils
     */
    async execute(interaction, utils){
        const target = await interaction.guild.members.fetch(interaction.targetId);

        const Response = new utils.embed(interaction)
            .setTitle("User Info")
            .setAuthor({ name: target.user.tag, iconURL: target.user.avatarURL({ dynamic: true, size: 512 }) })
            .setThumbnail(target.user.avatarURL({ dynamic: true, size: 512 }))
            .addField("ID", `${target.user.id}`, true)
            .addField("Roles", `${target.roles.cache.map(r => r).join(" ").replace("@everyone", "") || "None"}`, true)
            .addField("Member Since", `<t:${parseInt(target.joinedTimestamp / 1000)}:R>`, true)
            .addField("Discord User Since", `<t:${parseInt(target.user.createdTimestamp / 1000)}:R>`, true)

        interaction.editReply({ embeds: [Response] })
            .catch((e) => utils.consola.error(e));;
    }
}