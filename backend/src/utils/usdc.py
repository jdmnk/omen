from decimal import Decimal, InvalidOperation

USDC_DECIMALS = 6
USDC_DECIMALS_MULT = 10**USDC_DECIMALS


def from_usdc(value: str) -> float:
    """Convert scaled integer (string) to decimal."""
    try:
        return int(value) / USDC_DECIMALS_MULT
    except (ValueError, TypeError):
        raise ValueError(f"Invalid value for conversion: {value}") from None


def to_usdc(value: float) -> str:
    """Convert decimal to scaled integer string (for GraphQL)."""
    try:
        scaled = int(value * USDC_DECIMALS_MULT)
        return str(scaled)  # Return as string for GraphQL
    except (ValueError, TypeError):
        raise ValueError(f"Invalid value for conversion: {value}") from None


def from_usdc_decimal(value: object) -> Decimal:
    """Convert scaled integer (from API) to Decimal. Returns Decimal(0) if value is None or invalid."""
    try:
        if value is None:
            return Decimal(0)
        return Decimal(str(value)) / Decimal(USDC_DECIMALS_MULT)
    except (InvalidOperation, TypeError, ValueError):
        return Decimal(0)
