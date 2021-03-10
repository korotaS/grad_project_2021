from torch.utils.data import Dataset


class BaseDataset(Dataset):
    def __len__(self):
        pass

    def __getitem__(self, item):
        pass

    def check_structure(self, *args, **kwargs):
        pass

    def check_content(self, *args, **kwargs):
        pass


class DatasetStructureError(ValueError):
    """Raised when structure of dataset folder is incorrect"""
    pass


class DatasetContentError(ValueError):
    """Raised when content of dataset folder is incorrect"""
    pass
