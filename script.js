const QUEUE_PREPARING_TIME = 0.5;

const DEFAULT_MIDI_SETTINGS = {
	channel: 15,
	ccSetTempoMSB: 74, // value: 0-2
	ccSetTempoLSB: 75, // value: 0-127
	ccTapTempo: 76,
	ccSetTempoRelative: 90, // value: 0-127: -64 to 63
	ccIncrement: 91,
	ccDecrement: 92,
	ccIncrement5: 93,
	ccDecrement5: 94,
	ccIncrement10: 95,
	ccDecrement10: 96,
	ccSetTempoHalf: 97,
	ccSetTempoDouble: 98,
	ccStartStop: 100,
};

// WebWorkerを使用してスケジュールを管理するためのWorkerスクリプト
const workerScript = `
self.onmessage = function(e) {
  const { interval } = e.data;
  function tick() {
    postMessage('tick');
    setTimeout(tick, interval);
  }
  tick();
};
`;

// Workerを作成する関数
function createWorker(script) {
  const blob = new Blob([script], { type: 'application/javascript' });
  return new Worker(URL.createObjectURL(blob));
}

// beat() DSL - リズム定義用の統一的なインターフェース
function beat(length) {
	return {
		len: length,
		volume: 0.8,
		voice: null,
		
		rest() { return { ...this, volume: 0.0001 }; },
		accent() { return { ...this, volume: 1.0 }; },
		soft() { return { ...this, volume: 0.5 }; },
		voice(name) { return { ...this, voice: name }; },
		volume(v) { return { ...this, volume: v }; },
		triplet() { return { ...this, len: this.len * 3 }; }
	};
}

// Generator関数ヘルパー
function* pattern(...notes) {
	while (true) {
		for (const note of notes) {
			yield note;
		}
	}
}

