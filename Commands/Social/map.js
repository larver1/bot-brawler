const { Users } = require('../../Database/dbObjects');
const Map = require("../../Helpers/Map");
const { Op } = require("sequelize");

module.exports = {
    name: "map",
    description: "View recently active players on Bot Brawler.",
    options: [
    {
        name: "wealth",
        description: "Choose the most wealthy users.",
        required: false,
        type: "STRING",
        choices: [
        {
           name: "Highest",
           value: "DESC" 
        },
        {
            name: "Lowest",
            value: "ASC"
        }
        ]
    }
    ],
    /**
     * @param {CommandInteraction} CommandInteraction
     * @param {Object} executeObj
     */
    async execute(interaction, utils) {

        let orderOptions = [['lastCommand', 'DESC']];
        let title = `Recently Active Users`;

        // Sorting options
        let sortByWealth = await interaction.options.getString("wealth")

        if(sortByWealth) {
            orderOptions = [['balance', sortByWealth]];
            title = `${sortByWealth == 'DESC' ? 'Most' : 'Least'} Wealthy Users`;
        }

        // Get first 25 users with given order options
        let chosenUsers = await Users.findAll({
            limit: 25,
            order: orderOptions,
            where: { 
                [Op.or]: [
                    { privacy : 'public' },
                    { privacy : 'moderate' }
                ]
            }
        });

        // Plot users on the map
        let userMap = await new Map(interaction, chosenUsers);
        await userMap.createMap();
        await utils.user.pause(false); 

        // Display the map
        await interaction.editReply({ 
            files: [userMap.getMap()],
            content: `__**${title}**__` 
        }).catch((e) => utils.consola.error(e));

    }   
}