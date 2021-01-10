import json
import os

import torch
from PIL import Image
from torch.utils.data import Dataset


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
        self.transform = transform

        self.info_path = os.path.join(self.path, 'info.json')
        self.images_path = os.path.join(self.path, 'images/')
        self.check_structure()
        with open(self.path+'info.json', 'r') as r:
            self.info = json.load(r)
        self.check_content()

    def check_structure(self):
        if not os.path.exists(self.info_path):
            raise DatasetStructureError(f'info.json not found in dataset folder: {self.path}')
        if not os.path.exists(self.images_path):
            raise DatasetStructureError(f'"images/" folder not found in dataset folder: {self.path}')

    def check_content(self):
        for value in self.info.values():
            if not os.path.exists(os.path.join(self.images_path, value['filename'])):
                raise DatasetContentError(f'file with name {value["filename"]} not found in {self.images_path}')

    def __len__(self):
        return len(self.info)

    def __getitem__(self, idx):
        data = self.info[str(idx)]
        filename = data['filename']
        image = Image.open(os.path.join(self.images_path + filename))
        if self.transform:
            image = self.transform(image)
        image = image.to(self.device)

        label = data['label']
        label = torch.tensor(label, dtype=torch.float, device=self.device)
        return image, label


class DatasetStructureError(ValueError):
    """Raised when structure of dataset folder is incorrect"""
    pass


class DatasetContentError(ValueError):
    """Raised when content of dataset folder is incorrect"""
    pass
