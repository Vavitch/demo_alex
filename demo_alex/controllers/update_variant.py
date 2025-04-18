import frappe

def update_variant_description(doc,method):
    
    if doc.variant_of:
        template_item = frappe.get_doc("Item", doc.variant_of)
        doc.description = template_item.description
       
        for attribute in doc.attributes:
            
            attribute_name = attribute.attribute
            attribute_value = attribute.attribute_value
            #frappe.msgprint(f"{template_item.item_name} - {attribute_name}")

            if attribute_value == "n/a":
                continue

            if template_item.item_name in attribute_name:
                attribute_name = attribute_name.replace(template_item.item_name, "").strip()
                doc.description = doc.description + f"{attribute_value}<br>"
            else:
                doc.description = doc.description + f"{attribute_value}<br>"
                
def update_variant_price(doc,method):
    
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
    
def heritance_from_template(doc,method):
    
    if doc.has_variants:
        variants = frappe.get_all("Item", filters={"variant_of": doc.name}, fields=["name"])
        for variant in variants:
            variant_doc = frappe.get_doc("Item", variant.name) 
            variant_doc.description = doc.description     
        
            for attribute in variant_doc.attributes:
                attribute_name = attribute.attribute
                attribute_value = attribute.attribute_value
            #frappe.msgprint(f"{attribute_name} - {attribute_value}")

                if attribute_value == "n/a":
                    continue
       
                if doc.item_name in attribute_name:
                    attribute_name = attribute_name.replace(doc.item_name, "").strip()
                    variant_doc.description = variant_doc.description + f"{attribute_value}<br>"
                else:
                    variant_doc.description = variant_doc.description + f"{attribute_value}<br>"   
            variant_doc.save()
        
def naming_item(doc,method):
    doc.item_code = doc.name
    doc.item_name = doc.item_name.replace("-n/a", '').strip()
