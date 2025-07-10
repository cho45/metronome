export class PendulumLogic {
	constructor(initialBpm) {
		this.phase = 0;
		this.period = 60 / initialBpm;
		this.lastTime = 0;

		this.isAdjusting = false;
		this.adjustFrom = 0;
		this.adjustTo = 0;
		this.adjustStart = 0;
		this.adjustEnd = 0;
		this.adjustDuration = 0;
	}

	/**
	 * 現在時刻とビートキューを基に、振り子の次の角度を計算して返す
	 * @param {number} currentTime - 現在のオーディオコンテキスト時刻
	 * @param {number[]} queued - 音声再生がスケジュールされた時刻の配列
	 * @returns {number} - CSS transform用の角度(deg)
	 */
	update(currentTime, queued) {
		if (this.lastTime === -1) {
			this.lastTime = currentTime;
		}

		// 1. 経過時間(dt)を計算し、以前のperiodに基づいて位相を進める
		const dt = currentTime - this.lastTime;
		this.phase += dt / this.period;
		this.lastTime = currentTime;

		// 2. BPM/periodの変更を検知し、必要なら調整モードに入る
		if (queued.length > 1) {
			let newPeriod = queued[1] - queued[0];
			if (Math.abs(newPeriod - this.period) > Number.EPSILON) {
				this.period = newPeriod; // periodを更新
				this.isAdjusting = true;
				this.adjustFrom = this.phase; // 現在の位相から調整を開始
				this.adjustStart = currentTime;
				this.adjustEnd = queued[1];
				this.adjustDuration = this.adjustEnd - this.adjustStart;
				this.adjustTo = Math.ceil(this.phase);
				if (this.adjustDuration > this.period) {
					const adjustCount = Math.floor(this.adjustDuration / this.period);
					this.adjustEnd = this.adjustEnd - (adjustCount * this.period);
					this.adjustDuration = this.adjustEnd - this.adjustStart;
				}
			}
		}

		// 3. 調整モードなら、位相を補間計算で上書きする
		if (this.isAdjusting) {
			const t = (currentTime - this.adjustStart) / this.adjustDuration;
			if (t >= 1) {
				this.phase = this.adjustTo;
				this.isAdjusting = false;
			} else if (t >= 0) { // tが負にならないようにガード
				this.phase = this.adjustFrom + (this.adjustTo - this.adjustFrom) * t;
			}
		}

		if (this.phase > 2) this.phase -= 2;
		const sinPhase = Math.sin(Math.PI * this.phase);
		return sinPhase * 20; // 角度を返す
	}
}
