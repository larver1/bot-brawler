const { ContextMenuInteraction, MessageEmbed } = require("discord.js");

module.exports = {
    name: "userinfo",
    type: "USER",
    permission: "",
    /***
     * @param {ContextMenuInteraction} interaction
     * @param {Object} exec
     */
    async execute(interaction, exec){
        const target = await interaction.guild.members.fetch(interaction.targetId);

        const Response = new MessageEmbed()
            .setColor("AQUA")
            .setTitle("User Info")
            .setAuthor({ name: target.user.tag, iconURL: target.user.avatarURL({ dynamic: true, size: 512 }) })
            .setThumbnail(target.user.avatarURL({ dynamic: true, size: 512 }))
            .addField("ID", `${target.user.id}`, true)
            .addField("Roles", `${target.roles.cache.map(r => r).join(" ").replace("@everyone", "") || "None"}`, true)
            .addField("Member Since", `<t:${parseInt(target.joinedTimestamp / 1000)}:R>`, true)
            .addField("Discord User Since", `<t:${parseInt(target.user.createdTimestamp / 1000)}:R>`, true)

        interaction.reply({ embeds: [Response] });
    }
}