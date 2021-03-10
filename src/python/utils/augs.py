import copy

import albumentations as A
from albumentations.pytorch import ToTensorV2


def get_transforms(config, key='transforms', imagenet=False, norm=True):
    if config['data'][key] == 'default':
        if norm:
            return A.Compose([
                    A.Resize(config['data']['height'], config['data']['width']),
                    A.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]) if imagenet else A.Normalize(0, 1),
                ])
        else:
            return A.Compose([
                A.Resize(config['data']['height'], config['data']['width']),
            ])
    else:
        return get_aug_from_config(config['data'][key])


def get_aug_from_config(config):
    config = copy.deepcopy(config)

    if config is None:
        return A.NoOp()

    if isinstance(config, str):
        return name2factory(config)()

    if isinstance(config, list):
        return A.Compose([get_aug_from_config(c) for c in config])

    # Augmentation name
    name = list(config.keys())[0]
    config = config[name] if config[name] else {}

    # Args for Compose/OneOf
    args = config.pop("args", None)
    args = args if args is not None else []

    if name == "Compose":
        return A.Compose([get_aug_from_config(c) for c in args], **config)
    elif name == "OneOf":
        return A.OneOf([get_aug_from_config(c) for c in args], **config)
    else:
        return name2factory(name)(*args, **config)


def name2factory(name: str) -> A.BasicTransform:
    try:
        # Get from albumentations.core and albumentations.augmentation
        return getattr(A, name)
    except AttributeError:
        # Get from albumentations.pytorch
        return getattr(A.pytorch, name)
