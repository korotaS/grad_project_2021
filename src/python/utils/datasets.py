import json
import os

import torch
import cv2
from PIL import Image
from torch.utils.data import Dataset

from src.python.utils.utils import rle_decode_mask


class BaseDataset(Dataset):
    def __len__(self):
        pass

    def __getitem__(self, item):
        pass

    def check_structure(self, *args, **kwargs):
        pass

    def check_content(self, *args, **kwargs):
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
        with open(self.info_path, 'r') as r:
            self.info = json.load(r)
        self.check_content()

    def check_structure(self):
        if not os.path.exists(self.info_path):
            raise DatasetStructureError(f'info.json not found in dataset folder: {self.path}')
        if not os.path.exists(self.images_path):
            raise DatasetStructureError(f'"images/" folder not found in dataset folder: {self.path}')
        print('Structure OK!')

    def check_content(self):
        for value in self.info.values():
            if not os.path.exists(os.path.join(self.images_path, value['filename'])):
                raise DatasetContentError(f'File with name {value["filename"]} not found in {self.images_path}')
        print('Content OK!')

    def __len__(self):
        return len(self.info)

    def __getitem__(self, idx):
        data = self.info[str(idx)]
        filename = data['filename']
        image = Image.open(os.path.join(self.images_path, filename))
        if self.transform:
            image = self.transform(image)
        image = image.to(self.device)

        label = data['label']
        label = torch.tensor(label, dtype=torch.float, device=self.device)
        return image, label


class ImageSegmentationDataset(BaseDataset):
    def __init__(self, path, device='cpu', image_transform=None, mask_transform=None, use_rle=False):
        super().__init__()
        self.path = path
        self.device = device
        self.image_transform = image_transform
        self.mask_transform = mask_transform
        self.use_rle = use_rle

        self.images_path = os.path.join(self.path, 'images/')
        self.info_path = os.path.join(self.path, 'info.json')
        self.check_structure()
        with open(self.info_path, 'r') as r:
            self.info = json.load(r)
        if not self.use_rle:
            self.masks_path = os.path.join(self.path, 'masks/')
        self.check_content()

    def check_structure(self):
        if not os.path.exists(self.info_path):
            raise DatasetStructureError(f'info.json not found in dataset folder: {self.path}')
        if not os.path.exists(self.images_path):
            raise DatasetStructureError(f'"images/" folder not found in dataset folder: {self.path}')
        if not self.use_rle:
            if not os.path.exists(self.masks_path):
                raise DatasetStructureError(f'"masks/" folder not found in dataset folder: {self.path}')
        print('Structure OK!')

    def check_content(self):
        for image in self.info.values():
            if not os.path.exists(os.path.join(self.images_path, image['image_filename'])):
                raise DatasetContentError(f'File with name {image["image_filename"]} not found in {self.images_path}')
            if not self.use_rle:
                if not os.path.exists(os.path.join(self.masks_path, image['mask_filename'])):
                    raise DatasetContentError(f'File with name {image["mask_filename"]} not found in {self.masks_path}')
        print('Content OK!')

    def __len__(self):
        return len(os.listdir(self.images_path))

    def __getitem__(self, idx):
        data = self.info[str(idx)]
        image = cv2.imread(os.path.join(self.images_path, data['image_filename']))
        if self.image_transform:
            image = self.image_transform(image)
        image = image.to(self.device)

        if self.use_rle:
            values, counts = image['rle']['values'], image['rle']['counts']
            shape = image.shape
            mask = rle_decode_mask(values, counts, shape)
        else:
            mask = cv2.imread(os.path.join(self.masks_path, data['mask_filename']))
        if self.mask_transform:
            mask = self.mask_transform(mask)
        return image, mask


class DatasetStructureError(ValueError):
    """Raised when structure of dataset folder is incorrect"""
    pass


class DatasetContentError(ValueError):
    """Raised when content of dataset folder is incorrect"""
    pass
