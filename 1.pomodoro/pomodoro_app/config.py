class DefaultConfig:
    SECRET_KEY = "dev"
    TESTING = False


class TestingConfig(DefaultConfig):
    TESTING = True