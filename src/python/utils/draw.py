import matplotlib.pyplot as plt


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


def draw_confusion_matrix():
    pass
