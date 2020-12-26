import torch
import torch.nn as nn
from torchvision import models

import ssl

ssl._create_default_https_context = ssl._create_unverified_context


# IMAGE CLASSIFICATION

def get_im_clf_architectures():
    """Returns the list of atchitectures which are available"""
    return [
        'resnet18', 'resnet50', 'resnet152', 'alexnet', 'vgg16', 'inception_v3',
        'mobilenet_v2', 'resnext50_32x4d', 'resnext101_32x8d'
    ]


def get_im_clf_model(model_name, num_classes, use_pretrained=True):
    """
    https://pytorch.org/tutorials/beginner/finetuning_torchvision_models_tutorial.html
    """
    # Initialize these variables which will be set in this if statement. Each of these
    #   variables is model specific.
    model_ft = None
    input_size = 0

    if model_name.startswith("resnet") or model_name.startswith('resnext'):
        """ Resnet and Resnext
        """
        model_ft = getattr(models, model_name, None)(pretrained=use_pretrained)
        num_ftrs = model_ft.fc.in_features
        model_ft.fc = nn.Linear(num_ftrs, num_classes)
        input_size = 224

    elif model_name == "alexnet":
        """ Alexnet
        """
        model_ft = models.alexnet(pretrained=use_pretrained)
        num_ftrs = model_ft.classifier[6].in_features
        model_ft.classifier[6] = nn.Linear(num_ftrs, num_classes)
        input_size = 224

    elif model_name == "vgg16":
        """ VGG16_bn
        """
        model_ft = models.vgg16_bn(pretrained=use_pretrained)
        num_ftrs = model_ft.classifier[6].in_features
        model_ft.classifier[6] = nn.Linear(num_ftrs, num_classes)
        input_size = 224

    elif model_name == "inception_v3":
        """ Inception v3
        Be careful, expects (299,299) sized images and has auxiliary output
        """
        model_ft = models.inception_v3(pretrained=use_pretrained)
        # Handle the auxilary net
        num_ftrs = model_ft.AuxLogits.fc.in_features
        model_ft.AuxLogits.fc = nn.Linear(num_ftrs, num_classes)
        # Handle the primary net
        num_ftrs = model_ft.fc.in_features
        model_ft.fc = nn.Linear(num_ftrs, num_classes)
        input_size = 299

    elif model_name == 'mobilenet_v2':
        """MobileNet
        """
        model_ft = torch.hub.load('pytorch/vision', 'mobilenet_v2', pretrained=use_pretrained)
        num_ftrs = model_ft.classifier[1].in_features
        model_ft.classifier[1] = torch.nn.Linear(num_ftrs, num_classes)
        input_size = 224

    else:
        print("Invalid model name, exiting...")
        exit()

    return model_ft, input_size


# IMAGE SEGMENTATION


# OBJECT DETECTION


TASK_TO_FUNC = {
    'imclf': get_im_clf_architectures
}


def get_architectures_by_type(task_type):
    """Returns out-of-box architectures list by task type"""
    if task_type not in TASK_TO_FUNC:
        return []
    return TASK_TO_FUNC[task_type]()

# get_im_clf_model('mobilenet_v2', pretrained=False)
