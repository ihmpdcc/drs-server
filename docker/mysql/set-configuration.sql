UPDATE mysql.user SET host = '%' WHERE user='root';

CREATE USER 'hmpdrs'@'%' IDENTIFIED BY 'password';

GRANT ALL PRIVILEGES ON hmpdrs.* TO 'hmpdrs'@'%';

FLUSH PRIVILEGES;
