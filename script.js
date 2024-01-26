
const QUEUE_PREPARING_TIME = 0.1;

Vue.createApp({
	data() {
		return {
			playing: false,
			bpm: 120,
			flash: false,
			volume: 100,

			tapTempo: {
				active: false,
			},

			rhythm: {},
			rhythms: [
				{
					name: "1",
					imgs: [ "./img/notes/4note.svg" ],
					notes: [4],
				},
				{
					name: "2",
					imgs: Array(2).fill("./img/notes/4note.svg"),
					notes: Array(2).fill(4),
				},
				{
					name: "3",
					imgs: Array(3).fill("./img/notes/4note.svg"),
					notes: Array(3).fill(4),
				},
				{
					name: "4",
					imgs: Array(4).fill("./img/notes/4note.svg"),
					notes: Array(4).fill(4),
				},
				{
					name: "5",
					imgs: Array(5).fill("./img/notes/4note.svg"),
					notes: Array(5).fill(4),
				},
				{
					name: "8x2",
					imgs: ["./img/notes/8x2notes.svg"],
					notes: [8, 8],
				},
				{
					name: "Triplet",
					imgs: ["./img/notes/triplet.svg"],
					notes: [4*3, 4*3, 4*3],
				},
				/*
				{
					name: "𝅘𝅥𝅘𝅥 3[𝅘𝅥𝅮𝅘𝅥𝅮𝅘𝅥𝅮] 𝅘𝅥𝅮𝅘𝅥𝅮",
					notes: [4, 4, 4*3, 4*3, 4*3, 8, 8],
				},
				*/
				{
					name: "Triplet-1",
					imgs: ["./img/notes/triplet-1.svg"],
					notes: [4*3, {len: 4*3, volume: 0.0001}, 4*3],
				},
				{
					name: "16x4",
					imgs: ["./img/notes/16x4notes.svg"],
					notes: [16, 16, 16, 16],
				},
				{
					name: "16x4-2",
					imgs: ["./img/notes/16x4-2notes.svg"],
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
					name: "Ride Cymbal",
					file: "_drum_51_0_Chaos_sf2_file",
					src: "./lib/webaudiofontdata/sound/12851_0_Chaos_sf2_file.js",
					duration: 3.5,
					pitch: 51,
					volume: 0.8,
				},
				{
					name: "Closed Hi-hat",
					file: "_drum_42_0_Chaos_sf2_file",
					src: "./lib/webaudiofontdata/sound/12842_0_Chaos_sf2_file.js",
					duration: 3.5,
					pitch: 42,
					volume: 0.8,
				},
				{
					name: "Pedal Hi-hat",
					file: "_drum_44_0_Chaos_sf2_file",
					src: "./lib/webaudiofontdata/sound/12844_0_Chaos_sf2_file.js",
					duration: 3.5,
					pitch: 44,
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
			if (this.bpm >= 1000) {
				this.bpm = 999;
			}
			if (this.bpm < 1) {
				this.bpm = 1;
			}
			this.updateHashParams();
		},
		voice: function () {
			this.updateHashParams();
		},
		rhythm: function() {
			this.updateHashParams();
		},
		volume: function () {
			this.updateHashParams();
			this.channelMaster.output.gain.value = this.volume / 100;
		},
	},

	mounted() {
		console.log("mounted");
		document.body.addEventListener("animationend", () => {
			document.body.className = "";
		}, false);

		this.$refs.bpm.addEventListener("wheel", (e) => {
			e.preventDefault();
			console.log(e);
			this.bpm += 1 * Math.sign(e.wheelDelta);
		});

		this.$refs.volume.addEventListener("wheel", (e) => {
			e.preventDefault();
			console.log(e);
			this.volume += 1 * Math.sign(e.wheelDelta);
		});

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
		// GainNode と違い BiquadFilterNode の gain.value は dB 単位
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
			e.stopPropagation();
			const key =
				(e.ctrlKey  ? 'Ctrl-'  : '') +
				(e.shiftKey ? 'Shift-' : '') +
				(e.altKey   ? 'Alt-'   : '') +
				e.code;
			console.log(key);
			const func = {
				"Space" : () => {
					if (this.playing) {
						this.stop();
					} else {
						this.start();
					}
				},
				"Shift-Space" : () => {
					this.tapTempoTap();
				},
				"ArrowUp" : () => {
					this.bpm += 1;
				},
				"ArrowDown" : () => {
					this.bpm -= 1;
				},
				"Shift-ArrowUp" : () => {
					this.bpm += 10;
				},
				"Shift-ArrowDown" : () => {
					this.bpm -= 10;
				},
			}[key];
			if (func) {
				func();
				e.preventDefault();
			}
		});
	},

	methods: {
		start: async function () {
			const { player, audioContext, channelMaster } = this;
			this.playing = true;
			this.queued = [];

			audioContext.resume();
			// 初回の再生が遲れるが、開始タイミングを重視して現在時刻からスタートしたことにする
			// 2回目からはタイミングがあう
			let startTime = audioContext.currentTime; //  + (4 * 60 / this.bpm) * (1/4);
			this.timer = setInterval( async () => {
				const drum = await this.loadVoice(this.voice.src, this.voice.file);
				const { duration, pitch, volume } = this.voice;
				const rhythm = this.rhythm.notes;
				const sec = 4 * 60 / this.bpm; // quarter note


				// console.log('queue', {startTime}, audioContext.currentTime);
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
						// console.log(startTime, {pitch, volume}, note);
						player.queueWaveTable(audioContext, channelMaster.input, drum, startTime, pitch, duration, volume * queue.volumex);
						if (this.flash) {
							this.queued.push(startTime);
						}
						startTime += queue.length;
					}
				}
			}, 20);

			if (this.flash) {
				let lastFlash = performance.now();
				const updateFlash = () => {
					if (!this.playing) return;
					let flash = false;
					while (this.queued.length && this.queued[0] <= audioContext.currentTime) {
						this.queued.shift();
						flash = true;
					}

					if (flash) {
						const interval = performance.now() - lastFlash;
						if (interval > 150) {
							console.log({interval});
							document.body.className = "flash";
							window.navigator.vibrate(100);
						}
						lastFlash = performance.now();
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

		tapTempoTap: function () {
			const { tapTempo, audioContext } = this;
			clearTimeout(tapTempo.timer);
			audioContext.resume();

			const isFirstTap = !tapTempo.active;
			if (isFirstTap) {
				tapTempo.active = true;
				tapTempo.origin = performance.now();
				tapTempo.count = 0;
			} else {
				tapTempo.count++;
				const diff = performance.now() - tapTempo.origin;
				const bpm = (tapTempo.count * 60000) / diff;
				console.log('tap bpm', bpm);
				this.bpm = Math.round(bpm);
			}


			tapTempo.timer = setTimeout(() => {
				tapTempo.active = false;
				tapTempo.count = 0;
			}, 2000);
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

			if (params.has("volume") && +params.get("volume")) {
				console.log("load volume from hash");
				this.volume = +params.get("volume");
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
			params.set("volume", this.volume);
			history.replaceState(null, "", "#" + params.toString());
		},
	},
}).use(Vuetify.createVuetify({
	theme: {
		defaultTheme: 'light' // or dark
	}
})).mount("#app");


