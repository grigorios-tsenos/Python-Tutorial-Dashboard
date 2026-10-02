from langchain_core.messages import convert_to_messages


def add_messages(left, right):
    left = convert_to_messages(left or [])
    right = convert_to_messages(right if isinstance(right, (list, tuple)) and not (len(right) == 2 and isinstance(right[0], str) and isinstance(right[1], str)) else [right])
    return left + right
