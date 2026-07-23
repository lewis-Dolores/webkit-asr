import { useState, useRef } from 'react'

export function useSpeechRecognition() {
  const [isProcessing, setIsProcessing] = useState(false)
  const [results, setResults] = useState([])
  const [error, setError] = useState('')
  const recognitionRef = useRef(null)
  const audioContextRef = useRef(null)

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
      const arrayBuffer = await audioFile.arrayBuffer()
      audioContextRef.current = new AudioContext()
      const audioBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer)
      
      const duration = audioBuffer.duration
      
      const recognition = new SpeechRecognition()
      recognitionRef.current = recognition
      recognition.continuous = true
      recognition.interimResults = false
      recognition.lang = 'zh-TW'

      const finalResults = []
      let chunkStartTime = 0

      recognition.onresult = (event) => {
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i]
          if (result.isFinal) {
            const transcript = result[0].transcript
            const confidence = result[0].confidence
            
            const estimatedStart = chunkStartTime + (finalResults.length / 3)
            const estimatedEnd = estimatedStart + 3
            
            finalResults.push({
              index: finalResults.length + 1,
              startTime: Math.min(estimatedStart, duration),
              endTime: Math.min(estimatedEnd, duration),
              text: transcript,
              confidence: confidence
            })
          }
        }
      }

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error)
        if (event.error === 'no-speech') {
        } else if (event.error === 'aborted') {
        } else {
          setError(`語音辨識錯誤：${event.error}`)
        }
      }

      recognition.onend = () => {
        console.log('Recognition ended')
      }

      recognition.start()

      const audioElement = document.createElement('audio')
      audioElement.src = URL.createObjectURL(audioFile)
      audioElement.connect = function(destination) {
        const source = audioContextRef.current.createMediaElementSource(this)
        source.connect(destination)
        source.connect(audioContextRef.current.destination)
      }
      
      const source = audioContextRef.current.createMediaStreamDestination()
      audioElement.connect(source)
      
      await new Promise((resolve) => {
        audioElement.onended = resolve
        audioElement.play().catch(err => {
          console.error('Playback error:', err)
          resolve()
        })
      })

      recognition.stop()
      await new Promise(resolve => setTimeout(resolve, 1000))

      setResults(finalResults)
      
      if (finalResults.length === 0) {
        setError('未能識別任何語音內容。請確保音訊品質良好，並在安靜環境下使用。')
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
        }
      }
      if (audioContextRef.current) {
        await audioContextRef.current.close()
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
