insert into public.store_profile (store_name, phone, address)
values (
  'Northern Star',
  ' 99864 27145',
  '4th Cross, Vidyanagar, Hubli, Karnataka, India'
)
on conflict (singleton) do update
set
  store_name = excluded.store_name,
  phone = excluded.phone,
  address = excluded.address;

insert into public.items (name, price, is_active)
values
  ('Basmati Rice 5kg', 520.00, true),
  ('Sunflower Oil 1L', 175.00, true),
  ('Whole Wheat Flour 10kg', 410.00, true),
  ('Sugar 1kg', 48.00, true),
  ('Tea Powder 500g', 190.00, true),
  ('Laundry Detergent 2kg', 265.00, true),
  ('Bath Soap Pack', 96.00, true),
  ('Notebook Bundle', 140.00, true)
on conflict do nothing;
