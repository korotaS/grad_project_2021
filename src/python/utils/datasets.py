import os

import torch
from torch.utils.data import Dataset


class BaseDataset(Dataset):
    def __len__(self):
        super().__init__()
        pass

    def __getitem__(self, item):
        pass

    def check_structure(self):
        pass

    def check_content(self):
        pass


class ImageClassificationDataset(BaseDataset):
    def __init__(self, path, device='cpu'):
        super().__init__()
        self.path = path
        self.device = device
        self.check_structure()
        self.data = torch.load(os.path.join(self.path, 'data.pt')).to(self.device)
        self.labels = torch.load(os.path.join(self.path, 'labels.pt')).to(self.device)

    def check_structure(self):
        if not os.path.exists(os.path.join(self.path, 'data.pt')) or \
                not os.path.exists(os.path.join(self.path, 'labels.pt')):
            raise DatasetStructureError(f"folder {self.path} doesn\'t have data.pt or labels.pt")

    def check_content(self):
        if len(self.data) != len(self.labels):
            raise DatasetContentError('Data and labels have different lengths')

    def __len__(self):
        return len(self.data)

    def __getitem__(self, idx):
        if torch.is_tensor(idx):
            idx = idx.tolist()
        return self.data[idx], self.labels[idx]


class DatasetStructureError(ValueError):
    """Raised when structure of dataset folder is incorrect"""
    pass


class DatasetContentError(ValueError):
    """Raised when content of dataset folder is incorrect"""
    pass
