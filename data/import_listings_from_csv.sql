-- Import listings from listing_cleaned.csv
-- Run this AFTER running fix_id_default.sql
-- This imports all listings from the CSV with proper data types

BEGIN;

-- Listing 1: Car Transportation from Koh Kong to Phnom Penh
INSERT INTO public.listings (
  title, type, area, exact_location, location_consent,
  latitude, longitude, capacity_min, capacity_max, status,
  family_friendly, notes, contact_name, facebook_contact,
  verified, updated_at
) VALUES (
  'ពីកោះកុងមកភ្នំពេញ',
  'car_transportation',
  'កោះកុង',
  NULL,
  false,
  11.657430780368355,
  104.5864794049755,
  5,
  6,
  'open',
  true,
  'បងប្អូនដែរមិនមានអ្វីធ្វើដំណើរចេញពីកោះកុង អាចឆាតមកខ្ញុំបាន ខ្ញុំបើកឡានតែឯងមកភ្នំពេញ កៅអីទំនេរ ជិះបាន5 6 នាក់🙏🏻',
  'VaThana Chhoun',
  'https://www.facebook.com/vathana.chhoun.2025',
  true,
  NOW()
) RETURNING id;

-- Listing 2: Accommodation in Kampot
INSERT INTO public.listings (
  title, type, area, exact_location, location_consent,
  latitude, longitude, status, family_friendly, notes,
  contact_phone, reference_link, verified, updated_at
) VALUES (
  'ផ្ទះស្នាក់នៅបណ្តោះអាសន្ន - កំពត',
  'accommodation',
  'កំពត',
  'Kampot Province, Cambodia',
  false,
  10.7325351,
  104.3791912,
  'open',
  false,
  'ផ្ទះខ្ញុំនៅខេត្តកំពត អត់មានមនុស្សនៅទេ បើសិនបងប្អូនភាសឹក ពីខេត្តកោះកុងទៅកំពត អត់មានកន្លែងស្នាក់នៅទាក់ទងមកខ្ញុំបាន អាចស្នាក់នៅបណ្តោះអាសន្ន័បាន',
  '0964018899',
  'https://www.facebook.com/plugins/post.php?href=https%3A%2F%2Fwww.facebook.com%2Fah.ka.1272%2Fposts%2Fpfbid0VH9L69noh6nqoy25ngj6JZnnmv6mGaC8nr82MYWe4kPNxoNtetRdRA8d11NETHCYl',
  true,
  NOW()
) RETURNING id;

-- Listing 3: Free Transportation from Poipet to Siem Reap
INSERT INTO public.listings (
  title, type, area, exact_location, location_consent,
  latitude, longitude, status, family_friendly, notes,
  contact_phone, reference_link, verified, updated_at
) VALUES (
  'ដឹកជញ្ជូនដោយឥតគិតថ្លៃ - ប៉ោយប៉ែត ទៅ សៀមរាប',
  'car_transportation',
  'ប៉ោយប៉ែត',
  'Krong Poi Pet, Cambodia',
  false,
  13.6579053,
  102.5809026,
  'open',
  false,
  'ជូនដំណឹង! ខាងប៉ោយប៉ែត បន្ទាយមានជ័យ ចង់ភៀសសឹកមកខាងសៀមរាបសូមទាក់ទង 010684172 ដឹកមិនគិតលុយ',
  '010684172',
  'https://www.facebook.com/siemreap2023',
  true,
  NOW()
) RETURNING id;

-- Listing 4: Volunteer Request in Siem Reap
INSERT INTO public.listings (
  title, type, area, exact_location, location_consent,
  latitude, longitude, status, family_friendly, notes,
  contact_name, reference_link, google_maps_link, verified, updated_at
) VALUES (
  'ត្រូវការកម្លាំងជួយលើកជំនួយភៀសសឹក',
  'volunteer_request',
  'សៀមរាប',
  '1244, National Road 6A, Taphul Village, 17252, Krong Siem Reap 17252, Cambodia',
  true,
  13.367540237621608,
  103.84849990222956,
  'open',
  false,
  'ត្រូវការកំលាំងលើកជំនួយភៀសសឹក នៅសៀមរាបបងប្អូន ៤ឡាន',
  'Ouk VanDay-អ៊ុក វណ្ណដេ',
  'https://www.facebook.com/mrdaymedia',
  'https://maps.app.goo.gl/wySrLp5eqvJbWAHb7?g_st=ipc',
  true,
  NOW()
) RETURNING id;

