const { REST, Routes, SlashCommandBuilder } = require('discord.js');
require('dotenv').config();

const commands = [
  new SlashCommandBuilder()
    .setName('roll')
    .setDescription('Roll a d20 to determine your task fate!'),
  new SlashCommandBuilder()
    .setName('stats')
    .setDescription('View your productivity stats.'),
  new SlashCommandBuilder()
    .setName('log')
    .setDescription('View your recent roll history.')
]
.map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log('Started refreshing GLOBAL application (/) commands.');

    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands },
    );

    console.log('Successfully reloaded GLOBAL application (/) commands.');
  } catch (error) {
    console.error(error);
  }
})();
