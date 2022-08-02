const { promisify } = require("util");
const { glob } = require("glob");
const PG = promisify(glob);

module.exports = {
    name: "reload",
    description: "Reload a command.",
    options: [{
        name: "name",
        description: "Name of the commmand.",
        required: true,
        type: "STRING",
    }],
    /**
     * @param {CommandInteraction} CommandInteraction
     * @param {Object} executeObj
     */
    async execute(interaction, utils) {
		const commandToReload = interaction.options.getString('name').toLowerCase();
		const command = interaction.client.commands.get(commandToReload);
        
        await utils.user.pause(false);

		if(!command) {
			return interaction.editReply(`There is no command with the name \`${commandToReload}\`.`)
            .catch(e => { utils.consola.log(e)});
		}

		async function reloadCommand(c, { name }) {
			const command = c.commands.get(name);

            (await PG(`${process.cwd()}/Commands/*/${command.name}.js`)).map(async (file) => {
                delete require.cache[require.resolve(file)];
                const newCommand = require(file);
                c.commands.set(newCommand.name, newCommand);
            });
		}

		try {
			//interaction.client.shard.broadcastEval(reloadCommand, { context: { name: commandToReload, dir: __dirname }});
            await reloadCommand(interaction.client, { name: commandToReload });
			interaction.editReply(`Command \`${commandToReload}\` was reloaded!`).catch(e => { utils.consola.log(e)});
		} catch (error) {
			utils.consola.error(error);
			interaction.editReply(`There was an error while reloading a command \`${commandToReload}\`:\n\`${error.message}\``).catch(e => { utils.consola.log(e)});
		}

    }
}