-- Listing 5: Volunteer Request in Phnom Penh
INSERT INTO public.listings (
  title, type, area, exact_location, location_consent,
  latitude, longitude, status, family_friendly, notes,
  contact_name, reference_link, google_maps_link, verified, updated_at
) VALUES (
  'ត្រូវការកម្លាំងជួយ - Phnom Penh',
  'volunteer_request',
  'ភ្នំពេញ',
  'koh pich, Phnom Penh, Cambodia',
  true,
  11.54999882835978,
  104.94214762301785,
  'open',
  false,
  NULL,
  'Ouk VanDay-អ៊ុក វណ្ណដេ',
  'https://www.facebook.com/mrdaymedia',
  'https://maps.app.goo.gl/7RjiMrb5oChockbu8',
  true,
  NOW()
) RETURNING id;

-- Listing 6: Volunteer Request for Video Production
INSERT INTO public.listings (
  title, type, area, exact_location, location_consent,
  latitude, longitude, status, family_friendly, notes,
  contact_name, reference_link, verified, updated_at
) VALUES (
  'ត្រូវការអ្នកស្ម័គ្រចិត្តផលិត Video ភាសាអង់គ្លេស',
  'volunteer_request',
  'ភ្នំពេញ',
  'Phnom Penh, Cambodia',
  false,
  11.5563738,
  104.9282099,
  'open',
  false,
  'ត្រូវការអ្នកស្ម័គ្រចិត្តចេញមុខផលិត Video ជាភាសាអង់គ្លេស',
  'Zell - សំណាង',
  'https://www.facebook.com/zellotv',
  true,
  NOW()
) RETURNING id;

-- Listing 7: Accommodation - 8 houses in Kampot
INSERT INTO public.listings (
  title, type, area, exact_location, location_consent,
  latitude, longitude, status, family_friendly, notes,
  contact_name, facebook_contact, verified, updated_at
) VALUES (
  'ផ្ទះស្នាក់ ៨ផ្ទះ - កំពត',
  'accommodation',
  'កំពត',
  'Kampot Province, Cambodia',
  false,
  10.7325351,
  104.3791912,
  'open',
  true,
  'បងប្អូនភាសសឹកខាងកោះកុង បើមកដល់កំពតអត់មានកន្លែងស្នាក់អាចទាក់ទងខ្ញុំបាន ខ្ញុំអោយស្នាក់នៅ8ផ្ទះ',
  'Chey Chanpisey',
  'https://www.facebook.com/chey.chanpisey.7',
  true,
  NOW()
) RETURNING id;

-- Listing 8: Accommodation - Chhay Mongkol Guesthouse in Siem Reap
INSERT INTO public.listings (
  title, type, area, exact_location, location_consent,
  latitude, longitude, status, family_friendly, notes,
  contact_phone, reference_link, google_maps_link, verified, updated_at
) VALUES (
  'ផ្ទះសំណាក់ជ័យមង្គល - សៀមរាប',
  'accommodation',
  'សៀមរាប',
  NULL,
  true,
  13.362222,
  103.860278,
  'open',
  true,
  'យើងខ្ញុំជាម្ចាស់ផ្ទះសំណាក់ជ័យមង្គលខេត្តសៀមរាបមានផ្ទះទំនេរមួយកន្លែងសំរាប់បងប្អូនជនភាសសឹក',
  '092969644',
  'https://www.facebook.com/profile.php?id=61554137993006',
  'https://maps.app.goo.gl/sypU879rLo7jvNAy7',
  true,
  NOW()
) RETURNING id;

