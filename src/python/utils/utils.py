import re
from functools import reduce as _reduce

import numpy as np
from torch import optim
from torch.optim import lr_scheduler


def rle_encode(seq):
    values = []
    counts = []
    start_idxs = []
    values.append(seq[0])
    current_count = 1
    current_start_idx = 0
    iterator = range(1, len(seq))
    for idx in iterator:
        if seq[idx] == values[-1]:
            current_count += 1
        else:
            counts.append(current_count)
            start_idxs.append(current_start_idx)
            values.append(seq[idx])
            current_count = 1
            current_start_idx = idx
    counts.append(current_count)
    start_idxs.append(current_start_idx)
    return values, counts


def rle_encode_mask(mask, return_dict=False):
    flatten_mask = np.array(mask).flatten()
    values, counts = rle_encode(flatten_mask)
    if return_dict:
        return {'values': list([int(v) for v in values]),
                'counts': list([int(c) for c in counts]),
                'shape': mask.shape}
    return values, counts, mask.shape


def rle_decode(values, counts):
    counts = [int(i) for i in counts]
    seq = [[i] * j for i, j in zip(values, counts)]
    seq = _reduce(lambda x, y: x + y, seq)
    return np.array(seq)


def rle_decode_mask_raw(rle_dict):
    values = np.array(rle_dict['values'])
    counts = np.array(rle_dict['counts'])
    h, w = rle_dict['shape'][:2]
    seq = rle_decode(values, counts)
    mask = np.reshape(seq, (w, h))
    return mask


def rle_decode_mask(full_rle_dict):
    shapes = [tuple(value['shape']) for value in full_rle_dict.values()]
    assert len(set(shapes)) == 1, 'Shape of all channels in the mask must be equal.'
    shape = shapes[0]
    mask = np.zeros(shape+(len(full_rle_dict),))
    for i, value in enumerate(full_rle_dict.values()):
        mask[:, :, i] = rle_decode_mask_raw(value)
    return mask


def camel_to_snake(name):
    name = re.sub('(.)([A-Z][a-z]+)', r'\1_\2', name)
    return re.sub('([a-z0-9])([A-Z])', r'\1_\2', name).lower()


def _configure_optimizers(optimizer_cfg, scheduler_cfg, model, freeze=False):
    params_to_update = model.parameters()
    if freeze:
        params_to_update = []
        for name, param in model.named_parameters():
            if param.requires_grad:
                params_to_update.append(param)
    optimizer = getattr(optim, optimizer_cfg['name'])(params=params_to_update,
                                                      **optimizer_cfg['params'])
    scheduler = getattr(lr_scheduler, scheduler_cfg['name'])(optimizer=optimizer,
                                                             **scheduler_cfg['params'])
    scheduler_config = {
        "scheduler": scheduler,
        "interval": "epoch",
        "frequency": 1,
        "monitor": "val_loss",
    }
    return [[optimizer], [scheduler_config]]
