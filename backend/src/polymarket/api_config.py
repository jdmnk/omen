"""Polymarket public API hosts and local API exceptions."""

CLOB_API_HOST = "https://clob.polymarket.com"
DATA_API_HOST = "https://data-api.polymarket.com"
GAMMA_API_HOST = "https://gamma-api.polymarket.com"
USER_PNL_API_HOST = "https://user-pnl-api.polymarket.com"

GOLDSKY_API_HOST = "https://api.goldsky.com/api/public/project_cl6mb8i9h0003e201j6li0diw"
GOLDSKY_API_PNL_SUBGRAPH = "/subgraphs/pnl-subgraph/0.0.14/gn"
GOLDSKY_API_WALLET_SUBGRAPH = "/subgraphs/wallet-subgraph/0.0.4/gn"


class PolymarketApiError(RuntimeError):
    """Raised when a Polymarket public API request fails."""

