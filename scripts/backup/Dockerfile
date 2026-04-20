FROM alpine:3.20

RUN apk add --no-cache \
    postgresql16-client \
    rclone \
    gnupg \
    tzdata \
    curl \
    bash \
    dcron && \
    cp /usr/share/zoneinfo/America/Bahia /etc/localtime && \
    echo "America/Bahia" > /etc/timezone

WORKDIR /backup

COPY backup.sh /usr/local/bin/rb-backup
COPY restaurar.sh /usr/local/bin/rb-restaurar
COPY crontab /etc/crontabs/root
COPY entrypoint.sh /usr/local/bin/entrypoint
RUN chmod +x /usr/local/bin/rb-backup /usr/local/bin/rb-restaurar /usr/local/bin/entrypoint

ENTRYPOINT ["/usr/local/bin/entrypoint"]
