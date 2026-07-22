-- aiSETUP database bootstrap for local MySQL
CREATE DATABASE IF NOT EXISTS aisetup
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS 'aisetup'@'localhost' IDENTIFIED BY 'aisetup';
CREATE USER IF NOT EXISTS 'aisetup'@'%' IDENTIFIED BY 'aisetup';

GRANT ALL PRIVILEGES ON aisetup.* TO 'aisetup'@'localhost';
GRANT ALL PRIVILEGES ON aisetup.* TO 'aisetup'@'%';
FLUSH PRIVILEGES;

SHOW DATABASES LIKE 'aisetup';
SELECT user, host FROM mysql.user WHERE user = 'aisetup';
