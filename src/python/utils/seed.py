import os
import random
import signal

import numpy as np
import torch


def worker_init_fn(x):
    seed = (int(torch.initial_seed()) + x) % (2 ** 32 - 1)
    np.random.seed(seed)
    random.seed(seed)
    torch.manual_seed(seed)
    signal.signal(signal.SIGINT, signal.SIG_IGN)


def set_seed(seed: int = 42) -> None:
    np.random.seed(seed)
    os.environ['PYTHONHASHSEED'] = str(seed)
    random.seed(seed)
    torch.backends.cudnn.benchmark = False
    torch.backends.cudnn.deterministic = True
    torch.manual_seed(seed)
    torch.cuda.manual_seed_all(seed)
