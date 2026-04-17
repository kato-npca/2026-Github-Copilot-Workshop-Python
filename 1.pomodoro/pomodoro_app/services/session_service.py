class SessionService:
    def __init__(self, repository):
        self.repository = repository

    def list_sessions(self):
        return self.repository.list_sessions()