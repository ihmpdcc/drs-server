FROM mysql/mysql-server:5.7

ENV MYSQL_DATABASE hmp_drs

ENV MYSQL_ROOT_PASSWORD=1234

COPY ./set-configuration.sql /docker-entrypoint-initdb.d/

COPY ./hmp-drs.sql /docker-entrypoint-initdb.d/
