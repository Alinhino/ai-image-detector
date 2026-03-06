import torch
import torch.nn.functional as F
import numpy as np
from PIL import Image
from torchvision import transforms
import cv2

def generate_grad_cam(model, image_path, target_class=None):
    """
    Generate a Grad-CAM heatmap for the given image.
    Shows which regions of the image the model focuses on for its prediction.
    
    Args:
        model: The PyTorch model
        image_path: Path to the image
        target_class: Class to generate CAM for (0=AI, 1=Real). If None, uses predicted class.
    
    Returns:
        heatmap_img: PIL Image of the heatmap overlay
        original_img: PIL Image of the original
    """
    image = Image.open(image_path).convert("RGB")
    original_np = np.array(image)
    
    transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor()
    ])
    
    img_tensor = transform(image).unsqueeze(0)
    
    layer = model.layer4[-1].conv2
    
    img_tensor.requires_grad_(True)
    features = model.avgpool(model.relu(model.layer4(model.layer3(
        model.layer2(model.layer1(model.conv1(model.bn1(img_tensor))))
    ))))
    
    output = model.fc(features.view(features.size(0), -1))
    
    if target_class is None:
        target_class = output.argmax(dim=1).item()
    
    model.zero_grad()
    
    class_score = output[0, target_class]
    class_score.backward()
    
    gradients = img_tensor.grad.data
    
    pooled_gradients = torch.mean(gradients, dim=[0, 2, 3])
    
    activations = None
    
    def get_activation(name):
        def hook(model, input, output):
            nonlocal activations
            activations = output.detach()
        return hook
    
    handle = layer.register_forward_hook(get_activation('layer'))
    model(img_tensor)
    handle.remove()
    
    for i in range(activations.shape[1]):
        activations[:, i, :, :] *= pooled_gradients[i]
    
    heatmap = torch.mean(activations, dim=1).squeeze()
    heatmap = F.relu(heatmap)
    heatmap = heatmap / (heatmap.max() + 1e-8)
    
    heatmap_np = heatmap.cpu().numpy()
    heatmap_resized = cv2.resize(heatmap_np, (original_np.shape[1], original_np.shape[0]))
    
    heatmap_resized = (heatmap_resized * 255).astype(np.uint8)
    
    heatmap_color = cv2.applyColorMap(heatmap_resized, cv2.COLORMAP_JET)
    heatmap_color = cv2.cvtColor(heatmap_color, cv2.COLOR_BGR2RGB)
    
    overlay = (0.4 * original_np + 0.6 * heatmap_color).astype(np.uint8)
    
    return Image.fromarray(overlay), Image.fromarray(original_np), heatmap_resized


def simple_attention_map(predictions, width=224, height=224):
    """
    Create a simple attention visualization based on prediction confidence.
    This shows a general heatmap based on the model's confidence.
    
    Args:
        predictions: Tuple of (ai_score, real_score)
        width: Image width
        height: Image height
    
    Returns:
        Attention map as numpy array
    """
    ai_score, real_score = predictions
    
    x = np.linspace(0, 1, width)
    y = np.linspace(0, 1, height)
    X, Y = np.meshgrid(x, y)
    
    if ai_score > real_score:
        heatmap = np.exp(-((X - 0.5)**2 + (Y - 0.5)**2) / 0.3) * ai_score
    else:
        heatmap = (1 - np.sqrt((X - 0.5)**2 + (Y - 0.5)**2)) * real_score
    
    heatmap = (heatmap / (heatmap.max() + 1e-8) * 255).astype(np.uint8)
    
    return heatmap
