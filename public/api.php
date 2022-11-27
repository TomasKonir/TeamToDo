<?php

// function to parse the http auth header
function http_digest_parse($txt)
{
        // protect against missing data
        $needed_parts = array('nonce' => 1, 'nc' => 1, 'cnonce' => 1, 'qop' => 1, 'loginname' => 1, 'uri' => 1, 'response' => 1);
        $data = array();
        $keys = implode('|', array_keys($needed_parts));

        preg_match_all('@(' . $keys . ')=(?:([\'"])([^\2]+?)\2|([^\s,]+))@', $txt, $matches, PREG_SET_ORDER);

        foreach ($matches as $m) {
                $data[$m[1]] = $m[3] ? $m[3] : $m[4];
                unset($needed_parts[$m[1]]);
        }

        return $needed_parts ? false : $data;
}


header('Access-Control-Allow-Origin: *');
$cmd = "";
$ret = array();
$login = "";
$db = new SQLite3("data/db.sqlite");
$db->exec("CREATE TABLE IF NOT EXISTS user(login VARCHAR NOT NULL, password VARCHAR)");
$db->exec("CREATE TABLE IF NOT EXISTS todo(login VARCHAR NOT NULL, category VARCHAR NOT NULL,data VARCHAR NOT NULL)");
$db->exec("CREATE INDEX IF NOT EXISTS todo_idx ON todo(login)");

if (isset($_SERVER['TLS_CLIENT_DN'])) {
        $TLS_DN = explode(",", $_SERVER['TLS_CLIENT_DN']);
        foreach ($TLS_DN as $v) {
                if (str_starts_with($v, "O=")) {
                        $login = strtolower(substr($v, 2));
                        break;
                }
        }
}

//error_log(print_r($_SERVER, TRUE));
if (strlen($login) == 0 && isset($_SERVER["HTTP_X_AUTH"])) {
        list($auth_login, $auth_token) = explode(":", $_SERVER["HTTP_X_AUTH"]);
        $query = $db->prepare("SELECT password FROM user WHERE login=:login AND password IS NOT NULL");
        $query->bindValue(":login", $auth_login);
        $result = $query->execute();
        if ($row = $result->fetchArray(SQLITE3_NUM)) {
                $password = $row[0];
                if (strlen($password) > 0 && strlen($auth_token) > 0 && $password == $auth_token) {
                        $login = $auth_login;
                }
        }
}

if (strlen($login) == 0) {
        header('HTTP/1.1 401 Unauthorized');
        die('Auth failed');
}

$query = $db->prepare("SELECT login FROM user WHERE login=:login");
$query->bindValue(":login", $login);
$result = $query->execute();
if (!$result->fetchArray(SQLITE3_NUM)) {
        $query = $db->prepare("INSERT INTO user(login) VALUES(:login)");
        $query->bindValue(":login", $login);
        $result = $query->execute();
}

if (isset($_GET["cmd"])) {
        $cmd = $_GET["cmd"];
}

if ($cmd == "set") {
        $val = json_decode(file_get_contents('php://input'), true);
        $id = $val["id"];
        $target_login = $login;
        $target_category = $val["category"];
        unset($val["id"]);
        if (isset($val["login"])) {
                $target_login = $val["login"];
                $target_category = "00_" . $login;
                $val["category"] = $target_category;
                unset($val["login"]);
        }
        if ($id > 0) {
                $query = $db->prepare("UPDATE todo SET category=:category,login=:login,data=:data WHERE oid=:oid");
                $query->bindValue(":category", $target_category);
                $query->bindValue(":login", $target_login);
                $query->bindValue(":data", json_encode($val));
                $query->bindValue(":oid", $id);
                $result = $query->execute();
        } else {
                $query = $db->prepare("INSERT INTO todo(login,category,data) VALUES(:login,:category,:data)");
                $query->bindValue(":login", $target_login);
                $query->bindValue(":category", $target_category);
                $query->bindValue(":data", json_encode($val));
                $result = $query->execute();
        }
}

if ($cmd == "delete" && isset($_GET["id"])) {
        $id = $_GET["id"];
        $query = $db->prepare("DELETE FROM todo WHERE oid=:oid");
        $query->bindValue(":oid", $id);
        $result = $query->execute();
}

if ($cmd == "list") {
        $query = $db->prepare("SELECT oid,category,data FROM todo WHERE login=:login");
        $query->bindValue(":login", $login);
        $result = $query->execute();
        while ($row = $result->fetchArray(SQLITE3_NUM)) {
                $category = $row[1];
                $val = json_decode($row[2], true);
                $val["id"] = $row[0];
                if (!isset($ret[$category])) {
                        $ret[$category] = array();
                }
                array_push($ret[$category], $val);
        }
}

if ($cmd == "loginList") {
        $query = $db->prepare("SELECT login FROM user ORDER BY login");
        $result = $query->execute();
        while ($row = $result->fetchArray(SQLITE3_NUM)) {
                array_push($ret, $row[0]);
        }
}

if($cmd == "me"){
        $ret["login"] = $login;
}

$db->close();
echo json_encode($ret);
echo "\n";