-- Listing 9: Free Fuel Service in Siem Reap
INSERT INTO public.listings (
  title, type, area, exact_location, location_consent,
  latitude, longitude, status, family_friendly, notes,
  reference_link, verified, updated_at
) VALUES (
  'ស្ថានីយ៍សាំងឥតគិតថ្លៃ',
  'fuel_service',
  'សៀមរាប',
  'NR6, Krong Siem Reap 17251, Cambodia',
  true,
  13.3560705,
  103.9001486,
  'open',
  false,
  'បងប្អូនភៀសសឹក អាចមកចាក់សាំង​ ចាក់ប្រេងនៅទីនេះបាន ចាក់Free​ សំរាប់គោយន្ត​ រោម៉ក​ ម៉ូតូ នៅ Caltex Apollo Siem Reap NR6 & Coffee Plus',
  'https://www.facebook.com/Rithomegaofficial',
  true,
  NOW()
) RETURNING id;

-- Listing 10: Site Sponsor - SAITC School
INSERT INTO public.listings (
  title, type, area, exact_location, location_consent,
  latitude, longitude, status, family_friendly, notes,
  contact_phone, reference_link, verified, updated_at
) VALUES (
  'សាលាតិចណូ - ទីតាំង និងអ្នកស្ម័គ្រចិត្ត',
  'site_sponsor',
  'ភ្នំពេញ',
  'Russian Federation Blvd (110), Phnom Penh 120404, Cambodia',
  true,
  11.5703975,
  104.8980857,
  'open',
  false,
  'សាលាតិចណូ អាចផ្តល់ជូនទីតាំង និងយុវជនស្ម័គ្រចិត្តរៀបចំស្បៀង',
  '0962940840',
  'https://www.facebook.com/SAITC.edu.kh',
  true,
  NOW()
) RETURNING id;

-- Listing 11: Accommodation - Psar Krom Thmey 89 in Siem Reap
INSERT INTO public.listings (
  title, type, area, exact_location, location_consent,
  latitude, longitude, status, family_friendly, notes,
  contact_phone, facebook_contact, google_maps_link, verified, updated_at
) VALUES (
  'ផ្សារក្រោមថ្មី ៨៩ - សៀមរាប',
  'accommodation',
  'សៀមរាប',
  NULL,
  true,
  13.361667,
  103.856389,
  'open',
  true,
  'បងប្អូនភាសសឹកមកសៀមរាបអាចទៅស្នាក់នៅផ្សារក្រោមថ្មី ៨៩ ខេត្តសៀមរាបបាន មានបន្ទប់ទឹកច្រើន និងទឹកភ្លើងប្រើដោយមិនគិតថ្លៃទេ',
  '096 8 5555 90',
  'https://www.facebook.com/bunneammoy',
  'https://maps.app.goo.gl/cH8mgGnfW66r4rnc6',
  true,
  NOW()
) RETURNING id;

-- Listing 12: Volunteer Request - Kampong Thom School
INSERT INTO public.listings (
  title, type, area, exact_location, location_consent,
  latitude, longitude, status, family_friendly, notes,
  contact_name, reference_link, verified, updated_at
) VALUES (
  'ត្រូវការកម្លាំងជួយច្រេីន - សាលាខេត្តកំពង់ធំ',
  'volunteer_request',
  'កំពង់ធំ',
  'PV6J+XVR, Krong Stueng Saen, Cambodia',
  true,
  12.7124922,
  104.8821375,
  'open',
  false,
  'សាលាខេត្តកំពង់ធំ​ ខ្វះកម្លាំងជួយច្រេីនសូមបងប្អូននៅជិតទៅជួយឲ្យបានច្រេីនផង',
  'សាលាខេត្ត',
  'https://www.facebook.com/Someakarashow',
  true,
  NOW()
) RETURNING id;

