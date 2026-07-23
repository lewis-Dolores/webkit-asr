import { useState } from 'react'
import { pipeline } from '@xenova/transformers'

export function useSpeechRecognition() {
  const [isProcessing, setIsProcessing] = useState(false)
  const [results, setResults] = useState([])
  const [error, setError] = useState('')
  const [progress, setProgress] = useState(0)

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)
    const ms = Math.floor((seconds % 1) * 1000)
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')},${String(ms).padStart(3, '0')}`
  }

  const generateSRT = (segments) => {
    let srtContent = ''
    segments.forEach((segment, index) => {
      srtContent += `${index + 1}\n`
      srtContent += `${formatTime(segment.timestamp[0])} --> ${formatTime(segment.timestamp[1])}\n`
      srtContent += `${segment.text.trim()}\n\n`
    })
    return srtContent
  }

  const downloadSRT = (srtContent) => {
    if (!srtContent) return
    const blob = new Blob([srtContent], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'subtitles.srt'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const processAudio = async (audioFile) => {
    if (!audioFile) {
      setError('請先選擇音訊檔案')
      return null
    }

    try {
      setIsProcessing(true)
      setError('')
      setProgress(0)
      setResults([])

      // Load Whisper model
      const transcriber = await pipeline('automatic-speech-recognition', 'Xenova/whisper-tiny', {
        progress_callback: (data) => {
          if (data.status === 'progress') {
            setProgress(Math.round(data.progress))
          }
        }
      })

      // Read audio file as ArrayBuffer
      const arrayBuffer = await audioFile.arrayBuffer()
      
      // Transcribe
      const output = await transcriber(arrayBuffer, {
        chunk_length_s: 30,
        stride_length_s: 5,
        return_timestamps: true
      })

      const segments = output.chunks || [{ text: output.text, timestamp: [0, 0] }]
      setResults(segments)
      
      const srtContent = generateSRT(segments)
      return srtContent
    } catch (err) {
      console.error('ASR Error:', err)
      setError(`辨識失敗：${err.message}`)
      return null
    } finally {
      setIsProcessing(false)
    }
  }

  return {
    isProcessing,
    results,
    error,
    progress,
    processAudio,
    downloadSRT
  }
}
