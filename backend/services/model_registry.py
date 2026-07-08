from typing import Any, Callable

_registry: dict[str, Callable[[], Any]] = {}


def register_model(name: str, builder: Callable[[], Any]) -> None:
    _registry[name] = builder


def build_model(name: str) -> Any:
    builder = _registry.get(name)
    if builder is None:
        raise ValueError(
            f"Modelo no soportado: {name}. Modelos disponibles: {list_models()}"
        )
    return builder()


def list_models() -> list[str]:
    return list(_registry.keys())
