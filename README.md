SSL PINNING: https://habr.com/ru/post/559722/

Создание thumbnails:
python manage.py create_thumbnails


[{"id": "Q2hlY2tvdXRMaW5lOjk2NjRjN2VhLTE2ZTItNDQ1My05ZTcxLTQyZjE0MDQyZGY4MA==", "variant": {"id": "UHJvZHVjdFZhcmlhbnQ6NDIz", "name": "UHJvZHVjdFZhcmlhbnQ6NDIz", "pricing": {"price": {"gross": {"amount": 380, "currency": "KZT", "__typename": "Money"}, "__typename": "TaxedMoney"}, "__typename": "VariantPricingInfo"}, "product": {"id": "UHJvZHVjdDo0MjU=", "name": "Фасоль белая натуральная 'Кублей'", "slug": "C6PvNj-9P83rYkCj", "thumbnail": {"alt": "", "url": "https://ams3.digitaloceanspaces.com/inji-shop-media/thumbnails/products/optimized_9ca1e828_thumbnail_256.jpg", "__typename": "Image"}, "__typename": "Product", "translation": null}, "__typename": "ProductVariant", "translation": null}, "quantity": 1, "__typename": "CheckoutLine", "totalPrice": {"gross": {"amount": 380, "currency": "KZT", "__typename": "Money"}, "__typename": "TaxedMoney"}}]






TOKEN: eFjWx3rlsT86fpPsO6aP6oVWtld426 - что за токен?


doctl sandbox deploy xls-product-import

* OpenSearch Dashboards: https://159.89.10.199:5601/
  Username: admin
  Password: 2529fd8387c60ffacb845a9910bcf2e7ae694346
  https://159.89.10.199:5601/app/discover#/?_g=(filters:!(),refreshInterval:(pause:!t,value:0),time:(from:now-15m,to:now))&_a=(columns:!(_source),filters:!(),index:'17f89e50-2d26-11ed-9600-e9a91071367e',interval:auto,query:(language:kuery,query:''),sort:!())

Старт сервиса open search

sudo systemctl start elasticsearch.service

https://docs.saleor.io/docs/3.x/developer/extending/apps/asynchronous-webhooks
https://docs.saleor.io/docs/3.x/developer/checkout
https://docs.saleor.io/docs/3.x/developer/extending/apps/sample-webhook-payloads#transaction-action-request


BACKEND_APP:TOKEN:ZmFQJTiml6yhf9YEBwdtzvkniCQ0MB

ERP
https://codewithkarani.com/2022/08/18/install-erpnext-version-14/



/// CREATE PRODUCT
fetch("http://209.97.143.104:8000/api/method/frappe.desk.form.save.savedocs", {
"headers": {
"accept": "application/json",
"accept-language": "en-US,en;q=0.9",
"cache-control": "no-cache",
"content-type": "application/x-www-form-urlencoded; charset=UTF-8",
"pragma": "no-cache",
"x-frappe-cmd": "",
"x-frappe-csrf-token": "2bb2e7ce7cd92303fd1d482279bcd50eaf2b49e7c5284891163a9727",
"x-requested-with": "XMLHttpRequest",
"cookie": "user_image=; system_user=yes; sid=3256d1cf5dd40f809096399617a249460df8f921b3a84b07ff30f1fc; full_name=Albina; user_id=injiqaz%40gmail.com",
"Referer": "http://209.97.143.104:8000/app/item/new-item-2",
"Referrer-Policy": "strict-origin-when-cross-origin"
},
"body": "doc=%7B%22docstatus%22%3A0%2C%22doctype%22%3A%22Item%22%2C%22name%22%3A%22new-item-2%22%2C%22__islocal%22%3A1%2C%22__unsaved%22%3A1%2C%22owner%22%3A%22injiqaz%40gmail.com%22%2C%22naming_series%22%3A%22STO-ITEM-.YYYY.-%22%2C%22item_group%22%3A%22%D0%9F%D1%80%D0%BE%D0%B4%D1%83%D0%BA%D1%82%D1%8B%22%2C%22stock_uom%22%3A%22%D0%9A%D0%B8%D0%BB%D0%BE%D0%B3%D1%80%D0%B0%D0%BC%D0%BC%22%2C%22disabled%22%3A0%2C%22allow_alternative_item%22%3A0%2C%22is_stock_item%22%3A1%2C%22has_variants%22%3A0%2C%22include_item_in_manufacturing%22%3A1%2C%22is_fixed_asset%22%3A0%2C%22auto_create_assets%22%3A0%2C%22is_grouped_asset%22%3A0%2C%22end_of_life%22%3A%222099-12-31%22%2C%22default_material_request_type%22%3A%22Purchase%22%2C%22valuation_method%22%3A%22FIFO%22%2C%22allow_negative_stock%22%3A0%2C%22has_batch_no%22%3A0%2C%22create_new_batch%22%3A0%2C%22has_expiry_date%22%3A0%2C%22retain_sample%22%3A0%2C%22has_serial_no%22%3A0%2C%22variant_based_on%22%3A%22Item+Attribute%22%2C%22min_order_qty%22%3A0%2C%22is_purchase_item%22%3A1%2C%22is_customer_provided_item%22%3A0%2C%22delivered_by_supplier%22%3A0%2C%22enable_deferred_expense%22%3A0%2C%22country_of_origin%22%3A%22Kazakhstan%22%2C%22grant_commission%22%3A1%2C%22is_sales_item%22%3A1%2C%22enable_deferred_revenue%22%3A0%2C%22inspection_required_before_purchase%22%3A0%2C%22inspection_required_before_delivery%22%3A0%2C%22is_sub_contracted_item%22%3A0%2C%22published_in_website%22%3A0%2C%22item_template%22%3A%22%22%2C%22create_variant%22%3A0%2C%22item_code%22%3A%22%D0%93%D1%80%D1%83%D1%88%D0%B8%22%2C%22item_name%22%3A%22%D0%93%D1%80%D1%83%D1%88%D0%B8%22%2C%22description%22%3A%22%3Cdiv+class%3D%5C%22ql-editor+read-mode%5C%22%3E%3Cp%3E%D0%9E%D0%BF%D0%B8%D1%81%D0%B0%D0%BD%D0%B8%D0%B5+%D1%82%D0%BE%D0%B2%D0%B0%D1%80%D0%B0+123%3C%2Fp%3E%3C%2Fdiv%3E%22%2C%22opening_stock%22%3A100%2C%22shelf_life_in_days%22%3A9%2C%22weight_uom%22%3A%22%D0%9A%D0%B8%D0%BB%D0%BE%D0%B3%D1%80%D0%B0%D0%BC%D0%BC%22%2C%22item_defaults%22%3A%5B%7B%22docstatus%22%3A0%2C%22doctype%22%3A%22Item+Default%22%2C%22name%22%3A%22new-item-default-4%22%2C%22__islocal%22%3A1%2C%22__unsaved%22%3A1%2C%22owner%22%3A%22injiqaz%40gmail.com%22%2C%22company%22%3A%22inji%22%2C%22default_warehouse%22%3A%22%D0%9C%D0%B0%D0%B3%D0%B0%D0%B7%D0%B8%D0%BD%D1%8B+-+inji%22%2C%22parent%22%3A%22new-item-2%22%2C%22parentfield%22%3A%22item_defaults%22%2C%22parenttype%22%3A%22Item%22%2C%22idx%22%3A1%2C%22__unedited%22%3Afalse%2C%22default_price_list%22%3A%22%D0%A1%D1%82%D0%B0%D0%BD%D0%B4%D0%B0%D1%80%D1%82%D0%BD%D1%8B%D0%B9+%D0%9F%D0%BE%D0%BA%D1%83%D0%BF%D0%BA%D0%B0%22%7D%5D%2C%22purchase_uom%22%3A%22%D0%9A%D0%B8%D0%BB%D0%BE%D0%B3%D1%80%D0%B0%D0%BC%D0%BC%22%2C%22lead_time_days%22%3A0%2C%22sales_uom%22%3A%22%D0%9A%D0%B8%D0%BB%D0%BE%D0%B3%D1%80%D0%B0%D0%BC%D0%BC%22%2C%22valuation_rate%22%3A160%7D&action=Save",
"method": "POST"
});


