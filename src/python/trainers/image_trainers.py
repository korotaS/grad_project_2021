import ssl

from pytorch_lightning import Trainer as PLTrainer
from pytorch_lightning.loggers import TensorBoardLogger
from segmentation_models_pytorch.encoders import get_preprocessing_fn
from segmentation_models_pytorch.utils import losses as smp_losses
from torch import nn
from torch.utils.data import DataLoader

from src.python.architectures import get_im_clf_model, get_im_sgm_model
from src.python.datasets import ImageClassificationDataset, ImageSegmentationDataset
from src.python.models import ImageClassificationModel, ImageSegmentationModel
from src.python.trainers.base_trainers import BaseImageTrainer
from src.python.utils.augs import get_transforms
from src.python.utils.seed import worker_init_fn

ssl._create_default_https_context = ssl._create_unverified_context


class ImageClassificationTrainer(BaseImageTrainer):
    def __init__(self, cfg):
        super().__init__(cfg)
        self.freeze = self.cfg['model']['freeze_backbone']
        self.labels = self.cfg['data']['labels']
        self.num_classes = len(self.labels)

        self.pref_input_size = None

    def init_model(self):
        self.model_raw, self.pref_input_size = get_im_clf_model(model_name=self.architecture,
                                                                num_classes=self.num_classes,
                                                                pretrained=self.pretrained,
                                                                freeze=self.freeze)
        criterion = getattr(nn, self.criterion_name)()
        self.model = ImageClassificationModel(model=self.model_raw,
                                              architecture=self.architecture,
                                              optimizer_cfg=self.optimizer_cfg,
                                              scheduler_cfg=self.scheduler_cfg,
                                              criterion=criterion,
                                              labels=self.labels,
                                              freeze_backbone=self.freeze)

    def init_data(self):
        # train
        transform_train = get_transforms(config=self.cfg,
                                         key='transforms_train',
                                         imagenet=self.pretrained)
        self.train_dataset = ImageClassificationDataset(path=self.train_folder,
                                                        transform=transform_train,
                                                        input_size=self.input_size)
        self.train_loader = DataLoader(dataset=self.train_dataset,
                                       batch_size=self.batch_size_train,
                                       shuffle=self.shuffle_train,
                                       num_workers=self.num_workers,
                                       worker_init_fn=worker_init_fn)
        # val
        transform_val = get_transforms(config=self.cfg,
                                       key='transforms_val',
                                       imagenet=self.pretrained)
        self.val_dataset = ImageClassificationDataset(path=self.val_folder,
                                                      transform=transform_val,
                                                      input_size=self.input_size)
        self.val_loader = DataLoader(self.val_dataset,
                                     batch_size=self.batch_size_val,
                                     shuffle=self.shuffle_val,
                                     num_workers=self.num_workers,
                                     worker_init_fn=worker_init_fn)

    def train(self):
        logger = TensorBoardLogger(save_dir='tb_logs',
                                   name='imclf',
                                   version=self.tb_version)
        pl_trainer = PLTrainer(logger=logger,
                               log_every_n_steps=25,
                               num_sanity_val_steps=5,
                               callbacks=self.callbacks,
                               **self.trainer_params)
        pl_trainer.fit(model=self.model,
                       train_dataloader=self.train_loader,
                       val_dataloaders=self.val_loader)


class ImageSegmentationTrainer(BaseImageTrainer):
    def __init__(self, cfg):
        super().__init__(cfg)
        self.backbone = self.cfg['model']['backbone']
        self.in_channels = self.cfg['data']['in_channels']
        self.num_classes = self.cfg['data']['num_classes']

    def init_model(self):
        self.model_raw = get_im_sgm_model(model_name=self.architecture,
                                          encoder_name=self.backbone,
                                          num_classes=self.num_classes,
                                          in_channels=self.in_channels,
                                          pretrained=self.pretrained)
        criterion = getattr(smp_losses, self.criterion_name)()
        self.model = ImageSegmentationModel(model=self.model_raw,
                                            optimizer_cfg=self.optimizer_cfg,
                                            scheduler_cfg=self.scheduler_cfg,
                                            criterion=criterion)

    def init_data(self):
        preprocessing = get_preprocessing_fn(encoder_name=self.backbone,
                                             pretrained='imagenet' if self.pretrained else False)
        # train
        transform_train = get_transforms(config=self.cfg,
                                         key='transforms_train',
                                         imagenet=self.pretrained,
                                         norm=False,
                                         to_tensor=False)
        self.train_dataset = ImageSegmentationDataset(path=self.train_folder,
                                                      input_size=self.input_size,
                                                      num_classes=self.num_classes,
                                                      transform=transform_train,
                                                      preprocessing=preprocessing)
        self.train_loader = DataLoader(dataset=self.train_dataset,
                                       batch_size=self.batch_size_train,
                                       shuffle=self.shuffle_train,
                                       num_workers=self.num_workers,
                                       worker_init_fn=worker_init_fn)
        # val
        transform_val = get_transforms(config=self.cfg,
                                       key='transforms_val',
                                       imagenet=self.pretrained,
                                       norm=False,
                                       to_tensor=False)
        self.val_dataset = ImageSegmentationDataset(path=self.val_folder,
                                                    input_size=self.input_size,
                                                    num_classes=self.num_classes,
                                                    transform=transform_val,
                                                    preprocessing=preprocessing)
        self.val_loader = DataLoader(dataset=self.val_dataset,
                                     batch_size=self.batch_size_val,
                                     shuffle=self.shuffle_val,
                                     num_workers=self.num_workers,
                                     worker_init_fn=worker_init_fn)

    def train(self):
        logger = TensorBoardLogger(save_dir='tb_logs',
                                   name='imsgm',
                                   version=self.tb_version)
        pl_trainer = PLTrainer(logger=logger,
                               log_every_n_steps=25,
                               num_sanity_val_steps=5,
                               callbacks=self.callbacks,
                               **self.trainer_params)
        pl_trainer.fit(model=self.model,
                       train_dataloader=self.train_loader,
                       val_dataloaders=self.val_loader)
