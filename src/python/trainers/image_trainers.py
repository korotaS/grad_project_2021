import ssl

import torch
from pytorch_lightning import Trainer as PLTrainer
from pytorch_lightning.loggers import TensorBoardLogger
from segmentation_models_pytorch.utils import losses as smp_losses
from torch import nn
from torch.utils.data import DataLoader

from src.python.architectures import get_im_clf_model, get_im_sgm_model
from src.python.datasets import ImageClassificationDataset, ImageSegmentationDataset
from src.python.models import ImageClassificationModel, ImageSegmentationModel
from src.python.preprocessors import ImageClassificationPreprocessor, ImageSegmentationPreprocessor
from src.python.trainers.base_trainers import BaseImageTrainer
from src.python.utils.seed import worker_init_fn

ssl._create_default_https_context = ssl._create_unverified_context


class ImageClassificationTrainer(BaseImageTrainer):
    def __init__(self, cfg, test_cfg=None):
        super().__init__(cfg, test_cfg)
        self.freeze = self.cfg['model']['freeze_backbone']
        self.labels = self.cfg['data']['labels']
        self.num_classes = len(self.labels)

        self.pref_input_size = None

    def init_model(self, test_mode_external=False):
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
        if self.test_mode or test_mode_external:
            self.model.load_state_dict(torch.load(self.test_ckpt_path)['state_dict'])

    def init_data(self):
        # train
        preprocessor_train = ImageClassificationPreprocessor(cfg=self.cfg, mode='train')
        self.train_dataset = ImageClassificationDataset(path=self.train_folder,
                                                        preprocessor=preprocessor_train,
                                                        data_len=self.train_len)
        self.train_loader = DataLoader(dataset=self.train_dataset,
                                       batch_size=self.batch_size_train,
                                       shuffle=self.shuffle_train,
                                       num_workers=self.num_workers,
                                       worker_init_fn=worker_init_fn)
        # val
        preprocessor_val = ImageClassificationPreprocessor(cfg=self.cfg, mode='val')
        self.val_dataset = ImageClassificationDataset(path=self.val_folder,
                                                      preprocessor=preprocessor_val,
                                                      data_len=self.val_len)
        self.val_loader = DataLoader(dataset=self.val_dataset,
                                     batch_size=self.batch_size_val,
                                     shuffle=self.shuffle_val,
                                     num_workers=self.num_workers,
                                     worker_init_fn=worker_init_fn)

    def init_test_data(self):
        # test
        preprocessor_test = ImageClassificationPreprocessor(cfg=self.cfg, mode='val')
        self.test_dataset = ImageClassificationDataset(path=self.test_folder,
                                                       preprocessor=preprocessor_test,
                                                       data_len=self.test_len)
        self.test_loader = DataLoader(dataset=self.test_dataset,
                                      batch_size=self.batch_size_test,
                                      shuffle=self.shuffle_test,
                                      num_workers=self.num_workers_test,
                                      worker_init_fn=worker_init_fn)

    def train(self):
        logger = TensorBoardLogger(save_dir=f'tb_logs/imclf/',
                                   name=self.project_name,
                                   version=self.tb_version)
        pl_trainer = PLTrainer(logger=logger,
                               log_every_n_steps=25,
                               num_sanity_val_steps=5,
                               callbacks=self.callbacks,
                               **self.trainer_params)
        pl_trainer.fit(model=self.model,
                       train_dataloader=self.train_loader,
                       val_dataloaders=self.val_loader)

    def test(self):
        pl_trainer = PLTrainer(gpus=self.gpus_test)
        pl_trainer.test(model=self.model,
                        test_dataloaders=self.test_loader)


class ImageSegmentationTrainer(BaseImageTrainer):
    def __init__(self, cfg, test_cfg=None):
        super().__init__(cfg, test_cfg)
        self.backbone = self.cfg['model']['backbone']
        self.in_channels = self.cfg['data']['in_channels']
        self.num_classes = self.cfg['data']['num_classes']
        self.use_rle = self.cfg['data']['use_rle']

    def init_model(self, test_mode_external=False):
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
        if self.test_mode or test_mode_external:
            self.model.load_state_dict(torch.load(self.test_ckpt_path)['state_dict'])

    def init_data(self):
        preprocessor_train = ImageSegmentationPreprocessor(cfg=self.cfg, mode='train')
        self.train_dataset = ImageSegmentationDataset(path=self.train_folder,
                                                      num_classes=self.num_classes,
                                                      preprocessor=preprocessor_train,
                                                      use_rle=self.use_rle,
                                                      data_len=self.train_len)
        self.train_loader = DataLoader(dataset=self.train_dataset,
                                       batch_size=self.batch_size_train,
                                       shuffle=self.shuffle_train,
                                       num_workers=self.num_workers,
                                       worker_init_fn=worker_init_fn)
        # val
        preprocessor_val = ImageSegmentationPreprocessor(cfg=self.cfg, mode='val')
        self.val_dataset = ImageSegmentationDataset(path=self.val_folder,
                                                    num_classes=self.num_classes,
                                                    preprocessor=preprocessor_val,
                                                    use_rle=self.use_rle,
                                                    data_len=self.val_len)
        self.val_loader = DataLoader(dataset=self.val_dataset,
                                     batch_size=self.batch_size_val,
                                     shuffle=self.shuffle_val,
                                     num_workers=self.num_workers,
                                     worker_init_fn=worker_init_fn)

    def init_test_data(self):
        # test
        preprocessor_test = ImageSegmentationPreprocessor(cfg=self.cfg, mode='val')
        self.test_dataset = ImageSegmentationDataset(path=self.test_folder,
                                                     num_classes=self.num_classes,
                                                     preprocessor=preprocessor_test,
                                                     use_rle=self.use_rle,
                                                     data_len=self.test_len)
        self.test_loader = DataLoader(dataset=self.test_dataset,
                                      batch_size=self.batch_size_test,
                                      shuffle=self.shuffle_test,
                                      num_workers=self.num_workers_test,
                                      worker_init_fn=worker_init_fn)

    def train(self):
        logger = TensorBoardLogger(save_dir=f'tb_logs/imsgm/',
                                   name=self.project_name,
                                   version=self.tb_version)
        pl_trainer = PLTrainer(logger=logger,
                               log_every_n_steps=25,
                               num_sanity_val_steps=5,
                               callbacks=self.callbacks,
                               **self.trainer_params)
        pl_trainer.fit(model=self.model,
                       train_dataloader=self.train_loader,
                       val_dataloaders=self.val_loader)

    def test(self):
        pl_trainer = PLTrainer(gpus=self.gpus_test)
        pl_trainer.test(model=self.model,
                        test_dataloaders=self.test_loader)