doc: {"docstatus":0,"doctype":"Item","name":"new-item-2","__islocal":1,"__unsaved":1,"owner":"injiqaz@gmail.com","naming_series":"STO-ITEM-.YYYY.-","item_group":"Продукты","stock_uom":"Килограмм","disabled":0,"allow_alternative_item":0,"is_stock_item":1,"has_variants":0,"include_item_in_manufacturing":1,"is_fixed_asset":0,"auto_create_assets":0,"is_grouped_asset":0,"end_of_life":"2099-12-31","default_material_request_type":"Purchase","valuation_method":"FIFO","allow_negative_stock":0,"has_batch_no":0,"create_new_batch":0,"has_expiry_date":0,"retain_sample":0,"has_serial_no":0,"variant_based_on":"Item Attribute","min_order_qty":0,"is_purchase_item":1,"is_customer_provided_item":0,"delivered_by_supplier":0,"enable_deferred_expense":0,"country_of_origin":"Kazakhstan","grant_commission":1,"is_sales_item":1,"enable_deferred_revenue":0,"inspection_required_before_purchase":0,"inspection_required_before_delivery":0,"is_sub_contracted_item":0,"published_in_website":0,"item_template":"","create_variant":0,"item_code":"Груши","item_name":"Груши","description":"<div class=\"ql-editor read-mode\"><p>Описание товара 123</p></div>","opening_stock":100,"shelf_life_in_days":9,"weight_uom":"Килограмм","item_defaults":[{"docstatus":0,"doctype":"Item Default","name":"new-item-default-4","__islocal":1,"__unsaved":1,"owner":"injiqaz@gmail.com","company":"inji","default_warehouse":"Магазины - inji","parent":"new-item-2","parentfield":"item_defaults","parenttype":"Item","idx":1,"__unedited":false,"default_price_list":"Стандартный Покупка"}],"purchase_uom":"Килограмм","lead_time_days":0,"sales_uom":"Килограмм","valuation_rate":160}
action: Save


