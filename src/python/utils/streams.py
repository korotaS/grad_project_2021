import logging
import sys


class SocketStdOut(object):
    def __init__(self, skt):
        self.skt = skt
        self.last_log = None

    def write(self, string):
        if '\\x1b' not in repr(string):
            stripped = string.rstrip('\n')
            if string != '\n':
                if stripped != self.last_log:
                    self.skt.emit('log', stripped)
                    self.last_log = stripped
            else:
                self.skt.emit('log', stripped)

    def flush(self):
        pass


class RedirectStdStreams(object):
    def __init__(self, skt):
        if skt is None:
            custom_stdout = sys.stdout
            custom_stderr = sys.stderr
        else:
            custom_stdout = SocketStdOut(skt)
            custom_stderr = SocketStdOut(skt)
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
