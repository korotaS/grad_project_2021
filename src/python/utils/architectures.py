import ssl

import segmentation_models_pytorch as smp
import pytorch_lightning as pl
import torch
import torch.nn as nn
from torchvision import models

ssl._create_default_https_context = ssl._create_unverified_context


# IMAGE CLASSIFICATION

def get_im_clf_architectures():
    """Returns the list of atchitectures which are available"""
    return [
        'resnet18', 'resnet50', 'resnet152', 'alexnet', 'vgg16', 'inception_v3',
        'mobilenet_v2', 'resnext50_32x4d', 'resnext101_32x8d'
    ]


def set_parameter_requires_grad(model, feature_extracting):
    """Freezes some parameters
    (taken from https://pytorch.org/tutorials/beginner/finetuning_torchvision_models_tutorial.html)
    """
    if feature_extracting:
        for param in model.parameters():
            param.requires_grad = False


def get_im_clf_model(model_name, num_classes, pretrained=True, freeze=True):
    """
    https://pytorch.org/tutorials/beginner/finetuning_torchvision_models_tutorial.html
    """
    # Initialize these variables which will be set in this if statement. Each of these
    #   variables is model specific.
    model = None
    input_size = 0

    if model_name.startswith("resnet") or model_name.startswith('resnext'):
        """ Resnet and Resnext
        """
        model = getattr(models, model_name, None)(pretrained=pretrained)
        set_parameter_requires_grad(model, freeze)
        num_ftrs = model.fc.in_features
        model.fc = nn.Linear(num_ftrs, num_classes)
        input_size = 224

    elif model_name == "alexnet":
        """ Alexnet
        """
        model = models.alexnet(pretrained=pretrained)
        set_parameter_requires_grad(model, freeze)
        num_ftrs = model.classifier[6].in_features
        model.classifier[6] = nn.Linear(num_ftrs, num_classes)
        input_size = 224

    elif model_name == "vgg16":
        """ VGG16_bn
        """
        model = models.vgg16_bn(pretrained=pretrained)
        set_parameter_requires_grad(model, freeze)
        num_ftrs = model.classifier[6].in_features
        model.classifier[6] = nn.Linear(num_ftrs, num_classes)
        input_size = 224

    elif model_name == "inception_v3":
        """ Inception v3
        Be careful, expects (299,299) sized images and has auxiliary output
        """
        model = models.inception_v3(pretrained=pretrained)
        set_parameter_requires_grad(model, freeze)
        # Handle the auxilary net
        num_ftrs = model.AuxLogits.fc.in_features
        model.AuxLogits.fc = nn.Linear(num_ftrs, num_classes)
        # Handle the primary net
        num_ftrs = model.fc.in_features
        model.fc = nn.Linear(num_ftrs, num_classes)
        input_size = 299

    elif model_name == 'mobilenet_v2':
        """MobileNet
        """
        model = torch.hub.load('pytorch/vision', 'mobilenet_v2', pretrained=pretrained)
        set_parameter_requires_grad(model, freeze)
        num_ftrs = model.classifier[1].in_features
        model.classifier[1] = torch.nn.Linear(num_ftrs, num_classes)
        input_size = 224

    else:
        print("Invalid model name, exiting...")
        exit()

    return model, input_size


class ImageClassificationModel(pl.LightningModule):
    def __init__(self, model, architecture, optimizer, criterion):
        super().__init__()
        self.model = model
        self.architecture = architecture
        self.optimizer = optimizer
        self.criterion = criterion

        self.val_acc = pl.metrics.Accuracy()

    def forward(self, x):
        return self.model(x)

    def training_step(self, batch, batch_idx):
        inputs, labels = batch
        if self.architecture == 'inception_v3':
            outputs, aux_outputs = self.model(inputs)
            loss1 = self.criterion(outputs, labels)
            loss2 = self.criterion(aux_outputs, labels)
            loss = loss1 + 0.4 * loss2
        else:
            outputs = self.model(inputs)
            loss = self.criterion(outputs, labels.long())
        # socketio.emit('batch', {'batch': str(batch_idx)})
        self.log('train_loss', loss, on_step=True, on_epoch=True, logger=True)
        return loss

    def validation_step(self, batch, batch_idx):
        inputs, labels = batch
        if self.architecture == 'inception_v3':
            outputs, aux_outputs = self.model(inputs)
            loss1 = self.criterion(outputs, labels)
            loss2 = self.criterion(aux_outputs, labels)
            loss = loss1 + 0.4 * loss2
        else:
            outputs = self.model(inputs)
            loss = self.criterion(outputs, labels.long())
        _, preds = torch.max(outputs, 1)
        accuracy = self.val_acc(preds, labels.data)
        self.log('val_loss', loss, on_epoch=True, on_step=True, logger=True)

    def validation_epoch_end(self, outputs):
        self.log('val_acc', self.val_acc.compute(), on_epoch=True, on_step=False, logger=True, prog_bar=True)

    def configure_optimizers(self):
        return self.optimizer


# IMAGE SEGMENTATION

def get_im_sgm_architectures():
    """Returns the list of atchitectures which are available"""
    encoders = ['resnet18', 'resnet50', 'resnet152', 'vgg16', 'inceptionv4',
                'mobilenet_v2', 'resnext50_32x4d', 'resnext101_32x8d']
    architectures = ['Unet', 'Unet++', 'FPN', 'PAN', 'DeepLabV3']
    return {'encoders': encoders, 'models': architectures}


def get_im_sgm_model(model_name, encoder_name, num_classes, in_channels, pretrained=True):
    model = getattr(smp, model_name, None)(
        encoder_name=encoder_name,
        encoder_weights='imagenet' if pretrained else None,  # Only ImageNet for now
        in_channels=in_channels,
        classes=num_classes
    )
    return model


# Only semantic segmentation (instance segmentation TBD)
class ImageSegmentationModel(pl.LightningModule):
    def __init__(self, model, optimizer, criterion):
        super().__init__()
        self.model = model
        self.optimizer = optimizer
        self.criterion = criterion

    def forward(self, x):
        return self.model(x)

    def training_step(self, batch, batch_idx):
        images, masks = batch
        outputs = self.model(images, masks)
        loss = self.criterion(outputs, masks.long())
        # socketio.emit('batch', {'batch': str(batch_idx)})
        self.log('train_loss', loss, on_step=True, on_epoch=True, logger=True)
        return loss

    def validation_step(self, batch, batch_idx):
        images, masks = batch
        outputs = self.model(images, masks)
        loss = self.criterion(outputs, masks.long())
        _, preds = torch.max(outputs, 1)
        self.log('val_loss', loss, on_epoch=True, on_step=True, logger=True)

    def configure_optimizers(self):
        return self.optimizer


# OBJECT DETECTION


TASK_TO_FUNC = {
    'imclf': get_im_clf_architectures,
    'imsgm': get_im_sgm_architectures
}


def get_architectures_by_type(task_type):
    """Returns out-of-box architectures list by task type"""
    if task_type not in TASK_TO_FUNC:
        return []
    return TASK_TO_FUNC[task_type]()


get_im_sgm_model('Unet', 'mobilenet_v2', 2, 1, True)
