import cv2
import matplotlib.pyplot as plt
import numpy as np
import seaborn as sns
from sklearn.metrics import confusion_matrix


# IMAGE CLASSIFICATION

def draw_im_clf_predictions(images, logits, labels, columns: int = 4, rows: int = 4, fontsize: int = 6):
    fig = plt.figure(figsize=(int(columns * 2), int(rows * 3)))
    for i, (logits_im, image) in enumerate(zip(logits, images)):
        if i + 1 > rows * columns:
            break
        ax = fig.add_subplot(rows, columns, i + 1)
        res = sorted(zip(labels, logits_im), key=lambda x: -x[1])
        title = ''
        for label, proba in res[:3]:
            title += f'{label}: {proba:.3f}\n'
        title = title.strip()
        plt.title(title, fontsize=fontsize)
        plt.imshow(image)
    return fig


def draw_text_clf_predictions(texts, logits, labels, columns: int = 1, rows: int = 4, fontsize: int = 6):
    fig = plt.figure(figsize=(int(columns * 2), int(rows * 3)))
    for i, (logits_im, text) in enumerate(zip(logits, texts)):
        if i + 1 > rows * columns:
            break
        ax = fig.add_subplot(rows, columns, i + 1)
        res = sorted(zip(labels, logits_im), key=lambda x: -x[1])
        title = ''
        for label, proba in res[:3]:
            title += f'{label}: {proba:.3f}\n'
        title = title.strip()
        plt.title(title, fontsize=fontsize)
        plt.text(0, 0, text, ha='left', wrap=True)
    return fig


def draw_confusion_matrix(pred_labels, true_labels, label_names):
    conf_matr = confusion_matrix(true_labels, pred_labels)
    fig_conf_matr = make_confusion_matrix(conf_matr, categories=label_names, cbar=False,
                                          figsize=(6, 6), sum_stats=True)
    return fig_conf_matr


def make_confusion_matrix(cf,
                          group_names=None,
                          categories='auto',
                          count=True,
                          percent=True,
                          cbar=True,
                          xyticks=True,
                          xyplotlabels=True,
                          sum_stats=True,
                          figsize=None,
                          cmap='Blues',
                          title=None):
    """
    credits to https://github.com/DTrimarchi10/confusion_matrix
    """
    blanks = ['' for i in range(cf.size)]

    if group_names and len(group_names) == cf.size:
        group_labels = ["{}\n".format(value) for value in group_names]
    else:
        group_labels = blanks

    if count:
        group_counts = ["{0:0.0f}\n".format(value) for value in cf.flatten()]
    else:
        group_counts = blanks

    if percent:
        group_percentages = ["{0:.2%}".format(value) for value in cf.flatten() / np.sum(cf)]
    else:
        group_percentages = blanks

    box_labels = [f"{v1}{v2}{v3}".strip() for v1, v2, v3 in zip(group_labels, group_counts, group_percentages)]
    box_labels = np.asarray(box_labels).reshape(cf.shape[0], cf.shape[1])

    # CODE TO GENERATE SUMMARY STATISTICS & TEXT FOR SUMMARY STATS
    if sum_stats:
        # Accuracy is sum of diagonal divided by total observations
        accuracy = np.trace(cf) / float(np.sum(cf))

        # if it is a binary confusion matrix, show some more stats
        if len(cf) == 2:
            # Metrics for Binary Confusion Matrices
            precision = cf[1, 1] / sum(cf[:, 1])
            recall = cf[1, 1] / sum(cf[1, :])
            f1_score = 2 * precision * recall / (precision + recall)
            stats_text = "\n\nAccuracy={:0.3f}\nPrecision={:0.3f}\nRecall={:0.3f}\nF1 Score={:0.3f}".format(
                accuracy, precision, recall, f1_score)
        else:
            stats_text = "\n\nAccuracy={:0.3f}".format(accuracy)
    else:
        stats_text = ""

    # SET FIGURE PARAMETERS ACCORDING TO OTHER ARGUMENTS
    if figsize == None:
        # Get default figure size if not set
        figsize = plt.rcParams.get('figure.figsize')

    if xyticks == False:
        # Do not show categories if xyticks is False
        categories = False

    # MAKE THE HEATMAP VISUALIZATION
    fig = plt.figure(figsize=figsize)
    sns.heatmap(cf, annot=box_labels, fmt="", cmap=cmap, cbar=cbar, xticklabels=categories,
                yticklabels=categories)
    fontsize = 10
    if xyplotlabels:
        plt.ylabel('True label', fontsize=fontsize)
        plt.xlabel('Predicted label' + stats_text, fontsize=fontsize)
    else:
        plt.xlabel(stats_text, fontsize=fontsize)

    if title:
        plt.title(title)
    plt.subplots_adjust(bottom=0.25)
    return fig


# IMAGE SEGMENTATION


COLORS = [(75, 0, 130), (218, 112, 214), (255, 215, 0), (154, 205, 50), (255, 127, 80),
          (70, 130, 180), (210, 180, 140), (135, 206, 235), (34, 139, 87), (255, 165, 0)]


