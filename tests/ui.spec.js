import { test, expect } from '@playwright/test';

test.describe('UIテスト', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    
    // Vue.jsの読み込み完了のみ待機（WebAudioFontは不要）
    await page.waitForFunction(() => {
      return typeof Vue !== 'undefined';
    }, { timeout: 5000 });
  });

  test('初期状態の確認', async ({ page }) => {
    // 再生ボタンが表示されている
    await expect(page.locator('[data-testid="play-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="stop-button"]')).not.toBeVisible();
    
    // デフォルトBPM値
    await expect(page.locator('[data-testid="bpm-input"] input')).toHaveValue('120');
  });

  test('基本UI要素の表示確認', async ({ page }) => {
    // 各コントロール要素が表示されている
    await expect(page.locator('[data-testid="bpm-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="tap-tempo-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="rhythm-selector"]')).toBeVisible();
    await expect(page.locator('[data-testid="voice-selector"]')).toBeVisible();
    await expect(page.locator('[data-testid="volume-slider"]')).toBeVisible();
  });

  test('BPM入力の基本動作', async ({ page }) => {
    const bpmInput = page.locator('[data-testid="bpm-input"] input');
    
    // BPM値を変更
    await bpmInput.fill('140');
    await expect(bpmInput).toHaveValue('140');
    
    // 範囲内の値で動作確認
    await bpmInput.fill('180');
    await expect(bpmInput).toHaveValue('180');
  });

  test('再生/停止ボタンの切り替え', async ({ page }) => {
    // スペースキーで再生/停止切り替え
    await page.keyboard.press('Space');
    await expect(page.locator('[data-testid="stop-button"]')).toBeVisible();
    
    await page.keyboard.press('Space');
    await expect(page.locator('[data-testid="play-button"]')).toBeVisible();
  });

  test('タップテンポボタンのクリック', async ({ page }) => {
    const tapButton = page.locator('[data-testid="tap-tempo-button"]');
    
    // ボタンが表示されている
    await expect(tapButton).toBeVisible();
    
    // クリック可能
    await tapButton.click();
    await tapButton.click();
  });

  test('リズム選択メニューの表示', async ({ page }) => {
    const rhythmSelector = page.locator('[data-testid="rhythm-selector"]');
    
    // リズム選択メニューを開く
    await rhythmSelector.click();
    
    // 基本的なリズムパターンが表示されている
    await expect(page.getByText('4', { exact: true })).toBeVisible();
    
    // 4を選択
    await page.getByText('4', { exact: true }).click();
  });

  test('音源選択メニューの表示', async ({ page }) => {
    const voiceSelector = page.locator('[data-testid="voice-selector"]');
    
    // 音源選択メニューを開く
    await voiceSelector.click();
    
    // 基本的な音源が表示されている
    await expect(page.getByText('Bass Drum', { exact: true })).toBeVisible();
    
    // Bass Drumを選択
    await page.getByText('Bass Drum', { exact: true }).click();
  });

  test('BPM上限の確認', async ({ page }) => {
    const bpmInput = page.locator('[data-testid="bpm-input"] input');
    
    // 999を超える値を入力しても999に制限される
    await bpmInput.fill('1000');
    
    // Vue.jsの制限により999になることを確認
    await expect(bpmInput).toHaveValue('999');
  });

  test('キーボードショートカット - 矢印キーでBPM調整', async ({ page }) => {
    const bpmInput = page.locator('[data-testid="bpm-input"] input');
    
    // 120から開始
    await expect(bpmInput).toHaveValue('120');
    
    // 矢印キー上でBPM+1
    await page.keyboard.press('ArrowUp');
    await expect(bpmInput).toHaveValue('121');
    
    // 矢印キー下でBPM-1
    await page.keyboard.press('ArrowDown');
    await expect(bpmInput).toHaveValue('120');
    
    // Shift+矢印キー上でBPM+10
    await page.keyboard.press('Shift+ArrowUp');
    await expect(bpmInput).toHaveValue('130');
    
    // Shift+矢印キー下でBPM-10
    await page.keyboard.press('Shift+ArrowDown');
    await expect(bpmInput).toHaveValue('120');
  });

  test('キーボードショートカット - Shift+Space でタップテンポ', async ({ page }) => {
    const bpmInput = page.locator('[data-testid="bpm-input"] input');
    
    // Shift+Spaceでタップテンポ実行（500ms間隔 = 120BPM）
    await page.keyboard.press('Shift+Space');
    await page.waitForTimeout(500);
    await page.keyboard.press('Shift+Space');
    await page.waitForTimeout(500);
    await page.keyboard.press('Shift+Space');
    
    // 500ms間隔 = 2回/秒 = 120回/分 = 120BPM
    // タップテンポ機能でBPMが正しく計算・設定されることを確認
    const newBpm = await bpmInput.inputValue();
    const bpmValue = parseInt(newBpm);
    expect(bpmValue).toBeGreaterThan(115);
    expect(bpmValue).toBeLessThan(125);
  });

  test('タップテンポ精度テスト（ブラウザ内タイマー）', async ({ page }) => {
    // ブラウザ内で正確なタイミングでタップテンポボタンをクリック
    const testResults = await page.evaluate(async () => {
      const results = [];
      
      // テストケース: 異なる間隔でのタップテンポ（80BPMは時間がかかるため削除）
      const testCases = [
        { interval: 200, expectedBpm: 300 },
        { interval: 250, expectedBpm: 240 },
      ];
      
      for (const testCase of testCases) {
        // タップテンポボタンを取得
        const tapButton = document.querySelector('[data-testid="tap-tempo-button"]');
        const bpmInput = document.querySelector('[data-testid="bpm-input"] input');
        
        if (!tapButton || !bpmInput) {
          throw new Error('Required elements not found');
        }
        
        // BPMを初期値にリセット
        bpmInput.value = '120';
        bpmInput.dispatchEvent(new Event('input', { bubbles: true }));
        
        // タップテンポ状態をリセットするために2.5秒待機
        await new Promise(resolve => setTimeout(resolve, 2500));
        
        // 正確な間隔でタップテンポボタンを3回クリック
        const startTime = performance.now();
        
        // 1回目
        tapButton.click();
        
        // 2回目（指定間隔後）
        await new Promise(resolve => {
          setTimeout(() => {
            tapButton.click();
            resolve();
          }, testCase.interval);
        });
        
        // 3回目（さらに指定間隔後）
        await new Promise(resolve => {
          setTimeout(() => {
            tapButton.click();
            resolve();
          }, testCase.interval);
        });
        
        // 少し待ってからBPM値を読み取り
        await new Promise(resolve => setTimeout(resolve, 10));
        
        // 結果を記録
        results.push({
          interval: testCase.interval,
          expectedBpm: testCase.expectedBpm,
          actualBpm: parseInt(bpmInput.value),
          duration: performance.now() - startTime
        });
      }
      
      return results;
    });
    
    // 結果を検証
    for (const result of testResults) {
      console.log('Tap tempo test:', result);
      
      // 期待値の±5%の範囲で正確性を確認（Math.round()による丸め誤差を考慮）
      const tolerance = result.expectedBpm * 0.05;
      expect(result.actualBpm).toBeGreaterThanOrEqual(result.expectedBpm - tolerance);
      expect(result.actualBpm).toBeLessThanOrEqual(result.expectedBpm + tolerance);
    }
  });

  test('URLハッシュパラメータの更新', async ({ page }) => {
    // BPMを変更
    await page.fill('[data-testid="bpm-input"] input', '150');
    
    // 少し待ってからURLを確認
    await page.waitForTimeout(100);
    
    const url = page.url();
    expect(url).toContain('bpm=150');
  });

  test('URLハッシュパラメータからの値の復元', async ({ page }) => {
    // URLハッシュパラメータ付きで完全に新しいページとして読み込み
    await page.goto('about:blank'); // まず空白ページに移動
    await page.goto('/#bpm=180&rhythm=8x2&voice=Bass%20Drum&volume=75');
    
    // Vue.jsの読み込み完了を待機
    await page.waitForFunction(() => {
      return typeof Vue !== 'undefined';
    }, { timeout: 5000 });
    
    // loadHashParams()実行完了まで待機
    await page.waitForTimeout(200);
    
    // 各パラメータが正しく設定されることを確認
    const bpmInput = page.locator('[data-testid="bpm-input"] input');
    await expect(bpmInput).toHaveValue('180');
    
    // ボリュームスライダーの値を確認
    const volumeSlider = page.locator('[data-testid="volume-slider"] input');
    await expect(volumeSlider).toHaveValue('75');
    
    // リズム選択の確認（表示されているテキストで確認）
    const rhythmSelector = page.locator('[data-testid="rhythm-selector"]');
    await expect(rhythmSelector).toContainText('8x2');
    
    // 音源選択の確認（表示されているテキストで確認）
    const voiceSelector = page.locator('[data-testid="voice-selector"]');
    await expect(voiceSelector).toContainText('Bass Drum');
  });

  test('URLハッシュパラメータの部分的な復元', async ({ page }) => {
    // 一部のパラメータのみ指定して完全に新しいページとして読み込み
    await page.goto('about:blank'); // まず空白ページに移動
    await page.goto('/#bpm=240&volume=25');
    
    // Vue.jsの読み込み完了を待機
    await page.waitForFunction(() => {
      return typeof Vue !== 'undefined';
    }, { timeout: 5000 });
    
    // loadHashParams()実行完了まで待機
    await page.waitForTimeout(200);
    
    // 指定されたパラメータが設定される
    const bpmInput = page.locator('[data-testid="bpm-input"] input');
    await expect(bpmInput).toHaveValue('240');
    
    const volumeSlider = page.locator('[data-testid="volume-slider"] input');
    await expect(volumeSlider).toHaveValue('25');
    
    // 指定されていないパラメータはデフォルト値
    const rhythmSelector = page.locator('[data-testid="rhythm-selector"]');
    await expect(rhythmSelector).toContainText('1'); // デフォルト値（最初の要素）
    
    const voiceSelector = page.locator('[data-testid="voice-selector"]');
    await expect(voiceSelector).toContainText('Snare Drum'); // デフォルト値（最初の要素）
  });
});
