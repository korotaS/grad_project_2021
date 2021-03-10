import ssl

from pytorch_lightning import Trainer as PLTrainer
from pytorch_lightning.loggers import TensorBoardLogger
from segmentation_models_pytorch.utils import losses as smp_losses
from torch import nn
from torch import optim
from torch.utils.data import DataLoader

from src.python.architectures import get_im_clf_model, get_im_sgm_model
from src.python.models import ImageClassificationModel, ImageSegmentationModel
from src.python.trainers.base import BaseImageTrainer
from src.python.datasets import ImageClassificationDataset, ImageSegmentationDataset
from src.python.utils.augs import get_transforms

ssl._create_default_https_context = ssl._create_unverified_context


class ImageClassificationTrainer(BaseImageTrainer):
    def __init__(self, cfg):
        super().__init__(cfg)
        self.cfg = cfg
        self.freeze = self.cfg['model']['freeze_backbone']
        self.labels = self.cfg['data']['labels']
        self.num_classes = len(self.labels)

        self.pref_input_size = None

    def init_model(self):
        self.model_raw, self.pref_input_size = get_im_clf_model(self.architecture,
                                                                num_classes=self.num_classes,
                                                                pretrained=self.pretrained,
                                                                freeze=self.freeze)
        params_to_update = self.model_raw.parameters()
        if self.freeze:
            params_to_update = []
            for name, param in self.model_raw.named_parameters():
                if param.requires_grad:
                    params_to_update.append(param)
        optimizer = getattr(optim, self.optimizer_name)(params=params_to_update, lr=self.lr)
        criterion = getattr(nn, self.criterion_name)()
        self.model = ImageClassificationModel(self.model_raw, self.architecture, optimizer, criterion, self.labels)

    def init_data(self):
        transform_train = get_transforms(self.cfg, key='transforms_train', imagenet=self.pretrained)
        self.train_dataset = ImageClassificationDataset(self.train_folder, transform=transform_train,
                                                        input_size=self.input_size)
        self.train_loader = DataLoader(self.train_dataset, batch_size=self.batch_size, shuffle=True)

        transform_val = get_transforms(self.cfg, key='transforms_val', imagenet=self.pretrained)
        self.val_dataset = ImageClassificationDataset(self.val_folder, transform=transform_val,
                                                      input_size=self.input_size)
        self.val_loader = DataLoader(self.val_dataset, batch_size=self.batch_size, shuffle=False)

    def train(self):
        logger = TensorBoardLogger('tb_logs', name='imclf')
        pl_trainer = PLTrainer(max_epochs=self.max_epochs, logger=logger, log_every_n_steps=25,
                               num_sanity_val_steps=5)
        pl_trainer.fit(self.model, self.train_loader, self.val_loader)


class ImageSegmentationTrainer(BaseImageTrainer):
    def __init__(self, cfg):
        super().__init__(cfg)
        self.cfg = cfg
        self.backbone = self.cfg['model']['backbone']
        self.in_channels = self.cfg['data']['in_channels']
        self.num_classes = self.cfg['data']['num_classes']

    def init_model(self):
        self.model_raw = get_im_sgm_model(self.architecture, self.backbone,
                                          num_classes=self.num_classes, in_channels=self.in_channels,
                                          pretrained=self.pretrained)
        optimizer = getattr(optim, self.optimizer_name)(params=self.model_raw.parameters(), lr=self.lr)
        criterion = getattr(smp_losses, self.criterion_name)()
        self.model = ImageSegmentationModel(self.model_raw, optimizer, criterion)

    def init_data(self):
        transform_train = get_transforms(self.cfg, key='transforms_train', imagenet=self.pretrained)
        self.train_dataset = ImageSegmentationDataset(self.train_folder, self.input_size, self.num_classes,
                                                      transform=transform_train)
        self.train_loader = DataLoader(self.train_dataset, batch_size=self.batch_size, shuffle=True)

        transform_val = get_transforms(self.cfg, key='transforms_val', imagenet=self.pretrained)
        self.val_dataset = ImageSegmentationDataset(self.val_folder, self.input_size, self.num_classes,
                                                    transform=transform_val)
        self.val_loader = DataLoader(self.val_dataset, batch_size=self.batch_size, shuffle=False)

    def train(self):
        logger = TensorBoardLogger('tb_logs', name='imsgm')
        pl_trainer = PLTrainer(max_epochs=self.max_epochs, logger=logger, log_every_n_steps=25,
                               num_sanity_val_steps=5)
        pl_trainer.fit(self.model, self.train_loader, self.val_loader)
