-- Seed Categories
INSERT INTO categories (name, name_kn, sort_order) VALUES
('Starters', 'ಸ್ಟಾರ್ಟರ್ಸ್', 1),
('Biryani', 'ಬಿರ್ಯಾನಿ', 2),
('Curries', 'ಕರಿಗಳು', 3);

-- Seed Menu Items
INSERT INTO menu_items (name, name_kn, description, description_kn, price, category_id) VALUES
('Idli', 'ಇಡ್ಲಿ', 'Soft steamed rice cakes served with sambar and chutney', 'ಸಾಂಬಾರ್ ಮತ್ತು ಚಟ್ನಿಯೊಂದಿಗೆ ಮೃದು ಇಡ್ಲಿ', 50, (SELECT id FROM categories WHERE name = 'Starters')),
('Chicken Biryani', 'ಚಿಕನ್ ಬಿರ್ಯಾನಿ', 'Aromatic basmati rice cooked with tender chicken and spices', 'ಮಸಾಲೆಯೊಂದಿಗೆ ಬೇಯಿಸಿದ ಚಿಕನ್ ಬಿರ್ಯಾನಿ', 180, (SELECT id FROM categories WHERE name = 'Biryani')),
('Mutton Biryani', 'ಮಟನ್ ಬಿರ್ಯಾನಿ', 'Slow-cooked mutton with fragrant basmati rice and whole spices', 'ಸುಗಂಧಭರಿತ ಮಟನ್ ಬಿರ್ಯಾನಿ', 220, (SELECT id FROM categories WHERE name = 'Biryani')),
('Chicken Curry', 'ಚಿಕನ್ ಕರಿ', 'Rich and spicy chicken curry in a thick masala gravy', 'ದಪ್ಪ ಮಸಾಲೆ ಗ್ರೇವಿಯಲ್ಲಿ ಚಿಕನ್ ಕರಿ', 160, (SELECT id FROM categories WHERE name = 'Curries')),
('Mutton Curry', 'ಮಟನ್ ಕರಿ', 'Tender mutton pieces in a bold and aromatic curry sauce', 'ಪರಿಮಳಭರಿತ ಮಟನ್ ಕರಿ', 200, (SELECT id FROM categories WHERE name = 'Curries'));

-- Seed Restaurant Settings
INSERT INTO restaurant_settings (name, tagline_en, tagline_kn, whatsapp_number, is_open) VALUES
('Naati Nest', 'Homely food, right at your table', 'ನಿಮ್ಮ ಮೇಜಿನಲ್ಲೇ ಮನೆಯ ಊಟ', '919999900000', false);
