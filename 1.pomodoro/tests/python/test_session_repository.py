from pomodoro_app.repositories.session_repository import InMemorySessionRepository


def test_in_memory_repository_starts_empty():
    repository = InMemorySessionRepository()

    assert repository.list_sessions() == []