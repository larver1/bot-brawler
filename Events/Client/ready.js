const consola = require("consola");

module.exports = {
    name: "ready",
    once: true,
     /**  
     * @param {Client} client
     */
    execute(client) {
        consola.success("The client is now ready!");
        client.user.setActivity("Beep Boop", {type: "WATCHING"})
    }
}