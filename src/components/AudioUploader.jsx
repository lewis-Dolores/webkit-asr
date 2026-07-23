export function AudioUploader({ onFileSelect, disabled }) {
  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file && onFileSelect) {
      onFileSelect(file)
    }
  }

  return (
    <div className="audio-uploader">
      <input
        type="file"
        accept="audio/*"
        onChange={handleFileChange}
        disabled={disabled}
      />
      {disabled && <p>處理中，請等待...</p>}
    </div>
  )
}
