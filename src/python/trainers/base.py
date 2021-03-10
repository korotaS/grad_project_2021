import os


class BaseImageTrainer:
    def __init__(self, cfg):
        self.project_name = cfg['general']['project_name']
        self.dataset_folder = cfg['data']['dataset_folder']
        self.architecture = cfg['model']['architecture']
        self.criterion_name = cfg['model']['criterion']
        self.optimizer_name = cfg['model']['optimizer']
        self.pretrained = cfg['model']['pretrained']
        self.batch_size = cfg['model']['batch_size']
        self.max_epochs = cfg['model']['max_epochs']
        self.lr = cfg['model']['lr']
        self.width = cfg['data']['width']
        self.height = cfg['data']['height']
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

    def init_model(self):
        pass

    def init_data(self):
        pass

    def train(self):
        pass

    def run(self):
        self.init_model()
        self.init_data()
        self.train()
