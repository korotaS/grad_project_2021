import logging
import sys


class SocketStdOut(object):
    def __init__(self, skt):
        self.skt = skt

    def write(self, string):
        if '\\x1b' not in repr(string):
            self.skt.emit('log', string.rstrip('\n'))

    def flush(self):
        pass


class RedirectStdStreams(object):
    def __init__(self, skt):
        if skt is None:
            custom_stdout = sys.stdout
            custom_stderr = sys.stderr
        else:
            custom_stdout = SocketStdOut(skt)
            custom_stderr = custom_stdout
        logger = logging.getLogger("lightning")
        logger.setLevel(logging.INFO)
        handler = logging.StreamHandler(custom_stdout)
        handler.setLevel(logging.INFO)
        logger.addHandler(handler)

        self._stdout = custom_stdout
        self._stderr = custom_stderr

    def __enter__(self):
        self.old_stdout, self.old_stderr = sys.stdout, sys.stderr
        self.old_stdout.flush()
        self.old_stderr.flush()
        sys.stdout, sys.stderr = self._stdout, self._stderr

    def __exit__(self, exc_type, exc_value, traceback):
        # self._stdout.flush()
        # self._stderr.flush()
        sys.stdout = self.old_stdout
        sys.stderr = self.old_stderr