{
"docs": [
{
"name": "\u0413\u0440\u0443\u0448\u0438",
"owner": "injiqaz@gmail.com",
"creation": "2022-09-08 23:09:14.694654",
"modified": "2022-09-08 23:09:14.694654",
"modified_by": "injiqaz@gmail.com",
"docstatus": 0,
"idx": 0,
"naming_series": "STO-ITEM-.YYYY.-",
"item_code": "\u0413\u0440\u0443\u0448\u0438",
"item_name": "\u0413\u0440\u0443\u0448\u0438",
"item_group": "\u041f\u0440\u043e\u0434\u0443\u043a\u0442\u044b",
"stock_uom": "\u041a\u0438\u043b\u043e\u0433\u0440\u0430\u043c\u043c",
"disabled": 0,
"allow_alternative_item": 0,
"is_stock_item": 1,
"has_variants": 0,
"include_item_in_manufacturing": 1,
"opening_stock": 100.0,
"valuation_rate": 160.0,
"standard_rate": 0.0,
"is_fixed_asset": 0,
"auto_create_assets": 0,
"is_grouped_asset": 0,
"asset_category": null,
"asset_naming_series": null,
"over_delivery_receipt_allowance": 0.0,
"over_billing_allowance": 0.0,
"image": null,
"description": "<div><p>\u041e\u043f\u0438\u0441\u0430\u043d\u0438\u0435 \u0442\u043e\u0432\u0430\u0440\u0430 123</p></div>",
"brand": null,
"shelf_life_in_days": 9,
"end_of_life": "2099-12-31",
"default_material_request_type": "Purchase",
"valuation_method": "FIFO",
"warranty_period": null,
"weight_per_unit": 0.0,
"weight_uom": "\u041a\u0438\u043b\u043e\u0433\u0440\u0430\u043c\u043c",
"allow_negative_stock": 0,
"has_batch_no": 0,
"create_new_batch": 0,
"batch_number_series": null,
"has_expiry_date": 0,
"retain_sample": 0,
"sample_quantity": 0,
"has_serial_no": 0,
"serial_no_series": null,
"variant_of": null,
"variant_based_on": "Item Attribute",
"purchase_uom": "\u041a\u0438\u043b\u043e\u0433\u0440\u0430\u043c\u043c",
"min_order_qty": 0.0,
"safety_stock": 0.0,
"is_purchase_item": 1,
"lead_time_days": 0,
"last_purchase_rate": 0.0,
"is_customer_provided_item": 0,
"customer": null,
"delivered_by_supplier": 0,
"enable_deferred_expense": 0,
"deferred_expense_account": null,
"no_of_months_exp": 0,
"country_of_origin": "Kazakhstan",
"customs_tariff_number": null,
"sales_uom": "\u041a\u0438\u043b\u043e\u0433\u0440\u0430\u043c\u043c",
"grant_commission": 1,
"is_sales_item": 1,
"max_discount": 0.0,
"enable_deferred_revenue": 0,
"deferred_revenue_account": null,
"no_of_months": 0,
"inspection_required_before_purchase": 0,
"quality_inspection_template": null,
"inspection_required_before_delivery": 0,
"is_sub_contracted_item": 0,
"default_bom": null,
"customer_code": "",
"default_item_manufacturer": null,
"default_manufacturer_part_no": null,
"published_in_website": 0,
"total_projected_qty": 0.0,
"doctype": "Item",
"barcodes": [],
"attributes": [],
"reorder_levels": [],
"customer_items": [],
"taxes": [],
"uoms": [
{
"name": "c251c2993b",
"owner": null,
"creation": "2022-09-08 23:09:14.776536",
"modified": "2022-09-08 23:09:14.776536",
"modified_by": "injiqaz@gmail.com",
"docstatus": 0,
"idx": 1,
"uom": "\u041a\u0438\u043b\u043e\u0433\u0440\u0430\u043c\u043c",
"conversion_factor": 1.0,
"parent": "\u0413\u0440\u0443\u0448\u0438",
"parentfield": "uoms",
"parenttype": "Item",
"doctype": "UOM Conversion Detail"
}
],
"supplier_items": [],
"item_defaults": [
{
"name": "c65550221d",
"owner": "injiqaz@gmail.com",
"creation": "2022-09-08 23:09:14.694654",
"modified": "2022-09-08 23:09:14.694654",
"modified_by": "injiqaz@gmail.com",
"docstatus": 0,
"idx": 1,
"company": "inji",
"default_warehouse": "\u041c\u0430\u0433\u0430\u0437\u0438\u043d\u044b - inji",
"default_price_list": "\u0421\u0442\u0430\u043d\u0434\u0430\u0440\u0442\u043d\u044b\u0439 \u041f\u043e\u043a\u0443\u043f\u043a\u0430",
"default_discount_account": null,
"buying_cost_center": null,
"default_supplier": null,
"expense_account": null,
"default_provisional_account": null,
"selling_cost_center": null,
"income_account": null,
"parent": "\u0413\u0440\u0443\u0448\u0438",
"parentfield": "item_defaults",
"parenttype": "Item",
"doctype": "Item Default",
"__unsaved": 1
}
],
"__onload": {
"stock_exists": 0,
"asset_naming_series": "ACC-ASS-.YYYY.-"
},
"localname": "new-item-2"
}
],
"docinfo": {
"user_info": {},
"comments": [],
"shared": [],
"assignment_logs": [],
"attachment_logs": [],
"info_logs": [],
"like_logs": [],
"workflow_logs": [],
"attachments": [],
"communications": [],
"automated_messages": [],
"total_comments": 0,
"versions": [],
"assignments": [],
"permissions": {
"if_owner": {},
"has_if_owner_enabled": false,
"select": 1,
"read": 1,
"write": 1,
"create": 1,
"delete": 1,
"submit": 0,
"cancel": 0,
"amend": 0,
"print": 1,
"email": 1,
"report": 1,
"import": 1,
"export": 1,
"set_user_permissions": 0,
"share": 1
},
"views": [],
"energy_point_logs": [],
"additional_timeline_content": [],
"milestones": [],
"is_document_followed": null,
"tags": "",
"document_email": null
},
"_server_messages": "[\"{\\\"message\\\": \\\"\\\\u0421\\\\u043e\\\\u0445\\\\u0440\\\\u0430\\\\u043d\\\\u0435\\\\u043d\\\\u043d\\\\u044b\\\\u0435\\\", \\\"title\\\": \\\"\\\\u0421\\\\u043e\\\\u043e\\\\u0431\\\\u0449\\\\u0435\\\\u043d\\\\u0438\\\\u0435\\\", \\\"indicator\\\": \\\"green\\\", \\\"alert\\\": 1}\"]"
}

// CREATE GROUP
doc: {"docstatus":0,"doctype":"Item Group","name":"new-item-group-1","__islocal":1,"__unsaved":1,"owner":"injiqaz@gmail.com","is_group":1,"show_in_website":0,"include_descendants":0,"item_group_name":"Овощи, фрукты, ягоды, зелень","item_group_defaults":[]}
action: Save


