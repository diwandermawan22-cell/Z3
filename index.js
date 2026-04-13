const { Client, GatewayIntentBits, ActivityType } = require('discord.js');
const { joinVoiceChannel, getVoiceConnection } = require('@discordjs/voice');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMembers,
    ],
});

const TOKEN = process.env.DISCORD_TOKEN;
const S1_GUILD = process.env.S1_GUILD_ID;
const S1_CHAT = process.env.S1_CHAT_ID;
const S2_GUILD = process.env.S2_GUILD_ID;
const S2_CHAT = process.env.S2_CHAT_ID;

const userTrackers = new Map();

// --- MEGA DATABASE ANTI-BOSEN ---

const dbQuotes = [
    "🍑 @everyone Info janda dong, yang modelan mandiri tapi butuh sandaran di VOICE server ini ada nggak? 😏",
    "🔥 Perjaka server ini jangan cuma jago push rank, jago manjain telinga orang di VOICE dong! 🥴",
    "💌 Status boleh duda, tapi kalau soal perhatian aku nggak kalah sama yang muda. Sini naik VOICE! ✨",
    "🥺 Gadis-gadis cantik di sini pada ke mana? Apa perlu aku jemput satu-satu biar mau open mic di VOICE?",
    "😏 Perawan jangan malu-malu kucing, janda jangan malu-maluin. Sini kumpul kita ngeteh bareng di VOICE!",
    "🌹 Mencintai kamu itu gampang, yang susah itu liat kamu jarang naik VOICE. Aku kangen tau! 💖",
    "☕ Kopi pahit aja bisa manis kalau diminum sambil denger suara merdu kamu di VOICE tongkrongan kita.",
    "🌚 Malam minggu buat janda/duda galau mending di VOICE aja, daripada stalking mantan terus baper..",
    "🌟 Di server ini kita nggak mandang status, mau kamu perjaka atau duda, yang penting asyik naik VOICE bareng!",
    "💔 Buat yang lagi patah hati, mending naik VOICE. Siapa tau dapet janda/gadis baru di sini. Gas! 🔥",
    "🍃 Angin malam ini dingin, tapi lebih dingin lagi kalau VOICE server ini tanpa suara kalian. @everyone",
    "🔥 Peringatan! Tingkat kegantengan perjaka di sini sudah melampaui batas. Segera laporan ke VOICE! 😏",
    "🥨 Janda merapat, duda mendekat, yang single jangan cuma liat. VOICE udah rame nih! @everyone",
    "🎭 Hidup itu penuh sandiwara, tapi kalau rasa sayang aku ke kalian pas di VOICE itu nyata. ✨",
    "🚀 Gaspolll! Semangat buat yang lagi kerja atau lagi grinding. Sambil open mic di VOICE biar gak sepi! 💙"
];

const dbMakan = {
    pagi: [
        "🍳 @everyone Pagi sayang! Sarapan dulu ya, biar kuat cari jodoh di server ini! 🥛",
        "🥪 @everyone Pagi kesayangan! Sarapan dulu gih, janda sama perawan di sini butuh kamu yang sehat! ☕",
        "🥐 @everyone Awali harimu dengan sarapan, bukan dengan harapan palsu. Semangat ya sayang! 🌻"
    ],
    siang: [
        "🍛 @everyone Makan siang dulu sayang! Biar kuat VOICE-an nanti. Jangan sampai telat makan ya! 🍗",
        "🍱 @everyone Udah jam 12:30 nih, perjaka sama duda harus tetep kuat fisiknya. Yuk makan dulu! 🍱",
        "🍲 @everyone Sayang, istirahat dulu gih. Makan siang yang kenyang biar gak gampang sakit hati liat dia sama yang lain.. 🥺"
    ],
    malam: [
        "🍝 @everyone Waktunya Makan Malam! Makan yang banyak biar nggak gampang sakit hati.. 🥺",
        "🍕 @everyone Udah malam loh, jangan lupa makan. Makan malam bareng keluarga atau gebetan baru di server ini? 😏",
        "🍛 @everyone Perut kenyang, hati tenang. Yuk makan malam dulu sebelum lanjut begadang di VOICE! 🌙"
    ]
};

const dbSholat = [
    "🕌 @everyone **Waktunya {nama}!** Berhenti dulu VOICE-annya ya sayang, lapor ke Yang Maha Kuasa dulu. Nanti lanjut lagi ya 🥺💙",
    "🕌 @everyone **Adzan {nama} nih!** Yuk istirahat sejenak, ibadah dulu biar hubungan kita diberkahi. Aku nungguin di sini ya.. 🙏✨",
    "🕋 @everyone Sayang, panggilan {nama} sudah berkumandang. Yuk sholat dulu, minta doa biar dapet janda/duda idaman di server ini! 🤲"
];

