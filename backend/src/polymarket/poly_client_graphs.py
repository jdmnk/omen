import httpx

from src.models.position import PositionSchema, parse_position_from_api
from src.models.wallet import WalletSchema, parse_wallet_from_api
from src.utils.logging_config import get_logger
from src.utils.usdc import to_usdc

logger = get_logger(__name__)

GOLDSKY_API_HOST = "https://api.goldsky.com/api/public/project_cl6mb8i9h0003e201j6li0diw"
GOLDSKY_API_PNL_SUBGRAPH = "/subgraphs/pnl-subgraph/0.0.14/gn"
GOLDSKY_API_WALLET_SUBGRAPH = "/subgraphs/wallet-subgraph/0.0.4/gn"


class PolyClientGraphs:
    """
    General rate limit on Goldsky: 50req / 10s
    """

    async def get_market_positions(
        self, token_ids: list[str], min_amount: int = 0
    ) -> list[PositionSchema]:
        """
        Goldsky GraphQL api.

        Token IDs are the CLob token IDs (YES and NO).

        Sorted by amount desc.
        """

        query = """
        query GetMarketHolders($first: Int!, $skip: Int!, $tokenIds: [BigInt!]!, $minAmount: BigInt!) {
            userPositions(
                first: $first
                skip: $skip
                orderBy: amount
                orderDirection: desc
                where: {
                    tokenId_in: $tokenIds
                    amount_gt: $minAmount
                }
            ) {
                id
                realizedPnl
                user
                tokenId
                amount
                avgPrice
                totalBought
            }
        }
        """

        variables = {
            "first": 1000,
            "skip": 0,
            "tokenIds": token_ids,
            "minAmount": to_usdc(min_amount),  # for the smart contract
        }

        payload = {"query": query, "variables": variables, "operationName": "GetMarketHolders"}

        async with httpx.AsyncClient() as client:
            response = await client.post(GOLDSKY_API_HOST + GOLDSKY_API_PNL_SUBGRAPH, json=payload)
            data = response.json()
            user_positions = data.get("data", {}).get("userPositions", [])
            parsed_positions: list[PositionSchema] = [
                parse_position_from_api(position) for position in user_positions
            ]

            # sort by total amount desc (amount * avg price)
            parsed_positions.sort(key=lambda x: x.amount * x.avgPrice, reverse=True)

            return parsed_positions

    async def get_wallets_info(self, wallet_ids: list[str]) -> list[WalletSchema]:
        """
        Goldsky GraphQL api for wallet information.

        Returns wallet details including id, signer, type, balance, lastTransfer, and createdAt.
        """
        query = """
        query GetWalletsInfo($walletIds: [ID!]!) {
            wallets(
                where: {
                    id_in: $walletIds
                }
            ) {
                id
                signer
                type
                balance
                lastTransfer
                createdAt
            }
        }
        """

        variables = {
            "walletIds": wallet_ids,
        }

        payload = {"query": query, "variables": variables, "operationName": "GetWalletsInfo"}

        async with httpx.AsyncClient() as client:
            response = await client.post(
                GOLDSKY_API_HOST + GOLDSKY_API_WALLET_SUBGRAPH, json=payload
            )
            data = response.json()
            wallets = data.get("data", {}).get("wallets", [])
            parsed_wallets: list[WalletSchema] = [
                w for w in [parse_wallet_from_api(wallet) for wallet in wallets] if w is not None
            ]

            return parsed_wallets
