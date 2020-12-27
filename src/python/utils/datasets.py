import os

import torch
from torch.utils.data import Dataset
from torchvision import transforms
from PIL import Image
import cv2


class BaseDataset(Dataset):
    def __len__(self):
        pass

    def __getitem__(self, item):
        pass

    def check_structure(self):
        pass

    def check_content(self):
        pass


class ImageClassificationDataset(BaseDataset):
    def __init__(self, path, device='cpu', transform=None):
        super().__init__()
        self.path = path
        self.device = device
        # self.check_structure()
        # TODO: make loading data one at a time
        # self.data = torch.load(os.path.join(self.path, 'data.pt')).to(self.device)
        # self.labels = torch.load(os.path.join(self.path, 'labels.pt')).to(self.device)
        self.transform = transform

    # def check_structure(self):
    #     if not os.path.exists(os.path.join(self.path, 'data.pt')) or \
    #             not os.path.exists(os.path.join(self.path, 'labels.pt')):
    #         raise DatasetStructureError(f"folder {self.path} doesn\'t have data.pt or labels.pt")
    #
    # def check_content(self):
    #     if len(self.data) != len(self.labels):
    #         raise DatasetContentError('Data and labels have different lengths')

    def __len__(self):
        return len(os.listdir(self.path)) - 1

    def __getitem__(self, idx):
        # if torch.is_tensor(idx):
        #     idx = idx.tolist()
        # data = self.data[idx]
        # if self.transform:
        #     data = self.transform(data)
        # labels = self.labels[idx]
        # return data, labels
        name = f'{idx}.cat.jpg' if os.path.exists(self.path + f'{idx}.cat.jpg') else f'{idx}.dog.jpg'
        image = Image.open(self.path + name)
        label = int('dog' in name)
        if self.transform:
            image = self.transform(image)
        label = torch.tensor(label, dtype=torch.long)
        return image, label


class DatasetStructureError(ValueError):
    """Raised when structure of dataset folder is incorrect"""
    pass


class DatasetContentError(ValueError):
    """Raised when content of dataset folder is incorrect"""
    pass
