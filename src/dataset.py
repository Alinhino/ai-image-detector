from torchvision import datasets, transforms

def get_data_loader(data_path):
    transform = transforms.Compose([
        transforms.Resize((224,224)),
        transforms.ToTensor()
    ])
    dataset = datasets.ImageFolder(data_path, transform=transform)
    return dataset
