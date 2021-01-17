import os
import shutil

from torch import optim
from torch import nn
from torch.utils.data import DataLoader
from torchvision import transforms
from pytorch_lightning import Trainer as PLTrainer
from pytorch_lightning.loggers import TensorBoardLogger
from segmentation_models_pytorch.utils import losses as smp_losses

from src.python.utils.architectures import (get_im_clf_model, ImageClassificationModel, get_im_sgm_model,
                                            ImageSegmentationModel)
from src.python.utils.datasets import ImageClassificationDataset, ImageSegmentationDataset


class BaseImageTrainer:
    def __init__(self, project_name, raw_dataset_folder, architecture, num_classes, criterion, optimizer, pretrained,
                 batch_size, max_epochs=10, lr=0.001):
        self.project_name = project_name
        self.raw_dataset_folder = raw_dataset_folder
        self.architecture = architecture
        self.num_classes = num_classes
        self.criterion_name = criterion
        self.optimizer_name = optimizer
        self.pretrained = pretrained
        self.batch_size = batch_size
        self.max_epochs = max_epochs
        self.lr = lr

        self.train_dataset = self.val_dataset = self.train_loader = self.val_loader = None
        self.model_raw = None
        self.model = None

        if not os.path.exists('./projects/'):
            os.mkdir('./projects/')
        self.project_folder = os.path.join('./projects/', self.project_name)
        if not os.path.exists(self.project_folder):
            os.mkdir(self.project_folder)
        data_folder = os.path.join(self.project_folder, 'dataset/')
        if not os.path.exists(data_folder):
            os.mkdir(data_folder)
        self.train_folder = os.path.join(data_folder, 'train/')
        self.val_folder = os.path.join(data_folder, 'val/')

    def copy_data(self):
        if os.path.exists(self.train_folder):
            shutil.rmtree(self.train_folder)
        shutil.copytree(os.path.join(self.raw_dataset_folder, 'train/'), self.train_folder)

        if os.path.exists(self.val_folder):
            shutil.rmtree(self.val_folder)
        shutil.copytree(os.path.join(self.raw_dataset_folder, 'val/'), self.val_folder)

    def init_model(self):
        pass

    def init_data(self):
        pass

    def train(self):
        pass

    def run(self):
        self.init_model()
        # self.copy_data()
        self.init_data()
        self.train()


class ImageClassificationTrainer(BaseImageTrainer):
    def __init__(self, project_name, raw_dataset_folder, architecture, num_classes, criterion, optimizer, pretrained,
                 batch_size, max_epochs=10, lr=0.001, freeze=False, transforms='default'):
        super().__init__(project_name, raw_dataset_folder, architecture, num_classes, criterion, optimizer, pretrained,
                         batch_size, max_epochs, lr)
        self.freeze = freeze
        self.transforms = transforms

        # to be initialized
        self.input_size = None

    def init_model(self):
        self.model_raw, self.input_size = get_im_clf_model(self.architecture,
                                                           num_classes=self.num_classes,
                                                           pretrained=self.pretrained,
                                                           freeze=self.freeze)
        params_to_update = self.model_raw.parameters()
        if self.freeze:
            params_to_update = []
            for name, param in self.model_raw.named_parameters():
                if param.requires_grad:
                    params_to_update.append(param)
        optimizer = getattr(optim, self.optimizer_name, optim.Adam)(params=params_to_update, lr=self.lr)
        criterion = getattr(nn, self.criterion_name, nn.CrossEntropyLoss)()
        self.model = ImageClassificationModel(self.model_raw, self.architecture, optimizer, criterion)

    def init_data(self):
        if self.transforms == 'default':  # TODO: add transforms from UI
            transform_train = transforms.Compose([
                transforms.RandomResizedCrop(self.input_size),
                transforms.RandomHorizontalFlip(),
                transforms.ToTensor(),
                transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
            ])
        self.train_dataset = ImageClassificationDataset(self.train_folder, transform=transform_train)
        if self.transforms == 'default':
            transform_val = transforms.Compose([
                transforms.Resize(self.input_size),
                transforms.CenterCrop(self.input_size),
                transforms.ToTensor(),
                transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
            ])
        self.val_dataset = ImageClassificationDataset(self.val_folder, transform=transform_val)

        self.train_loader = DataLoader(self.train_dataset, batch_size=self.batch_size, shuffle=True)
        self.val_loader = DataLoader(self.val_dataset, batch_size=self.batch_size, shuffle=False)

    def train(self):
        logger = TensorBoardLogger('tb_logs', name='my_model')
        pl_trainer = PLTrainer(max_epochs=self.max_epochs, logger=logger, log_every_n_steps=25)
        pl_trainer.fit(self.model, self.train_loader, self.val_loader)


class ImageSegmentationTrainer(BaseImageTrainer):
    def __init__(self, project_name, raw_dataset_folder, architecture, backbone, num_classes, criterion, optimizer,
                 pretrained, batch_size, max_epochs=10, lr=0.001, in_channels=3, image_transforms='default',
                 mask_transforms='default'):
        super().__init__(project_name, raw_dataset_folder, architecture, num_classes, criterion, optimizer, pretrained,
                         batch_size, max_epochs, lr)
        self.backbone = backbone
        self.in_channels = in_channels
        self.image_transforms = image_transforms
        self.mask_transforms = mask_transforms

    def init_model(self):
        self.model_raw = get_im_sgm_model(self.architecture, self.backbone,
                                          num_classes=self.num_classes, in_channels=self.in_channels,
                                          pretrained=self.pretrained)
        optimizer = getattr(optim, self.optimizer_name, optim.Adam)(params=self.model_raw.parameters(), lr=self.lr)
        criterion = getattr(smp_losses, self.criterion_name, smp_losses.DiceLoss)()
        self.model = ImageSegmentationModel(self.model_raw, optimizer, criterion)

    def init_data(self):
        if self.image_transforms == 'default':
            image_transform = transforms.Compose([
                transforms.ToTensor(),
                transforms.Normalize(mean=0, std=1)
            ])
        if self.mask_transforms == 'default':
            mask_transform = transforms.Compose([
                transforms.ToTensor()
            ])
        self.train_dataset = ImageSegmentationDataset(self.train_folder, image_transform=image_transform,
                                                      mask_transform=mask_transform)
        self.val_dataset = ImageSegmentationDataset(self.val_folder, image_transform=image_transform,
                                                    mask_transform=mask_transform)
        self.train_loader = DataLoader(self.train_dataset, batch_size=self.batch_size, shuffle=True)
        self.val_loader = DataLoader(self.val_dataset, batch_size=self.batch_size, shuffle=False)

    def train(self):
        logger = TensorBoardLogger('tb_logs', name='my_model')
        pl_trainer = PLTrainer(max_epochs=self.max_epochs, logger=logger, log_every_n_steps=25)
        pl_trainer.fit(self.model, self.train_loader, self.val_loader)


# trainer = ImageClassificationTrainer('project_1', '', 'mobilenet_v2', 2, 'CrossEntropyLoss', 'Adam', True, 8,
#                                      freeze=True)
# trainer = ImageSegmentationTrainer('project_2', '', 'FPN', 'mobilenet_v2', 1, 'DiceLoss', 'Adam', True, 8)
# trainer.run()
