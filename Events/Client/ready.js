const consola = require("consola");

module.exports = {
    name: "ready",
    once: true,
     /**
     * Sets up client when ready is fired 
     * @param {Client} client
     */
    async execute(client) {
        consola.success("The client is now ready!");
        client.user.setActivity("Beep Boop", {type: "WATCHING"});
    }
}