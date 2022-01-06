const { Client, MessageEmbed } = require("discord.js");
require("../../Events/Client/ready");

module.exports = {
    name: "status",
    description: "Displays status of client.",
    /**
     * @param {CommandInteraction} CommandInteraction
     * @param {Client} client
     */
    async execute(interaction, client) {
        const Response = new MessageEmbed()
            .setColor("AQUA")
            .setDescription(`**Client**: \`✅ ONLINE\` - \`${client.ws.ping}ms\`\n **Uptime**: <t:${parseInt(client.readyTimestamp / 1000)}:R>\n`)
    
        interaction.reply({ embeds: [Response] });

    }
}

function switchTo(val) {
    let status = " ";
    switch(val) {
        case 0:
            status = "DISCONNECTED";
            break;
        case 1:
            status = "CONNECTED";
            break;
        case 2: 
            status = "CONNECTING";
            break;
        case 3:
            status = "DISCONNECTING";
            break;
        default:
            break;
    }

    return status;
}