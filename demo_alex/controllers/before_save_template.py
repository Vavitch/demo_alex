import frappe

def inheritance_template(doc, method):

    if doc.has_variants:
        variants = frappe.get_all("Item", filters={"variant_of": doc.name}, fields=["name"])
        for variant in variants:
            variant_doc = frappe.get_doc("Item", variant.name) 
            variant_doc.description = doc.description     
        
            for attribute in variant_doc.attributes:
                attribute_name = attribute.attribute
                attribute_value = attribute.attribute_value
                #frappe.msgprint(f"{attribute_name} - {attribute_value}")

            # Проверяем, если значение attribute_value равно "n/a", то пропускаем
                if attribute_value == "n/a":
                    continue
       
                if doc.item_name in attribute_name:
                    attribute_name = attribute_name.replace(doc.item_name, "").strip()
                #frappe.msgprint(f"новое - {attribute_name}")
                    variant_doc.description = variant_doc.description + f"{attribute_value}<br>"
                else:
                    variant_doc.description = variant_doc.description + f"{attribute_value}<br>"   
            variant_doc.save()
    

def inheritance_template_multiple(doc, method):  
    if doc.variant_of:
        template_item = frappe.get_doc("Item", doc.variant_of)
        doc.description = template_item.description
    
        #frappe.msgprint("Я сработал Variant")
    
        # Перебираем атрибуты для изменения описания
        for attribute in doc.attributes:
            # Получаем атрибут и его значение
        
            attribute_name = attribute.attribute
            attribute_value = attribute.attribute_value
        #frappe.msgprint(f"{template_item.item_name} - {attribute_name}")

            # Проверяем, если значение attribute_value равно "n/a", то пропускаем
            if attribute_value == "n/a":
                continue

            # Заменяем имя атрибута "Farbe" на "Far" в описании
            if template_item.item_name in attribute_name:
                attribute_name = attribute_name.replace(template_item.item_name, "").strip()
                doc.description = doc.description + f"{attribute_value}<br>"
            else:
                doc.description = doc.description + f"{attribute_value}<br>"

def make_item_naming_series (doc, method):
    template_item = frappe.get_doc("Item", doc.variant_of)
    if doc.variant_of:
        doc.naming_series=template_item.naming_series
        doc.item_code = doc.name

def make_item_code(doc, method):
    
    if doc.variant_of:
        template_item = frappe.get_doc("Item", doc.variant_of)
        doc.item_name = doc.item_name.replace("-n/a","").strip()
        doc.item_code = doc.name


def add_price_to_variant(doc, method):

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

           