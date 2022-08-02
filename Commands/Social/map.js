const { Users, Bots } = require('../../Database/dbObjects');
const Map = require("../../Helpers/Map");
const { Op } = require("sequelize");

module.exports = {
    name: "map",
    usage: "`/map wealth` allows you to sort the map by wealth.",
    description: "View recently active players on Bot Brawler.",
    options: [{
        name: "users",
        description: "Browse recently active users.",
        required: false,
        type: "SUB_COMMAND",
        options: [{
            name: "wealth",
            description: "Find the most wealthy users.",
            required: false,
            type: "STRING",
            choices: [{
                name: "Highest",
                value: "DESC" 
            },
            {
                name: "Lowest",
                value: "ASC"
            }]
        }]
    },
    {
        name: "bots",
        description: "Browse the most/least powerful bots.",
        required: false,
        type: "SUB_COMMAND",
        options: [{
            name: "exp",
            description: "Order by EXP.",
            required: false,
            type: "STRING",
            choices: [{
                name: "Highest",
                value: "DESC" 
            },
            {
                name: "Lowest",
                value: "ASC"
            }],
        }]
    }],
    /**
     * @param {CommandInteraction} CommandInteraction
     * @param {Object} executeObj
     */
    async execute(interaction, utils) {

        let orderOptions = [];
        let title = `Recently Active Users`;

        // Sorting type
        let sortType = interaction.options.getSubcommand();

        // Sorting options
        let sortByWealth = await interaction.options.getString("wealth");
        let sortByExp = await interaction.options.getString("exp");

        let chosen;

        // If searching for users
        if(sortType == "users") {
            orderOptions.push(['lastCommand', 'DESC']);
            if(sortByWealth) {
                orderOptions = [['balance', sortByWealth]];
                title = `${sortByWealth == 'DESC' ? 'Most' : 'Least'} Wealthy Users`;
            }
    
            // Get first 25 users with given order options
            chosen = await Users.findAll({
                limit: 25,
                order: orderOptions,
                where: { 
                    [Op.or]: [
                        { privacy : 'public' },
                        { privacy : 'moderate' }
                    ]
                }
            });
        }

        // If searching for bots
        if(sortType == "bots") {
            if(sortByExp) {
                orderOptions = [['exp', sortByExp]];
                title = `${sortByExp == 'DESC' ? 'Most' : 'Least'} Powerful Bots`;
            } else {
                orderOptions = [['exp', 'DESC']];
                title = `Most Powerful Bots`;
            }
    
            // Get first 25 bots with given order options
            chosen = await Bots.findAll({
                limit: 10,
                order: orderOptions,
                where: { alive: true }
            });
        }

        // Plot users on the map
        let userMap = await new Map(interaction, chosen, sortType);
        await userMap.createMap();
        await utils.user.pause(false); 

        // Display the map
        await interaction.editReply({ 
            files: [userMap.getMap()],
            content: `__**${title}**__` 
        }).catch((e) => utils.consola.error(e));

    }   
}