
DROP TABLE IF EXISTS inventory CASCADE;
DROP TABLE IF EXISTS account CASCADE;
DROP TABLE IF EXISTS classification CASCADE;
DROP TYPE IF EXISTS account_type_enum;

CREATE TYPE account_type_enum AS ENUM ('Client', 'Administration', 'Employee');

CREATE TABLE classification (
  classification_id   SERIAL PRIMARY KEY,
  classification_name VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE account (
  account_id         SERIAL PRIMARY KEY,
  account_firstname  VARCHAR(50) NOT NULL,
  account_lastname   VARCHAR(50) NOT NULL,
  account_email      VARCHAR(100) UNIQUE NOT NULL,
  account_password   VARCHAR(255) NOT NULL,
  account_type       account_type_enum NOT NULL DEFAULT 'Client'
);

CREATE TABLE inventory (
  inv_id            SERIAL PRIMARY KEY,
  inv_make          VARCHAR(50) NOT NULL,
  inv_model         VARCHAR(50) NOT NULL,
  inv_description   TEXT NOT NULL,
  inv_image         VARCHAR(255) NOT NULL,
  inv_thumbnail     VARCHAR(255) NOT NULL,
  inv_price         NUMERIC(12,2) NOT NULL DEFAULT 0,
  inv_year          INTEGER NOT NULL,
  inv_miles         INTEGER NOT NULL DEFAULT 0,
  inv_color         VARCHAR(30) NOT NULL,
  classification_id INTEGER NOT NULL REFERENCES classification(classification_id)
);

INSERT INTO classification (classification_name) VALUES
 ('SUV'),
 ('Sport'),
 ('Sedan'),
 ('Truck'),
 ('Classic');

INSERT INTO inventory
(inv_make, inv_model, inv_description, inv_image, inv_thumbnail, inv_price, inv_year, inv_miles, inv_color, classification_id)
VALUES
 ('GM', 'Hummer', 'Rugged off-roader with small interiors, powerful engine, and bold design.',
  '/images/hummer-h1.jpg', '/images/hummer-h1-tn.jpg', 55000, 2006, 120000, 'Yellow',
  (SELECT classification_id FROM classification WHERE classification_name = 'SUV')),

 ('Porsche', '911', 'Iconic sport coupe with razor-sharp handling.',
  '/images/porsche-911.jpg', '/images/porsche-911-tn.jpg', 120000, 2022, 5000, 'Red',
  (SELECT classification_id FROM classification WHERE classification_name = 'Sport')),

 ('Mazda', 'MX-5', 'Lightweight roadster loved for driving feel.',
  '/images/mx5.jpg', '/images/mx5-tn.jpg', 32000, 2021, 12000, 'Blue',
  (SELECT classification_id FROM classification WHERE classification_name = 'Sport'));

-- 4) Replace part of the GM Hummer description
UPDATE inventory
   SET inv_description = REPLACE(inv_description, 'small interiors', 'a huge interior')
 WHERE inv_make = 'GM' AND inv_model = 'Hummer';

-- 6) Add '/vehicles' inside the image and thumbnail paths
UPDATE inventory
   SET inv_image     = REPLACE(inv_image, '/images/', '/images/vehicles/'),
       inv_thumbnail = REPLACE(inv_thumbnail, '/images/', '/images/vehicles/');
