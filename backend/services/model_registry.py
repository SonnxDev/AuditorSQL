"""
Registry pattern para la gestión de modelos LLM.

Permite registrar, construir y listar modelos de forma desacoplada,
de modo que agregar un nuevo modelo no requiera modificar el servicio RAG
ni las rutas HTTP.
"""

from typing import Any, Callable

_registry: dict[str, Callable[[], Any]] = {}


def register_model(name: str, builder: Callable[[], Any]) -> None:
    """Registra una fábrica de modelo bajo un nombre identificador."""
    _registry[name] = builder


def build_model(name: str) -> Any:
    """Construye y retorna una instancia del modelo registrado.

    Lanza ValueError si el nombre no está registrado.
    """
    builder = _registry.get(name)
    if builder is None:
        raise ValueError(
            f"Modelo no soportado: {name}. Modelos disponibles: {list_models()}"
        )
    return builder()


def list_models() -> list[str]:
    """Retorna la lista de nombres de modelos registrados."""
    return list(_registry.keys())