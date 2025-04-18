from __future__ import unicode_literals
import frappe
import json
from frappe import _
from frappe.utils import flt


DEFAULT_ITEM_GROUP = 'Products'
DEFAULT_UOM = 'Nos'
DEFAULT_RATE = 0.0

@frappe.whitelist()
def get_item_details():
    """Get complete item details with safe field handling"""
    try:
        item_code = frappe.form_dict.get('item_code')
        fields = frappe.form_dict.get('fields')
        
        if not item_code:
            frappe.throw(_("Item Code is required"))
            
        if not frappe.db.exists("Item", item_code):
            frappe.throw(_("Item {0} does not exist").format(item_code))
            
        if not fields:
            fields = ['item_name', 'standard_rate', 'attributes', 
                     'variant_of', 'has_variants', 'stock_uom',
                     'item_group', 'custom_add_price']
        
        return frappe.get_doc("Item", item_code).as_dict(fields)
    except Exception as e:
        frappe.log_error(title="Item Details Error", message=str(e))
        raise


@frappe.whitelist()
def get_item_attribute_values():
    try:
        attribute = frappe.form_dict.get('attribute')
        
        if not attribute:
            frappe.throw("Attribute not specified")
            
        if not frappe.db.exists("Item Attribute", attribute):
            frappe.throw(f"The {attribute} attribute was not found")
            
        attribute_doc = frappe.get_doc("Item Attribute", attribute)
        return {
            'attribute': attribute,
            'values': [{
                'attribute_value': v.attribute_value,  # ���� 'value'
                'abbr': v.abbr,
                'custom_add_price': v.custom_add_price  # ���� 'add_price'
            } for v in attribute_doc.item_attribute_values]
        }
    except Exception as e:
        frappe.log_error("Error of receiving attribute values", str(e))
        raise


@frappe.whitelist()
def search_templates(search_text=None):
    """Search item templates with improved filters"""
    try:
        base_filters = [
            ['has_variants', '=', 1],
            ['disabled', '=', 0]
        ]
        
        or_filters = {}
        if search_text:
            or_filters = {
                'name': ['like', f'%{search_text}%'],
                'item_name': ['like', f'%{search_text}%']
            }
        
        return frappe.get_list("Item",
            filters=base_filters,
            or_filters=or_filters,
            fields=['name', 'item_name', 'item_group'],
            limit=10)
            
    except Exception as e:
        frappe.log_error(_("Template Search Error"))
        raise

@frappe.whitelist()
def create_item_variant(item_data):
    """Create item variant with comprehensive validation"""
    try:
        # Parse input data
        if isinstance(item_data, str):
            item_data = json.loads(item_data)
        
        # Validate required fields
        required_fields = ['item_name', 'item_code', 'variant_of']
        for field in required_fields:
            if not item_data.get(field):
                frappe.throw(_("Field {0} is required").format(field))

        # Check for duplicates
        if frappe.db.exists("Item", item_data['item_code']):
            frappe.throw(_("Item {0} already exists").format(item_data['item_code']))

        # Validate template exists
        if not frappe.db.exists("Item", item_data['variant_of']):
            frappe.throw(_("Template item {0} not found").format(item_data['variant_of']))

        # Prepare attributes
        attributes = []
        if isinstance(item_data.get('attributes'), str):
            item_data['attributes'] = json.loads(item_data['attributes'])
        
        for attr in item_data.get('attributes', []):
            if not frappe.db.exists("Item Attribute", attr['attribute']):
                frappe.throw(_("Attribute {0} not found").format(attr['attribute']))
            attributes.append({
                'attribute': attr['attribute'],
                'attribute_value': attr.get('attribute_value')
            })

        # Create variant
        doc = frappe.get_doc({
            'doctype': 'Item',
            'item_name': item_data['item_name'],
            'item_code': item_data['item_code'],
            'variant_of': item_data['variant_of'],
            'item_group': item_data.get('item_group', DEFAULT_ITEM_GROUP),
            'stock_uom': item_data.get('stock_uom', DEFAULT_UOM),
            'standard_rate': flt(item_data.get('standard_rate', DEFAULT_RATE)),
            'attributes': attributes
        })
        
        doc.insert()
        
        return doc.as_dict()
    except Exception as e:
        
        frappe.log_error(_("Variant Creation Failed: {0}").format(str(e)))
        frappe.throw(_("Failed to create variant: {0}").format(str(e)))