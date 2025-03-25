from fastapi import FastAPI, UploadFile, Form
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware 
from diffusers import (
    StableDiffusionControlNetPipeline,
    ControlNetModel,
    StableDiffusionPipeline,
)
from controlnet_aux import MidasDetector
import torch
from PIL import Image
from io import BytesIO
import os
from datetime import datetime
from typing import Optional

device = "mps"

app = FastAPI()

print("🔄 Loading ControlNet...")
controlnet = ControlNetModel.from_pretrained(
    "lllyasviel/sd-controlnet-depth",  # ControlNet for SD 1.5
    torch_dtype=torch.float16
).to(device)

print("🔄 Loading Stable Diffusion XL pipeline...")
pipe = StableDiffusionControlNetPipeline.from_pretrained(
    "runwayml/stable-diffusion-v1-5",  # SD 1.5 model
    controlnet=controlnet,
    torch_dtype=torch.float16
).to(device)

print("🔄 Loading standard SD pipeline (no ControlNet)...")
text2img_pipe = StableDiffusionPipeline.from_pretrained(
    "runwayml/stable-diffusion-v1-5",
    torch_dtype=torch.float16
).to(device)

print("🎨 Loading LoRA from ./loras/lora_v1.0/lora.safetensors ...")
try:
    pipe.load_lora_weights(
        "./loras/lora_v1.0", 
        weight_name="Ohty_ohty_Cream_LoRA_V1.safetensors",
        adapter_name="default"
    )
except Exception as e:
    print("❌ Failed to load LoRA:", e)


print("🔍 Loading Depth detector (Midas)...")
depth_estimator = MidasDetector.from_pretrained("lllyasviel/ControlNet")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In prod need to define domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "AI Design API is running!"}

@app.post("/generate")
async def generate(prompt: str = Form(...), file: Optional[UploadFile] = Form(None)):
    try:
        print("\n📤 Received generation request...")
        print("📝 Prompt:", prompt)

        if file:
            print("🖼️ Using uploaded image")
            content = await file.read()
            input_image = Image.open(BytesIO(content)).convert("RGB").resize((512, 512))
            processed_image = depth_estimator(input_image)

            result = pipe(
                prompt,
                image=processed_image,
                num_inference_steps=50,
                negative_prompt="ugly, bad colors, messy room, unrealistic",
                guidance_scale=7.5,
                guidance_rescale=0.7
            ).images[0]
        else:
            print("✨ Generating room from prompt only (no image)")
            result = text2img_pipe(
                prompt,
                num_inference_steps=50,
                negative_prompt="ugly, bad colors, messy room, unrealistic",
                guidance_scale=7.5
            ).images[0]

        os.makedirs("generated_images", exist_ok=True)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"generated_images/image_{timestamp}.jpg"
        result.save(filename)
        print("✅ Image generated and saved to:", filename)
        return {"image_path": filename}

    except Exception as e:
        print("❌ Generation error:", e)
        return {"error": str(e)}

@app.get("/images/{image_name}")
async def get_image(image_name: str):
    return FileResponse(path=f"generated_images/{image_name}", media_type="image/jpeg")
