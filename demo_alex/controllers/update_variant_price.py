import frappe
if doc.variant_of:
    variant_item_values = doc.get("attributes")
    template_item = frappe.get_doc("Item", doc.variant_of)
    template = template_item.standard_rate
    
    for attr_in_variant_of in variant_item_values:
        item_attribute_template = frappe.get_doc("Item Attribute", attr_in_variant_of.attribute)
        item_attribute_template_values = item_attribute_template.get("item_attribute_values")
    
        for value in item_attribute_template_values:
            if value.attribute_value == attr_in_variant_of.attribute_value:
                template = template + float(value.custom_add_price)
 
    doc.custom_changed_selling_price = template
    doc.standard_rate = template