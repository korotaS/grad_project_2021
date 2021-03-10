import os
import shutil


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
