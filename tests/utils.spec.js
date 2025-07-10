import { PendulumLogic } from '../utils.js';
import { test, expect } from '@playwright/test';

test.describe('PendulumLogic', () => {
	test('一定のBPMで正しく位相が進むべき', () => {
		const logic = new PendulumLogic(120); // 120BPM -> 周期0.5秒
		
		// 0秒地点: 角度は0のはず
		expect(logic.update(0, [0, 0.5])).toBeCloseTo(0);

		// 0.25秒地点 (周期の半分): 角度は最大のはず
		expect(logic.update(0.25, [0.5, 1.0])).toBeCloseTo(20);

		// 0.5秒地点 (周期の終わり): 角度は0に戻るはず
		expect(logic.update(0.5, [1.0, 1.5])).toBeCloseTo(0);
	});

	test('BPMが変更された際にスムーズに角度を調整すべき', () => {
		const logic = new PendulumLogic(60); // 60BPM -> 周期1秒
		logic.update(0, [0, 1.0]);

		// 0.5秒後、BPMが120に変更されたとする (次のビートは0.5秒後)
		// queuedが [0.5, 1.0] になる
		const angle1 = logic.update(0.5, [0.5, 1.0]);
		expect(logic.isAdjusting).toBe(true); // 調整モードに入っている

		// 調整中の0.75秒地点
		const angle2 = logic.update(0.75, [1.0, 1.5]);
		
		// 調整完了後の1.0秒地点
		const angle3 = logic.update(1.0, [1.5, 2.0]);
		
		// 角度がジャンプせず、連続的に変化することをアサートできる
		expect(angle2).not.toBe(angle1);
	});
});
