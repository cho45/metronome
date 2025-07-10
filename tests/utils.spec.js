import { PendulumLogic } from '../utils.js';
import { test, expect } from '@playwright/test';

test.describe('PendulumLogic', () => {
	test('初期状態のテスト', () => {
		const logic = new PendulumLogic(120);
		
		// 初期状態の確認
		expect(logic.phase).toBe(0);
		expect(logic.period).toBe(0.5); // 60/120 = 0.5
		expect(logic.lastTime).toBe(-1);
		expect(logic.isAdjusting).toBe(false);
	});

	test('一定のBPMで正しく位相が進むべき', () => {
		const logic = new PendulumLogic(120); // 120BPM -> 周期0.5秒
		
		// 0秒地点: phase = 0, sin(0) = 0
		expect(logic.update(0, [0, 0.5])).toBeCloseTo(0);

		// 0.25秒地点 (周期の半分): phase = 0.5, sin(π/2) = 1
		expect(logic.update(0.25, [0.5, 1.0])).toBeCloseTo(1);

		// 0.5秒地点 (周期の終わり): phase = 1.0, sin(π) = 0
		expect(logic.update(0.5, [1.0, 1.5])).toBeCloseTo(0);
	});

	test('位相のsin値が正しく計算されるべき', () => {
		const logic = new PendulumLogic(240); // 240BPM -> 周期0.25秒
		
		// 0秒地点: phase = 0, sin(0) = 0
		expect(logic.update(0, [0, 0.25])).toBeCloseTo(0);

		// 0.125秒地点 (周期の半分): phase = 0.5, sin(π/2) = 1
		expect(logic.update(0.125, [0.25, 0.5])).toBeCloseTo(1);

		// 0.0625秒地点 (周期の1/4): phase = 0.25, sin(π/4) = √2/2 ≈ 0.707
		logic.phase = 0; // リセット
		logic.lastTime = 0;
		expect(logic.update(0.0625, [0.25, 0.5])).toBeCloseTo(Math.sin(Math.PI * 0.25));

		// 0.1875秒地点 (周期の3/4): phase = 0.75, sin(3π/4) = √2/2 ≈ 0.707
		logic.phase = 0; // リセット
		logic.lastTime = 0;
		expect(logic.update(0.1875, [0.25, 0.5])).toBeCloseTo(Math.sin(Math.PI * 0.75));
	});

	test('BPMが変更された際にスムーズに調整すべき', () => {
		const logic = new PendulumLogic(60); // 60BPM -> 周期1秒
		logic.update(0, [0, 1.0]);

		// 0.5秒後、BPMが120に変更されたとする (次のビートは0.5秒後)
		// queuedが [0.5, 1.0] になる
		const sinPhase1 = logic.update(0.5, [0.5, 1.0]);
		expect(logic.isAdjusting).toBe(true); // 調整モードに入っている

		// 調整中の0.75秒地点
		const sinPhase2 = logic.update(0.75, [1.0, 1.5]);
		
		// 調整完了後の1.0秒地点
		logic.update(1.0, [1.5, 2.0]);
		
		// sin値がジャンプせず、連続的に変化することをアサートできる
		expect(sinPhase2).not.toBe(sinPhase1);
		expect(logic.isAdjusting).toBe(false); // 調整完了
	});

	test('位相のラップアラウンドが正しく動作すべき', () => {
		const logic = new PendulumLogic(60); // 60BPM -> 周期1秒
		
		// 位相を2以上にする
		logic.phase = 2.5;
		const sinPhase = logic.update(0, [0, 1.0]);
		
		// 位相が2引かれて0.5になる
		expect(logic.phase).toBeCloseTo(0.5);
		expect(sinPhase).toBeCloseTo(Math.sin(Math.PI * 0.5));
	});

	test('queuedが空の場合の動作', () => {
		const logic = new PendulumLogic(120);
		
		// queuedが空の場合、調整は行われない
		logic.update(0.0, [0.0]);
		const sinPhase = logic.update(0.1, []);
		expect(logic.isAdjusting).toBe(false);
		expect(sinPhase).toBeCloseTo(Math.sin(Math.PI * (0.1 / 0.5)));
	});

	test('queuedが1要素の場合の動作', () => {
		const logic = new PendulumLogic(120);
		
		// queuedが1要素の場合、調整は行われない
		logic.update(0.0, [0.0]);
		const sinPhase = logic.update(0.1, [0.5]);
		expect(logic.isAdjusting).toBe(false);
		expect(sinPhase).toBeCloseTo(Math.sin(Math.PI * (0.1 / 0.5)));
	});

	test('時間が進まない場合の動作', () => {
		const logic = new PendulumLogic(120);
		
		// 初回
		const sinPhase1 = logic.update(0, [0, 0.5]);
		
		// 同じ時間で再度呼び出し
		const sinPhase2 = logic.update(0, [0, 0.5]);
		
		// 位相は進まない
		expect(sinPhase1).toBeCloseTo(sinPhase2);
	});

	test('調整モードの詳細テスト', () => {
		const logic = new PendulumLogic(60); // 60BPM -> 周期1秒
		
		// 初期状態
		logic.update(0, [0, 1.0]);
		expect(logic.isAdjusting).toBe(false);
		
		// BPM変更を検知
		logic.update(0.5, [0.5, 1.0]); // 120BPMに変更
		expect(logic.isAdjusting).toBe(true);
		expect(logic.period).toBe(0.5);
		expect(logic.adjustStart).toBe(0.5);
		expect(logic.adjustEnd).toBe(1.0);
		expect(logic.adjustDuration).toBe(0.5);
		
		// 調整完了
		logic.update(1.0, [1.0, 1.5]);
		expect(logic.isAdjusting).toBe(false);
	});

	test('調整時間が長い場合の処理', () => {
		const logic = new PendulumLogic(60); // 60BPM -> 周期1秒
		
		// 初期状態
		logic.update(0, [0, 1.0]);
		
		// 調整時間が複数周期分になる場合
		logic.update(0.5, [0.5, 3.0]); // 調整時間が2.5秒
		
		// 新しいperiod = 3.0 - 0.5 = 2.5秒
		// 調整時間が周期を超える場合の処理を確認
		// 実際の実装では、adjustDuration > periodの場合のみ調整される
		expect(logic.adjustDuration).toBe(2.5);
		expect(logic.period).toBe(2.5);
		expect(logic.isAdjusting).toBe(true);
	});

	test('エッジケース: periodが非常に小さい場合', () => {
		const logic = new PendulumLogic(6000); // 6000BPM -> 周期0.01秒
		
		// 正常に動作すること
		const sinPhase = logic.update(0.005, [0, 0.01]);
		expect(typeof sinPhase).toBe('number');
		expect(sinPhase).toBeGreaterThanOrEqual(-1);
		expect(sinPhase).toBeLessThanOrEqual(1);
	});

	test('複数回の調整', () => {
		const logic = new PendulumLogic(60);
		
		// 初期状態
		logic.update(0, [0, 1.0]);
		
		// 1回目の調整
		logic.update(0.5, [0.5, 1.0]);
		expect(logic.isAdjusting).toBe(true);
		
		// 調整完了
		logic.update(1.0, [1.0, 1.5]);
		expect(logic.isAdjusting).toBe(false);
		
		// 2回目の調整
		logic.update(1.25, [1.25, 1.5]);
		expect(logic.isAdjusting).toBe(true);
	});

	test('負の時間差による動作', () => {
		const logic = new PendulumLogic(120);
		
		// 初期状態
		logic.update(1.0, [1.0, 1.5]);
		
		// 時間が戻る場合（通常は起こらないが、テストのため）
		const sinPhase = logic.update(0.5, [0.5, 1.0]);
		
		// 正常な値が返されること
		expect(typeof sinPhase).toBe('number');
		expect(sinPhase).toBeGreaterThanOrEqual(-1);
		expect(sinPhase).toBeLessThanOrEqual(1);
	});

	test('periodの変更が微小な場合', () => {
		const logic = new PendulumLogic(120);
		
		// 初期状態
		logic.update(0, [0, 0.5]);
		
		// 同じ値で変更なし
		logic.update(0.25, [0.25, 0.75]);
		
		// 調整モードに入らない（変更なし）
		expect(logic.isAdjusting).toBe(false);
	});
});
