import torch
from PIL import Image
from torchvision import transforms
from model import load_model
import os

model = load_model()

model_path = "models/resnet_detector.pth"
if os.path.exists(model_path):
    model.load_state_dict(torch.load(model_path))
else:
    os.makedirs("models", exist_ok=True)
    torch.save(model.state_dict(), model_path)
    print(f"Model file not found. Created base model at {model_path}")

model.eval()

transform = transforms.Compose([
    transforms.Resize((224,224)),
    transforms.ToTensor()
])

def predict_image(image_path):

    image = Image.open(image_path).convert("RGB")

    image = transform(image).unsqueeze(0)

    output = model(image)

    probabilities = torch.softmax(output,dim=1)

    ai_prob = probabilities[0][0].item()
    real_prob = probabilities[0][1].item()

    return ai_prob, real_prob