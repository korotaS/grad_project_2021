import torch
from torchvision import models


def get_im_clf_architectures():
    return [
        'resnet18', 'resnet50', 'resnet152', 'alexnet', 'vgg16', 'densenet161', 'inception_v3',
        'googlenet', 'mobilenet_v2', 'resnext50_32x4d', 'resnext101_32x8d'
    ]


TASK_TO_FUNC = {
    'imclf': get_im_clf_architectures
}


def get_architectures_by_type(task_type):
    if task_type not in TASK_TO_FUNC:
        return []
    return TASK_TO_FUNC[task_type]()
