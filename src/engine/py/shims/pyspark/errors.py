class PySparkException(Exception):
    pass


class AnalysisException(PySparkException):
    pass


class PySparkTypeError(PySparkException, TypeError):
    pass
