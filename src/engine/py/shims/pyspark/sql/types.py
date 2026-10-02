class DataType:
    name = "string"
    pandas = "object"

    def __repr__(self):
        return f"{type(self).__name__}()"

    def simpleString(self):
        return self.name


class StringType(DataType):
    name = "string"


class IntegerType(DataType):
    name, pandas = "int", "Int64"


class LongType(DataType):
    name, pandas = "bigint", "Int64"


class DoubleType(DataType):
    name, pandas = "double", "float64"


class FloatType(DoubleType):
    name = "float"


class BooleanType(DataType):
    name, pandas = "boolean", "boolean"


class StructField:
    def __init__(self, name, dataType, nullable=True):
        self.name, self.dataType, self.nullable = name, dataType, nullable


class StructType:
    def __init__(self, fields=None):
        self.fields = list(fields or [])

    def add(self, name, dataType, nullable=True):
        self.fields.append(StructField(name, dataType, nullable))
        return self

    @property
    def names(self):
        return [f.name for f in self.fields]


_DDL = {"string": StringType, "int": IntegerType, "integer": IntegerType, "long": LongType, "bigint": LongType,
        "double": DoubleType, "float": FloatType, "boolean": BooleanType}


def parse_ddl(ddl):
    out = []
    for part in ddl.split(","):
        name, _, typ = part.strip().partition(" ")
        out.append(StructField(name.strip(), _DDL[typ.strip().lower()]()))
    return StructType(out)
