import jimp from 'jimp';
import { roleMuted } from '../../utils/createRoleMuted/roleMuted.js';
import Colors from '../../utils/layoutEmbed/colors.js';

function makeid(length) {
  let result = '';
  const characters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;

  for (let i = 0; i < length; i++) {
    result += `${characters.charAt(
      Math.floor(Math.random() * charactersLength)
    )}`;
  }
  return result;
}
export async function recaptcha(client, memberAdd) {
  const guildIdDatabase = new client.Database.table(
    `guild_id_${memberAdd.guild.id}`
  );

  const activeRecaptcha = guildIdDatabase.get('recaptcha');
  if (activeRecaptcha) {
    const noobrole = await roleMuted(memberAdd, 'notVerified');

    const userMember = client.guilds.cache
      .get(memberAdd.guild.id)
      .members.cache.get(memberAdd.user.id);

    await userMember.roles.add(noobrole.id);

    const channelName = `Verifique aqui!`;
    const channel = await memberAdd.guild.channels.create(channelName, {
      type: 'text',
      permissionOverwrites: [
        {
          id: memberAdd.guild.roles.everyone,
          deny: ['VIEW_CHANNEL', 'SEND_MESSAGES'],
        },
        {
          id: memberAdd.user.id,
          allow: ['VIEW_CHANNEL', 'SEND_MESSAGES'],
        },
      ],
    });

    const idVerification = makeid(5);
    const fonte = await jimp.loadFont(
      './src/services/humanVerify/font/Chiller.ttf.fnt'
    );
    const fundo = await jimp.read('https://i.imgur.com/xUDuQ6P.png');
    const line = await jimp.read('https://i.imgur.com/aeD0ucO.png');
    line.resize(500, 5);
    fundo
      .resize(500, 200)
      .print(fonte, 150, 20, idVerification)
      .composite(line, 0, 100);

    fundo.getBuffer(jimp.MIME_PNG, async (err, buffer) => {
      await channel.send({
        content: `${memberAdd.user}`,
        embeds: [
          {
            color: Colors.pink_red,
            title: `Escreva o código de 5 caracteres abaixo no chat para confirmar que você é um humano! :eyes:`,
            timestamp: new Date(),
            image: { url: 'attachment://image.png' },
          },
        ],
        files: [
          {
            name: 'image.png',
            attachment: buffer,
          },
        ],
      });
    });

    const filter = (m) => m.author.id === memberAdd.user.id;
    const collector = channel.createMessageCollector(filter, {
      max: 1,
      time: 120000,
    });
    let answered = false;
    collector.on('collect', async (m) => {
      if (m.content.toLowerCase() === idVerification.toLowerCase()) {
        channel.delete();
        userMember.roles.remove(noobrole.id);
        answered = true;

        const channelLog = client.channels.cache.get(
          guildIdDatabase.get('channel_log')
        );
        channelLog?.send({
          content: `${userMember}`,
          embeds: [
            {
              title: `O usuário ${userMember.user.tag} confirmou que é um humano e entrou no servidor!`,
              description: `**Código verificado: ${idVerification}**`,
              color: Colors.pink_red,
              thumbnail: userMember.user.displayAvatarURL({ dynamic: true }),
              footer: { text: `ID do usuário: ${userMember.user.id}` },
              timestamp: new Date(),
            },
          ],
        });
      }
    });

    collector.on('end', async () => {
      if (!answered) {
        await userMember.kick();
        await channel.delete();
      }
    });
  }
}
