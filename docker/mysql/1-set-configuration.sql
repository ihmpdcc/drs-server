UPDATE mysql.user SET host = '%' WHERE user='root';

CREATE USER 'hmp_drs'@'%' IDENTIFIED BY 'password';

CREATE DATABASE IF NOT EXISTS `hmp_drs`;

GRANT ALL PRIVILEGES ON hmp_drs.* TO hmp_drs@'%';

GRANT ALL PRIVILEGES ON `hmp_drs`.`*` TO `hmp_drs`@`%`;

FLUSH PRIVILEGES;
