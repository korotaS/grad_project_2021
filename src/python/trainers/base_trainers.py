import os

import yaml
from pytorch_lightning.callbacks import ModelCheckpoint

from src.python.utils.seed import set_seed


class BaseTrainer:
    def __init__(self, cfg):
        self.cfg = cfg
        # general
        self.project_name = self.cfg['general']['project_name']
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
        self.optimizer_name = self.cfg['training']['optimizer']['name']
        self.optimizer_params = self.cfg['training']['optimizer']['params']
        self.criterion_name = self.cfg['training']['criterion']
        self.seed = self.cfg['training']['seed']
        set_seed(self.seed)

        self.callbacks, self.exp_folder = self.configure_callbacks()
        with open(os.path.join(self.exp_folder, 'config.yaml'), 'w') as outfile:
            yaml.dump(cfg, outfile, default_flow_style=False)

    def init_model(self):
        pass

    def init_data(self):
        pass

    def train(self):
        pass

    def configure_callbacks(self):
        callbacks = []
        exp_path = f"projects/{self.cfg['general']['project_name']}/{self.cfg['general']['exp_name']}"
        ckpt_path = os.path.join(exp_path, 'weights')
        checkpoint_callback = ModelCheckpoint(dirpath=ckpt_path, **self.cfg['checkpoint_callback'])
        callbacks.append(checkpoint_callback)
        return callbacks, exp_path

    def run(self):
        self.init_model()
        self.init_data()
        self.train()


class BaseImageTrainer(BaseTrainer):
    def __init__(self, cfg):
        super().__init__(cfg)
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
    def __init__(self, cfg):
        super().__init__(cfg)
        # model
        self.model_type = self.cfg['model']['model_type']
        # data
        self.lang = self.cfg['data']['lang']
        self.split = self.cfg['data']['split']
        self.train_folder = os.path.join(self.dataset_folder, 'train/') if self.split else self.dataset_folder
        self.val_folder = os.path.join(self.dataset_folder, 'val/') if self.split else self.dataset_folder
