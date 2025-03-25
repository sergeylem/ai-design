from fastapi import FastAPI, UploadFile, Form
from fastapi.responses import FileResponse
from diffusers import StableDiffusionControlNetPipeline, ControlNetModel
from controlnet_aux import MidasDetector
import torch
from PIL import Image
from io import BytesIO
import os
from diffusers import AutoencoderKL
from datetime import datetime

device = "mps"

def try_load_vae(pipe, vae_path: str, vae_file: str = "diffusion_pytorch_model.safetensors"):
    config_path = os.path.join(vae_path, "config.json")
    vae_full_path = os.path.join(vae_path, vae_file)

    if os.path.exists(config_path) and os.path.exists(vae_full_path):
        try:
            print("🔄 Подключаю кастомный VAE...")
            vae = AutoencoderKL.from_pretrained(
                vae_path,
                weight_name=vae_file,
                torch_dtype=torch.float16
            ).to(pipe.device)
            pipe.vae = vae
            print("✅ VAE успешно загружен")
        except Exception as e:
            print("⚠️ Ошибка при загрузке VAE:", e)
    else:
        print("⚠️ VAE или config.json не найдены — используется встроенный VAE")

app = FastAPI()

print("🔄 Загружаю ControlNet...")
controlnet = ControlNetModel.from_pretrained(
    "lllyasviel/sd-controlnet-depth", # ControlNet для SD 1.5
    torch_dtype=torch.float16
).to(device)

print("🔄 Загружаю StableDiffusionXL pipeline...")
pipe = StableDiffusionControlNetPipeline.from_pretrained(
    "runwayml/stable-diffusion-v1-5", # Модель SD 1.5
    controlnet=controlnet,
    torch_dtype=torch.float16
).to(device)

print("🎨 Загружаю LoRA из ./loras/lora_v1.0/lora.safetensors ...")
try:
    pipe.load_lora_weights(
        "./loras/sd_1.5", 
        weight_name="etf",
        adapter_name="default"
    )
except Exception as e:
    print("❌ Не удалось загрузить LoRA:", e)
    
# pipe.set_adapters(["default"], adapter_weights=[0.85]) # by default 1, maximum 1.2
# print("✅ LoRA подключена с весом 0.85")

# ✅ Пытаемся подключить VAE
# try_load_vae(pipe, "./loras/sdxl_vae")

# 🟢 Используем Depth detector вместо Canny
print("🔍 Загружаю Depth детектор (Midas)...")
depth_estimator = MidasDetector.from_pretrained("lllyasviel/ControlNet")

@app.get("/")
async def root():
    return {"message": "AI Design API is running!"}

@app.post("/generate")
async def generate(prompt: str = Form(...), file: UploadFile = Form(...)):
    try:
        print("\n📤 Получен запрос на генерацию...")
        print("📝 Промпт:", prompt)
        content = await file.read()
        input_image = Image.open(BytesIO(content)).convert("RGB").resize((512, 512)) # SD 1.5 работает с 512x512
        processed_image = depth_estimator(input_image)
        # processed_image = input_image

        result = pipe(
            prompt,
            image=processed_image,
            num_inference_steps=50,  # 50
            negative_prompt= "ugly, bad colors, messy room, unrealistic", #"lowres, blurry, ugly, messy, distorted, bad composition", # "ugly, bad colors, messy room, unrealistic",
            guidance_scale=7.5, # 9,
            guidance_rescale=0.7 #0.8
        ).images[0]

        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"generated_images/image_{timestamp}.jpg"
        result.save(filename)
        print("✅ Картинка сгенерирована и сохранена в:", filename)
        return {"image_path": filename}

    except Exception as e:
        print("❌ Ошибка генерации:", e)
        return {"error": str(e)}

@app.get("/images/{image_name}")
async def get_image(image_name: str):
    return FileResponse(path=f"generated_images/{image_name}", media_type="image/jpeg")
