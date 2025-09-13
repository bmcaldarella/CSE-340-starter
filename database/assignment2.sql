
-- 1) Insert Tony Stark (account_id and account_type auto-handle)
INSERT INTO account (account_firstname, account_lastname, account_email, account_password)
VALUES ('Tony', 'Stark', 'tony@starkent.com', 'Iam1ronM@n');

-- 2) Change Tony Stark's account type to 'Administration'
UPDATE account
   SET account_type = 'Administration'
 WHERE account_email = 'tony@starkent.com';

-- 3) Delete Tony Stark's record
DELETE FROM account
 WHERE account_email = 'tony@starkent.com';

-- 4) Replace part of the GM Hummer description
UPDATE inventory
   SET inv_description = REPLACE(inv_description, 'small interiors', 'a huge interior')
 WHERE inv_make = 'GM' AND inv_model = 'Hummer';

-- 5) Inner join to get make, model and classification for Sport vehicles
SELECT i.inv_make, i.inv_model, c.classification_name
  FROM inventory i
  JOIN classification c ON i.classification_id = c.classification_id
 WHERE c.classification_name = 'Sport';

-- 6) Add '/vehicles' inside the image and thumbnail paths
UPDATE inventory
   SET inv_image     = REPLACE(inv_image, '/images/', '/images/vehicles/'),
       inv_thumbnail = REPLACE(inv_thumbnail, '/images/', '/images/vehicles/');
