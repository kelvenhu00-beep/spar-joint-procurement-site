INSERT INTO `enterprises` (`id`, `name`, `short_name`, `type`, `region`, `status`) VALUES
('ent_jiarong', '广东嘉荣超市有限公司', '广东嘉荣集团', '区域头部超市', '华南', 'active'),
('ent_jiajiayue', '家家悦集团股份有限公司', '家家悦集团', '区域连锁超市', '山东', 'active'),
('ent_jiahui', '湖南佳惠百货有限责任公司', '湖南佳惠百货', '区域商贸零售', '华中', 'active');
--> statement-breakpoint
INSERT INTO `enterprise_users` (`id`, `enterprise_id`, `name`, `email`, `role`, `status`) VALUES
('eu_jiarong_buyer', 'ent_jiarong', '王经理', 'buyer@jiarong.example', 'buyer_manager', 'active');
--> statement-breakpoint
INSERT INTO `operator_users` (`id`, `name`, `email`, `role`, `status`) VALUES
('ou_manager_liu', '刘经理', 'manager@spar-supply.example', 'manager', 'active'),
('ou_director_chen', '陈总监', 'director@spar-supply.example', 'director', 'active');
--> statement-breakpoint
INSERT INTO `products` (`id`, `cn_name`, `brand`, `en_name`, `country`, `category`, `spec`, `case_spec`, `shelf_life_months`, `estimated_landed_cost_cny`, `retail_price_band`, `gross_margin_band`, `moq_boxes`, `last_12_month_boxes`, `target_boxes_20ft`, `status`, `authorization_status`, `label_status`, `hs_code`, `storage_requirement`, `image_path`) VALUES
('haribo-goldbears-175g', 'HARIBO 哈瑞宝金熊软糖', 'HARIBO', 'Goldbears 175g', '德国', '糖果', '175g*30袋/箱', '30 袋 / 箱', 18, 178.5, 'RMB 19.90-26.90 / 袋', '26%~36%', 8, 12860, 2600, 'approved', 'pending_region_authorization', 'draft_reviewed', '1905 / 1806 待关务复核', '常温干燥，避免挤压', '/product-assets/haribo.png'),
('manner-neapolitan-75g', 'Manner 曼纳威化饼干', 'Manner', 'Original Neapolitan Wafers 75g', '奥地利', '威化饼干', '75g*24盒/箱', '24 盒 / 箱', 12, 107.6, 'RMB 9.90-13.90 / 包', '28%~38%', 10, 18640, 4600, 'approved', 'approved', 'draft_reviewed', '1905 / 1806 待关务复核', '常温干燥，避免挤压', '/product-assets/manner.png'),
('walkers-fingers-250g', 'Walker''s 沃克斯黄油酥饼', 'Walker''s', 'Shortbread Fingers 250g', '英国', '饼干', '250g*24盒/箱', '24 盒 / 箱', 15, 382.4, 'RMB 39.90-49.90 / 袋', '22%~32%', 6, 9240, 2100, 'approved', 'approved', 'draft_reviewed', '1905 / 1806 待关务复核', '常温干燥，避免挤压', '/product-assets/walkers.png'),
('twinings-eb-100ct', 'Twinings 川宁伯爵红茶', 'Twinings', 'Earl Grey Tea', '英国', '茶叶', '50g*6盒/箱', '6 盒 / 箱', 24, 165.3, 'RMB 69.90-89.90 / 盒', '28%~38%', 12, 6820, 2400, 'approved', 'approved', 'complete', '0902 待关务复核', '常温干燥，避免异味', '/product-assets/twinings.png'),
('ritter-milk-100g', 'Ritter Sport 瑞特斯波德牛奶巧克力', 'Ritter Sport', 'Fine Milk Chocolate 100g', '德国', '巧克力', '100g*12块/箱', '12 块 / 箱', 12, 156, 'RMB 16.90-22.90 / 板', '24%~34%', 10, 15480, 5200, 'approved', 'approved', 'draft_reviewed', '1806 待关务复核', '避光控温，夏季需温控方案', '/product-assets/ritter-milk.png'),
('lavazza-coffee-250g', 'Lavazza 拉瓦萨意式浓缩咖啡粉', 'Lavazza', 'Espresso Ground Coffee 250g', '意大利', '咖啡', '250g*12罐/箱', '12 罐 / 箱', 18, 312.8, 'RMB 39.90-49.90 / 罐', '25%~35%', 6, 5360, 1800, 'approved', 'approved', 'draft_reviewed', '0901 待关务复核', '常温干燥，避免异味', '/product-assets/lavazza.png'),
('persil-laundry-1-35l', 'Persil 宝莹深层洁净洗衣液', 'Persil', 'Deep Clean Laundry Liquid', '德国', '洗衣液', '1.35L*6瓶/箱', '6 瓶 / 箱', 36, 194.5, 'RMB 39.90-59.90 / 瓶', '20%~30%', 8, 3120, 1500, 'approved', 'approved', 'pending', '3402.50', '常温，防漏防破损', '/product-assets/persil.png'),
('nivea-body-400ml', 'NIVEA 妮维雅深层滋润身体乳', 'NIVEA', 'Rich Nourishing Body Milk 400ml', '德国', '身体乳', '400ml*12瓶/箱', '12 瓶 / 箱', 30, 268.6, 'RMB 49.90-69.90 / 瓶', '22%~32%', 10, 4280, 1600, 'approved', 'approved', 'pending', '3304.99', '常温避光，需确认个护进口资料', '/product-assets/nivea.png');
--> statement-breakpoint
INSERT INTO `procurement_groups` (`id`, `product_id`, `container_type`, `target_boxes`, `current_boxes`, `status`, `expected_arrival_window`, `final_quote_version`) VALUES
('grp_haribo_2026q4', 'haribo-goldbears-175g', '20ft', 2600, 2110, 'collecting', '2026 年 Q4', 'estimate-v1'),
('grp_manner_2026q4', 'manner-neapolitan-75g', '20ft', 4600, 3820, 'collecting', '2026 年 Q4', 'estimate-v1'),
('grp_walkers_2026q4', 'walkers-fingers-250g', '20ft', 2100, 1460, 'collecting', '2026 年 Q4', 'estimate-v1'),
('grp_twinings_2026q4', 'twinings-eb-100ct', '20ft', 2400, 980, 'collecting', '2026 年 Q4', 'estimate-v1'),
('grp_ritter_2026q4', 'ritter-milk-100g', '20ft', 5200, 3180, 'collecting', '2026 年 Q4', 'estimate-v1'),
('grp_lavazza_2026q4', 'lavazza-coffee-250g', '20ft', 1800, 740, 'collecting', '2026 年 Q4', 'estimate-v1'),
('grp_persil_2026q4', 'persil-laundry-1-35l', '20ft', 1500, 360, 'collecting', '2026 年 Q4', 'estimate-v1'),
('grp_nivea_2026q4', 'nivea-body-400ml', '20ft', 1600, 520, 'collecting', '2026 年 Q4', 'estimate-v1');
