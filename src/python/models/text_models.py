import pytorch_lightning as pl
import torch
import torch.nn as nn
from sklearn.metrics import classification_report, accuracy_score

from src.python.utils.draw import draw_confusion_matrix
from src.python.utils.utils import _configure_optimizers


class BaseTextClassificationModel(pl.LightningModule):
    def __init__(self, model, optimizer_cfg, scheduler_cfg, criterion, labels):
        super().__init__()
        self.model = model
        self.optimizer_cfg = optimizer_cfg
        self.scheduler_cfg = scheduler_cfg
        self.criterion = criterion
        self.labels = labels

        self.metrics = {}

    def _training_step_after_model(self, outputs, labels):
        loss = self.criterion(outputs, labels.long())
        _, preds = torch.max(outputs, 1)
        tb_logs = {
            'train_loss': loss.cpu()
        }
        # for metric_name, metric in self.metrics.items():
        #     tb_logs['train_' + metric_name] = metric(preds, labels.data)
        for key, value in tb_logs.items():
            self.log(key, value)
        return {
            'loss': loss.cpu(),
        }

    def _validation_step_after_model(self, outputs, labels, raw_text):
        loss = self.criterion(outputs, labels.long())
        _, preds = torch.max(outputs, 1)
        logits = nn.functional.softmax(outputs, dim=1)
        tb_logs = {
            'val_loss': loss.cpu()
        }
        for metric_name, metric in self.metrics.items():
            tb_logs['val_' + metric_name] = metric(preds.cpu(), labels.data.cpu().int())
        for key, value in tb_logs.items():
            self.log(key, value)
        return {
            'loss': loss.cpu(),
            'logits': logits,
            'raw_text': raw_text,
            'pred_labels': preds,
            'true_labels': labels
        }

    def validation_epoch_end(self, outputs):
        # texts = outputs[0]['raw_text']
        # logits = outputs[0]['logits'].cpu().numpy()
        pred_labels = [output['pred_labels'].cpu().numpy() for output in outputs]
        pred_labels = [int(label) for batch in pred_labels for label in batch]
        true_labels = [output['true_labels'].cpu().numpy() for output in outputs]
        true_labels = [int(label) for batch in true_labels for label in batch]

        # text = f'Text: {texts[0]}\nPred: {logits[0]}'
        #
        # self.logger.experiment.add_text('text_predictions', text, self.current_epoch)

        conf_matr_figure = draw_confusion_matrix(pred_labels, true_labels, self.labels)
        self.logger.experiment.add_figure('confusion matrix', conf_matr_figure, self.current_epoch)

    def configure_optimizers(self):
        return _configure_optimizers(self.optimizer_cfg, self.scheduler_cfg, self.model)


class LSTMTextClassificationModel(BaseTextClassificationModel):
    def __init__(self, model, optimizer_cfg, scheduler_cfg, criterion, labels):
        super().__init__(model, optimizer_cfg, scheduler_cfg, criterion, labels)

        self.metrics.update({
            'acc': pl.metrics.Accuracy()
        })

    def training_step(self, batch, batch_idx):
        self.model.train()
        _, torch_input, text_lengths, labels = batch
        outputs = self.model(torch_input, text_lengths)
        return self._training_step_after_model(outputs, labels)

    def validation_step(self, batch, batch_idx):
        self.model.eval()
        raw_text, torch_input, text_lengths, labels = batch
        outputs = self.model(torch_input, text_lengths)
        return self._validation_step_after_model(outputs, labels, raw_text)

    def test_step(self, batch, batch_idx):
        return self.validation_step(batch, batch_idx)

    def test_epoch_end(self, outputs):
        true_labels = [int(one_lab.item()) for x in outputs for one_lab in x["true_labels"]]
        pred_labels = [int(one_lab.item()) for x in outputs for one_lab in x["pred_labels"]]
        print('\n', classification_report(true_labels, pred_labels, target_names=self.labels, digits=3))

        avg_loss = torch.stack([x["loss"] for x in outputs]).mean().item()
        self.log('val_loss', avg_loss)
        self.log('val_acc', accuracy_score(true_labels, pred_labels))


class BertTextClassificationModel(BaseTextClassificationModel):
    def __init__(self, model, optimizer_cfg, scheduler_cfg, criterion, labels):
        super().__init__(model, optimizer_cfg, scheduler_cfg, criterion, labels)

        self.metrics.update({
            'acc': pl.metrics.Accuracy()
        })

    def training_step(self, batch, batch_idx):
        self.model.train()
        _, input_ids, mask, token_type_ids, labels = batch
        outputs = self.model(input_ids, mask, token_type_ids)
        return self._training_step_after_model(outputs, labels)

    def validation_step(self, batch, batch_idx):
        self.model.eval()
        raw_text, input_ids, mask, token_type_ids, labels = batch
        outputs = self.model(input_ids, mask, token_type_ids)
        return self._validation_step_after_model(outputs, labels, raw_text)

    def test_step(self, batch, batch_idx):
        return self.validation_step(batch, batch_idx)

    def test_epoch_end(self, outputs):
        true_labels = [int(one_lab.item()) for x in outputs for one_lab in x["true_labels"]]
        pred_labels = [int(one_lab.item()) for x in outputs for one_lab in x["pred_labels"]]
        print('\n', classification_report(true_labels, pred_labels, target_names=self.labels, digits=3))

        avg_loss = torch.stack([x["loss"] for x in outputs]).mean().item()
        self.log('val_loss', avg_loss)
        self.log('val_acc', accuracy_score(true_labels, pred_labels))
