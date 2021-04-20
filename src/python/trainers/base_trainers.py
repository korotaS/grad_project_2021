import os
from datetime import datetime

import yaml
from pytorch_lightning.callbacks import ModelCheckpoint, LearningRateMonitor


class BaseTrainer:
    def __init__(self, cfg, test_cfg=None):
        self.test_mode = False
        self.cfg = cfg
        # general
        self.project_name = self.cfg['general']['project_name']
        self.exp_name = self.cfg['general']['exp_name']
        self.version = datetime.now().strftime("%Y%m%dT%H%M%S")
        self.tb_version = self.exp_name + '_' + self.version
        if not os.path.exists('./projects/'):
            os.mkdir('./projects/')
        self.project_folder = os.path.join('./projects/', self.project_name)
        if not os.path.exists(self.project_folder):
            os.mkdir(self.project_folder)
        # model
        self.model_raw = None
        self.model = None
        # data
        self.dataset_folder = self.cfg['data']['dataset_folder']
        self.train_len = self.cfg['data']['train_len']
        self.val_len = self.cfg['data']['val_len']
        self.train_dataset = self.val_dataset = self.train_loader = self.val_loader = None
        # trainer
        self.trainer_params = self.cfg['trainer']
        # training
        self.batch_size_train = self.cfg['training']['batch_size_train']
        self.batch_size_val = self.cfg['training']['batch_size_val']
        self.shuffle_train = self.cfg['training']['shuffle_train']
        self.shuffle_val = self.cfg['training']['batch_size_val']
        self.num_workers = self.cfg['training']['workers']
        self.criterion_name = self.cfg['training']['criterion']
        # optimizer, scheduler
        self.optimizer_cfg = self.cfg['optimizer']
        self.scheduler_cfg = self.cfg['scheduler']

        self.test_cfg = test_cfg
        if self.test_cfg is not None:
            self.test_dataset = self.test_loader = None
            self.test_folder = self.test_cfg['dataset_folder']
            self.test_len = self.test_cfg['data_len']
            self.shuffle_test = self.test_cfg['shuffle']
            self.num_workers_test = self.test_cfg['num_workers_test']
            self.batch_size_test = self.test_cfg['batch_size']
            self.gpus_test = self.test_cfg['gpus']
            self.test_ckpt_path = self.test_cfg['ckpt_path']
            self.test_mode = True

        self.callbacks, self.exp_folder = self.configure_callbacks()
        if not self.test_mode:
            if not os.path.exists(self.exp_folder):
                os.mkdir(self.exp_folder)
            with open(os.path.join(self.exp_folder, f'cfg_{self.version}.yaml'), 'w') as outfile:
                yaml.dump(cfg, outfile, default_flow_style=False)

    def init_model(self, test_mode_external=False):
        pass

    def init_data(self):
        pass

    def init_test_data(self):
        pass

    def train(self):
        pass

    def test(self):
        pass

    def configure_callbacks(self):
        callbacks = []
        exp_path = f"projects/{self.cfg['general']['project_name']}/{self.cfg['general']['exp_name']}_{self.version}"
        ckpt_path = os.path.join(exp_path, 'weights')
        ckpt_callback_cfg = self.cfg['checkpoint_callback']
        ckpt_filename = f'{ckpt_callback_cfg["filename"]}_{self.version}'
        checkpoint_callback = ModelCheckpoint(dirpath=ckpt_path,
                                              mode=ckpt_callback_cfg['mode'],
                                              monitor=ckpt_callback_cfg['monitor'],
                                              save_top_k=ckpt_callback_cfg['save_top_k'],
                                              verbose=ckpt_callback_cfg['verbose'],
                                              filename=ckpt_filename)
        callbacks.append(checkpoint_callback)
        lr_logger = LearningRateMonitor(logging_interval='epoch')
        callbacks.append(lr_logger)
        return callbacks, exp_path

    def run(self):
        self.init_model()
        if self.test_mode:
            self.init_test_data()
            self.test()
        else:
            self.init_data()
            self.train()


class BaseImageTrainer(BaseTrainer):
    def __init__(self, cfg, test_cfg=None):
        super().__init__(cfg, test_cfg)
        # model
        self.architecture = self.cfg['model']['architecture']
        self.pretrained = self.cfg['model']['pretrained']
        # data
        self.width = self.cfg['data']['width']
        self.height = self.cfg['data']['height']
        self.input_size = (self.height, self.width)
        self.train_folder = os.path.join(self.dataset_folder, 'train/')
        self.val_folder = os.path.join(self.dataset_folder, 'val/')


class BaseTextTrainer(BaseTrainer):
    def __init__(self, cfg, test_cfg=None):
        super().__init__(cfg, test_cfg)
        # model
        self.model_type = self.cfg['model']['model_type']
        # data
        self.lang = self.cfg['data']['lang']
        self.split = self.cfg['data']['split']
        self.train_folder = os.path.join(self.dataset_folder, 'train/') if self.split else self.dataset_folder
        self.val_folder = os.path.join(self.dataset_folder, 'val/') if self.split else self.dataset_folder
        if self.test_cfg is not None:
            self.split_test = self.cfg['split']
