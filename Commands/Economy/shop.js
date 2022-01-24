const { Client, MessageEmbed } = require("discord.js");
const { CurrencyShop } = require('../../Database/dbObjects');

function padString(string) {
    let numChars = 18;
    numChars -= string.length;
    let spaces = "";

    for(var i = 0; i < numChars; i++) spaces += " ";
    
    return spaces;
}

function extraPadding(string) {
    let spaces = "";

    if(string.length < 5)
    {
        let numToAdd = 5 - string.length;
        for(var i = 0; i < numToAdd; i++) spaces += " ";
    }

    return spaces;
}

module.exports = {
    name: "shop",
    description: "Browse for items to improve your bot performance!",
    /**
     * @param {CommandInteraction} CommandInteraction
     * @param {Object} executeObj
     */
    async execute(interaction, utils) {

		let shopItems = await CurrencyShop.findAll()

        //Iterate through all items and display them
        let msg = `You have \`${utils.user.balance}💰\` \n \`/buy item name\` to buy an item.\n\n`;
        
        msg += `${shopItems.map(i => `${i.emoji} \`${i.name} ${padString(i.name)} ${extraPadding(i.cost.toString())}${i.cost}💰\``).join('\n')}`;
        
        msg += `\n\n-> To find out what an item does: e.g. \`/info type:item name:Balanced Chip\``;
        msg += `\n-> To buy an item: e.g. \`/buy item:Balanced Chip amount:1\`.`;
        msg += `\n-> To sell an item: e.g. \`/sell item:Balanced Chip amount:1\`.`;
        msg += `\n-> To equip items to bots: e.g. \`/equip item:Balanced Chip\``;

        let shop = new utils.embed(interaction, utils.user)
            .setTitle(`Welcome to the Electronics Store!`)
            .setDescription(`${msg}`)

        return interaction.editReply({embeds: [shop]}).catch(e => { console.log(e)}); 

    }

}