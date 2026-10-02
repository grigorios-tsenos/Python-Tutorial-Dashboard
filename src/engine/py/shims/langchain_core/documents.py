class Document:
    def __init__(self, page_content, metadata=None):
        self.page_content = page_content
        self.metadata = metadata or {}

    def __repr__(self):
        return f"Document(metadata={self.metadata!r}, page_content={self.page_content!r})"
