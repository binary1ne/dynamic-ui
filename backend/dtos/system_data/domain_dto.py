from marshmallow import Schema, fields

class DomainSchema(Schema):
    """Domain response schema"""
    domain_id = fields.Int(dump_only=True)
    domain_name = fields.Str(required=True)
    description = fields.Str()
    active_flag = fields.Bool()
    created_at = fields.Str(dump_only=True)

class CreateDomainSchema(Schema):
    """Create domain schema"""
    domain_name = fields.Str(required=True)
    description = fields.Str()

class UpdateDomainSchema(Schema):
    """Update domain schema"""
    domain_name = fields.Str()
    description = fields.Str()
    active_flag = fields.Bool()
