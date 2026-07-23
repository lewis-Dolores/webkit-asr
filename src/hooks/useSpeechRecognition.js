import { useState, useRef } from 'react'

export function useSpeechRecognition() {
  const [isProcessing, setIsProcessing] = useState(false)
  const [results, setResults] = useState([])
  const [error, setError] = useState('')
  const recognitionRef = useRef(null)

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)
    const ms = Math.floor((seconds % 1) * 1000)
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')},${String(ms).padStart(3, '0')}`
  }

  const generateSRT = (results) => {
    let srtContent = ''
    results.forEach((result, index) => {
      srtContent += `${index + 1}\n`
      srtContent += `${formatTime(result.startTime)} --> ${formatTime(result.endTime)}\n`
      srtContent += `${result.text}\n\n`
    })
    return srtContent
  }

  const downloadSRT = (results) => {
    if (!results || results.length === 0) return
    const srtContent = generateSRT(results)
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

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      setError('您的瀏覽器不支援 Web Speech API，請使用 Chrome 或 Safari')
      return null
    }

    setIsProcessing(true)
    setError('')
    setResults([])

    try {
      const recognition = new SpeechRecognition()
      recognitionRef.current = recognition
      recognition.continuous = true
      recognition.interimResults = false
      recognition.lang = 'zh-TW'

      const finalResults = []
      let currentSegmentStart = 0
      let lastResultIndex = -1

      recognition.onresult = (event) => {
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i]
          if (result.isFinal) {
            const transcript = result[0].transcript
            const confidence = result[0].confidence
            
            // 簡單的時間戳估計
            const durationPerSegment = 3
            const startTime = lastResultIndex + 1
            const endTime = startTime + durationPerSegment
            
            finalResults.push({
              index: finalResults.length + 1,
              startTime: startTime,
              endTime: endTime,
              text: transcript,
              confidence: confidence
            })
            
            lastResultIndex++
          }
        }
      }

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error)
        if (event.error === 'no-speech') {
          // 忽略無語音錯誤
        } else if (event.error === 'aborted') {
          // 忽略中止錯誤
        } else {
          setError(`語音辨識錯誤：${event.error}`)
        }
      }

      recognition.start()

      // 建立 AudioContext 來播放音訊
      const audioContext = new AudioContext()
      const arrayBuffer = await audioFile.arrayBuffer()
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
      
      // 建立音訊來源並播放
      const source = audioContext.createBufferSource()
      source.buffer = audioBuffer
      source.connect(audioContext.destination)
      
      const duration = audioBuffer.duration
      const startTime = Date.now()
      
      source.start(0)
      
      // 等待播放完成
      await new Promise((resolve) => {
        source.onended = resolve
      })
      
      // 等待辨識結果穩定
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      recognition.stop()
      
      // 清理
      await audioContext.close()
      
      setResults(finalResults)

      if (finalResults.length === 0) {
        setError('未能識別任何語音內容。請確保音訊品質良好。')
      }

      return finalResults

    } catch (err) {
      console.error('Processing error:', err)
      setError(`處理錯誤：${err.message}`)
      return null
    } finally {
      setIsProcessing(false)
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop()
        } catch (e) {
          // 忽略停止錯誤
        }
      }
    }
  }

  const reset = () => {
    setResults([])
    setError('')
    setIsProcessing(false)
  }

  return {
    isProcessing,
    results,
    error,
    processAudio,
    downloadSRT,
    reset,
    formatTime
  }
}
