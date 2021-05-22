import torch
import yaml

from src.python.exporters.base_exporter import BaseExporter


class TextClassificationExporter(BaseExporter):
    def __init__(self, cfg, export_folder, prefix='', checkpoint_path=None, find_by_time=False, cfg_name=None):
        super().__init__(cfg, export_folder, prefix, checkpoint_path, find_by_time, cfg_name)
        self.model_type = self.cfg['model']['model_type']
        self.max_len = self.cfg['data']['max_item_len']
        self.model.cpu()
        if self.model_type == 'bert':
            # self.model_name = self.cfg['model']['model_name']
            self._example_input = (torch.randint(1, 5, (1, self.max_len)),  # input_ids
                                   torch.randint(1, 5, (1, self.max_len)),  # input_mask
                                   torch.randint(1, 5, (1, self.max_len)))  # segment_ids
        elif self.model_type == 'lstm':
            self._example_input = (torch.randint(1, 5, (1, self.max_len)),  # input_sentence
                                   torch.randint(1, 5, (1,)))  # input_lengths

    def export_onnx(self):
        # print(f'Exporting ONNX model to {self.onnx_path}')
        if self.model_type == 'bert':
            torch.onnx.export(
                self.model,
                self._example_input,
                self.onnx_path,
                export_params=True,
                opset_version=11,
                do_constant_folding=True,
                input_names=['input_ids', 'input_mask', 'segment_ids'],
                output_names=['output'],
                dynamic_axes={
                    'input_ids': [0, 1],
                    'input_mask': [0, 1],
                    'segment_ids': [0, 1],
                    'output': [0]
                }
            )
        elif self.model_type == 'lstm':
            torch.onnx.export(
                self.model,
                self._example_input,
                self.onnx_path,
                export_params=True,
                opset_version=11,
                do_constant_folding=True,
                input_names=['input_sentence', 'input_lengths'],
                output_names=['output'],
                dynamic_axes={
                    'input_sentence': [0, 1],
                    'input_lengths': [0],
                    'output': [0]
                }
            )

    def export_jit(self, device='cpu'):
        print(f'Exporting JIT model to {self.jit_path}')
        example_input = tuple(inp.to(device) for inp in self._example_input)
        module = torch.jit.trace(self.model.to(device), example_input)
        torch.jit.save(module, self.jit_path)


# exp = 'projects/project_3/experiment_1_20210417T154503'
# cfg = yaml.full_load(open(f'{exp}/config.yaml'))
# checkpoint = f'{exp}/weights/epoch=1_val_acc=0.89_20210417T154503.ckpt'
# export_folder = f'{exp}/weights/'
# exp = TextClassificationExporter(cfg, checkpoint, export_folder, prefix='txt_clf_bert_0.89')
# exp.export_jit()
# exp.export_onnx()
