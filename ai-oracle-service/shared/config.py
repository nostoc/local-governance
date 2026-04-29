import os
from pathlib import Path

try:
    from dotenv import load_dotenv
except ImportError:  # pragma: no cover - optional dependency
    load_dotenv = None


BASE_DIR = Path(__file__).resolve().parent
ROOT_DIR = BASE_DIR.parent


def load_local_env(env_path: Path) -> None:
    if not env_path.exists():
        return

    for raw_line in env_path.read_text().splitlines():
        line = raw_line.strip()

        if not line or line.startswith("#") or "=" not in line:
            continue

        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip())


ENV_PATH = ROOT_DIR / ".env"

if load_dotenv is not None:
    load_dotenv(ENV_PATH)
else:
    load_local_env(ENV_PATH)


def get_env(name: str, *, default: str | None = None, required: bool = False) -> str:
    value = os.getenv(name, default)

    if required and not value:
        raise RuntimeError(
            f"Missing required environment variable: {name}. "
            f"Add it to ai-oracle-service/.env or export it before starting the service."
        )

    return value


RPC_URL = get_env("ORACLE_RPC_URL", default="http://127.0.0.1:8545")
ORACLE_WS_URL = get_env("ORACLE_WS_URL", default="")
ORACLE_CONTRACT_ADDRESS = get_env("ORACLE_CONTRACT_ADDRESS", required=True)
ABI_PATH = Path(
    get_env(
        "ORACLE_ABI_PATH",
        default=str(
            (ROOT_DIR / "../smart-contracts/artifacts/contracts/Reporting.sol/Reporting.json").resolve()
        ),
    )
)

DEFAULT_PRIVATE_KEY = get_env("ORACLE_PRIVATE_KEY")
GOV_PRIVATE_KEY = get_env("ORACLE_GOV_PRIVATE_KEY")
NGO_PRIVATE_KEY = get_env("ORACLE_NGO_PRIVATE_KEY")
INTL_PRIVATE_KEY = get_env("ORACLE_INTL_PRIVATE_KEY")

IPFS_API_URL = get_env("IPFS_API_URL", default="/ip4/127.0.0.1/tcp/5001")
IPFS_GATEWAY = get_env("IPFS_GATEWAY", default="https://ipfs.io/ipfs")

CONTRACT_ADDRESS = ORACLE_CONTRACT_ADDRESS