def draw_iterative(mask_pr, mask_gt=None, colors=None, draw_compare=False, num=10):
    mask_left = colorize_3ch_mask(mask=mask_pr[0], color=colors[0])
    for j in range(1, len(mask_pr)):
        mask_left = cv2.bitwise_or(mask_left, colorize_3ch_mask(mask=mask_pr[j],
                                                                color=colors[j % num]))
    if draw_compare:
        mask_right = colorize_mask_gt(mask_binary=mask_gt, colors=colors)

        mask_result = cv2.hconcat([mask_left, mask_right])
    else:
        mask_result = mask_left

    return mask_result


def draw_masks(mask_pr, mask_gt=None, colors=None, draw_compare=False, seg_type='single', num=10):
    if seg_type == 'single':
        if draw_compare:
            # print(mask_pr.shape, mask_gt.shape)
            mask_left = colorize_3ch_mask(mask=mask_pr, color=colors[0])
            mask_right = colorize_mask_gt(mask_binary=mask_gt, colors=colors)
            mask_result = cv2.hconcat([mask_left, mask_right])
        else:
            mask_result = colorize_3ch_mask(mask=mask_pr, color=colors[0])
    elif seg_type == 'multi':
        if draw_compare:
            mask_result = draw_iterative(mask_pr=mask_pr, mask_gt=mask_gt, colors=colors,
                                         draw_compare=draw_compare, num=num)
        else:
            mask_result = draw_iterative(mask_pr=mask_pr, colors=colors,
                                         draw_compare=draw_compare, num=num)

    return mask_result


def draw_prediction_masks(masks_pr, rows, columns,
                          figsize=(15, 15), seg_type='single', colors_custom=None):
    fig = plt.figure(figsize=figsize)
    if colors_custom:
        colors = colors_custom
    else:
        colors = COLORS
    for i, mask_pr in enumerate(masks_pr):
        ax = fig.add_subplot(rows, columns, i + 1)
        ax.grid(False)
        mask_result = draw_masks(mask_pr=mask_pr, colors=colors, draw_compare=False, seg_type=seg_type,
                                 num=len(colors))
        plt.imshow(mask_result)

    return fig


def draw_prediction_masks_on_image(images, masks_pr, masks_gt, jaccard_metrics, rows, columns,
                                   figsize=(20, 20), seg_type='single', colors_custom=None):
    fig = plt.figure(figsize=figsize)
    if colors_custom:
        colors = colors_custom
    else:
        colors = COLORS
    for i, (image, mask_pr, mask_gt, jaccard_metric) in enumerate(zip(images, masks_pr, masks_gt, jaccard_metrics)):
        ax = fig.add_subplot(rows, columns, i + 1)
        ax.grid(False)
        image = image.detach().cpu().numpy().copy()

        mask_left = draw_masks(mask_pr=mask_pr, colors=colors, draw_compare=False,
                               seg_type=seg_type, num=len(colors))
        mask_left = overlay_mask_on_image(mask=mask_left, image=image, alpha=0.6)
        mask_right = draw_masks(mask_pr=mask_gt, colors=colors, draw_compare=False,
                                seg_type=seg_type, num=len(colors))
        mask_right = overlay_mask_on_image(mask=mask_right, image=image, alpha=0.8)

        mask_result = cv2.hconcat([mask_left, mask_right])
        plt.imshow(mask_result)
        ax.set_xlabel(f'mIoU: {jaccard_metric}')

    return fig


def draw_comparison_prediction_and_gt_masks(masks_pr, masks_gt, jaccard_metrics, rows, columns,
                                            figsize=(20, 20), seg_type='single', colors_custom=None):
    fig = plt.figure(figsize=figsize)
    if colors_custom:
        colors = colors_custom
    else:
        colors = COLORS
    for i, (mask_pr, mask_gt, jaccard_metric) in enumerate(zip(masks_pr, masks_gt, jaccard_metrics)):
        ax = fig.add_subplot(rows, columns, i + 1)
        ax.grid(False)
        mask_result = draw_masks(mask_pr=mask_pr, mask_gt=mask_gt, colors=colors, draw_compare=True,
                                 seg_type=seg_type, num=len(colors))
        plt.imshow(mask_result)
        ax.set_xlabel(f'mIoU: {jaccard_metric}')

    return fig


def overlay_mask_on_image(mask, image, alpha=0.5):
    return cv2.addWeighted(mask, alpha, image, 1 - alpha, 0)


def filtrate_mask(mask, filtrate=True):
    mask = mask.squeeze().detach().cpu().numpy()
    if filtrate:
        mask = np.where(mask > 0.5, 1, 0)
    mask = mask.astype(np.uint8)

    return mask


def colorize_3ch_mask(mask, color):
    mask_new = filtrate_mask(mask, filtrate=True)
    mask_new = cv2.merge((mask_new * color[0], mask_new * color[1], mask_new * color[2]))

    return mask_new


def colorize_mask_gt(mask_binary, colors):
    mask_binary = mask_binary.detach().cpu().numpy()
    c, y, x = mask_binary.shape

    mask_new = np.zeros((3, y, x)).astype(np.uint8)

    for i in range(c):
        coords = np.argwhere(mask_binary[i] == 1)
        color = colors[i % c]

        for coord in coords:
            mask_new[2][coord[0]][coord[1]] = color[0]
            mask_new[1][coord[0]][coord[1]] = color[1]
            mask_new[0][coord[0]][coord[1]] = color[2]

    mask_new = mask_new.transpose((1, 2, 0))

    return mask_new
