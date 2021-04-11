import os
from pytorch_lightning.callbacks import ModelCheckpoint


class BaseImageTrainer:
    def __init__(self, cfg):
        self.cfg = cfg
        self.project_name = self.cfg['general']['project_name']
        self.dataset_folder = self.cfg['data']['dataset_folder']
        self.architecture = self.cfg['model']['architecture']
        self.criterion_name = self.cfg['model']['criterion']
        self.optimizer_name = self.cfg['model']['optimizer']
        self.pretrained = self.cfg['model']['pretrained']
        self.batch_size = self.cfg['model']['batch_size']
        self.max_epochs = self.cfg['model']['max_epochs']
        self.lr = self.cfg['model']['lr']
        self.width = self.cfg['data']['width']
        self.height = self.cfg['data']['height']
        self.input_size = (self.height, self.width)

        self.train_dataset = self.val_dataset = self.train_loader = self.val_loader = None
        self.model_raw = None
        self.model = None

        if not os.path.exists('./projects/'):
            os.mkdir('./projects/')
        self.project_folder = os.path.join('./projects/', self.project_name)
        if not os.path.exists(self.project_folder):
            os.mkdir(self.project_folder)
        self.train_folder = os.path.join(self.dataset_folder, 'train/')
        self.val_folder = os.path.join(self.dataset_folder, 'val/')

        self.callbacks = self.configure_callbacks()

    def init_model(self):
        pass

    def init_data(self):
        pass

    def train(self):
        pass
    
    def configure_callbacks(self):
        callbacks = []
        ckpt_dirpath = f"projects/{self.cfg['general']['project_name']}/{self.cfg['general']['exp_name']}/weights/"
        checkpoint_callback = ModelCheckpoint(dirpath=ckpt_dirpath, **self.cfg['checkpoint_callback'])
        callbacks.append(checkpoint_callback)

        return callbacks

    def run(self):
        self.init_model()
        self.init_data()
        self.train()


class BaseTextTrainer:
    def __init__(self, cfg):
        self.cfg = cfg
        self.project_name = self.cfg['general']['project_name']
        self.dataset_folder = self.cfg['data']['dataset_folder']
        self.lang = self.cfg['data']['lang']
        self.split = self.cfg['data']['split']
        self.criterion_name = self.cfg['model']['criterion']
        self.optimizer_name = self.cfg['model']['optimizer']
        self.batch_size = self.cfg['model']['batch_size']
        self.max_epochs = self.cfg['model']['max_epochs']
        self.lr = self.cfg['model']['lr']

        self.train_dataset = self.val_dataset = self.train_loader = self.val_loader = None
        self.model_raw = None
        self.model = None

        if not os.path.exists('./projects/'):
            os.mkdir('./projects/')
        self.project_folder = os.path.join('./projects/', self.project_name)
        if not os.path.exists(self.project_folder):
            os.mkdir(self.project_folder)
        self.train_folder = os.path.join(self.dataset_folder, 'train/') if self.split else self.dataset_folder
        self.val_folder = os.path.join(self.dataset_folder, 'val/') if self.split else self.dataset_folder

        self.callbacks = self.configure_callbacks()

    def init_model(self):
        pass

    def init_data(self):
        pass

    def train(self):
        pass

    def configure_callbacks(self):
        callbacks = []
        ckpt_dirpath = f"projects/{self.cfg['general']['project_name']}/{self.cfg['general']['exp_name']}/weights/"
        checkpoint_callback = ModelCheckpoint(dirpath=ckpt_dirpath, **self.cfg['checkpoint_callback'])
        callbacks.append(checkpoint_callback)

        return callbacks

    def run(self):
        self.init_model()
        self.init_data()
        self.train()
