import { useState } from 'react'
import { useSpeechRecognition } from '../hooks/useSpeechRecognition'
import MainLayout from '../layouts/MainLayout'
import FileUpload from '../components/FileUpload'
import StatusBadge from '../components/StatusBadge'

export default function HomePage() {
  const [audioFile, setAudioFile] = useState(null)
  const { isProcessing, error, progress, processAudio, downloadSRT } = useSpeechRecognition()

  const handleFileSelect = (file) => {
    setAudioFile(file)
  }

  const handleProcess = async () => {
    if (!audioFile) return
    const srtContent = await processAudio(audioFile)
    if (srtContent) {
      downloadSRT(srtContent)
    }
  }

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-center">WebKit ASR - 音訊轉字幕工具</h1>
        
        <FileUpload onFileSelect={handleFileSelect} accept="audio/*" />
        
        {audioFile && (
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-medium mb-2">已選擇檔案：</h3>
            <p className="text-sm text-gray-600 break-all">{audioFile.name}</p>
            <p className="text-xs text-gray-500 mt-1">
              {(audioFile.size / 1024 / 1024).toFixed(2)} MB
            </p>
            
            <button
              onClick={handleProcess}
              disabled={isProcessing}
              className="mt-4 w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded transition"
            >
              {isProcessing ? '處理中...' : '開始辨識並下載 SRT'}
            </button>
            
            {progress > 0 && progress < 100 && (
              <div className="mt-4">
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-blue-600 h-2.5 rounded-full transition-all" 
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600 mt-1">模型載入進度：{progress}%</p>
              </div>
            )}
          </div>
        )}
        
        <StatusBadge status={isProcessing ? 'processing' : error ? 'error' : 'idle'} message={error} />
        
        <div className="text-sm text-gray-500 text-center">
          <p>使用 Whisper Tiny 模型，首次使用需下載約 40MB 模型檔案</p>
          <p>支援格式：MP3, WAV, WebM, OGG 等瀏覽器支援的音訊格式</p>
        </div>
      </div>
    </MainLayout>
  )
}
