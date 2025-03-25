import { useState, useEffect } from 'react';
import axios from 'axios';

export default function InteriorEditor() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [prompt, setPrompt] = useState('');
  const [generatedImage, setGeneratedImage] = useState('');
  const [mode, setMode] = useState('create');
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);

  const defaultPrompts = {
    create: 'A modern cozy living room with a large sofa, wooden coffee table, bookshelves, indoor plants, a rug, and soft natural lighting coming from big windows. Scandinavian interior design, minimalistic, warm color palette, high quality.',
    edit: 'a modern minimalist bedroom interior, clean lines, natural light, neutral colors, Scandinavian design, wooden floor, low bed, large window, minimal decoration, soft ambient lighting, cozy and elegant atmosphere, high resolution, photorealistic'
  };

  useEffect(() => {
    setPrompt(defaultPrompts[mode]);
  }, [mode]);

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
    setError(null);
  };

  const handleSubmit = async () => {
    if (!prompt.trim()) {
      setError("Please enter a prompt!");
      return;
    }

    if (mode === 'edit' && !selectedFile) {
      setError("Please upload an image to edit!");
      return;
    }

    setIsLoading(true);
    setProgress(0);
    setGeneratedImage('');
    setError(null);

    const progressInterval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + Math.random() * 10;
        return newProgress > 90 ? 90 : newProgress;
      });
    }, 500);

    try {
      const formData = new FormData();
      formData.append('prompt', prompt);
      
      if (mode === 'edit' && selectedFile) {
        formData.append('file', selectedFile);
      }

      const res = await axios.post('http://localhost:8000/generate', formData, {
        timeout: 300000 // 5 minutes timeout
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (!res.data?.image_path) {
        throw new Error("Server didn't return image path");
      }

      const imagePath = res.data.image_path.split('/').pop();
      setGeneratedImage(`http://localhost:8000/images/${imagePath}?t=${Date.now()}`);
      
    } catch (err) {
      console.error("Generation error details:", err);
      clearInterval(progressInterval);
      
      let errorMsg = "Failed to generate image";
      if (err.response) {
        errorMsg = err.response.data?.error || err.response.statusText;
      } else if (err.message) {
        errorMsg = err.message;
      }
      
      setError(errorMsg);
    } finally {
      setTimeout(() => setIsLoading(false), 500);
    }
  };

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
        {/* Radio buttons for mode selection */}
        <div style={{
          display: 'flex',
          gap: '1rem',
          marginBottom: '1rem',
          width: '100%',
          justifyContent: 'center'
        }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input
              type="radio"
              name="mode"
              checked={mode === 'create'}
              onChange={() => setMode('create')}
            />
            Create design from scratch
          </label>
          
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input
              type="radio"
              name="mode"
              checked={mode === 'edit'}
              onChange={() => setMode('edit')}
            />
            Edit design for current room
          </label>
        </div>

        {/* File input (only shown in edit mode) */}
        {mode === 'edit' && (
          <div style={{ width: '100%', marginBottom: '1em' }}>
            <input 
              type="file" 
              onChange={handleFileChange}
              accept="image/*"
              style={{ 
                width: '100%',
                padding: '0.5em',
                border: '1px solid #ddd',
                borderRadius: '4px'
              }}
            />
            <small style={{ display: 'block', marginTop: '0.5em', color: '#666' }}>
              Upload a photo of your room to edit
            </small>
          </div>
        )}
        
        <textarea
          style={{ 
            width: '100%',
            padding: '0.5em',
            border: '1px solid #ddd',
            borderRadius: '8px',
            marginBottom: '1em',
            minHeight: '100px',
            fontFamily: 'inherit',
            fontSize: '1em'
          }}
          placeholder="Describe the style of interior"
          value={prompt}
          onChange={(e) => {
            setPrompt(e.target.value);
            setError(null);
          }}
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
            marginBottom: '1em',
            fontSize: '1em',
            fontWeight: '500',
            transition: 'background-color 0.25s',
            opacity: isLoading ? 0.7 : 1
          }}
          onClick={handleSubmit}
          disabled={isLoading}
        >
          {mode === 'create' ? 'Create new design' : 'Edit room design'}
          {isLoading && ' (Processing...)'}
        </button>

        {/* Progress bar */}
        {isLoading && (
          <div style={{
            width: '100%',
            backgroundColor: '#f0f0f0',
            borderRadius: '8px',
            marginBottom: '1em',
            height: '8px',
            overflow: 'hidden'
          }}>
            <div 
              style={{
                width: `${progress}%`,
                height: '100%',
                backgroundColor: '#646cff',
                transition: 'width 0.3s ease',
                borderRadius: '8px'
              }}
            />
          </div>
        )}

        {/* Error message */}
        {error && (
          <div style={{
            color: '#d32f2f',
            backgroundColor: '#ffebee',
            padding: '0.8em',
            borderRadius: '4px',
            marginBottom: '1em',
            width: '100%',
            border: '1px solid #ef9a9a'
          }}>
            {error}
          </div>
        )}
        
        {generatedImage && (
          <div style={{ marginTop: '2em', width: '100%' }}>
            <h2 style={{ 
              textAlign: 'center', 
              marginBottom: '1em',
              fontSize: '1.5em',
              color: '#333'
            }}>
              {mode === 'create' ? 'Created Design' : 'Edited Design'}
            </h2>
            <div style={{
              border: '1px solid #eee',
              borderRadius: '8px',
              padding: '0.5em',
              backgroundColor: '#fafafa'
            }}>
              <img 
                src={generatedImage} 
                alt="Generated Interior" 
                style={{ 
                  maxWidth: '100%', 
                  borderRadius: '4px',
                  display: 'block'
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}