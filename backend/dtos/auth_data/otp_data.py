from marshmallow import Schema, fields

# Additional Schemas
class VerifyOtpSchema(Schema):
    """Schema for completing login with OTP verification and domain/role selection"""
    email = fields.Email(required=True)
    otp = fields.String(required=False, allow_none=True)  # Required only if 2FA enabled
    domain_id = fields.Integer(required=True)
    active_role = fields.String(required=True)