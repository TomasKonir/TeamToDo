

#nginx config
geo $from_home {
        default       0;
        192.168.0.0/16 1;
}

server {
    listen 443 ssl http2 default_server;
    listen [::]:443 ssl default_server;
    ssl_certificate     /etc/letsencrypt/live/somewhere/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/somewhere/web.pem;
    ssl_client_certificate /etc/nginx/private.CA.crt;
    ssl_verify_client optional;
    set $allow_from_home $ssl_client_verify;

    if ( $from_home ){
        set $allow_from_home "SUCCESS";
    }

    root /var/www/html;

    # Add index.php to the list if you are using PHP
    index index.html index.php;

    server_name _;

    location /ttd/ {
                if ($ssl_client_verify != "SUCCESS"){
                        return 403;
                }
                location ~ \.php$ {
                        if ($ssl_client_verify != "SUCCESS"){
                                return 403;
                        }
                        include snippets/fastcgi-php.conf;
                        fastcgi_pass unix:/var/run/php/php8.1-fpm.sock;
                        fastcgi_split_path_info ^(.+\.php)(/.+)$;
                        include fastcgi_params;
                        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
                        fastcgi_param PATH_INFO $fastcgi_path_info;
                        fastcgi_param TLS_CLIENT_VERIFIED $ssl_client_verify;
                        fastcgi_param TLS_CLIENT_DN $ssl_client_s_dn;
                }
        }
}
