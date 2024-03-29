import { helpWithASpecificCommand } from '../../everyone/commandsCommon/help.command.js';
import { getUserOfCommand } from '../../../utils/commandsFunctions/getUserMention/getUserOfCommand.js';
import Colors from '../../../utils/commandsFunctions/layoutEmbed/colors.js';
import Discord from 'discord.js';

export default {
  name: 'unmute',
  description: `<prefix>unmute @Usuários/TAGs/Nomes/IDs/Citações para desmutar usuários`,
  permissions: ['padawans'],
  aliases: ['tirarmute', 'desmutar', 'desmute'],
  category: 'Moderação ⚔️',
  /**
   * 
   * @param {{ message: Discord.Message; client: Discord.Client; args: Array<string>; string }} param0 
   * @returns 
   */
  run: async ({ message, client, args, prefix }) => {
    const { users } = await getUserOfCommand(client, message, prefix);

    if (!args[0] && !users) {
      const [command] = message.content.slice(prefix.length).split(/ +/);
      helpWithASpecificCommand(command, client, message);
      return;
    }
    if (!message.member.permissions.has('MODERATE_MEMBERS')) {
      return message.channel
        .send({
          content: `${message.author}`,
          embeds: [
            {
              color: Colors.pink_red,
              thumbnail: client.user.displayAvatarURL({ dynamic: true }),
              description: `Você não tem permissão para desmutar usuários`,
              title: `Peça para um cargo maior desmutar o membro`,
              timestamp: new Date(),
            },
          ],
        })
        .then((msg) => setTimeout(() => msg.delete(), 15000));
    }

    if (!users) {
      return message.channel
        .send({
          content: `${message.author}`,
          embeds: [
            {
              color: Colors.pink_red,
              thumbnail: client.user.displayAvatarURL({ dynamic: true }),
              title: `Não encontrei o usuário!`,
              description: `**Tente usar**\`\`\`${prefix}mute @usuário <motivo> <tempo>\`\`\``,
              timestamp: new Date(),
            },
          ],
        })
        .then((msg) => setTimeout(() => msg.delete(), 15000));
    }
    const tableTemporarilyMutated = new client.Database.table(
      `tableTemporarilyMutated`
    );
    const guildUndefinedMutated = new client.Database.table(
      `guild_users_mutated_${message.guild.id}`
    );
    users.forEach(async (user) => {
      const userMuted =
        tableTemporarilyMutated.get(
          `guild_id_${message.guild.id}_user_id_${user.id}`
        ) || guildUndefinedMutated.get(`user_id_${user.id}`);

      if (!userMuted || user.communicationDisabledUntilTimestamp <= Date.now()) {
        return message.channel
          .send({
            content: `${message.author}`,
            embeds: [
              {
                color: Colors.pink_red,
                thumbnail: user.displayAvatarURL({ dynamic: true }),
                author: {
                  name: message.author.tag,
                  icon_url: message.author.displayAvatarURL({ dynamic: true }),
                },
                description: `O usuário ${user} não está mutado no servidor, para mutar use ${prefix}mute @Usuários/TAGs/Nomes/IDs/Citações <motivo> <tempo/2d 5h 30m 12s>`,
                title: `Usuário não está mutado`,
                footer: { text: `ID do usuário : ${user.id}` },
                timestamp: new Date(),
              },
            ],
          })
          .then((msg) => setTimeout(() => msg.delete(), 15000));
      }

      if (guildUndefinedMutated.has(`user_id_${user.id}`)) {
        guildUndefinedMutated.delete(`user_id_${user.id}`);
      } else if (
        tableTemporarilyMutated.has(
          `guild_id_${message.guild.id}_user_id_${user.id}`
        )
      ) {
        tableTemporarilyMutated.delete(
          `guild_id_${message.guild.id}_user_id_${user.id}`
        );
      }
      const userMember = client.guilds.cache
        .get(userMuted.guildId)
        .members.cache.get(userMuted.id);

      userMember.timeout(0);
      const guildIdDatabase = new client.Database.table(
        `guild_id_${message.guild.id}`
      );
      const channelLog = client.channels.cache.get(
        guildIdDatabase.get('channel_log')
      );

      function messageInviteLog() {
        return {
          title: `Usuário ${userMember.user.tag} foi desmutado!`,
          footer: { text: `ID do usuário: ${userMember.user.id}` },
          author: {
            name: message.author.tag,
            icon_url: message.author.displayAvatarURL({ dynamic: true }),
          },
          thumbnail: userMember.user.displayAvatarURL({ dynamic: true }),
          color: Colors.pink_red,
          timestamp: new Date(),
        };
      }
      if (channelLog) {
        channelLog.send({
          content: `${message.author}`,
          embeds: [messageInviteLog()],
        });
      } else {
        message.channel
          .send({ content: `${message.author}`, embeds: [messageInviteLog()] })
          .then((msg) => setTimeout(() => msg.delete(), 15000));
      }
    });
  },
};
