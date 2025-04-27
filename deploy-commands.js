// deploy-commands.js
const { REST, Routes, SlashCommandBuilder } = require('discord.js');
require('dotenv').config();

// Define all slash commands here
const commands = [
  new SlashCommandBuilder()
    .setName('roll')
    .setDescription('Roll a d20 to determine your productivity fate 🎲'),
  new SlashCommandBuilder()
    .setName('stats')
    .setDescription('View your productivity battle stats 📈'),
  new SlashCommandBuilder()
    .setName('history')
    .setDescription('View your recent rolls and results 📜'),
]
.map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

// Make sure to set your real application and server IDs here
const CLIENT_ID = '1365697874087772190';   // << your bot's Application ID
const
