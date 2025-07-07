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
});
