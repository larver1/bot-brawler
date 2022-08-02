module.exports = {
    name: "commands",
    description: "See a list of commands.",
    usage: "`/commands name` allows you to get more information about a given command... Don't you already know how to do this?",
    options: [{
        name: "commandname",
        description: "The name of the command.",
        required: false,
        type: "STRING",
    }],
    /***
     * @param {CommandInteraction} interaction
     * @param {Object} utils
     */
    async execute(interaction, utils) {
        const commands = interaction.client.commands;
        let commandName = interaction.options.getString('commandname');
        let data = [];
        let economy = [];
        let gameplay = [];
        let social = [];
        let utilities = [];

        await utils.user.pause(false);

        //If no command was specified, list all of them
        if(!commandName)
        {
            economy.push(commands
                .filter(command => command.section == "Economy")
                .map(command => command.name)
                .join('` `/'));
        
            gameplay.push(commands
                .filter(command => command.section == "Gameplay")
                .map(command => command.name)
                .join('` `/'));

            social.push(commands
                .filter(command => command.section == "Social")
                .map(command => command.name)
                .join('` `/'));

            utilities.push(commands
                .filter(command => command.section == "Utilities")
                .map(command => command.name)
                .join('` `/'));

            let commandList = new utils.embed(interaction, utils.user)
                .setTitle(`Here's a list of commands: `)
                .setDescription(`**Economy**\n\`/${economy}\`\n\n**Gameplay**\n\`/${gameplay}\`\n\n**Social**\n\`/${social}\`\n\n**Utilities**\n\`/${utilities}\`\n\nYou can send \`/commands [command name]\` to get info on a specific command!\nFor a beginner's walkthrough, use \`/guide\``)
                .setThumbnail(`https://i.imgur.com/ULDd1OC.png`)

            await interaction.editReply({ embeds: [commandList] }).catch(e => { utils.consola.error(e)}).catch(e => { utils.consola.error(e)});
            return;
        }
        
        //If a specific command was mentioned, display it
        const name = commandName.toLowerCase();
        const command = commands.get(name);
        
        if (!command) {
            return interaction.editReply('that\'s not a valid command!').catch(e => { utils.consola.error(e)});
        }
                
        if (command.description) data.push(`**Description:** ${command.description}`);
        if (command.usage) data.push(`**Usage:** \`/${command.name}\`\n${command.usage.length ? command.usage : ""}`);      
        
        await interaction.editReply(data.join("\n")).catch(e => { utils.consola.error(e)});
        
        }
    }