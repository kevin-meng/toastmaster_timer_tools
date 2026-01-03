import random

# In-memory store for verification codes (Production should use Redis)
verification_codes = {}


class SMSService:
    @staticmethod
    def send_verification_code(phone: str) -> str:
        """
        Mock sending SMS. In production, integrate with Aliyun/Tencent SMS.
        """
        code = str(random.randint(100000, 999999))
        verification_codes[phone] = code
        print(f"============================================")
        print(f"SENDING SMS TO {phone}: {code}")
        print(f"============================================")
        return code

    @staticmethod
    def verify_code(phone: str, code: str) -> bool:
        """
        Verify the code.
        """
        if phone in verification_codes and verification_codes[phone] == code:
            del verification_codes[phone]
            return True
        return False
