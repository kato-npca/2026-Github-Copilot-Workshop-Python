class InMemorySessionRepository:
    def __init__(self):
        self._sessions = []

    def list_sessions(self):
        return list(self._sessions)