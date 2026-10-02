class MemorySaver:
    def __init__(self):
        self.storage = {}

    def __repr__(self):
        return f"MemorySaver(threads={list(self.storage)})"


InMemorySaver = MemorySaver
