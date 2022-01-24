const { Client, MessageEmbed } = require("discord.js");
const { CurrencyShop } = require('../../Database/dbObjects');
const { Op } = require("sequelize");

module.exports = {
    name: "buy",
    description: "View your total number of Machine Parts.",
    options: [
    {
        name: "item",
        type: "STRING",
        description: "The item you wish to purchase.",
        required: true
    },
    {
        name: "amount",
        type: "INTEGER",
        description: "How many you would like to buy.",
        required: true
    }],
    /**
     * @param {CommandInteraction} CommandInteraction
     * @param {Object} executeObj
     */
    async execute(interaction, utils) {

        //Get arguments, already in correct Data Types
		let itemName = await interaction.options.getString('item');
        let amount = await interaction.options.getInteger('amount');
        
        if(amount == null || amount <= 0) 
            amount = 1;

        //If item is invalid then it will end command
        const item = await CurrencyShop.findOne({ where: { name: { [Op.like]: itemName } } });
  
        if(!item)
            return interaction.editReply("This item is either unavailable or does not exist.")
                .catch(e => { utils.consola.error(e)});

        //Checks cost of item and whether they can afford it
        let itemCost = item.cost * amount;
        if(itemCost > utils.user.balance)
            return interaction.editReply(`You currently have \`${utils.user.balance}💰\`, but ${item.emoji} \`${item.name} ${amount ? "x" + amount : ""}\` costs \`${itemCost}💰\``)
                .catch(e => utils.consola.error(e));

        //Takes off money and gives user the item
        await utils.db.remove(interaction.user.id, "balance", itemCost);
        await user.addItem(item, amount);

        await interaction.editReply(`You've bought: ${item.emoji} \`${item.name}${amount ? " x" + amount : ""}\` for \`${itemCost}💰\``)
            .catch(e => utils.consola.error(e));

        return; 
    }

}