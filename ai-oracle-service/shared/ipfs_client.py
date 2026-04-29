import requests
from typing import Optional

try:
    import ipfshttpclient
except Exception:  # ipfshttpclient is optional; we'll fall back to HTTP gateway
    ipfshttpclient = None

from shared.config import IPFS_API_URL, IPFS_GATEWAY


def fetch_text_from_cid(cid: str, timeout: int = 10) -> Optional[str]:
    if not cid:
        return None

    if ipfshttpclient is not None:
        try:
            client = ipfshttpclient.connect(IPFS_API_URL)
            data = client.cat(cid)
            if isinstance(data, bytes):
                return data.decode("utf-8", errors="replace")
            return str(data)
        except Exception:
            pass

    try:
        url = IPFS_GATEWAY.rstrip("/") + "/" + cid
        resp = requests.get(url, timeout=timeout)
        if resp.status_code == 200:
            return resp.text
    except Exception:
        return None

    return None
