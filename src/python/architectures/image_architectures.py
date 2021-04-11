import ssl

import segmentation_models_pytorch as smp
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


TASK_TO_FUNC = {
    'imclf': get_im_clf_architectures,
    'imsgm': get_im_sgm_architectures
}


def get_image_architectures_by_type(task_type):
    """Returns out-of-box architectures list by task type"""
    if task_type not in TASK_TO_FUNC:
        return []
    return TASK_TO_FUNC[task_type]()