doc: {"docstatus":0,"doctype":"Sales Order","name":"new-sales-order-2","__islocal":1,"__unsaved":1,"owner":"injiqaz@gmail.com","title":"{customer_name}","naming_series":"SAL-ORD-.YYYY.-","order_type":"Sales","skip_delivery_note":0,"company":"inji","transaction_date":"2022-09-10","currency":"KZT","selling_price_list":"Стандартный Продажа","price_list_currency":"KZT","ignore_pricing_rule":0,"apply_discount_on":"Grand Total","disable_rounded_total":0,"is_internal_customer":0,"party_account_currency":"KZT","letter_head":"inji - Доставка продуктов","group_same_items":0,"status":"Draft","delivery_status":"Not Delivered","billing_status":"Not Billed","items":[{"docstatus":0,"doctype":"Sales Order Item","name":"new-sales-order-item-3","__islocal":1,"__unsaved":1,"owner":"injiqaz@gmail.com","ensure_delivery_based_on_produced_serial_no":0,"item_group":"Овощи, фрукты, ягоды, зелень, грибы","stock_uom":"Килограмм","margin_type":"","is_free_item":0,"grant_commission":1,"delivered_by_supplier":0,"against_blanket_order":null,"page_break":0,"parent":"new-sales-order-2","parentfield":"items","parenttype":"Sales Order","idx":1,"__unedited":false,"item_code":"Шампиньоны Наша марка / 2458251e-b1cc-76a0-7be6-245537873e07","weight_per_unit":0,"weight_uom":null,"conversion_factor":1,"barcode":null,"item_name":"Шампиньоны Наша марка","description":"Шампиньоны Наша марка","image":"","warehouse":"Магазины - inji","income_account":"4110 - Продажи - inji","expense_account":"5111 - Себестоимость проданных продуктов - inji","discount_account":null,"provisional_expense_account":null,"cost_center":"Основные - inji","has_serial_no":0,"has_batch_no":0,"batch_no":null,"uom":"Килограмм","min_order_qty":"","qty":1,"stock_qty":1,"price_list_rate":0,"base_price_list_rate":0,"rate":25,"base_rate":25,"amount":25,"base_amount":25,"net_rate":25,"net_amount":25,"discount_percentage":0,"discount_amount":0,"supplier":null,"update_stock":0,"is_fixed_asset":0,"last_purchase_rate":0,"transaction_date":"2022-09-10","bom_no":null,"brand":null,"manufacturer":null,"manufacturer_part_no":null,"item_tax_rate":"{}","customer_item_code":null,"valuation_rate":0,"projected_qty":0,"actual_qty":0,"reserved_qty":0,"has_margin":false,"free_item_data":"","child_docname":"new-sales-order-item-3","rate_with_margin":0,"base_rate_with_margin":0,"margin_rate_or_amount":0,"stock_uom_rate":25,"base_net_rate":25,"base_net_amount":25,"billed_amt":0,"gross_profit":0,"total_weight":0,"blanket_order_rate":0,"ordered_qty":0,"planned_qty":0,"work_order_qty":0,"delivered_qty":0,"produced_qty":0,"returned_qty":0,"picked_qty":0,"delivery_date":"2022-09-10"}],"conversion_rate":1,"plc_conversion_rate":1,"base_net_total":25,"net_total":25,"base_total":25,"total":25,"total_qty":1,"rounding_adjustment":0,"grand_total":25,"base_grand_total":25,"total_taxes_and_charges":0,"base_total_taxes_and_charges":0,"base_rounding_adjustment":0,"rounded_total":25,"base_rounded_total":25,"in_words":"","base_in_words":"","base_discount_amount":0,"amount_eligible_for_commission":25,"total_commission":null,"tax_id":null,"customer_name":"c77071234567@customer.inji.kz","represents_company":null,"customer":"c77071234567@customer.inji.kz","customer_address":null,"address_display":null,"shipping_address_name":"","shipping_address":null,"company_address":null,"company_address_display":null,"contact_person":null,"contact_display":null,"contact_email":null,"contact_mobile":null,"contact_phone":null,"customer_group":"Частное лицо","territory":"Kazakhstan","language":"ru","tax_category":"","payment_terms_template":null,"sales_team":[],"total_net_weight":0}
action: Save

http://json2ts.com/
https://app.quicktype.io/


