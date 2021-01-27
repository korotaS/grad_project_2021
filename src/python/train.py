from threading import Thread
import inspect

from src.python.utils.trainers import ImageClassificationTrainer, ImageSegmentationTrainer
from src.python.utils.utils import camel_to_snake


class TrainThread(Thread):
    def __init__(self, data):
        super().__init__()
        self.data = data
        converted_params = self.convert_params()
        subtask = converted_params['subtask']
        if subtask == 'imclf':
            trainer_class = ImageClassificationTrainer
        elif subtask == 'imsgm':
            trainer_class = ImageSegmentationTrainer
        init_params = inspect.getfullargspec(trainer_class.__init__)[0]
        params_dict = {k: v for k, v in converted_params.items() if k in init_params}
        self.trainer = trainer_class(**params_dict)

    def convert_params(self):
        int_params = ['batch_size', 'max_epochs', 'in_channels', 'num_classes']
        float_params = ['lr']
        new_params = {}
        for key, value in self.data.items():
            new_key = camel_to_snake(key)
            if new_key in int_params:
                new_params[new_key] = int(value)
            elif new_key in float_params:
                new_params[new_key] = float(value)
            else:
                new_params[new_key] = value
        return new_params

    def run(self):
        self.trainer.run()


# thread = TrainThread({'task': 'cv',
#                       'subtask': 'imclf',
#                       'projectName': 'project_1',
#                       'rawDatasetFolder': '',
#                       'architecture': 'mobilenet_v2',
#                       'numClasses': '2',
#                       'criterion': 'CrossEntropyLoss',
#                       'optimizer': 'Adam',
#                       'pretrained': True,
#                       'batchSize': '8',
#                       'freeze': True,
#                       'lr': '0.001'})
thread = TrainThread({'task': 'cv',
                      'subtask': 'imsgm',
                      'projectName': 'project_2',
                      'rawDatasetFolder': '',
                      'architecture': 'FPN',
                      'backbone': 'mobilenet_v2',
                      'numClasses': '1',
                      'criterion': 'JaccardLoss',
                      'optimizer': 'Adam',
                      'pretrained': True,
                      'batchSize': '8',
                      'lr': '0.001'})
thread.start()

