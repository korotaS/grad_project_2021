import ssl

import pytorch_lightning as pl
import segmentation_models_pytorch as smp
import torch
import torch.nn as nn
from torchvision import models

from src.python.utils.draw import draw_im_clf_predictions, draw_confusion_matrix

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
    def __init__(self, model, architecture, optimizer, criterion, labels):
        super().__init__()
        self.model = model
        self.architecture = architecture
        self.optimizer = optimizer
        self.criterion = criterion
        self.labels = labels

        self.metrics = {
            'acc': pl.metrics.Accuracy()
        }

    def forward(self, x):
        return self.model(x)

    def training_step(self, batch, batch_idx):
        raw_images, inputs, labels = batch
        if self.architecture == 'inception_v3':
            outputs, aux_outputs = self.model(inputs)
            loss1 = self.criterion(outputs, labels)
            loss2 = self.criterion(aux_outputs, labels)
            loss = loss1 + 0.4 * loss2
        else:
            outputs = self.model(inputs)
            loss = self.criterion(outputs, labels.long())
        _, preds = torch.max(outputs, 1)
        # socketio.emit('batch', {'batch': str(batch_idx)})
        tb_logs = {
            'train_loss': loss.cpu()
        }
        for metric_name, metric in self.metrics.items():
            tb_logs['train_' + metric_name] = metric(preds, labels.data)
        for key, value in tb_logs.items():
            self.log(key, value)
        return {
            'loss': loss.cpu(),
        }

    def validation_step(self, batch, batch_idx):
        raw_images, inputs, labels = batch
        if self.architecture == 'inception_v3':
            outputs, aux_outputs = self.model(inputs)
            loss1 = self.criterion(outputs, labels)
            loss2 = self.criterion(aux_outputs, labels)
            loss = loss1 + 0.4 * loss2
        else:
            outputs = self.model(inputs)
            loss = self.criterion(outputs, labels.long())
        _, preds = torch.max(outputs, 1)
        logits = nn.functional.softmax(outputs, dim=1)
        tb_logs = {
            'val_loss': loss.cpu()
        }
        for metric_name, metric in self.metrics.items():
            tb_logs['val_' + metric_name] = metric(preds, labels.data)
        for key, value in tb_logs.items():
            self.log(key, value)
        return {
            'loss': loss.cpu(),
            'images': raw_images,
            'logits': logits,
            'pred_labels': preds,
            'true_labels': labels
        }

    def validation_epoch_end(self, outputs):
        images = outputs[0]['images'].cpu().numpy()
        logits = outputs[0]['logits'].cpu().numpy()
        pred_labels = [output['pred_labels'].cpu().numpy() for output in outputs]
        pred_labels = [int(label) for batch in pred_labels for label in batch]
        true_labels = [output['true_labels'].cpu().numpy() for output in outputs]
        true_labels = [int(label) for batch in true_labels for label in batch]

        pred_figure = draw_im_clf_predictions(images, logits, self.labels, fontsize=10)
        self.logger.experiment.add_figure('predictions', pred_figure, self.current_epoch)

        conf_matr_figure = draw_confusion_matrix(pred_labels, true_labels, self.labels)
        self.logger.experiment.add_figure('confusion matrix', conf_matr_figure, self.current_epoch)

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
        classes=num_classes,
        activation='sigmoid' if num_classes == 1 else 'softmax'
    )
    return model


# Only semantic segmentation (instance segmentation TBD)
class ImageSegmentationModel(pl.LightningModule):
    def __init__(self, model, optimizer, criterion):
        super().__init__()
        self.model = model
        self.optimizer = optimizer
        self.criterion = criterion
        self.metrics = {
            'IOU': smp.utils.metrics.IoU()
        }

    def forward(self, x):
        return self.model(x)

    def training_step(self, batch, batch_idx):
        images, masks = batch
        outputs = self.model(images)
        loss = self.criterion(outputs, masks.long())
        # socketio.emit('batch', {'batch': str(batch_idx)})
        tb_logs = {
            'train_loss': loss.cpu()
        }
        for metric_name, metric in self.metrics.items():
            tb_logs['train_'+metric_name] = metric(outputs, images)
        return {
            'loss': loss.cpu(),
            'log': tb_logs
        }

    def validation_step(self, batch, batch_idx):
        images, masks = batch
        outputs = self.model(images)
        loss = self.criterion(outputs, masks.long())
        tb_logs = {
            'val_loss': loss.cpu()
        }
        for metric_name, metric in self.metrics.items():
            tb_logs['val_' + metric_name] = metric(outputs, images)
        return {
            'loss': loss.cpu(),
            'log': tb_logs
        }

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
