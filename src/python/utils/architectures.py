import torch.nn as nn
import torch.nn.functional as F
from torchvision import models
from torchvision import transforms

import ssl
ssl._create_default_https_context = ssl._create_unverified_context


# IMAGE CLASSIFICATION

def get_im_clf_architectures():
    """Returns the list of atchitectures which are available"""
    return [
        'resnet18', 'resnet50', 'resnet152', 'alexnet', 'vgg16', 'densenet161', 'inception_v3',
        'googlenet', 'mobilenet_v2', 'resnext50_32x4d', 'resnext101_32x8d'
    ]


class ImageClassificationModel(nn.Module):
    def __init__(self, backbone, fc_layers=(), num_classes=2, bn=True):
        super(ImageClassificationModel, self).__init__()
        self.backbone = backbone
        self.fc_layers = []
        self.bn = bn
        if self.bn:
            self.bns = []
        for i, n_hid in enumerate(fc_layers):
            if i == 0:
                curr_layer = nn.Linear(1000, n_hid)
            else:
                curr_layer = nn.Linear(fc_layers[i-1], n_hid)
            self.fc_layers.append(curr_layer)
            if self.bn:
                self.bns.append(nn.BatchNorm1d(n_hid))
        last_n_hid = fc_layers[-1] if fc_layers else 1000
        self.fc_final = nn.Linear(last_n_hid, num_classes if num_classes > 2 else 1)
        self.relu = nn.ReLU()

    def forward(self, batch):
        x = batch
        x = self.backbone(x)
        for i in range(len(self.fc_layers)):
            x = self.fc_layers[i](x)
            if self.bn:
                x = self.bns[i](x)
            x = self.relu(x)
        x = self.fc_final(x)
        return F.softmax(x)


def get_im_clf_model(architecture, input_shape=None, num_classes=None, pretrained=False, bn=True, **kwargs):
    """Returns model by arch name and parameters"""
    # TODO: make other arguments (FC layers, number of neurons etc)
    backbone_func = getattr(models, architecture, None)
    if backbone_func is None:
        raise NotImplementedError('Architecture type is not supported!')
    backbone = backbone_func(pretrained)
    model = ImageClassificationModel(backbone=backbone, fc_layers=(), num_classes=num_classes, bn=bn)
    return model


TASK_TO_FUNC = {
    'imclf': get_im_clf_architectures
}


def get_architectures_by_type(task_type):
    """Returns out-of-box architectures list by task type"""
    if task_type not in TASK_TO_FUNC:
        return []
    return TASK_TO_FUNC[task_type]()


# get_im_clf_model('mobilenet_v2', pretrained=False)