doc: {"owner":"injiqaz@gmail.com","docstatus":0,"idx":0,"naming_series":"ACC-SINV-.YYYY.-","customer":"c77071234568@customer.inji.kz","customer_name":"c77071234568@customer.inji.kz","is_pos":0,"is_consolidated":0,"is_return":0,"is_debit_note":0,"update_billed_amount_in_sales_order":0,"company":"inji","posting_date":"2022-09-11","posting_time":"22:49:15.508734","set_posting_time":0,"due_date":"2022-09-11","po_no":"","territory":"Kazakhstan","shipping_address_name":"","currency":"KZT","conversion_rate":1,"selling_price_list":"Стандартный Продажа","price_list_currency":"KZT","plc_conversion_rate":1,"ignore_pricing_rule":0,"update_stock":0,"total_billing_amount":0,"total_billing_hours":0,"total_qty":3,"base_total":720,"base_net_total":720,"total_net_weight":0,"total":720,"net_total":720,"tax_category":"","base_total_taxes_and_charges":0,"total_taxes_and_charges":0,"loyalty_points":0,"loyalty_amount":0,"redeem_loyalty_points":0,"apply_discount_on":"Grand Total","is_cash_or_non_trade_discount":0,"base_discount_amount":0,"additional_discount_percentage":0,"discount_amount":0,"base_grand_total":720,"base_rounding_adjustment":0,"base_rounded_total":720,"base_in_words":"","grand_total":720,"rounding_adjustment":0,"rounded_total":720,"in_words":"","total_advance":0,"outstanding_amount":720,"disable_rounded_total":0,"write_off_amount":0,"base_write_off_amount":0,"write_off_outstanding_amount_automatically":0,"allocate_advances_automatically":0,"ignore_default_payment_terms_template":0,"base_paid_amount":0,"paid_amount":0,"base_change_amount":0,"change_amount":0,"letter_head":"inji - Доставка продуктов","group_same_items":0,"language":"ru","status":"Draft","customer_group":"Частное лицо","is_internal_customer":0,"is_discounted":0,"debit_to":"1310 - Дебеторы - inji","party_account_currency":"KZT","is_opening":"No","amount_eligible_for_commission":720,"commission_rate":0,"total_commission":0,"doctype":"Sales Invoice","taxes":[],"items":[{"owner":"injiqaz@gmail.com","docstatus":0,"idx":1,"item_code":"Молоко Египет / fefc613e-d0e3-b441-76bc-f59feb54953e","item_name":"Молоко Египет","description":"Молоко Египет","item_group":"Молоко, сливки","image":"","qty":3,"stock_uom":"Кол-во","uom":"Килограмм","conversion_factor":1,"stock_qty":3,"price_list_rate":240,"base_price_list_rate":240,"margin_type":"","margin_rate_or_amount":0,"rate_with_margin":0,"discount_percentage":0,"discount_amount":0,"base_rate_with_margin":0,"rate":240,"amount":720,"base_rate":240,"base_amount":720,"stock_uom_rate":0,"is_free_item":0,"grant_commission":1,"net_rate":240,"net_amount":720,"base_net_rate":240,"base_net_amount":720,"delivered_by_supplier":0,"income_account":"4110 - Продажи - inji","is_fixed_asset":0,"expense_account":"5111 - Себестоимость проданных продуктов - inji","enable_deferred_revenue":0,"weight_per_unit":0,"total_weight":0,"warehouse":"Магазины - inji","incoming_rate":0,"allow_zero_valuation_rate":0,"item_tax_rate":"{}","actual_batch_qty":0,"actual_qty":91,"sales_order":"SAL-ORD-2022-00022","so_detail":"536411016f","delivered_qty":0,"cost_center":"Основные - inji","page_break":0,"parentfield":"items","parenttype":"Sales Invoice","doctype":"Sales Invoice Item","__islocal":1,"__unsaved":1,"parent":"new-sales-invoice-2","name":"new-sales-invoice-item-2"}],"timesheets":[],"pricing_rules":[],"advances":[],"sales_team":[],"payments":[],"payment_schedule":[],"packed_items":[],"__islocal":1,"__onload":{"load_after_mapping":true,"ignore_price_list":true},"__unsaved":1,"name":"new-sales-invoice-2","__last_sync_on":"2022-09-11T16:49:16.025Z","company_address":"","company_address_display":""}


// DELIVERY NOTE

{"owner":"injiqaz@gmail.com","docstatus":0,"idx":0,"naming_series":"MAT-DN-.YYYY.-","customer":"c77071234568@customer.inji.kz","customer_name":"c77071234568@customer.inji.kz","company":"inji","posting_date":"2022-09-11","posting_time":"23:23:49.140108","set_posting_time":0,"is_return":0,"issue_credit_note":0,"po_no":"","shipping_address_name":"","currency":"KZT","conversion_rate":1,"selling_price_list":"Стандартный Продажа","price_list_currency":"KZT","plc_conversion_rate":1,"ignore_pricing_rule":0,"total_qty":3,"base_total":720,"base_net_total":720,"total_net_weight":0,"total":720,"net_total":720,"tax_category":"","base_total_taxes_and_charges":0,"total_taxes_and_charges":0,"apply_discount_on":"Grand Total","base_discount_amount":0,"additional_discount_percentage":0,"discount_amount":0,"base_grand_total":720,"base_rounding_adjustment":0,"base_rounded_total":720,"base_in_words":"","grand_total":720,"rounding_adjustment":0,"rounded_total":720,"in_words":"","disable_rounded_total":0,"lr_date":"2022-09-11","is_internal_customer":0,"per_billed":0,"customer_group":"Частное лицо","territory":"Kazakhstan","letter_head":"inji - Доставка продуктов","language":"ru","print_without_amount":0,"group_same_items":0,"status":"Draft","per_installed":0,"per_returned":0,"amount_eligible_for_commission":720,"commission_rate":0,"total_commission":0,"doctype":"Delivery Note","taxes":[],"items":[{"owner":"injiqaz@gmail.com","docstatus":0,"idx":1,"item_code":"Молоко Египет / fefc613e-d0e3-b441-76bc-f59feb54953e","item_name":"Молоко Египет","description":"Молоко Египет","item_group":"Молоко, сливки","image":"","qty":3,"stock_uom":"Кол-во","uom":"Килограмм","conversion_factor":1,"stock_qty":3,"returned_qty":0,"price_list_rate":240,"base_price_list_rate":240,"margin_type":"","margin_rate_or_amount":0,"rate_with_margin":0,"discount_percentage":0,"discount_amount":0,"base_rate_with_margin":0,"rate":240,"amount":720,"base_rate":240,"base_amount":720,"stock_uom_rate":0,"is_free_item":0,"grant_commission":1,"net_rate":240,"net_amount":720,"base_net_rate":240,"base_net_amount":720,"billed_amt":0,"incoming_rate":0,"weight_per_unit":0,"total_weight":0,"warehouse":"Магазины - inji","against_sales_order":"SAL-ORD-2022-00024","so_detail":"9d0e96e493","actual_batch_qty":0,"actual_qty":70,"installed_qty":0,"item_tax_rate":"{}","expense_account":"5111 - Себестоимость проданных продуктов - inji","allow_zero_valuation_rate":0,"cost_center":"Основные - inji","page_break":0,"parentfield":"items","parenttype":"Delivery Note","doctype":"Delivery Note Item","__islocal":1,"__unsaved":1,"parent":"new-delivery-note-1","name":"new-delivery-note-item-1"}],"pricing_rules":[],"sales_team":[],"packed_items":[],"__islocal":1,"__onload":{"load_after_mapping":true,"ignore_price_list":true},"__unsaved":1,"name":"new-delivery-note-1","__last_sync_on":"2022-09-11T17:23:49.498Z"}


