# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

Vue.js 3とVuetify 3で構築されたWeb版メトロノームアプリケーションです。WebAudioFontを使用した高品質なドラム音源と、WebWorkerによる精密なタイミング制御を実装しています。PWA（Progressive Web App）として設計されており、デバイスにインストールしてオフラインでも使用可能です。

## 開発環境

このプロジェクトにはビルドシステムがありません。ブラウザで直接動作するクライアントサイドのみのアプリケーションです：

- **package.jsonやビルドツールなし** - 依存関係はCDNまたはローカルファイルで読み込み
- **Playwrightテスト** - UIテストと音響タイミングテストを分離した包括的なテストスイート
- **リンターやフォーマッターなし** - 直接ファイル編集方式
- **静的ファイル配信** - `npx serve`による配信（`npm run serve`）

## 主要なアーキテクチャ

### 音響実装
- **WebWorkerタイミング**: インラインワーカー`workerScript`による精密スケジューリング（メインスレッドブロック回避）
  - タブが非アクティブになったときに`setTimeout`/`setInterval`が停止する問題を回避
  - WebWorkerは背景で動作し続けるため、正確なタイミングを維持
  - WebWorker内では`setTimeout`は遅延しないため、20ms間隔でのtick処理が可能
- **WebAudioFont**: `/lib/webaudiofontdata/sound/`ディレクトリからサウンドフォントファイルを読み込み
- **Web Audio API**: `AudioContext.currentTime`による直接音声スケジューリング
- **タイミング精度**: `QUEUE_PREPARING_TIME = 0.5`秒でオーディオバッファキューイング
- **無音表現**: 完全な無音（0）ではなく0.0001を使用してブラウザの「音を出していますよ」マークの点滅を防止

### コアファイル
- `script.js`: 全アプリケーションロジックを含む単一Vue.jsコンポーネント（907行）
- `index.html`: メインエントリーポイント、CDNからVue.jsとVuetifyを読み込み、テスト用`data-testid`属性含む
- `manifest.webmanifest`: PWA設定
- `/lib/webaudiofont/`: 音声合成ライブラリ
- `/lib/webaudiofontdata/sound/`: ドラム音源サンプル
- `tests/`: Playwrightテストファイル（UI、MIDI、タイミングの3分割）
- `playwright.config.js`: テスト設定（UI、MIDI、タイミングテストの分離）

### 状態管理
- Vue.jsリアクティブデータでUI状態管理
- URLハッシュで設定永続化（`#bpm=120&rhythm=quarter&voice=snare`）
- localStorageでMIDIコントローラー設定
- 外部状態管理ライブラリは使用せず

## コード設計の特徴

### 最近のリファクタリング改善
- **`processMidiMessage()`**: 長大なif-elseチェーンからハンドラーマップパターンに改善（保守性・可読性向上）
- **`start()`メソッド分割**: 責任別に3メソッドに分割
  - `initializePlayback()`: 初期状態設定
  - `setupWorkerScheduler()`: WebWorker + 音声スケジューリング
  - `setupFlashAnimation()`: フラッシュアニメーション
- **包括的テストカバレッジ**: 全MIDI機能とタイミング精度がテストで検証済み

### メソッド設計原則
- **単一責任原則**: 各メソッドが明確な1つの責任を持つ
- **可読性重視**: 複雑なロジックを理解しやすい単位に分割
- **テスタビリティ**: ダイレクトメソッドテストによる確実な動作保証

## MIDI連携

設定可能なCCマッピングでMIDIコントローラーをサポート：
- デフォルトMIDIチャンネル: 15
- CC 74/75: テンポMSB/LSB制御（14bit精度でBPM制御、MIDIのCCは7bit制限のため分割）
- CC 76: タップテンポ
- CC 90: 相対テンポ調整
- CC 91-98: インクリメント/デクリメント制御
- CC 100: 開始/停止切り替え

MIDI設定はlocalStorageに`midiSettings`キーで保存されます。

### 動的リズムパターン
一部のリズムパターンは関数として定義され、`noteCount`を引数として受け取ります:
```javascript
notes: function me (n) {
    // me: 自己関数参照で状態保持
    // n: monotonic増加するnoteCount、n個ごとに異なる音を生成
}
```

## 一般的な開発タスク

### アプリケーションの実行
```bash
# ローカルでファイル配信
npm run serve
```

### テスト実行
```bash
# 全テスト（UI + MIDI + タイミングテスト）
npm test

# UIテストのみ（高速、5-10秒）
npm run test:ui

# MIDIテストのみ（高速、5-10秒）
npm run test:midi

# 音響タイミングテストのみ（時間がかかる、15-25秒）
npm run test:timing

# ヘッド付きモードでテスト実行（ブラウザ表示）
npm run test:headed
npm run test:ui-headed

# 特定のテストのみ実行
npm run test:ui -- --grep "タップテンポ"
```

### テスト設計アーキテクチャ
- **UIテスト** (`tests/ui.spec.js`): ボタンクリック、フォーム入力、キーボードショートカット、URLハッシュ復元
- **MIDIテスト** (`tests/midi.spec.js`): `processMidiMessage()`メソッドの直接テスト、全MIDIコントロール機能の検証
- **音響タイミングテスト** (`tests/timing.spec.js`): WebAudioFontの`queueWaveTable`監視による実際の音響タイミング精度検証
- **WebAudioFont監視**: 実際の音出力なしで`AudioContext.when`値による高精度タイミング検証（±0.01秒精度）
- **ブラウザ内タイマー**: Playwrightのタイミングに依存しない`setTimeout`によるタップテンポ精度テスト
- **URLハッシュテスト**: `about:blank`経由でページリロードを強制し、`loadHashParams()`実行を確実にする
- **ダイレクトメソッドテスト**: Vueインスタンスへの直接アクセスによるMIDI機能の単体テスト
- **安定化されたタイミングテスト**: キューイング時間(500ms)を考慮し、最初と最後のintervalのみ比較することで過渡期データを除外

### 音響問題のデバッグ
- `audioContext.state`を確認 - 開始にユーザーインタラクションが必要な場合があります
- `/lib/webaudiofontdata/sound/`のサウンドフォント読み込みを確認
- ブラウザDevToolsのPerformanceタブでWebWorkerタイミングを監視
- Flash機能は150ms以上の間隔でのみ動作（ちらつき防止、人間の認知限界を考慮）

### 新しいリズムパターンの追加
リズムパターンは`script.js`の`rhythms`computed propertyで定義されています。各パターンは`beat`（タイミング）と`accent`（音量）プロパティを持つオブジェクトの配列です。

### 新しい音源の追加
1. `/lib/webaudiofontdata/sound/`に新しいサウンドフォントファイルを追加
2. `script.js`の`voices`配列に新しい音源定義を更新
3. `webaudiofont`オブジェクトに対応するローダーを含める

## ブラウザ互換性

- Web Audio APIサポートが必要な現代的ブラウザ
- ES2015+機能を使用（モジュール、アロー関数、async/await）
- PWA機能は本番環境でHTTPS必須
- MIDIサポートにはWeb MIDI API必須（Chrome、Edge）
- テスト: Playwrightが Chrome/Desktop環境で実行（WebAudioFont対応必須）