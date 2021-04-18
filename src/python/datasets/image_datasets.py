import json
import os

import numpy as np
import torch
from PIL import Image

from src.python.datasets.base_datasets import BaseDataset, DatasetContentError, DatasetStructureError
from src.python.utils.utils import rle_decode_mask


class ImageClassificationDataset(BaseDataset):
    def __init__(self, path, preprocessor, data_len=-1):
        super().__init__()
        self.path = path
        self.preprocessor = preprocessor
        self.data_len = data_len

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
        if self.data_len != -1:
            return self.data_len
        return len(self.info)

    def __getitem__(self, idx):
        data = self.info[str(idx)]
        filename = data['filename']
        image = np.array(Image.open(os.path.join(self.images_path, filename)))
        raw_image, image = self.preprocessor.process(image)

        # TODO: change labeling
        label = data['label']
        label = torch.tensor(label, dtype=torch.float)
        return raw_image, image, label


class ImageSegmentationDataset(BaseDataset):
    def __init__(self, path, num_classes, preprocessor, use_rle=False, data_len=-1):
        super().__init__()
        self.path = path
        self.num_classes = num_classes
        self.preprocessor = preprocessor
        self.use_rle = use_rle
        if self.num_classes > 1 and not self.use_rle:
            raise AttributeError('Num classes > 1 works only with RLE.')
        self.data_len = data_len

        self.images_path = os.path.join(self.path, 'images/')
        self.info_path = os.path.join(self.path, 'info.json')
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
        if not os.path.exists(self.masks_path):
            raise DatasetStructureError(f'"masks/" folder not found in dataset folder: {self.path}')
        print(f'{self.path}: Structure OK!')

    def check_content(self):
        for image in self.info.values():
            if not os.path.exists(os.path.join(self.images_path, image['image_filename'])):
                raise DatasetContentError(f'File with name {image["image_filename"]} not found in {self.images_path}')
            if not os.path.exists(os.path.join(self.masks_path, image['mask_filename'])):
                raise DatasetContentError(f'File with name {image["mask_filename"]} not found in {self.masks_path}')
        print(f'{self.path}: Content OK!')

    def __len__(self):
        if self.data_len != -1:
            return self.data_len
        return len(self.info)

    def __getitem__(self, idx):
        data = self.info[str(idx)]
        image = np.array(Image.open(os.path.join(self.images_path, data['image_filename'])))

        if self.use_rle:
            mask_filename = data['mask_filename']
            with open(os.path.join(self.masks_path, mask_filename), 'r') as r:
                rle_dict = json.load(r)
            mask = rle_decode_mask(rle_dict)
            if mask.shape[2] == 1:
                mask = mask[:, :, 0]
        else:
            mask = np.array(Image.open(os.path.join(self.masks_path, data['mask_filename'])))
            if self.num_classes == 1:
                assert len(mask.shape) == 2, 'Num_classes is 1, so mask must be a 1-channel image with shape (x, y)'

        raw_image, image, mask = self.preprocessor.process(image=image, mask=mask)
        return raw_image, image, mask
