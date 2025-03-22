// frontend/src/components/InteriorEditor.jsx
import { useState } from 'react'
import axios from 'axios'

export default function InteriorEditor() {
  const [selectedFile, setSelectedFile] = useState(null)
  const [prompt, setPrompt] = useState('')
  const [generatedImage, setGeneratedImage] = useState('')

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0])
  }

  const handleSubmit = async () => {
    if (!selectedFile || !prompt) {
      alert("Загрузите фото и укажите описание!")
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
    <div className="p-4">
      <h1 className="text-2xl mb-4">AI Interior Designer</h1>
      <input type="file" onChange={handleFileChange} />
      <input
        className="border rounded my-2 p-2 w-full"
        placeholder="Опишите стиль интерьера"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
      />
      <button className="bg-blue-500 text-white p-2 rounded" onClick={handleSubmit}>
        Создать дизайн
      </button>
      {generatedImage && (
        <div className="mt-4">
          <h2>Созданный дизайн:</h2>
          <img src={generatedImage} alt="Generated Interior" />
        </div>
      )}
    </div>
  )
}
