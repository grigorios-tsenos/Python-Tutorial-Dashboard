import type { CommandCard } from '../index'

export const PYDANTIC_CARDS: CommandCard[] = [
  {
    keys: ['pydantic.BaseModel'],
    name: 'BaseModel',
    kind: 'class',
    signature: 'BaseModel(**data)',
    summary: 'Base class for pydantic data models: subclass it and declare each field as an annotated class attribute. Creating an instance validates the data against those annotations, converting compatible values in the default lax mode (a numeric string for an int field, say) and raising ValidationError when anything does not fit.',
    params: [
      { name: 'data', text: 'Field values as keyword arguments. A missing required field fails validation; unknown names are ignored by default, which the class\'s `model_config` setting can change.' },
    ],
    returns: 'A model instance whose fields are attributes holding the validated values. Subclasses also gain class methods such as `model_validate` (from a dict) and `model_validate_json` (from a JSON string), and instances gain `model_dump`.',
  },
  {
    keys: ['pydantic.Field'],
    name: 'Field',
    kind: 'function',
    signature: 'Field(default=PydanticUndefined, *, gt=None, ge=None, lt=None, le=None, strict=None, ...)',
    summary: 'Adds a default and validation constraints to one field of a pydantic model. It is assigned as the field\'s value in the class body, after the type annotation.',
    params: [
      { name: 'default', text: 'The field\'s default value. Leaving it out (PydanticUndefined) keeps the field required; the separate `default_factory` parameter computes a default by calling a function instead.' },
      { name: 'gt', text: 'The value must be strictly greater than this. None (default) means no such bound.' },
      { name: 'ge', text: 'The value must be greater than or equal to this. None (default) means no such bound.' },
      { name: 'lt', text: 'The value must be strictly less than this. None (default) means no such bound.' },
      { name: 'le', text: 'The value must be less than or equal to this. None (default) means no such bound.' },
      { name: 'strict', text: 'If True, no type conversion for this field: the input must already have the right type, so numeric strings and booleans are rejected for a number field. None (default) follows the model\'s setting, which is lax unless configured otherwise.' },
    ],
    returns: 'A `FieldInfo` object that pydantic reads when it builds the model.',
  },
  {
    keys: ['pydantic.ValidationError'],
    name: 'ValidationError',
    kind: 'exception',
    signature: 'ValidationError.from_exception_data(title, line_errors, ...)',
    summary: 'The exception pydantic raises when data does not fit a model; it reports every failing field at once, not just the first. It subclasses ValueError, and is normally caught rather than created by hand (it has no ordinary constructor).',
    params: [
      { name: 'title', text: 'Name shown in the error header, usually the model\'s class name.' },
      { name: 'line_errors', text: 'A list of error-detail dicts, one per failure, each with an error `type`, the offending `input` and optionally a `loc`.' },
    ],
    returns: 'A ValidationError: its `errors` method returns one dict per failure (with `type`, `loc`, `msg` and `input`), `error_count` says how many, and printing it shows a readable report.',
  },
]
