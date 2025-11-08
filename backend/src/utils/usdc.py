USDC_DECIMALS = 6
USDC_DECIMALS_MULT = 10**USDC_DECIMALS


def from_usdc_float(usdc_units: int | str | None) -> float:
    """
    Convert USDC from on-chain units (6 decimals) to a float value.

    Args:
        usdc_units: Value in USDC's smallest unit (1 USDC = 1,000,000 units)

    Returns:
        Float representation of the USDC value

    Examples:
        1_000_000 -> 1.0
        100_000_000 -> 100.0
        0 -> 0.0
    """
    if usdc_units is None:
        return 0.0
    try:
        return float(usdc_units) / USDC_DECIMALS_MULT
    except (ValueError, TypeError):
        return 0.0


def to_usdc(value: float) -> str:
    """Convert decimal to scaled integer string (for GraphQL)."""
    try:
        scaled = int(value * USDC_DECIMALS_MULT)
        return str(scaled)  # Return as string for GraphQL
    except (ValueError, TypeError):
        raise ValueError(f"Invalid value for conversion: {value}") from None
