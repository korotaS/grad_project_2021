import cv2
import numpy as np
import torch
from segmentation_models_pytorch.encoders import get_preprocessing_fn

from src.python.utils.augs import get_transforms


class BaseImagePreprocessor:
    def __init__(self, cfg, mode='train', device='cpu'):
        self.width = cfg['data']['width']
        self.height = cfg['data']['height']
        self.input_size = (self.height, self.width)
        self.pretrained = cfg['model']['pretrained']
        self.mode = mode
        self.device = device


class ImageClassificationPreprocessor(BaseImagePreprocessor):
    def __init__(self, cfg, mode='train', device='cpu'):
        super().__init__(cfg, mode, device)
        transforms_mode = 'train' if self.mode == 'train' else 'val'
        self.transforms = get_transforms(config=cfg,
                                         key=f'transforms_{transforms_mode}',
                                         imagenet=self.pretrained)

    def process(self, image):
        image = cv2.resize(image, self.input_size)
        if self.mode == 'inference':
            image = self.transforms(image=image)['image']
            image = torch.tensor(image, dtype=torch.float32, device=self.device).unsqueeze(0)
            return image
        else:
            raw_image = image.copy()
            image = self.transforms(image=image)['image']
            return raw_image, image


class ImageSegmentationPreprocessor(BaseImagePreprocessor):
    def __init__(self, cfg, mode='train', device='cpu'):
        super().__init__(cfg, mode, device)
        self.backbone = cfg['model']['backbone']
        self.in_channels = cfg['data']['in_channels']
        self.num_classes = cfg['data']['num_classes']
        self.preprocessing = get_preprocessing_fn(encoder_name=self.backbone,
                                                  pretrained='imagenet' if self.pretrained else False)
        transforms_mode = 'train' if self.mode == 'train' else 'val'
        self.transforms = get_transforms(config=cfg,
                                         key=f'transforms_{transforms_mode}',
                                         imagenet=self.pretrained,
                                         norm=False,
                                         to_tensor=False)

    def process(self, image, mask=None):
        if self.mode == 'inference':
            image = self.transforms(image=image)['image']
            image = self.preprocessing(image)
            image = image.transpose((2, 0, 1)).astype('float32')
            image = torch.tensor(image, dtype=torch.float32, device=self.device).unsqueeze(0)
            return image
        else:
            assert mask is not None
            sample = self.transforms(image=image, mask=mask)  # TODO: check multiple masks
            image = sample['image']
            mask = sample['mask']
            raw_image = image.copy()
            image = self.preprocessing(image)
            image = image.transpose((2, 0, 1)).astype('float32')
            mask = mask / 255.0
            mask = mask.astype('float32')
            if self.num_classes == 1:
                mask = mask[np.newaxis, :, :]
            else:
                mask = mask.transpose((2, 0, 1))
            return raw_image, image, mask
