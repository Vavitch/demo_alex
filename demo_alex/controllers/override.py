import frappe
from erpnext.controllers.item_variant import generate_keyed_value_combinations, get_variant, make_variant_item_code
from frappe.utils import cstr, flt
import json
import copy
from frappe import _

@frappe.whitelist()
def custom_create_variant(item, args, use_template_image=False):
    use_template_image = frappe.parse_json(use_template_image)
    if isinstance(args, str):
        args = json.loads(args)

    template = frappe.get_doc("Item", item)
    variant = frappe.new_doc("Item")
    variant.variant_based_on = "Item Attribute"
    variant_attributes = []

    for d in template.attributes:
        variant_attributes.append({"attribute": d.attribute, "attribute_value": args.get(d.attribute)})

    variant.set("attributes", variant_attributes)
    custom_copy_attributes_to_variant(template, variant)

    if use_template_image and template.image:
        variant.image = template.image

    make_variant_item_code(template.item_code, template.item_name, variant)
    variant.save()

    return variant


def custom_copy_attributes_to_variant(item, variant):
    # copy non no-copy fields

    exclude_fields = [
        "naming_series",
        "item_code",
        "item_name",
        "published_in_website",
        "opening_stock",
        "variant_of",
        "valuation_rate",
    ]

    if item.variant_based_on == "Manufacturer":
        # don't copy manufacturer values if based on part no
        exclude_fields += ["manufacturer", "manufacturer_part_no"]

    allow_fields = [d.field_name for d in frappe.get_all("Variant Field", fields=["field_name"])]
    if "variant_based_on" not in allow_fields:
        allow_fields.append("variant_based_on")
    for field in item.meta.fields:
        # "Table" is part of `no_value_field` but we shouldn't ignore tables
        if (field.reqd or field.fieldname in allow_fields) and field.fieldname not in exclude_fields:
            if variant.get(field.fieldname) != item.get(field.fieldname):
                if field.fieldtype == "Table":
                    variant.set(field.fieldname, [])
                    for d in item.get(field.fieldname):
                        row = copy.deepcopy(d)
                        if row.get("name"):
                            row.name = None
                        variant.append(field.fieldname, row)
                else:
                    variant.set(field.fieldname, item.get(field.fieldname))

    variant.variant_of = item.name

    if "description" not in allow_fields:
        if not variant.description:
            add_description(item, variant)
    add_description(item, variant)
        
def add_description(item, variant):
    
    variant.description = item.description
    for attribute in variant.attributes:
        attribute_value = attribute.attribute_value
        if attribute_value == "n/a":
            continue
        variant.description = variant.description + f"{attribute_value}<br>"

def custom_create_multiple_variants(item, args, use_template_image=False):
    count = 0
    if isinstance(args, str):
        args = json.loads(args)

    template_item = frappe.get_doc("Item", item)
    args_set = generate_keyed_value_combinations(args)

    for attribute_values in args_set:
        if not get_variant(item, args=attribute_values):
            variant = custom_create_variant(item, attribute_values)
            if use_template_image and template_item.image:
                variant.image = template_item.image
            variant.save()
            count += 1

    return count

@frappe.whitelist()
def custom_enqueue_multiple_variant_creation(item, args, use_template_image=False):
	use_template_image = frappe.parse_json(use_template_image)
	# There can be innumerable attribute combinations, enqueue
	if isinstance(args, str):
		variants = json.loads(args)
	total_variants = 1
	for key in variants:
		total_variants *= len(variants[key])
	if total_variants >= 600:
		frappe.throw(_("Please do not create more than 500 items at a time"))
		return
	if total_variants < 10:
		return custom_create_multiple_variants(item, args, use_template_image)
	else:
		frappe.enqueue(
			"demo_alex.controllers.override.custom_create_multiple_variants",
			item=item,
			args=args,
			use_template_image=use_template_image,
			now=frappe.flags.in_test,
		)
		return "queued"
