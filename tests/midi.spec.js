import { test, expect } from '@playwright/test';

test.describe('MIDI機能テスト', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    
    // Vue.jsの読み込み完了を待機
    await page.waitForFunction(() => {
      return typeof Vue !== 'undefined';
    }, { timeout: 5000 });
    
    // 初期化完了まで少し待機
    await page.waitForTimeout(200);
  });

  test('processMidiMessage - BPM MSB/LSB制御', async ({ page }) => {
    const testResults = await page.evaluate(() => {
      // Vueインスタンスにアクセス
      const app = document.querySelector('#app').__vue_app__;
      const vueInstance = app._instance.ctx;
      
      // MIDI設定をデフォルトに確保
      vueInstance.midiSettings.channel = 15;
      vueInstance.midiSettings.ccSetTempoMSB = 74;
      vueInstance.midiSettings.ccSetTempoLSB = 75;
      
      const results = [];
      
      // テスト1: BPM MSB制御
      vueInstance.bpm = 120; // 初期値設定
      const beforeBpm = vueInstance.bpm;
      
      // MSB=2, LSB=100 → BPM = (2 << 7) | 100 = 356
      vueInstance.processMidiMessage([0xBE, 74, 2]); // チャンネル15, CC74, value=2
      vueInstance.processMidiMessage([0xBE, 75, 100]); // チャンネル15, CC75, value=100
      
      const expectedBpm = (2 << 7) | 100; // 256 + 100 = 356
      
      results.push({
        test: 'BPM MSB/LSB制御',
        beforeBpm,
        afterBpm: vueInstance.bpm,
        expectedBpm,
        success: vueInstance.bpm === expectedBpm
      });
      
      return results;
    });
    
    // 検証
    for (const result of testResults) {
      console.log('MIDI test result:', result);
      expect(result.success).toBe(true);
      expect(result.afterBpm).toBe(result.expectedBpm);
    }
  });

  test('processMidiMessage - 開始/停止制御', async ({ page }) => {
    const testResults = await page.evaluate(() => {
      const vueInstance = document.querySelector('#app').__vue_app__._instance.ctx;
      
      // MIDI設定確保
      vueInstance.midiSettings.channel = 15;
      vueInstance.midiSettings.ccStartStop = 100;
      
      const results = [];
      
      // 初期状態は停止
      const beforePlaying = vueInstance.playing;
      
      // 開始/停止メッセージ送信
      vueInstance.processMidiMessage([0xBE, 100, 127]); // チャンネル15, CC100
      
      const afterPlaying = vueInstance.playing;
      
      results.push({
        test: '開始/停止切り替え',
        beforePlaying,
        afterPlaying,
        toggleSuccess: beforePlaying !== afterPlaying
      });
      
      return results;
    });
    
    for (const result of testResults) {
      console.log('MIDI start/stop test:', result);
      expect(result.toggleSuccess).toBe(true);
    }
  });

  test('processMidiMessage - 相対テンポ制御', async ({ page }) => {
    const testResults = await page.evaluate(() => {
      const vueInstance = document.querySelector('#app').__vue_app__._instance.ctx;
      
      // MIDI設定確保
      vueInstance.midiSettings.channel = 15;
      vueInstance.midiSettings.ccSetTempoRelative = 90;
      
      const results = [];
      
      // テスト1: +6 BPM
      vueInstance.bpm = 120;
      const beforeBpm1 = vueInstance.bpm;
      vueInstance.processMidiMessage([0xBE, 90, 70]); // 70-64=+6
      
      results.push({
        test: '相対テンポ +6',
        beforeBpm: beforeBpm1,
        afterBpm: vueInstance.bpm,
        expectedBpm: beforeBpm1 + 6,
        success: vueInstance.bpm === beforeBpm1 + 6
      });
      
      // テスト2: -10 BPM
      const beforeBpm2 = vueInstance.bpm;
      vueInstance.processMidiMessage([0xBE, 90, 54]); // 54-64=-10
      
      results.push({
        test: '相対テンポ -10',
        beforeBpm: beforeBpm2,
        afterBpm: vueInstance.bpm,
        expectedBpm: beforeBpm2 - 10,
        success: vueInstance.bpm === beforeBpm2 - 10
      });
      
      return results;
    });
    
    for (const result of testResults) {
      console.log('MIDI relative tempo test:', result);
      expect(result.success).toBe(true);
      expect(result.afterBpm).toBe(result.expectedBpm);
    }
  });

  test('processMidiMessage - インクリメント/デクリメント制御', async ({ page }) => {
    const testResults = await page.evaluate(() => {
      const vueInstance = document.querySelector('#app').__vue_app__._instance.ctx;
      
      // MIDI設定確保
      vueInstance.midiSettings.channel = 15;
      vueInstance.midiSettings.ccIncrement = 91;
      vueInstance.midiSettings.ccDecrement = 92;
      vueInstance.midiSettings.ccIncrement5 = 93;
      vueInstance.midiSettings.ccDecrement5 = 94;
      vueInstance.midiSettings.ccIncrement10 = 95;
      vueInstance.midiSettings.ccDecrement10 = 96;
      
      const results = [];
      
      // BPM 120から開始
      vueInstance.bpm = 120;
      
      // +1テスト
      const beforeInc1 = vueInstance.bpm;
      vueInstance.processMidiMessage([0xBE, 91, 127]);
      results.push({
        test: 'インクリメント +1',
        before: beforeInc1,
        after: vueInstance.bpm,
        expected: beforeInc1 + 1,
        success: vueInstance.bpm === beforeInc1 + 1
      });
      
      // +5テスト
      const beforeInc5 = vueInstance.bpm;
      vueInstance.processMidiMessage([0xBE, 93, 127]);
      results.push({
        test: 'インクリメント +5',
        before: beforeInc5,
        after: vueInstance.bpm,
        expected: beforeInc5 + 5,
        success: vueInstance.bpm === beforeInc5 + 5
      });
      
      // +10テスト
      const beforeInc10 = vueInstance.bpm;
      vueInstance.processMidiMessage([0xBE, 95, 127]);
      results.push({
        test: 'インクリメント +10',
        before: beforeInc10,
        after: vueInstance.bpm,
        expected: beforeInc10 + 10,
        success: vueInstance.bpm === beforeInc10 + 10
      });
      
      // -1テスト
      const beforeDec1 = vueInstance.bpm;
      vueInstance.processMidiMessage([0xBE, 92, 127]);
      results.push({
        test: 'デクリメント -1',
        before: beforeDec1,
        after: vueInstance.bpm,
        expected: beforeDec1 - 1,
        success: vueInstance.bpm === beforeDec1 - 1
      });
      
      return results;
    });
    
    for (const result of testResults) {
      console.log('MIDI increment/decrement test:', result);
      expect(result.success).toBe(true);
      expect(result.after).toBe(result.expected);
    }
  });

  test('processMidiMessage - タップテンポ制御', async ({ page }) => {
    const testResults = await page.evaluate(() => {
      const vueInstance = document.querySelector('#app').__vue_app__._instance.ctx;
      
      // MIDI設定確保
      vueInstance.midiSettings.channel = 15;
      vueInstance.midiSettings.ccTapTempo = 76;
      
      // タップテンポ状態をリセット
      vueInstance.tapTempo.active = false;
      
      // タップテンポメッセージ送信
      vueInstance.processMidiMessage([0xBE, 76, 127]);
      
      return {
        test: 'タップテンポ開始',
        tapTempoActive: vueInstance.tapTempo.active,
        success: vueInstance.tapTempo.active === true
      };
    });
    
    console.log('MIDI tap tempo test:', testResults);
    expect(testResults.success).toBe(true);
  });

  test('processMidiMessage - チャンネルフィルタリング', async ({ page }) => {
    const testResults = await page.evaluate(() => {
      const vueInstance = document.querySelector('#app').__vue_app__._instance.ctx;
      
      // MIDI設定: チャンネル15のみ受け付ける
      vueInstance.midiSettings.channel = 15;
      vueInstance.midiSettings.ccIncrement = 91;
      
      const results = [];
      
      // テスト1: 間違ったチャンネル（チャンネル1）
      vueInstance.bpm = 120;
      const beforeWrongChannel = vueInstance.bpm;
      vueInstance.processMidiMessage([0xB0, 91, 127]); // チャンネル1 (0xB0 = 0xB0 + 0)
      
      results.push({
        test: '間違ったチャンネル無視',
        before: beforeWrongChannel,
        after: vueInstance.bpm,
        shouldIgnore: beforeWrongChannel === vueInstance.bpm
      });
      
      // テスト2: 正しいチャンネル（チャンネル15）
      const beforeCorrectChannel = vueInstance.bpm;
      vueInstance.processMidiMessage([0xBE, 91, 127]); // チャンネル15 (0xBE = 0xB0 + 14)
      
      results.push({
        test: '正しいチャンネル処理',
        before: beforeCorrectChannel,
        after: vueInstance.bpm,
        shouldProcess: beforeCorrectChannel !== vueInstance.bpm
      });
      
      return results;
    });
    
    for (const result of testResults) {
      console.log('MIDI channel filtering test:', result);
      if (result.test === '間違ったチャンネル無視') {
        expect(result.shouldIgnore).toBe(true);
      } else if (result.test === '正しいチャンネル処理') {
        expect(result.shouldProcess).toBe(true);
      }
    }
  });

  test('processMidiMessage - 無効なMIDIメッセージ', async ({ page }) => {
    const testResults = await page.evaluate(() => {
      const vueInstance = document.querySelector('#app').__vue_app__._instance.ctx;
      
      // 初期状態を記録
      const beforeState = {
        bpm: vueInstance.bpm,
        playing: vueInstance.playing
      };
      
      // 無効なMIDIメッセージ（Note Onメッセージ、CCではない）
      vueInstance.processMidiMessage([0x9E, 60, 127]); // Note On, チャンネル15
      
      const afterState = {
        bpm: vueInstance.bpm,
        playing: vueInstance.playing
      };
      
      return {
        test: '無効なMIDIメッセージ無視',
        beforeState,
        afterState,
        stateUnchanged: 
          beforeState.bpm === afterState.bpm && 
          beforeState.playing === afterState.playing
      };
    });
    
    console.log('MIDI invalid message test:', testResults);
    expect(testResults.stateUnchanged).toBe(true);
  });

  test('processMidiMessage - テンポ半分/倍速制御', async ({ page }) => {
    const testResults = await page.evaluate(() => {
      const vueInstance = document.querySelector('#app').__vue_app__._instance.ctx;
      
      // MIDI設定確保
      vueInstance.midiSettings.channel = 15;
      vueInstance.midiSettings.ccSetTempoHalf = 97;
      vueInstance.midiSettings.ccSetTempoDouble = 98;
      
      const results = [];
      
      // テスト1: 半分速度
      vueInstance.bpm = 120;
      const beforeHalf = vueInstance.bpm;
      vueInstance.processMidiMessage([0xBE, 97, 127]);
      
      results.push({
        test: 'テンポ半分',
        before: beforeHalf,
        after: vueInstance.bpm,
        expected: Math.round(beforeHalf / 2),
        success: vueInstance.bpm === Math.round(beforeHalf / 2)
      });
      
      // テスト2: 倍速
      const beforeDouble = vueInstance.bpm;
      vueInstance.processMidiMessage([0xBE, 98, 127]);
      
      results.push({
        test: 'テンポ倍速',
        before: beforeDouble,
        after: vueInstance.bpm,
        expected: Math.round(beforeDouble * 2),
        success: vueInstance.bpm === Math.round(beforeDouble * 2)
      });
      
      return results;
    });
    
    for (const result of testResults) {
      console.log('MIDI tempo half/double test:', result);
      expect(result.success).toBe(true);
      expect(result.after).toBe(result.expected);
    }
  });
});