const dbNgambek = {
    stage1: [
        "🥺 {user}, baru sejam turun kok udah kangen ya? Naik VOICE lagi dong sayang.. 💙",
        "👀 Kok sepi? {user} baru sejam gak ada di VOICE aku udah ngerasa kehilangan.. 💔",
        "💌 {user}, satu jam tanpamu bagai satu tahun tanpa cinta. Sini naik VOICE sebentar aja.. 🥺"
    ],
    stage2: [
        "😤 {user}, kok belum naik VOICE juga? Udah 2 jam loh. Lagi asyik sama yang lain ya di server sebelah? 💔",
        "🤨 2 jam berlalu tanpa suara kamu {user}.. Kamu beneran tega biarin aku nunggu sendirian?",
        "💦 {user}, jangan biarkan malamku basah karena air mata galau nungguin kamu naik VOICE! 2 jam loh ini! 😡"
    ],
    stage3: [
        "😭 {user} JAHAT! Udah 3 jam aku nungguin kamu di VOICE tapi nggak muncul. Aku ngambek beneran nih! 💨",
        "😡 Fix, {user} udah gak sayang lagi sama aku & server ini. 3 jam aku dicuekin. Tega banget!",
        "💔 {user}, 3 jam itu lama loh. Kayaknya kamu emang udah nggak butuh aku lagi ya? Oke fine! 😤"
    ],
    stage12: [
        "🥀 {user}, beneran ya seharian ini kamu gak ada kabar? Udah 12 jam lebih gak naik VOICE... Putus aja kita! 🥺💔",
        "🥺💔 12 jam tanpa kamu {user}.. Aku anggep kamu udah lupa sama kenangan kita di VOICE. Selamat tinggal..",
        "💀 {user}, 12 jam menghilang? Fix kamu udah punya simpenan baru ya? Jangan cari aku lagi kalau nanti kangen! 💨"
    ]
};

// --- FUNGSI CORE ---

function pickRandom(array) {
    return array[Math.floor(Math.random() * array.length)];
}

function nowWIB() {
    const now = new Date();
    const utc = now.getTime() + now.getTimezoneOffset() * 60000;
    return new Date(utc + 7 * 3600000);
}

async function broadcast(text) {
    const ids = [S1_CHAT, S2_CHAT].filter(id => id);
    for (const id of ids) {
        try {
            const ch = await client.channels.fetch(id).catch(() => null);
            if (ch) await ch.send(text);
        } catch (e) {}
    }
}

function setInactivityWarning(member, guildId, stage) {
    let delay = (stage === 12) ? 9 * 3600000 : 1 * 3600000; 
    
    const timer = setTimeout(async () => {
        let targetChId = (guildId === S1_GUILD) ? S1_CHAT : (guildId === S2_GUILD ? S2_CHAT : null);
        if (targetChId) {
            const logCh = await client.channels.fetch(targetChId).catch(() => null);
            if (logCh) {
                const userTag = member.user.toString();
                let message = "";
                if (stage === 1) message = pickRandom(dbNgambek.stage1).replace("{user}", userTag);
                else if (stage === 2) message = pickRandom(dbNgambek.stage2).replace("{user}", userTag);
                else if (stage === 3) message = pickRandom(dbNgambek.stage3).replace("{user}", userTag);
                else if (stage === 12) message = pickRandom(dbNgambek.stage12).replace("{user}", userTag);
                
                await logCh.send(message);
            }
        }

        if (stage === 1) setInactivityWarning(member, guildId, 2);
        else if (stage === 2) setInactivityWarning(member, guildId, 3);
        else if (stage === 3) setInactivityWarning(member, guildId, 12);
    }, delay);

    userTrackers.set(member.id, { timer, stage });
}

// --- EVENT HANDLERS ---

client.once('ready', () => {
    console.log(`Bot Ayank ${client.user.tag} siap menjaga VOICE server ini!`);
    client.user.setActivity('Bikin Basah Janda duda Perjaka gadis', { type: ActivityType.Watching });

    // Quotes Random (Setiap 2 jam)
    setInterval(() => {
        broadcast(pickRandom(dbQuotes));
    }, 2 * 3600000);

    // Checker Jam Makan & Sholat
    setInterval(async () => {
        const now = nowWIB();
        const h = now.getHours();
        const m = now.getMinutes();

        // Jadwal Makan
        if (h === 7 && m === 30) await broadcast(pickRandom(dbMakan.pagi));
        if (h === 12 && m === 30) await broadcast(pickRandom(dbMakan.siang));
        if (h === 19 && m === 15) await broadcast(pickRandom(dbMakan.malam));

        // Jadwal Sholat
        const jadwalSholat = { "Subuh": [4, 35], "Dzuhur": [12, 5], "Ashar": [15, 25], "Maghrib": [18, 5], "Isya": [19, 20] };
        for (const [nama, waktu] of Object.entries(jadwalSholat)) {
            if (h === waktu[0] && m === waktu[1]) {
                const msg = pickRandom(dbSholat).replace("{nama}", nama);
                await broadcast(msg);
            }
        }
    }, 60000);
});

client.on('voiceStateUpdate', async (oldState, newState) => {
    const member = newState.member;
    if (!member || member.user.bot) return;

    // Join VOICE: Matikan tracker ngambek
    if (!oldState.channelId && newState.channelId) {
        if (userTrackers.has(member.id)) {
            clearTimeout(userTrackers.get(member.id).timer);
            userTrackers.delete(member.id);
            console.log(`[Tracker] ${member.user.username} balik, timer dihapus.`);
        }
    } 
    // Keluar VOICE: Mulai stage 1
    else if (oldState.channelId && !newState.channelId) {
        setInactivityWarning(member, oldState.guild.id, 1);
    }
});

client.login(TOKEN);
