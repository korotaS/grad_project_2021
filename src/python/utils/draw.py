import matplotlib.pyplot as plt
import numpy as np
import seaborn as sns
from sklearn.metrics import confusion_matrix


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
    # sns.set(font_scale=1.6)
    sns.heatmap(cf, annot=box_labels, fmt="", cmap=cmap, cbar=cbar, xticklabels=categories,
                yticklabels=categories)
    # sns.set(font_scale=1)
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