// SALES INVOICE

{"owner":"injiqaz@gmail.com","docstatus":0,"idx":0,"naming_series":"ACC-SINV-.YYYY.-","customer":"c77071234568@customer.inji.kz","customer_name":"c77071234568@customer.inji.kz","is_pos":0,"is_consolidated":0,"is_return":0,"is_debit_note":0,"update_billed_amount_in_sales_order":0,"company":"inji","posting_date":"2022-09-11","posting_time":"23:28:23.561533","set_posting_time":0,"due_date":"2022-09-11","po_no":"","territory":"Kazakhstan","shipping_address_name":"","currency":"KZT","conversion_rate":1,"selling_price_list":"Стандартный Продажа","price_list_currency":"KZT","plc_conversion_rate":1,"ignore_pricing_rule":0,"update_stock":0,"total_billing_amount":0,"total_billing_hours":0,"total_qty":3,"base_total":720,"base_net_total":720,"total_net_weight":0,"total":720,"net_total":720,"tax_category":"","base_total_taxes_and_charges":0,"total_taxes_and_charges":0,"loyalty_points":0,"loyalty_amount":0,"redeem_loyalty_points":0,"apply_discount_on":"Grand Total","is_cash_or_non_trade_discount":0,"base_discount_amount":0,"additional_discount_percentage":0,"discount_amount":0,"base_grand_total":720,"base_rounding_adjustment":0,"base_rounded_total":720,"base_in_words":"","grand_total":720,"rounding_adjustment":0,"rounded_total":720,"in_words":"","total_advance":0,"outstanding_amount":720,"disable_rounded_total":0,"write_off_amount":0,"base_write_off_amount":0,"write_off_outstanding_amount_automatically":0,"allocate_advances_automatically":0,"ignore_default_payment_terms_template":0,"base_paid_amount":0,"paid_amount":0,"base_change_amount":0,"change_amount":0,"letter_head":"inji - Доставка продуктов","group_same_items":0,"language":"ru","status":"Draft","customer_group":"Частное лицо","is_internal_customer":0,"is_discounted":0,"debit_to":"1310 - Дебеторы - inji","party_account_currency":"KZT","is_opening":"No","amount_eligible_for_commission":720,"commission_rate":0,"total_commission":0,"doctype":"Sales Invoice","taxes":[],"items":[{"owner":"injiqaz@gmail.com","docstatus":0,"idx":1,"item_code":"Молоко Египет / fefc613e-d0e3-b441-76bc-f59feb54953e","item_name":"Молоко Египет","description":"Молоко Египет","item_group":"Молоко, сливки","image":"","qty":3,"stock_uom":"Кол-во","uom":"Килограмм","conversion_factor":1,"stock_qty":3,"price_list_rate":240,"base_price_list_rate":240,"margin_type":"","margin_rate_or_amount":0,"rate_with_margin":0,"discount_percentage":0,"discount_amount":0,"base_rate_with_margin":0,"rate":240,"amount":720,"base_rate":240,"base_amount":720,"stock_uom_rate":0,"is_free_item":0,"grant_commission":1,"net_rate":240,"net_amount":720,"base_net_rate":240,"base_net_amount":720,"delivered_by_supplier":0,"income_account":"4110 - Продажи - inji","is_fixed_asset":0,"expense_account":"5111 - Себестоимость проданных продуктов - inji","enable_deferred_revenue":0,"weight_per_unit":0,"total_weight":0,"warehouse":"Магазины - inji","incoming_rate":0,"allow_zero_valuation_rate":0,"item_tax_rate":"{}","actual_batch_qty":0,"actual_qty":61,"sales_order":"SAL-ORD-2022-00026","delivery_note":"ACC-SINV-2022-00018","dn_detail":"5743614e90","delivered_qty":0,"cost_center":"Основные - inji","page_break":0,"parentfield":"items","parenttype":"Sales Invoice","doctype":"Sales Invoice Item","__islocal":1,"__unsaved":1,"parent":"new-sales-invoice-4","name":"new-sales-invoice-item-4"}],"timesheets":[],"pricing_rules":[],"advances":[],"sales_team":[],"payments":[],"payment_schedule":[],"packed_items":[],"__islocal":1,"__onload":{"load_after_mapping":true,"ignore_price_list":true},"__unsaved":1,"name":"new-sales-invoice-4","__last_sync_on":"2022-09-11T17:28:23.795Z","company_address":"","company_address_display":""}

/// SALES INVOICE

