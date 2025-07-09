import { test, expect } from '@playwright/test';

test.describe('音響タイミングテスト', () => {
  test.beforeEach(async ({ page }) => {
    // WebAudioFontの呼び出しを監視
    await page.addInitScript(() => {
      window.audioCallHistory = [];
      
      const waitForWebAudioFont = () => {
        if (typeof WebAudioFontPlayer !== 'undefined') {
          const original = WebAudioFontPlayer.prototype.queueWaveTable;
          WebAudioFontPlayer.prototype.queueWaveTable = function(context, input, drum, when, pitch, duration, volume) {
            window.audioCallHistory.push({
              when: when,
              volume: volume,
              timestamp: performance.now(),
              contextTime: context.currentTime
            });
            console.log('Audio queued:', { when, volume, contextTime: context.currentTime });
            return original.call(this, context, input, drum, when, pitch, duration, volume);
          };
          console.log('WebAudioFont monitoring enabled');
        } else {
          setTimeout(waitForWebAudioFont, 100);
        }
      };
      waitForWebAudioFont();
    });
    
    await page.goto('/');
    
    // WebAudioFontの読み込み完了を待機
    await page.waitForFunction(() => {
      return typeof WebAudioFontPlayer !== 'undefined';
    }, { timeout: 30000 });
  });

  test('メトロノーム開始時に音声がスケジュールされる', async ({ page }) => {
    // BPM120に設定
    await page.fill('[data-testid="bpm-input"] input', '120');
    
    // メトロノーム開始
    await page.click('[data-testid="play-button"]');

    // 500ms待機
    await page.waitForTimeout(500);
    
    // 音声呼び出し履歴を確認
    const audioCallHistory = await page.evaluate(() => window.audioCallHistory || []);
    console.log('Audio calls:', audioCallHistory.length);
    
    // 音声がスケジュールされていることを確認
    expect(audioCallHistory.length).toBeGreaterThan(0);
    
    // メトロノーム停止
    await page.click('[data-testid="stop-button"]');
  });

  [240, 300, 360].forEach(bpm => {
    test(`BPM${bpm}での間隔確認`, async ({ page }) => {
      await page.fill('[data-testid="bpm-input"] input',  bpm.toString());
      
      // 履歴をクリア
      await page.evaluate(() => { window.audioCallHistory = []; });
      
      await page.click('[data-testid="play-button"]');
      
      // 3秒間実行
      await page.waitForTimeout(1000);
      
      const audioCallHistory = await page.evaluate(() => window.audioCallHistory || []);
      
      console.log('Total audio calls:', audioCallHistory.length);
      
      // 複数の音声がスケジュールされていることを確認
      expect(audioCallHistory.length).toBeGreaterThan(2);
      
      if (audioCallHistory.length >= 2) {
        for (let i = 1; i < audioCallHistory.length; i++) {
          const prev = audioCallHistory[i - 1];
          const curr = audioCallHistory[i];
          const interval = curr.when - prev.when;
          console.log(`Interval ${i}:`, interval);
          expect(interval).toBeCloseTo(60 / bpm, 5);
        }
      }
      
      await page.click('[data-testid="stop-button"]');
    });
  });

  test('再生中のリズム切り替えテスト', async ({ page }) => {
    // BPM240で固定（より高速で効率的なテスト）
    await page.fill('[data-testid="bpm-input"] input', '240');
    
    // 履歴をクリア
    await page.evaluate(() => { window.audioCallHistory = []; });
    
    // 4拍子で再生開始
    const rhythmSelector = page.locator('[data-testid="rhythm-selector"]');
    await rhythmSelector.click();
    await page.getByText('4', { exact: true }).click();
    
    await page.click('[data-testid="play-button"]');
    
    // 500ms間再生（4拍子: 間隔0.25秒で安定させる）
    await page.waitForTimeout(500);
    
    // 8x2リズムに切り替え
    await rhythmSelector.click();
    await page.getByText('8x2', { exact: true }).click();
    
    // キューイング時間(500ms)を考慮して700ms待機（8x2: 間隔0.125秒で安定させる）
    await page.waitForTimeout(700);
    
    await page.click('[data-testid="stop-button"]');
    
    // 音声呼び出し履歴を分析
    const audioCallHistory = await page.evaluate(() => window.audioCallHistory || []);
    
    console.log('Total audio calls:', audioCallHistory.length);
    expect(audioCallHistory.length).toBeGreaterThan(6);
    
    // 間隔を全て計算
    const intervals = [];
    for (let i = 1; i < audioCallHistory.length; i++) {
      const prev = audioCallHistory[i - 1];
      const curr = audioCallHistory[i];
      const interval = curr.when - prev.when;
      intervals.push(interval);
      console.log(`Interval ${i}:`, interval);
    }
    
    // 最初の2回と最後の2回のintervalのみを比較（切り替え過渡期を除外）
    if (intervals.length >= 4) {
      const initialIntervals = intervals.slice(0, 2);  // 最初の2回
      const laterIntervals = intervals.slice(-2);      // 最後の2回
      
      // 4拍子の期待間隔: 60/240 = 0.25秒
      // 8x2の期待間隔: 60/240/2 = 0.125秒
      
      const avgInitial = initialIntervals.reduce((a, b) => a + b) / initialIntervals.length;
      const avgLater = laterIntervals.reduce((a, b) => a + b) / laterIntervals.length;
      
      console.log('Average initial interval (4拍子):', avgInitial);
      console.log('Average later interval (8x2):', avgLater);
      
      // 最初は4拍子の間隔（0.25秒）
      expect(avgInitial).toBeCloseTo(0.25, 1);
      
      // 最後は8x2の間隔（0.125秒）
      expect(avgLater).toBeCloseTo(0.125, 1);
    }
  });

  test('16分音符から4分音符への切り替えテスト', async ({ page }) => {
    // BPM240で固定（4分音符間隔は0.25秒、16分音符間隔は0.0625秒）
    await page.fill('[data-testid="bpm-input"] input', '240');
    
    // 履歴をクリア
    await page.evaluate(() => { window.audioCallHistory = []; });
    
    // 16x4パターンで再生開始
    const rhythmSelector = page.locator('[data-testid="rhythm-selector"]');
    await rhythmSelector.click();
    await page.getByText('16x4', { exact: true }).click();
    
    await page.click('[data-testid="play-button"]');
    
    // 16分音符が1.5秒間鳴るまで待機（約12個の16分音符）
    await page.waitForTimeout(1500);
    
    // 4分音符パターンに切り替え
    await rhythmSelector.click();
    await page.getByText('1', { exact: true }).click();
    
    // 切り替え後の音響を確認するため1.5秒待機
    await page.waitForTimeout(1500);
    
    await page.click('[data-testid="stop-button"]');
    
    // 音声呼び出し履歴を分析
    const audioCallHistory = await page.evaluate(() => window.audioCallHistory || []);
    
    console.log('Total audio calls:', audioCallHistory.length);
    expect(audioCallHistory.length).toBeGreaterThan(8);
    
    // 期待される間隔
    const quarterBeatInterval = 60 / 240; // 0.25秒
    const sixteenthNoteInterval = quarterBeatInterval / 4; // 0.0625秒
    
    console.log('Audio call timings:');
    for (let i = 0; i < audioCallHistory.length; i++) {
      console.log(`[${i}] when: ${audioCallHistory[i].when}`);
    }
    
    // 間隔の変化を分析
    const intervals = [];
    for (let i = 1; i < audioCallHistory.length; i++) {
      const prev = audioCallHistory[i - 1];
      const curr = audioCallHistory[i];
      const interval = curr.when - prev.when;
      intervals.push(interval);
      console.log(`Interval ${i-1}-${i}: ${interval}`);
    }
    
    // 16分音符（0.0625秒間隔）から4分音符（0.25秒間隔）への切り替え検出
    let sixteenthNotes = [];
    let quarterNotes = [];
    
    for (let i = 0; i < intervals.length; i++) {
      if (Math.abs(intervals[i] - sixteenthNoteInterval) < 0.01) {
        sixteenthNotes.push(intervals[i]);
      } else if (Math.abs(intervals[i] - quarterBeatInterval) < 0.02) {
        quarterNotes.push(intervals[i]);
      }
    }
    
    console.log('Sixteenth note intervals:', sixteenthNotes);
    console.log('Quarter note intervals:', quarterNotes);
    
    // 16分音符の間隔が検出されていること
    expect(sixteenthNotes.length).toBeGreaterThan(0);
    
    // 4分音符の間隔が検出されていること
    expect(quarterNotes.length).toBeGreaterThan(0);
    
    // 16分音符が4の倍数回鳴っていることを確認
    if (sixteenthNotes.length > 0) {
      console.log('Number of sixteenth notes:', sixteenthNotes.length);
      // 4分音符境界で切り替わるので、16分音符は4の倍数回鳴る
      expect(sixteenthNotes.length % 4).toBe(0);
      
      // 平均間隔の確認
      const avgSixteenth = sixteenthNotes.reduce((a, b) => a + b) / sixteenthNotes.length;
      expect(avgSixteenth).toBeCloseTo(sixteenthNoteInterval, 1);
    }
    
    if (quarterNotes.length > 0) {
      // 4分音符の平均間隔が0.25秒に近いこと
      const avgQuarter = quarterNotes.reduce((a, b) => a + b) / quarterNotes.length;
      expect(avgQuarter).toBeCloseTo(quarterBeatInterval, 1);
    }
  });
});
