ABOUT
Simple small team ToDo application, written in REACT
Based on client certificate authentication -  user is identified by certificate details
Added simple user administration (if you want to use it, you must create user in DB first)

just run sqlite3 db.sqlite (database is created after first load)
and than: INSERT INTO user(login,password,isAdmin) VALUES('admin','d82494f05d6917ba02f7aaa29689ccb444bb73f20380876cb05d1f37537b7892',true);


REQUIREMENTS
Needs PHP and SQLITE3 on server, tested with NGINX

INSTALLATION
npm run build
Than copy content of build/ folder whenever you want.

NOTES
Tested under nginx, with config like below (need to pass TLS variables to PHP)
Should work under properly configured apache too

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
                location /ttd/data/ {
                        deny all;
                        return 404;
                }
        }
}
