from pomodoro_app import create_app
from pomodoro_app.config import TestingConfig


def test_index_route_returns_success():
    app = create_app(TestingConfig)
    client = app.test_client()

    response = client.get("/")

    assert response.status_code == 200
    assert b"Pomodoro Timer" in response.data