import json
import traceback
from typing import Any

from web3 import Web3
from web3.middleware import ExtraDataToPOAMiddleware

from src.models.responses import AncillaryDataUpdate
from src.settings import settings
from src.utils.logging_config import get_logger


def decode_hex_to_text(hex_str: str) -> str:
    """
    Decode a hex string to UTF-8 text.
    Handles hex strings with or without 0x prefix.
    Removes null bytes and trims whitespace.
    """
    try:
        # Remove 0x prefix if present
        clean_hex = hex_str[2:] if hex_str.startswith("0x") else hex_str

        # Convert hex pairs to bytes
        bytes_data = bytes.fromhex(clean_hex)

        # Decode as UTF-8
        text = bytes_data.decode("utf-8", errors="ignore")

        # Remove null bytes and trim
        return text.replace("\x00", "").strip()
    except Exception:
        # If decoding fails, return empty string
        return ""


logger = get_logger(__name__)

# UMA CTF Adapter contract address
UMA_CTF_ADAPTER_ADDRESS = "0x6A9D222616C90FcA5754cd1333cFD9b7fb6a4F74"

# Good free Polygon RPC endpoint
POLYGON_RPC_URL = "https://polygon-rpc.com"


class PolyClientOnchain:
    """
    Client for making on-chain calls to Polymarket contracts.
    """

    def __init__(self, rpc_url: str | None = None):
        """
        Initialize the on-chain client.

        Args:
            rpc_url: Optional Polygon RPC URL. Defaults to public endpoint.
        """
        self.rpc_url = rpc_url or getattr(settings, "polygon_rpc_url", POLYGON_RPC_URL)
        self.w3 = Web3(Web3.HTTPProvider(self.rpc_url))
        # Add PoA middleware for Polygon
        self.w3.middleware_onion.inject(ExtraDataToPOAMiddleware(), layer=0)

        # Load ABI
        self.abi = self._load_abi()

        # Create contract instance
        self.contract = self.w3.eth.contract(
            address=Web3.to_checksum_address(UMA_CTF_ADAPTER_ADDRESS), abi=self.abi
        )

    def _load_abi(self) -> list[dict[str, Any]]:
        """Load ABI from the TypeScript file."""
        try:
            import os

            # Get the absolute path to the ABI fiel
            current_dir = os.path.dirname(os.path.abspath(__file__))
            abi_file_path = os.path.join(current_dir, "abi", "UmaCtfAdapter.abi.json")

            with open(abi_file_path) as f:
                content = f.read()
                # The file is a TypeScript file but contains a JSON array
                # Parse it directly as JSON
                abi = json.loads(content)
                return abi
        except Exception as exc:
            logger.error(f"Failed to load ABI: {exc}")
            logger.error(traceback.format_exc())
            raise

    def get_rules_updates(self, question_id: str, owner: str) -> list[AncillaryDataUpdate]:
        """
        Get all updates for a questionID and owner from the UMA CTF Adapter contract.

        Args:
            question_id: The question ID as a hex string (0x...)
            owner: The owner address (0x...)

        Returns:
            List of AncillaryDataUpdate objects

        Raises:
            Exception: If the on-chain call fails
        """
        try:
            # Convert question_id to bytes32 hex string
            if not question_id.startswith("0x"):
                question_id = "0x" + question_id

            # Ensure question_id is exactly 32 bytes (64 hex chars)
            question_id_clean = question_id[2:] if question_id.startswith("0x") else question_id
            question_id_clean = question_id_clean.zfill(64)
            question_id_hex = "0x" + question_id_clean

            # Ensure addresses are checksummed
            owner = Web3.to_checksum_address(owner)

            # Call the contract - web3.py accepts hex strings for bytes32
            updates = self.contract.functions.getUpdates(
                Web3.to_bytes(hexstr=question_id_hex), owner
            ).call()

            # Parse the results
            result: list[AncillaryDataUpdate] = []
            for update in updates:
                timestamp = update[0]
                update_bytes = update[1]

                # Convert bytes to hex string (with 0x prefix) for decoding
                if isinstance(update_bytes, bytes):
                    update_hex = "0x" + update_bytes.hex()
                elif isinstance(update_bytes, str):
                    # Already a string, ensure it has 0x prefix
                    update_hex = (
                        update_bytes if update_bytes.startswith("0x") else "0x" + update_bytes
                    )
                else:
                    # Fallback: convert to hex
                    update_hex = "0x" + bytes(update_bytes).hex()

                # Decode hex to text
                decoded_text = decode_hex_to_text(update_hex)

                result.append(
                    AncillaryDataUpdate(
                        timestamp=timestamp,
                        text=decoded_text,
                    )
                )

            return result
        except Exception as exc:
            logger.error(f"get_updates: error calling contract: {exc}")
            logger.error(traceback.format_exc())
            raise
