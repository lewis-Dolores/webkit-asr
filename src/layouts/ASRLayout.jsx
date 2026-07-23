import { useSpeechRecognition } from '../hooks/useSpeechRecognition'
import { AudioUploader } from '../components/AudioUploader'
import { ResultList } from '../components/ResultList'

export function ASRLayout() {
  const {
    isProcessing,
    results,
    error,
    processAudio,
    downloadSRT,
    reset
  } = useSpeechRecognition()

  const handleFileSelect = async (file) => {
    await processAudio(file)
  }

  const handleDownload = () => {
    downloadSRT(results)
  }

  return (
    <div className="asr-layout">
      <header className="asr-header">
        <h1>🎤 Audio to SRT Converter</h1>
        <p className="subtitle">使用 WebKit Web Speech API 將音訊轉換為 SRT 字幕檔</p>
      </header>

      <main className="asr-main">
        <section className="upload-section">
          <AudioUploader 
            onFileSelect={handleFileSelect} 
            disabled={isProcessing} 
          />
        </section>

        {error && (
          <section className="error-section">
            <div className="error-message">⚠️ {error}</div>
          </section>
        )}

        {results && results.length > 0 && (
          <section className="results-section">
            <ResultList 
              results={results} 
              onDownload={handleDownload} 
            />
          </section>
        )}

        <section className="info-section">
          <h3>📝 使用說明：</h3>
          <ul>
            <li>本工具使用瀏覽器的 Web Speech API (webkitSpeechRecognition) 進行語音辨識</li>
            <li><strong>注意：</strong>由於 Web Speech API 的限制，音訊需要實際播放才能被辨識</li>
            <li>建議在安靜環境下使用，並將音量調至適當大小</li>
            <li>支援格式：MP3, WAV, OGG, M4A 等瀏覽器支援的音訊格式</li>
            <li>語言設定：目前預設為繁體中文 (zh-TW)</li>
            <li>最佳瀏覽器：Google Chrome, Microsoft Edge, Safari</li>
          </ul>
        </section>
      </main>

      <footer className="asr-footer">
        <p>WebKit ASR Tool &copy; 2024</p>
      </footer>
    </div>
  )
}