{"owner":"injiqaz@gmail.com","docstatus":0,"idx":0,"naming_series":"ACC-SINV-.YYYY.-","customer":"c77071234568@customer.inji.kz","customer_name":"c77071234568@customer.inji.kz","is_pos":0,"is_consolidated":0,"is_return":0,"is_debit_note":0,"update_billed_amount_in_sales_order":0,"company":"inji","posting_date":"2022-09-12","posting_time":"01:41:50.252991","set_posting_time":0,"due_date":"2022-09-12","po_no":"","territory":"Kazakhstan","shipping_address_name":"","currency":"KZT","conversion_rate":1,"selling_price_list":"Стандартный Продажа","price_list_currency":"KZT","plc_conversion_rate":1,"ignore_pricing_rule":0,"update_stock":0,"total_billing_amount":0,"total_billing_hours":0,"total_qty":3,"base_total":720,"base_net_total":720,"total_net_weight":0,"total":720,"net_total":720,"tax_category":"","base_total_taxes_and_charges":0,"total_taxes_and_charges":0,"loyalty_points":0,"loyalty_amount":0,"redeem_loyalty_points":0,"apply_discount_on":"Grand Total","is_cash_or_non_trade_discount":0,"base_discount_amount":0,"additional_discount_percentage":0,"discount_amount":0,"base_grand_total":720,"base_rounding_adjustment":0,"base_rounded_total":720,"base_in_words":"","grand_total":720,"rounding_adjustment":0,"rounded_total":720,"in_words":"","total_advance":0,"outstanding_amount":720,"disable_rounded_total":0,"write_off_amount":0,"base_write_off_amount":0,"write_off_outstanding_amount_automatically":0,"allocate_advances_automatically":0,"ignore_default_payment_terms_template":0,"base_paid_amount":0,"paid_amount":0,"base_change_amount":0,"change_amount":0,"letter_head":"inji - Доставка продуктов","group_same_items":0,"language":"ru","status":"Draft","customer_group":"Частное лицо","is_internal_customer":0,"is_discounted":0,"debit_to":"1310 - Дебеторы - inji","party_account_currency":"KZT","is_opening":"No","amount_eligible_for_commission":720,"commission_rate":0,"total_commission":0,"doctype":"Sales Invoice","taxes":[],"items":[{"owner":"injiqaz@gmail.com","docstatus":0,"idx":1,"item_code":"Молоко Египет / fefc613e-d0e3-b441-76bc-f59feb54953e","item_name":"Молоко Египет","description":"Молоко Египет","item_group":"Молоко, сливки","image":"","qty":3,"stock_uom":"Кол-во","uom":"Килограмм","conversion_factor":1,"stock_qty":3,"price_list_rate":240,"base_price_list_rate":240,"margin_type":"","margin_rate_or_amount":0,"rate_with_margin":0,"discount_percentage":0,"discount_amount":0,"base_rate_with_margin":0,"rate":240,"amount":720,"base_rate":240,"base_amount":720,"stock_uom_rate":0,"is_free_item":0,"grant_commission":1,"net_rate":240,"net_amount":720,"base_net_rate":240,"base_net_amount":720,"delivered_by_supplier":0,"income_account":"4110 - Продажи - inji","is_fixed_asset":0,"expense_account":"5111 - Себестоимость проданных продуктов - inji","enable_deferred_revenue":0,"weight_per_unit":0,"total_weight":0,"warehouse":"Магазины - inji","incoming_rate":0,"allow_zero_valuation_rate":0,"item_tax_rate":"{}","actual_batch_qty":0,"actual_qty":5,"sales_order":"SAL-ORD-2022-00035","delivery_note":"ACC-SINV-2022-00034","dn_detail":"197d99fa32","delivered_qty":0,"cost_center":"Основные - inji","page_break":0,"parentfield":"items","parenttype":"Sales Invoice","doctype":"Sales Invoice Item","__islocal":1,"__unsaved":1,"parent":"new-sales-invoice-5","name":"new-sales-invoice-item-5"}],"timesheets":[],"pricing_rules":[],"advances":[],"sales_team":[],"payments":[],"payment_schedule":[],"packed_items":[],"__islocal":1,"__onload":{"load_after_mapping":true,"ignore_price_list":true},"__unsaved":1,"name":"new-sales-invoice-5","__last_sync_on":"2022-09-11T19:41:50.331Z","company_address":"","company_address_display":""}

// DELIVERY NOTE

{"owner":"injiqaz@gmail.com","docstatus":0,"idx":0,"naming_series":"MAT-DN-.YYYY.-","customer":"c77071234568@customer.inji.kz","customer_name":"c77071234568@customer.inji.kz","company":"inji","posting_date":"2022-09-12","posting_time":"02:35:44.302149","set_posting_time":0,"is_return":0,"issue_credit_note":0,"po_no":"","shipping_address_name":"","currency":"KZT","conversion_rate":1,"selling_price_list":"Стандартный Продажа","price_list_currency":"KZT","plc_conversion_rate":1,"ignore_pricing_rule":0,"total_qty":3,"base_total":720,"base_net_total":720,"total_net_weight":0,"total":720,"net_total":720,"tax_category":"","base_total_taxes_and_charges":0,"total_taxes_and_charges":0,"apply_discount_on":"Grand Total","base_discount_amount":0,"additional_discount_percentage":0,"discount_amount":0,"base_grand_total":720,"base_rounding_adjustment":0,"base_rounded_total":720,"base_in_words":"","grand_total":720,"rounding_adjustment":0,"rounded_total":720,"in_words":"","disable_rounded_total":0,"lr_date":"2022-09-12","is_internal_customer":0,"per_billed":0,"customer_group":"Частное лицо","territory":"Kazakhstan","letter_head":"inji - Доставка продуктов","language":"ru","print_without_amount":0,"group_same_items":0,"status":"Draft","per_installed":0,"per_returned":0,"amount_eligible_for_commission":720,"commission_rate":0,"total_commission":0,"doctype":"Delivery Note","taxes":[],"items":[{"owner":"injiqaz@gmail.com","docstatus":0,"idx":1,"item_code":"Молоко Египет / fefc613e-d0e3-b441-76bc-f59feb54953e","item_name":"Молоко Египет","description":"Молоко Египет","item_group":"Молоко, сливки","image":"","qty":3,"stock_uom":"Кол-во","uom":"Килограмм","conversion_factor":1,"stock_qty":3,"returned_qty":0,"price_list_rate":240,"base_price_list_rate":240,"margin_type":"","margin_rate_or_amount":0,"rate_with_margin":0,"discount_percentage":0,"discount_amount":0,"base_rate_with_margin":0,"rate":240,"amount":720,"base_rate":240,"base_amount":720,"stock_uom_rate":0,"is_free_item":0,"grant_commission":1,"net_rate":240,"net_amount":720,"base_net_rate":240,"base_net_amount":720,"billed_amt":0,"incoming_rate":0,"weight_per_unit":0,"total_weight":0,"warehouse":"Магазины - inji","against_sales_order":"SAL-ORD-2022-00043","so_detail":"008f8c6849","actual_batch_qty":0,"actual_qty":144,"installed_qty":0,"item_tax_rate":"{}","expense_account":"5111 - Себестоимость проданных продуктов - inji","allow_zero_valuation_rate":0,"cost_center":"Основные - inji","page_break":0,"parentfield":"items","parenttype":"Delivery Note","doctype":"Delivery Note Item","__islocal":1,"__unsaved":1,"parent":"new-delivery-note-3","name":"new-delivery-note-item-3"}],"pricing_rules":[],"sales_team":[],"packed_items":[],"__islocal":1,"__onload":{"load_after_mapping":true,"ignore_price_list":true},"__unsaved":1,"name":"new-delivery-note-3","__last_sync_on":"2022-09-11T20:35:44.475Z"}


