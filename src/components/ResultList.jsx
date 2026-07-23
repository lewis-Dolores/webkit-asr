export function ResultList({ results, onDownload }) {
  if (!results || results.length === 0) return null

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)
    const ms = Math.floor((seconds % 1) * 1000)
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')},${String(ms).padStart(3, '0')}`
  }

  return (
    <div className="result-list">
      <div className="result-header">
        <h2>轉換結果 ({results.length} 段)</h2>
        <button onClick={onDownload} className="download-btn">
          📥 下載 SRT
        </button>
      </div>
      
      <div className="results-container">
        {results.map((result, index) => (
          <div key={index} className={`result-item ${index % 2 === 0 ? 'even' : 'odd'}`}>
            <div className="result-time">
              {formatTime(result.startTime)} → {formatTime(result.endTime)}
              {result.confidence && (
                <span className="confidence">
                  信心度：{(result.confidence * 100).toFixed(1)}%
                </span>
              )}
            </div>
            <div className="result-text">{result.text}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
