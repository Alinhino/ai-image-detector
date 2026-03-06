import torch
from model import get_model

def evaluate():
    model = get_model()
    model.load_state_dict(torch.load("models/resnet_detector.pth"))
    model.eval()

    print("Model loaded successfully")
    # You can expand this to calculate Accuracy, Precision, Recall, Confusion Matrix

if __name__ == "__main__":
    evaluate()
