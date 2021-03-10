import json
import os

import cv2
import numpy as np
import torch
from PIL import Image

from src.python.utils.utils import rle_decode_mask
from src.python.datasets.base import BaseDataset, DatasetContentError, DatasetStructureError


class ImageClassificationDataset(BaseDataset):
    def __init__(self, path, input_size, device='cpu', transform=None):
        super().__init__()
        self.path = path
        self.device = device
        self.transform = transform
        self.input_size = input_size

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
        print(f'{self.path}: Structure OK!')

    def check_content(self):
        for value in self.info.values():
            if not os.path.exists(os.path.join(self.images_path, value['filename'])):
                raise DatasetContentError(f'File with name {value["filename"]} not found in {self.images_path}')
        print(f'{self.path}: Content OK!')

    def __len__(self):
        return len(self.info)

    def __getitem__(self, idx):
        data = self.info[str(idx)]
        filename = data['filename']
        image = Image.open(os.path.join(self.images_path, filename))
        raw_image = np.array(image)
        raw_image = cv2.resize(raw_image, (self.input_size, self.input_size))
        if self.transform:
            image = self.transform(image)
        image = image.to(self.device)

        # TODO: change labeling
        label = data['label']
        label = torch.tensor(label, dtype=torch.float, device=self.device)
        return raw_image, image, label


class ImageSegmentationDataset(BaseDataset):
    def __init__(self, path, input_size, num_classes, device='cpu', image_transform=None,
                 mask_transform=None, use_rle=False):
        super().__init__()
        self.path = path
        self.input_size = input_size
        self.num_classes = num_classes
        self.device = device
        self.image_transform = image_transform
        self.mask_transform = mask_transform
        self.use_rle = use_rle

        self.images_path = os.path.join(self.path, 'images/')
        self.info_path = os.path.join(self.path, 'info.json')
        if not self.use_rle:
            self.masks_path = os.path.join(self.path, 'masks/')
        self.check_structure()
        with open(self.info_path, 'r') as r:
            self.info = json.load(r)
        self.check_content()

    def check_structure(self):
        if not os.path.exists(self.info_path):
            raise DatasetStructureError(f'info.json not found in dataset folder: {self.path}')
        if not os.path.exists(self.images_path):
            raise DatasetStructureError(f'"images/" folder not found in dataset folder: {self.path}')
        if not self.use_rle:
            if not os.path.exists(self.masks_path):
                raise DatasetStructureError(f'"masks/" folder not found in dataset folder: {self.path}')
        print(f'{self.path}: Structure OK!')

    def check_content(self):
        for image in self.info.values():
            if not os.path.exists(os.path.join(self.images_path, image['image_filename'])):
                raise DatasetContentError(f'File with name {image["image_filename"]} not found in {self.images_path}')
            if not self.use_rle:
                if not os.path.exists(os.path.join(self.masks_path, image['mask_filename'])):
                    raise DatasetContentError(f'File with name {image["mask_filename"]} not found in {self.masks_path}')
        print(f'{self.path}: Content OK!')

    def __len__(self):
        return len(self.info)

    def __getitem__(self, idx):
        data = self.info[str(idx)]
        image = Image.open(os.path.join(self.images_path, data['image_filename']))
        raw_image = np.array(image)
        raw_image = cv2.resize(raw_image, self.input_size)  # TODO: fix it
        if self.image_transform:
            image = self.image_transform(image)
        image = image.to(self.device)

        if self.use_rle:
            values, counts = image['rle']['values'], image['rle']['counts']
            shape = image.shape
            mask = rle_decode_mask(values, counts, shape)
        else:
            mask = Image.open(os.path.join(self.masks_path, data['mask_filename']))
            if self.num_classes == 1:
                assert len(mask.size) == 2, 'Num_classes is 1, so mask must be a 1-channel image with shape (x, y)'
            else:
                assert len(mask.size) == 3 and mask.size[2] == self.num_classes, \
                    f'Num_classes is {self.num_classes}, so mask must be a {self.num_classes}-channel image'
        if self.mask_transform:
            mask = self.mask_transform(mask)
        return raw_image, image, mask