function* sequence(logic) {
	let n = 0;
	while (true) {
		yield logic(n++);
	}
}



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

			midiSettings: DEFAULT_MIDI_SETTINGS,
			midiConnected: false,

			rhythm: {},
			rhythms: [
				{
					name: "1",
					imgs: [ "./img/notes/4note.svg" ],
					notes: function* () {
						yield* pattern(
							beat(4).accent()
						);
					},
				},
				{
					name: "2",
					imgs: Array(2).fill("./img/notes/4note.svg"),
					notes: function* () {
						yield* pattern(
							beat(4).accent(),
							beat(4)
						);
					},
				},
				{
					name: "3",
					imgs: Array(3).fill("./img/notes/4note.svg"),
					notes: function* () {
						yield* pattern(
							beat(4).accent(),
							beat(4),
							beat(4)
						);
					},
				},
				{
					name: "4",
					imgs: Array(4).fill("./img/notes/4note.svg"),
					notes: function* () {
						yield* pattern(
							beat(4).accent(),
							beat(4),
							beat(4),
							beat(4)
						);
					},
				},
				{
					name: "5",
					imgs: Array(5).fill("./img/notes/4note.svg"),
					notes: function* () {
						yield* pattern(
							beat(4).accent(),
							beat(4),
							beat(4),
							beat(4),
							beat(4)
						);
					},
				},
				{
					name: "8x2",
					imgs: ["./img/notes/8x2notes.svg"],
					notes: function* () {
						yield* pattern(
							beat(8).accent(),
							beat(8)
						);
					},
				},
				{
					name: "Triplet",
					imgs: ["./img/notes/triplet.svg"],
					notes: function* () {
						yield* pattern(
							beat(4).triplet().accent(),
							beat(4).triplet(),
							beat(4).triplet()
						);
					},
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
					notes: function* () {
						yield* pattern(
							beat(4).triplet().accent(),
							beat(4).triplet().rest(),
							beat(4).triplet()
						);
					},
				},
				{
					name: "16x4",
					imgs: ["./img/notes/16x4notes.svg"],
					notes: function* () {
						yield* pattern(
							beat(16).accent(),
							beat(16),
							beat(16),
							beat(16)
						);
					},
				},
				{
					name: "16x4-2",
					imgs: ["./img/notes/16x4-2notes.svg"],
					notes: function* () {
						yield* pattern(
							beat(16).accent(),
							beat(16).rest(),
							beat(16).rest(),
							beat(16)
						);
					},
				},
				{
					name: "Son Clave 3-2",
					notes: function* () {
						yield* pattern(
							beat(8).soft(),
							beat(16).rest(),
							beat(16),
							beat(8).rest(),
							beat(8),

							beat(8).rest(),
							beat(8),
							beat(8),
							beat(8).rest()
						);
					},
				},
				{
					name: "Son Clave 2-3",
					notes: function* () {
						yield* pattern(
							beat(8).rest(),
							beat(8),
							beat(8),
							beat(8).rest(),

							beat(8).soft(),
							beat(16).rest(),
							beat(16),
							beat(8).rest(),
							beat(8)
						);
					},
				},
				{
					name: "Rumba Clave 3-2",
					notes: function* () {
						yield* pattern(
							beat(8).soft(),
							beat(16).rest(),
							beat(16),
							beat(8).rest(),
							beat(16).rest(),
							beat(16),

							beat(8).rest(),
							beat(8),
							beat(8),
							beat(8).rest()
						);
					},
				},
				{
					name: "Rumba Clave 2-3",
					notes: function* () {
						yield* pattern(
							beat(8).rest(),
							beat(8),
							beat(8),
							beat(8).rest(),

							beat(8).soft(),
							beat(16).rest(),
							beat(16),
							beat(8).rest(),
							beat(16).rest(),
							beat(16)
						);
					},
				},
				{
					name: "1/4 Upbeat Support",
					voices: [
						"Snare Drum",
						"Bass Drum",
					],
					notes: function* () {
						yield* sequence(n => {
							const x = !(Math.floor(n / 8) % 2);
							const isSnare = n % 2;
							
							if (x) {
								return beat(8).soft().voice(isSnare ? "Snare Drum" : "Bass Drum");
							} else {
								return isSnare ? beat(8).voice("Snare Drum") : beat(8).rest().voice("Bass Drum");
							}
						});
					},
				},
				{
					name: "1/4 Triplet Upbeat Support",
					voices: [
						"Bass Drum",
						"Side Stick",
						"Snare Drum",
					],
					notes: function* () {
						yield* sequence(n => {
							const x = !(Math.floor(n / (3*4)) % 2);
							const voiceIndex = n % 3;
							const voiceNames = ["Bass Drum", "Side Stick", "Snare Drum"];
							const volumes = [0.0001, 0.0001, 0.5];
							
							const note = beat(4).triplet().voice(voiceNames[voiceIndex]);
							
							if (x) {
								return note.soft();
							} else {
								return volumes[voiceIndex] === 0.0001 ? note.rest() : note.soft();
							}
						});
					},
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
			],

			midiDialog: false,
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
			// 再生中にリズムが変更された場合、新しいgeneratorを作成
			if (this.playing && this.rhythmGenerator) {
				this.rhythmGenerator = this.rhythm.notes();
			}
		},
		volume: function () {
			this.updateHashParams();
			this.channelMaster.output.gain.value = this.volume / 100;
		},
		midiSettings: {
			handler: function () {
				this.saveMidiSettings();
			},
			deep: true
		},
	},

	mounted() {
		console.log("mounted");

		this._loadedVoices = new Map();

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
		}, true);

		const fit = () => {
			const viewportW = document.documentElement.clientWidth;
			const viewportH = document.documentElement.clientHeight;
			const scaleX = viewportW / 500;
			const scaleY = viewportH / this.$refs.container.$el.offsetHeight;
			console.log('fit', {scaleX, scaleY});
			const scale = Math.min(scaleX, scaleY);
			this.$el.style.transformOrigin = "top center";
			this.$el.style.transform = `scale(${scale})`;
		};
		fit();
		window.addEventListener("resize", fit);

		this.loadMidiSettings();
		this.autoConnectMidi();
	},

	methods: {
		start: async function () {
			const { player, audioContext, channelMaster } = this;
			this.playing = true;
			this.queued = [];
			this.rhythmGenerator = this.rhythm.notes();

			audioContext.resume();
			let startTime = audioContext.currentTime;

			// Workerを作成してスケジュールを管理
			if (this.timerWorker) {
				this.timerWorker.terminate();
			}
			this.timerWorker = createWorker(workerScript);
			this.timerWorker.postMessage({ interval: 20 });

			this.timerWorker.onmessage = async () => {
				const sec = 4 * 60 / this.bpm;
				
				// 必要な音源を事前に読み込み
				const voices = new Map();
				if (this.rhythm.voices) {
					for (let name of this.rhythm.voices) {
						const voice = this.voices.find(i => i.name === name);
						voices.set(name, { voice, drum: await this.loadVoice(voice.src, voice.file) });
					}
				}
				
				while (startTime < audioContext.currentTime + QUEUE_PREPARING_TIME) {
					const note = this.rhythmGenerator.next().value;
					const queue = {
						length: 1 / note.len * sec,
						volumex: note.volume
					};
					
					// 音源を決定
					let voice, drum;
					if (note.voice && voices.has(note.voice)) {
						// 指定された音源を使用
						voice = voices.get(note.voice).voice;
						drum = voices.get(note.voice).drum;
					} else {
						// デフォルト音源を使用
						voice = this.voice;
						drum = await this.loadVoice(this.voice.src, this.voice.file);
					}
					
					const { duration, pitch, volume } = voice;
					player.queueWaveTable(audioContext, channelMaster.input, drum, startTime, pitch, duration, volume * queue.volumex);
					
					if (this.flash) {
						this.queued.push(startTime);
					}
					startTime += queue.length;
				}
			};

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
							console.log({ interval });
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
			if (this.timerWorker) {
				this.timerWorker.terminate();
				this.timerWorker = null;
			}
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
			if (!this._loadedVoices.has(name)) {
				this._loadedVoices.set(name, new Promise((resolve) => {
					player.loader.startLoad(audioContext, src, name);
					player.loader.waitLoad(() => {
						console.log("loaded voice", name);
						resolve(window[name]);
					});
				}));
			}
			return this._loadedVoices.get(name);
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

			if (params.has("flash")) {
				this.flash = true;
			}

			if (params.has("midi")) {
				this.midiDialog = true;
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

		loadMidiSettings: async function () {
			let midiSettings;
			try {
				midiSettings = JSON.parse(localStorage.getItem('midiSettings'));
			} catch (e) {
				console.log('failed to load midi settings');
			}
			// merge
			this.midiSettings = Object.assign({}, DEFAULT_MIDI_SETTINGS, midiSettings);
		},

		saveMidiSettings: async function () {
			console.log('saveMidiSettings');
			localStorage.setItem('midiSettings', JSON.stringify(this.midiSettings));
		},

		initMidi: async function () {
			this.saveMidiSettings();
			this.connectMidi();
		},

		processMidiMessage: async function (data) {
			// https://midi.org/summary-of-midi-1-0-messages
			const status = data[0] & 0xF0;
			const channel = (data[0] & 0x0F) + 1;
			console.log(`status: ${status.toString(2)}, channel: ${channel}`);
			if (+this.midiSettings.channel !== 0 && channel !== +this.midiSettings.channel) {
				return;
			}

			const CC_STATUS = 0xB0;
			if (status !== CC_STATUS) {
				return;
			}

			const cc = data[1];
			const value = data[2];
			console.log(`cc: ${cc}, value: ${value}`);

			// MIDIハンドラーマップ - 動的に構築して可読性と保守性を向上
			const midiHandlers = {
				[+this.midiSettings.ccStartStop]: () => {
					if (this.playing) {
						this.stop();
					} else {
						this.start();
					}
				},
				[+this.midiSettings.ccTapTempo]: () => {
					this.tapTempoTap();
				},
				[+this.midiSettings.ccSetTempoMSB]: (value) => {
					this.bpm = (this.bpm & 0x7F) | (value << 7);
				},
				[+this.midiSettings.ccSetTempoLSB]: (value) => {
					this.bpm = (this.bpm & 0x3F80) | value;
				},
				[+this.midiSettings.ccSetTempoRelative]: (value) => {
					this.bpm += value - 64;
				},
				[+this.midiSettings.ccIncrement]: () => {
					this.bpm += 1;
				},
				[+this.midiSettings.ccDecrement]: () => {
					this.bpm -= 1;
				},
				[+this.midiSettings.ccIncrement5]: () => {
					this.bpm += 5;
				},
				[+this.midiSettings.ccDecrement5]: () => {
					this.bpm -= 5;
				},
				[+this.midiSettings.ccIncrement10]: () => {
					this.bpm += 10;
				},
				[+this.midiSettings.ccDecrement10]: () => {
					this.bpm -= 10;
				},
				[+this.midiSettings.ccSetTempoHalf]: () => {
					this.bpm = Math.round(+this.bpm / 2);
				},
				[+this.midiSettings.ccSetTempoDouble]: () => {
					this.bpm = Math.round(+this.bpm * 2);
				}
			};

			// ハンドラーが存在する場合のみ実行
			const handler = midiHandlers[cc];
			if (handler) {
				handler(value);
			}
		},

		autoConnectMidi: async function () {
			const result = await navigator.permissions.query({ name: "midi" });
			if (result.state === "granted") {
				this.connectMidi();
			} else if (result.state === "prompt") {
				console.log('prompt');
			} else {
				console.log('denied');
			}
		},

		connectMidi: async function () {
			const onmidimessage = (event) => {
				const dump = Array.from(event.data).map(n => (0x100 + n).toString(16).slice(1) ).join(' ')
				// console.log(event);
				console.log(event, dump);
				this.processMidiMessage(event.data);
			};

			console.log('connectMidi');
			const midi = await navigator.requestMIDIAccess({
				sysex: false
			});
			midi.onstatechange = function (event) {
				if (event.port.type !== 'input') {
					return;
				}
				if (event.port.state === 'connected') {
					console.log(`MIDI connected: ${event.port.name}`);
					event.port.onmidimessage = onmidimessage;
				} else
				if (event.port.state === 'disconnected') {
					console.log(`MIDI disconnected: ${event.port.name}`);
				}
			};

			for (let input of midi.inputs.values()) {
				input.onmidimessage = onmidimessage;
			}

			this.midiConnected = true;
		},

	},
}).use(Vuetify.createVuetify({
	theme: {
		defaultTheme: 'light' // or dark
	}
})).mount("#app");
