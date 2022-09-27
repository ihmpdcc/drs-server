FROM mysql/mysql-server:5.7

ENV MYSQL_DATABASE hmp_drs

ENV MYSQL_ROOT_PASSWORD=1234

RUN rm -rf /var/lib/mysql

COPY ./1-set-configuration.sql /docker-entrypoint-initdb.d/

COPY ./2-hmp-drs.sql /docker-entrypoint-initdb.d/
