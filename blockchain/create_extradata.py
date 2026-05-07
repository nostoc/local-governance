import sys

# --- CONFIGURATION ---
# PASTE YOUR 3 ADDRESSES HERE (Remove the '0x')
validator_1 = "0x7E687086d737d5A06d13926505b7Fd5281aEdc23"
validator_2 = "0x151e6113e425990Ea0fBe47f1EeE01Ada1a3798c"
validator_3 = "0xAD0A0ed0e54954cF8CCe1e04991dAA6219e12105"
# ---------------------

def create_clique_extradata(validators):
    # 1. 32 bytes of vanity (zeros)
    prefix = "0" * 64
    
    # 2. Concatenate validator addresses
    # Ensure they are stripped of '0x' and lowercase
    validators_hex = "".join([v.replace("0x", "").lower() for v in validators])
    
    # 3. 65 bytes of signature suffix (zeros)
    suffix = "0" * 130
    
    return "0x" + prefix + validators_hex + suffix

validators = [validator_1, validator_2, validator_3]
print("\nYOUR EXTRA_DATA STRING:")
print(create_clique_extradata(validators))
print("\n")