-- Listing 13: Volunteer Request - Dav TheCake
INSERT INTO public.listings (
  title, type, area, exact_location, location_consent,
  latitude, longitude, status, family_friendly, notes,
  contact_name, reference_link, google_maps_link, verified, updated_at
) VALUES (
  'ត្រូវការកម្លាំងជួយ - Dav TheCake',
  'volunteer_request',
  'ភ្នំពេញ',
  '08, Street RN 1 Corner 363, Chbar Aom Pov 1, Phnom Penh 121201, Cambodia',
  true,
  11.5316764,
  104.9361264,
  'open',
  false,
  'Please verify which location to be exact. Currently there are three branches.',
  'Dav TheCake',
  'https://www.facebook.com/DavTheCakeOfficial',
  'https://maps.app.goo.gl/zCzXtJSkLyGLqcJG7?g_st=ic',
  true,
  NOW()
) RETURNING id;

-- Listing 14: School - Wat Bo Primary School
INSERT INTO public.listings (
  title, type, area, exact_location, location_consent,
  latitude, longitude, status, family_friendly, notes,
  google_maps_link, verified, updated_at
) VALUES (
  'Wat Bo Primary School',
  'school',
  'សៀមរាប',
  'Wat Bo Primary School',
  true,
  13.356111,
  103.858611,
  'open',
  false,
  NULL,
  'https://maps.app.goo.gl/XsnDdVdzRv2tDmwk6',
  true,
  NOW()
) RETURNING id;

-- Listing 15: School - Chinese School Chong San
INSERT INTO public.listings (
  title, type, area, exact_location, location_consent,
  latitude, longitude, status, family_friendly, notes,
  reference_link, google_maps_link, verified, updated_at
) VALUES (
  'សាលារៀនចិន ចុងសាន - រៀនភាសាចិនឥតគិតថ្លៃ',
  'school',
  'សៀមរាប',
  '9V38+4W6, Krong Siem Reap, Cambodia',
  true,
  13.3527822,
  103.8672714,
  'open',
  true,
  'គណៈគ្រប់គ្រងសាលារៀនចិន ចុងសានខេត្តសៀមរាប សូមជូនដំណឹងដល់មាតាបិតាសិស្សដែលភៀសសឹក អាចយកកូនៗមកចុះឈ្មោះចូលរៀនភាសាចិនជាបណ្តោះអាសន្ននៅសាលាចិន ចុងសានបាន ដោយពុំមានការបង់ប្រាក់ឡើយ',
  'https://www.facebook.com/zhang.yong.977415',
  'https://maps.app.goo.gl/XkDBRLQ8a3JBySZS9',
  true,
  NOW()
) RETURNING id;

-- Listing 16: Volunteer Request - Boeng Keng Kang
INSERT INTO public.listings (
  title, type, area, exact_location, location_consent,
  latitude, longitude, status, family_friendly, notes,
  contact_name, reference_link, verified, updated_at
) VALUES (
  'ត្រូវការអ្នកស្ម័គ្រចិត្ត - បឹងកេងកងផ្លូវ360',
  'volunteer_request',
  'ភ្នំពេញ',
  'Sangkat Boeng Keng Kang Ti Muoy, Phnom Penh, Cambodia',
  true,
  11.5500312,
  104.9257444,
  'open',
  false,
  'ពីម៉ោង10ព្រឹកតទៅ',
  'Jingjing Soung',
  'https://www.facebook.com/jingjingtraveling',
  true,
  NOW()
) RETURNING id;

-- Listing 17: Car Transportation - ZTO Express
INSERT INTO public.listings (
  title, type, area, exact_location, location_consent,
  latitude, longitude, status, family_friendly, notes,
  contact_name, contact_phone, verified, updated_at
) VALUES (
  'ZTO Express - សេវាដឹកជញ្ជូន',
  'car_transportation',
  'ភ្នំពេញ',
  '261 230 phnom penh, Phnom Penh 12000, Cambodia',
  true,
  11.5565822,
  104.894454,
  'open',
  false,
  NULL,
  'ZTO Express',
  '087652674 / 069322253',
  true,
  NOW()
) RETURNING id;

COMMIT;

-- Verify the data was inserted
SELECT 
  COUNT(*) as total_inserted
FROM public.listings;

-- Show the inserted listings
SELECT 
  id, 
  title, 
  type, 
  area, 
  verified,
  created_at
FROM public.listings 
ORDER BY created_at DESC 
LIMIT 20;

