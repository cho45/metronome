
const QUEUE_PREPARING_TIME = 0.1;

Vue.createApp({
	data() {
		return {
			playing: false,
			bpm: 120,
			flash: false,

			rhythm: {},
			rhythms: [
				{
					name: "𝅘𝅥",
					notes: [4],
				},
				{
					name: "𝅘𝅥𝅘𝅥",
					notes: [4, 4],
				},
				{
					name: "𝅘𝅥𝅘𝅥𝅘𝅥",
					notes: [4, 4, 4],
				},
				{
					name: "𝅘𝅥𝅘𝅥𝅘𝅥𝅘𝅥",
					notes: [4, 4, 4, 4],
				},
				{
					name: Array(5).fill("𝅘𝅥").join(""),
					notes: Array(5).fill(4),
				},
				{
					name: Array(6).fill("𝅘𝅥").join(""),
					notes: Array(6).fill(4),
				},
				{
					name: Array(7).fill("𝅘𝅥").join(""),
					notes: Array(7).fill(4),
				},
				{
					name: Array(8).fill("𝅘𝅥").join(""),
					notes: Array(8).fill(4),
				},
				{
					name: Array(9).fill("𝅘𝅥").join(""),
					notes: Array(9).fill(4),
				},
				{
					name: "𝅘𝅥𝅮𝅘𝅥𝅮",
					notes: [8, 8],
				},
				{
					name: "3[𝅘𝅥𝅮𝅘𝅥𝅮𝅘𝅥𝅮]",
					notes: [4*3, 4*3, 4*3],
				},
				{
					name: "𝅘𝅥𝅘𝅥 3[𝅘𝅥𝅮𝅘𝅥𝅮𝅘𝅥𝅮] 𝅘𝅥𝅮𝅘𝅥𝅮",
					notes: [4, 4, 4*3, 4*3, 4*3, 8, 8],
				},
				{
					name: "3[𝅘𝅥𝅮-𝅘𝅥𝅮]",
					notes: [4*3, {len: 4*3, volume: 0.0001}, 4*3],
				},
				{
					name: "𝅘𝅥𝅯𝅘𝅥𝅯𝅘𝅥𝅯𝅘𝅥𝅯",
					notes: [16, 16, 16, 16],
				},
				{
					name: "𝅘𝅥𝅯𝄿𝄿𝅘𝅥𝅯",
					notes: [16, {len: 16, volume: 0.0001}, {len: 16, volume: 0.0001}, 16],
				},
				{
					name: "Son Clave 3-2",
					notes: [
						{ len: 8, volume: 0.5 },
						{ len: 16, volume: 0.0001 },
						16,
						{ len: 8, volume: 0.0001 },
						8,

						{ len: 8, volume: 0.0001 },
						8,
						8,
						{ len: 8, volume: 0.0001 },
					]
				},
				{
					name: "Son Clave 2-3",
					notes: [
						{ len: 8, volume: 0.0001 },
						8,
						8,
						{ len: 8, volume: 0.0001 },

						{ len: 8, volume: 0.5 },
						{ len: 16, volume: 0.0001 },
						16,
						{ len: 8, volume: 0.0001 },
						8,
					]
				},
				{
					name: "Rumba Clave 3-2",
					notes: [
						{ len: 8, volume: 0.5 },
						{ len: 16, volume: 0.0001 },
						16,
						{ len: 8, volume: 0.0001 },
						{ len: 16, volume: 0.0001 },
						16,

						{ len: 8, volume: 0.0001 },
						8,
						8,
						{ len: 8, volume: 0.0001 },
					]
				},
				{
					name: "Rumba Clave 2-3",
					notes: [
						{ len: 8, volume: 0.0001 },
						8,
						8,
						{ len: 8, volume: 0.0001 },

						{ len: 8, volume: 0.5 },
						{ len: 16, volume: 0.0001 },
						16,
						{ len: 8, volume: 0.0001 },
						{ len: 16, volume: 0.0001 },
						16,
					]
				},
			],

			voice: {},
			voices: [
				{
					name: "Snare Drum",
					file: "_drum_38_0_Chaos_sf2_file",
					src: "./lib/webaudiofontdata/sound/12838_0_Chaos_sf2_file.js",
					duration: 3.5,
					pitch: 38,
					volume: 0.8,
				},
				{
					name: "Side Stick",
					file: "_drum_37_0_Chaos_sf2_file",
					src: "./lib/webaudiofontdata/sound/12837_0_Chaos_sf2_file.js",
					duration: 3.5,
					pitch: 37,
					volume: 0.8,
				},
				{
					name: "Side Stick 2",
					file: "_drum_37_0_JCLive_sf2_file",
					src: "./lib/webaudiofontdata/sound/12837_0_JCLive_sf2_file.js",
					duration: 3.5,
					pitch: 37,
					volume: 0.8,
				},
				{
					name: "Bass Drum",
					file: "_drum_36_0_Chaos_sf2_file",
					src: "./lib/webaudiofontdata/sound/12836_0_Chaos_sf2_file.js",
					duration: 3.5,
					pitch: 36,
					volume: 0.8,
				},
				{
					name: "Hand Clap",
					file: "_drum_39_0_Chaos_sf2_file",
					src: "./lib/webaudiofontdata/sound/12839_0_Chaos_sf2_file.js",
					duration: 3.5,
					pitch: 39,
					volume: 0.8,
				},
				{
					name: "High Wood Block",
					file: "_drum_76_0_Chaos_sf2_file",
					src: "./lib/webaudiofontdata/sound/12876_0_Chaos_sf2_file.js",
					duration: 3.5,
					pitch: 76,
					volume: 0.9,
				},
				{
					name: "Claves",
					file: "_drum_75_3_JCLive_sf2_file",
					src: "./lib/webaudiofontdata/sound/12875_3_JCLive_sf2_file.js",
					duration: 3.5,
					pitch: 75,
					volume: 0.8,
				},
				{
					name: "Stick",
					file: "_drum_43_10_Chaos_sf2_file",
					src: "./lib/webaudiofontdata/sound/12843_10_Chaos_sf2_file.js",
					duration: 3.5,
					pitch: 43,
					volume: 0.8,
				},
				{
					name: "Metronome Click",
					file: "_drum_45_10_Chaos_sf2_file",
					src: "./lib/webaudiofontdata/sound/12845_10_Chaos_sf2_file.js",
					duration: 3.5,
					pitch: 43,
					volume: 0.8,
				}
			]
		}
	},

	computed: {
	},

	watch: {
		bpm: function () {
			this.updateHashParams();
		},
		voice: function () {
			this.updateHashParams();
		},
		rhythm: function() {
			this.updateHashParams();
		},
	},

	mounted() {
		console.log("mounted");
		document.body.addEventListener("animationend", () => {
			document.body.className = "";
		}, false);

		if (!this.audioContext) {
			this.audioContext = new AudioContext();
			this.player = new WebAudioFontPlayer();
		}


		this.rhythm = this.rhythms[0];
		this.voice  = this.voices[0];
		this.loadHashParams();

		const { player, audioContext } = this;

		for (const voice of this.voices) {
			this.loadVoice(voice.src, voice.file);
			// player.loader.decodeAfterLoading(audioContext, voice.file);
		}

		const channelMaster = player.createChannel(audioContext);
		channelMaster.output.connect(audioContext.destination);

		// ハイを上げて若干聞きとりやすくする
		channelMaster.band32.gain.value = 0;
		channelMaster.band64.gain.value = 0;
		channelMaster.band128.gain.value = 0;
		channelMaster.band512.gain.value = 0;
		channelMaster.band1k.gain.value = 0;
		channelMaster.band2k.gain.value = 6;
		channelMaster.band4k.gain.value = 6;
		channelMaster.band8k.gain.value = 6;
		channelMaster.band16k.gain.value = 0;

		this.channelMaster = channelMaster;

		window.addEventListener("keydown", (e) => {
			if (e.code === "Space") {
				if (this.playing) {
					this.stop();
				} else {
					this.start();
				}
			} else
			if (e.code === "ArrowUp") {
				this.bpm += 1;
			} else
			if (e.code === "ArrowDown") {
				this.bpm -= 1;
			}
		});
	},

	methods: {
		start: async function () {
			const { player, audioContext, channelMaster } = this;
			this.playing = true;
			this.queued = [];

			// ensure loading
			await this.loadVoice(this.voice.src, this.voice.file);

			let startTime = null;
			console.log({startTime});
			this.timer = setInterval( async () => {
				if (!startTime) {
					startTime = audioContext.currentTime + QUEUE_PREPARING_TIME / 2;
				}  else {
					if (audioContext.currentTime < startTime - QUEUE_PREPARING_TIME) {
						return;
					}
				}
				console.log('queue', {startTime}, audioContext.currentTime);


				const drum = await this.loadVoice(this.voice.src, this.voice.file);
				const { duration, pitch, volume } = this.voice;
				const rhythm = this.rhythm.notes;
				const sec = 4 * 60 / this.bpm; // quarter note

				// 0.1s 分キューイングしていく
				while (startTime < audioContext.currentTime + QUEUE_PREPARING_TIME) {
					for (let i = 0, len = rhythm.length; i < len; i++) {
						const note = rhythm[i];
						const queue = {
							volumex: (i == 0) ? 1.0 : 0.5,
						};
						if (typeof note === 'number') {
							queue.length = 1/note * sec;
						} else {
							queue.length = 1/note.len * sec;
							if (note.volume) {
								queue.volumex = note.volume;
							}
						}
						console.log(startTime, {pitch, volume}, note);
						player.queueWaveTable(audioContext, channelMaster.input, drum, startTime, pitch, duration, volume * queue.volumex);
						if (this.flash) {
							this.queued.push(startTime);
						}
						startTime += queue.length;
					}
				}
			}, 20);

			if (this.flash) {
				const updateFlash = () => {
					if (!this.playing) return;
					while (this.queued.length && this.queued[0] < audioContext.currentTime) {
						document.body.className = "flash";
						this.queued.shift();
					}

					requestAnimationFrame(updateFlash);
				};
				requestAnimationFrame(updateFlash);
			}
		},

		stop: function () {
			const { player, audioContext } = this;
			clearInterval(this.timer);
			player.cancelQueue(audioContext);
			this.playing = false;
		},

		loadVoice: async function (src, name) {
			const { player, audioContext } = this;
			if (window[name]) {
				return Promise.resolve(window[name]);
			} else {
				console.log('loading', src, name);
				return new Promise( (resolve) => {
					player.loader.startLoad(audioContext, src, name);
					player.loader.waitLoad(() => {
						resolve(window[name]);
					});
				});
			}
		},

		loadHashParams: function () {
			const params = new URLSearchParams(location.hash.substring(1));
			
			if (params.has("bpm") && +params.get("bpm")) {
				console.log("load bpm from hash");
				this.bpm = +params.get("bpm");
			}

			if (params.has("voice")) {
				const name = params.get("voice");
				const voice = this.voices.find(i => i.name === name);
				console.log("load voice from hash", {name, voice});
				if (voice) {
					this.voice = voice;
				}
			}

			if (params.has("rhythm")) {
				const name = params.get("rhythm");
				const rhythm = this.rhythms.find(i => i.name === name);
				console.log("load rhythm from hash", {name, rhythm});
				if (rhythm) {
					this.rhythm = rhythm;
				}
				console.log(this.rhythm);
			}
		},

		updateHashParams: function () {
			const params = new URLSearchParams(location.hash.substring(1));
			params.set("bpm", this.bpm);
			params.set("voice", this.voice.name);
			params.set("rhythm", this.rhythm.name);
			history.replaceState(null, "", "#" + params.toString());
		},
	},
}).use(Vuetify.createVuetify({
	theme: {
		defaultTheme: 'light' // or dark
	}
})).mount("#app");


