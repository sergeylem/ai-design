import { useState } from 'react'
import axios from 'axios'

export default function InteriorEditor() {
  const [selectedFile, setSelectedFile] = useState(null)
  const [prompt, setPrompt] = useState(
    'a modern minimalist bedroom interior, clean lines, natural light, neutral colors, Scandinavian design, wooden floor, low bed, large window, minimal decoration, soft ambient lighting, cozy and elegant atmosphere, high resolution, photorealistic'
  )

  const [generatedImage, setGeneratedImage] = useState('')

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0])
  }

  const handleSubmit = async () => {
    if (!selectedFile || !prompt) {
      alert("Load your photo (jpg file) and put a prompt!")
      return
    }

    const formData = new FormData()
    formData.append('file', selectedFile)
    formData.append('prompt', prompt)

    const res = await axios.post('http://localhost:8000/generate', formData)
    const imagePath = res.data.image_path.split('/').pop()
    setGeneratedImage(`http://localhost:8000/images/${imagePath}`)
  }

  return (
    <div style={{ width: '100%' }}>
      <h1 style={{ fontSize: '2em', marginBottom: '1em', textAlign: 'center' }}>AI Interior Designer</h1>
      
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center',
        width: '100%',
        maxWidth: '800px',
        margin: '0 auto',
        padding: '0 1rem'
      }}>
        <input 
          type="file" 
          onChange={handleFileChange}
          style={{ 
            marginBottom: '1em',
            width: '100%'
          }}
        />
        
        <textarea
          style={{ 
            width: '100%',
            padding: '0.5em',
            border: '1px solid #ddd',
            borderRadius: '8px',
            marginBottom: '1em',
            minHeight: '100px'
          }}
          placeholder="Describe the style of interior"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
        
        <button 
          style={{ 
            backgroundColor: '#646cff',
            color: 'white',
            padding: '0.6em 1.2em',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            width: '100%',
            marginBottom: '1em'
          }}
          onClick={handleSubmit}
        >
          Create new design
        </button>
        
        {generatedImage && (
          <div style={{ marginTop: '2em', width: '100%' }}>
            <h2 style={{ textAlign: 'center', marginBottom: '1em' }}>Созданный дизайн:</h2>
            <img 
              src={generatedImage} 
              alt="Generated Interior" 
              style={{ maxWidth: '100%', borderRadius: '8px' }}
            />
          </div>
        )}
      </div>
    </div>
  )
}