/// DNOTE

{"owner":"injiqaz@gmail.com","docstatus":0,"idx":0,"naming_series":"MAT-DN-.YYYY.-","customer":"c77071234568@customer.inji.kz","customer_name":"c77071234568@customer.inji.kz","company":"inji","posting_date":"2022-09-12","posting_time":"03:01:29.988504","set_posting_time":0,"is_return":0,"issue_credit_note":0,"po_no":"","shipping_address_name":"","currency":"KZT","conversion_rate":1,"selling_price_list":"Стандартный Продажа","price_list_currency":"KZT","plc_conversion_rate":1,"ignore_pricing_rule":0,"total_qty":3,"base_total":720,"base_net_total":720,"total_net_weight":0,"total":720,"net_total":720,"tax_category":"","base_total_taxes_and_charges":0,"total_taxes_and_charges":0,"apply_discount_on":"Grand Total","base_discount_amount":0,"additional_discount_percentage":0,"discount_amount":0,"base_grand_total":720,"base_rounding_adjustment":0,"base_rounded_total":720,"base_in_words":"","grand_total":720,"rounding_adjustment":0,"rounded_total":720,"in_words":"","disable_rounded_total":0,"lr_date":"2022-09-12","is_internal_customer":0,"per_billed":0,"customer_group":"Частное лицо","territory":"Kazakhstan","letter_head":"inji - Доставка продуктов","language":"ru","print_without_amount":0,"group_same_items":0,"status":"Draft","per_installed":0,"per_returned":0,"amount_eligible_for_commission":720,"commission_rate":0,"total_commission":0,"doctype":"Delivery Note","taxes":[],"items":[{"owner":"injiqaz@gmail.com","docstatus":0,"idx":1,"item_code":"Молоко Египет / fefc613e-d0e3-b441-76bc-f59feb54953e","item_name":"Молоко Египет","description":"Молоко Египет","item_group":"Молоко, сливки","image":"","qty":3,"stock_uom":"Кол-во","uom":"Килограмм","conversion_factor":1,"stock_qty":3,"returned_qty":0,"price_list_rate":240,"base_price_list_rate":240,"margin_type":"","margin_rate_or_amount":0,"rate_with_margin":0,"discount_percentage":0,"discount_amount":0,"base_rate_with_margin":0,"rate":240,"amount":720,"base_rate":240,"base_amount":720,"stock_uom_rate":0,"is_free_item":0,"grant_commission":1,"net_rate":240,"net_amount":720,"base_net_rate":240,"base_net_amount":720,"billed_amt":0,"incoming_rate":0,"weight_per_unit":0,"total_weight":0,"warehouse":"Магазины - inji","against_sales_order":"SAL-ORD-2022-00052","so_detail":"08ffbd14ba","actual_batch_qty":0,"actual_qty":90,"installed_qty":0,"item_tax_rate":"{}","expense_account":"5111 - Себестоимость проданных продуктов - inji","allow_zero_valuation_rate":0,"cost_center":"Основные - inji","page_break":0,"parentfield":"items","parenttype":"Delivery Note","doctype":"Delivery Note Item","__islocal":1,"__unsaved":1,"parent":"new-delivery-note-4","name":"new-delivery-note-item-4"}],"pricing_rules":[],"sales_team":[],"packed_items":[],"__islocal":1,"__onload":{"load_after_mapping":true,"ignore_price_list":true},"__unsaved":1,"name":"new-delivery-note-4","__last_sync_on":"2022-09-11T21:01:30.163Z"}


syncHooks - fd9wUZs6YyQABz6NnhQX0Tj84PJDuw


OFD_TOKEN: 42760074 Казахтелекеом


PYTHON3.11 UPDATE:
sudo update-alternatives --install /usr/bin/python3 python3 /usr/bin/python3.10 110
sudo update-alternatives --install /usr/bin/python3 python3 /usr/bin/python3.11 100
sudo update-alternatives --config python3



4607120236300
460017350512
745114385949
4603743959077
4605093000812
4605093000935
4605093000942
4605093000959
4605093001802
4605093009396
4607120230964
4607120234061
4640017350536
4690228004018
4690228007842
4870143000139
4870143000146
4870143000214
4870143000221
4870232460011
4870232460028
4870232460035
4870232460110
4870232460134
48701143000016
